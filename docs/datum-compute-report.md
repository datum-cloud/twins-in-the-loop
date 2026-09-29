# Datum Compute deployment report: twins-in-the-loop

Date: 2026-09-28 (all times UTC)
Project: `project-2h27h` (org `personal-org-86e0525b`), location `us-central-1`

## TL;DR

The site's container image builds and runs correctly, Datum serves it on a public `*.datumproxy.net` URL, and the Strapi Secret now loads through `--env-from-secret`. One problem still blocks a working deployment:

- **No outbound network access (open).** From inside the instance, DNS lookups time out, IPv4 is unreachable, and IPv6 connections to the internet time out. The app cannot reach Strapi, so pages render without posts.

Two other problems were found and explained along the way:

| #   | Problem                                             | Cause                                                                                            | Status                                           |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| 1   | `--env-from-secret` → instance `ConfigurationError` | Cloud console stored hex values raw instead of base64 ([details](./datum-compute-secret-bug.md)) | **Fixed** (re-encoded); console bug to report    |
| 2   | No egress (DNS + IPv6 + IPv4)                       | Unknown. Network uses a ULA prefix with no visible NAT/egress                                    | **Open**                                         |
| 3   | Broken instance never replaced after a spec change  | Matches datum-cloud/compute#297 (spec changes do not roll running instances)                     | Known upstream; workaround: destroy and redeploy |

## What the app needs

Twins in the Loop is an Astro 7 SSR site. For the Datum target it is built with `@astrojs/node` (standalone) into a `node:22-slim` image and listens on `[::]:4321`.

At request time it needs:

- env vars `STRAPI_URL`, `STRAPI_TOKEN`, `STRAPI_WEBHOOK_SECRET` (optional `STRAPI_ASSETS_URL`)
- outbound HTTPS to Strapi Cloud (`grateful-excitement-dfe9d47bad.strapiapp.com`) and its media host (`grateful-excitement-dfe9d47bad.media.strapiapp.com`). Both have A and AAAA records behind Cloudflare.

## Environment

| Item           | Value                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| datumctl       | v0.20.0 (session started on v0.19.0)                                                                                                     |
| compute plugin | v0.10.9 (session started on v0.8.0)                                                                                                      |
| Runtime        | sandbox, `general-purpose`, `datumcloud/d1-standard-2`, 1 instance                                                                       |
| Network        | `default`, `ipFamilies: [IPv6]`, `ipam.mode: Auto`, prefix `fd20:0:26::/48`, MTU 1440                                                    |
| Image          | `ghcr.io/datum-cloud/twins-in-the-loop` (public, linux/amd64)                                                                            |
| Digests        | `sha256:6a56f9af41cb…` (`manual-test`), `sha256:6d79ab2e5118…` (`diag`, adds `/api/diag`)                                                |
| Secret         | `twins-strapi-secrets`, `Opaque`, keys `STRAPI_TOKEN`, `STRAPI_URL`, `STRAPI_WEBHOOK_SECRET`; created in the console, re-encoded via CLI |

## Current workload

| Workload       | Image          | Config                          | Instance           | URL                                     |
| -------------- | -------------- | ------------------------------- | ------------------ | --------------------------------------- |
| `twins-secret` | `6d79ab2e5118` | `envFrom: twins-strapi-secrets` | `True / Available` | https://beach-hour-rms6d.datumproxy.net |

`/`, `/about`, `/rss.xml` return 200. `POST /api/strapi-webhook` without a token returns `401 Invalid secret`, which shows `STRAPI_WEBHOOK_SECRET` reached the process. Diagnostics: https://beach-hour-rms6d.datumproxy.net/api/diag

The test workloads `twins-in-the-loop`, `twins-nosecret`, `twins-env` and `twins-probe` were destroyed. `twins-env` had held the Strapi values in cleartext in its spec, so the Strapi token should be rotated.

## Problem 1: Secret values stored without base64 (fixed)

Full write-up: [Cloud console stores some Secret values without base64-encoding them](./datum-compute-secret-bug.md).

Short version: the console's **New Secret** form skipped base64 encoding for the hex token and hex webhook secret (they already look like base64). The workload received binary bytes as env values, and the instance failed with a generic `ConfigurationError`. After the two values were base64-encoded correctly, a new workload with `--env-from-secret` started on the first try.

Isolation, same image and runtime:

| Workload / step                   | Secret               | Instance                       |
| --------------------------------- | -------------------- | ------------------------------ |
| no config                         | –                    | `True / Available`             |
| plain `--env=PROBE=plain`         | –                    | `True / Available`             |
| `--env-from-secret`               | as stored by console | `Unknown / ConfigurationError` |
| `--env-from-secret`, new workload | re-encoded correctly | `True / Available`             |

Other notes from the investigation:

- Plugin v0.8.0 had no `--env*` flags; `envFrom` was first added by patching the workload with `datumctl apply`. That failed for the same reason (bad Secret), not because of the patch. v0.10.9 (datum-cloud/compute#356) adds the flags, which are now used instead.
- The image was ruled out by running the same digest locally under `linux/amd64` with the Strapi values as env vars: all routes 200, posts render, server answers on `::1`.
- **Recommendation:** create Secrets with `stringData` via `datumctl apply -f datum/secret.yaml`, not through the console form.

## Problem 2: no outbound network access (open)

### Symptom

With the env vars loaded, the site serves pages but renders no Strapi content (RSS has 0 items). An outbound fetch through the app's image endpoint took 11.3 s to fail on Datum, against 0.7 s locally.

### Diagnostic endpoint

`/api/diag` (commits `c9b37f7`, `ae383d8`) runs DNS lookups and HTTPS fetches from inside the container. Each probe has a 5 s timeout. It returns only status, timing and error codes, no credentials. The first version had no DNS timeout and the edge returned `504 response_timeout`, which already pointed at a hung resolver.

Results, same code (Datum results identical on `twins-env` and `twins-secret`):

| Probe                                            | Local                           | Datum                 |
| ------------------------------------------------ | ------------------------------- | --------------------- |
| DNS `…strapiapp.com`                             | 4 addrs, 789 ms                 | timeout 5000 ms       |
| DNS `…media.strapiapp.com`                       | 4 addrs, 426 ms                 | timeout 5000 ms       |
| DNS `example.com`                                | 4 addrs, 453 ms                 | timeout 5000 ms       |
| `https://…strapiapp.com/_health`                 | 204, 1.7 s                      | timeout               |
| `https://…media.strapiapp.com/`                  | 403, 1.6 s                      | timeout               |
| `https://example.com/`                           | 200, 1.5 s                      | timeout               |
| `https://1.1.1.1/` (IPv4 literal)                | 301, 0.7 s                      | `ENETUNREACH` in 4 ms |
| `https://[2606:4700:4700::1111]/` (IPv6 literal) | timeout (local ISP has no IPv6) | timeout               |

### Reading

- **DNS:** the resolver configured in the instance does not answer.
- **IPv4:** no route at all. Expected on an IPv6-only network.
- **IPv6:** a literal public address (Cloudflare) does not answer. DNS is not involved here, so egress itself is blocked, not just DNS.
- **Addressing:** the network prefix is `fd20:0:26::/48`, a ULA range (`fd00::/8`). ULA addresses are not routable on the internet, so egress needs NAT66, a translator (NAT64/DNS64), or a public address. None appears to be in place.

Inbound works: the edge proxy reaches the instance at `[fd20:0:26::…]:4321` and edge access logs show normal response times.

### Configuration checked

- `Network.spec` has only `ipFamilies`, `ipam` (`Auto`/`Policy`) and `mtu`. There is no egress or NAT setting.
- `Workload.spec.template.spec.networkInterfaces[].addresses[].class` can request extra addresses, for example `public-ipv4`. datum-cloud/compute#356 lists public IPv4 as a future `deploy` option and notes the choice cannot be changed after a workload exists. **Not tested yet.**
- The DNS service (`dns.networking.miloapis.com`, currently not requested) is authoritative DNS for hosting zones. It is not the resolver used by instances.
- Metrics Export Policies (Grafana) are unrelated.

### Related report

milo-os/milo-os.com#160 describes a VPC edge-router `BGPVRFInstance` stuck at generation 1 that blocks connectivity while logs look healthy. The workaround there was redeploying under a new `--network`. **Not tested yet.**

## Problem 3: rollout stuck after `ConfigurationError`

After an instance entered `ConfigurationError`, later `compute deploy` runs updated the workload spec, but the rollout stayed `Pending` and the instance kept its old generation:

```
PLACEMENT  LOCATION      UPDATED  READY  OLD  PHASE
default    us-central-1  0        0      1    Pending
```

This matches datum-cloud/compute#297 (open): spec changes reach the WorkloadDeployment but running instances are not replaced. Workaround: `datumctl compute destroy` and deploy again, or deploy under a new name.

## Minor issues

- **HTTPProxy left behind on destroy (plugin v0.8.0).** `compute destroy` deleted the workload but failed on `cannot deletecollection resource "httpproxies"`. The proxy was deleted by name with `datumctl delete httpproxy`. Fixed in v0.10.9.
- **No instance logs.** `datumctl compute logs` is suggested by `compute deploy` output but does not exist in plugin v0.10.9. The console shows only edge access logs, not container stdout/stderr.
- **`compute workloads describe` prints env values in full**, including secrets passed with `--env`. Prefer `--env-from-secret`.
- **Compute access** needed a manual approval that took about 3 hours ("Pending approval").

## Expected behavior

1. The console base64-encodes every Secret value it is given.
2. If an env value cannot be used, the instance condition names the variable and the reason instead of a generic configuration error.
3. A deploy that changes the spec replaces running instances (compute#297).
4. Instances on the default network can resolve DNS and open outbound connections, or the docs say how to enable egress.
5. Container logs are available from the CLI or console.

## Next steps

| Step                                                                                      | Owner        | Status  |
| ----------------------------------------------------------------------------------------- | ------------ | ------- |
| Report the console Secret encoding bug                                                    | us           | open    |
| Report the missing egress with the `/api/diag` results                                    | us           | open    |
| Test egress on a new network (`--network=twins-net`), run `/api/diag`                     | us           | not run |
| Test a public address on the interface (`addresses: [{class: public-ipv4}]`) via manifest | us           | not run |
| Confirm how egress is meant to work on Datum Compute (NAT66, NAT64/DNS64, public IPs)     | Compute team | open    |
| Rewrite `datum/deploy.sh` for plugin v0.10.9 flags (drop the `apply` patch)               | us           | open    |
| Rotate the Strapi token and re-create the Secret via `datumctl apply`                     | us           | open    |

## References

- datum-cloud/compute#356: `--env`, `--env-from-secret`, `--secret` on `compute deploy`
- datum-cloud/compute#297: workload spec changes do not roll running instances
- milo-os/milo-os.com#160: milo-os.com on Datum Compute (IPv6 bind, stuck `BGPVRFInstance`)
- Branch `feat/datum-compute` in `datum-cloud/twins-in-the-loop`: Dockerfile, `datum/deploy.sh`, `.github/workflows/deploy-datum.yml`, `docs/datum-compute.md`, `/api/diag`
