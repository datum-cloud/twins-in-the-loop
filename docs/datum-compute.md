# Deploy on Datum Compute

Datum Compute runs the site as a container on Datum Cloud, **alongside** Vercel. Vercel stays the production host for `twinsintheloop.com`; the Datum copy is a manually deployed staging target served on a Datum-managed `*.datumproxy.net` URL, `noindex` and without a sitemap.

> **Known platform problem.** Instances currently have no outbound network access, so Strapi content does not load. Also create the Secret with `datumctl` (option A below): the console form can store values wrongly and break the instance. See the [Datum Compute report](./datum-compute-report.md) before deploying.

| Thing            | Value                                                               |
| ---------------- | ------------------------------------------------------------------- |
| Datum project    | `project-2h27h` (org `personal-org-86e0525b`)                       |
| Workload         | `twins-in-the-loop`                                                 |
| Image            | `ghcr.io/datum-cloud/twins-in-the-loop`                             |
| Runtime          | `general-purpose`, `datumcloud/d1-standard-2`, 1 instance           |
| Default location | `us-central-1` (workflow input)                                     |
| Workflow         | [`deploy-datum.yml`](../.github/workflows/deploy-datum.yml), manual |

## How the build differs from Vercel

`astro.config.mjs` picks the adapter from `ADAPTER`:

- unset → `@astrojs/vercel` (local dev, CI, Vercel)
- `ADAPTER=node` → `@astrojs/node` standalone server (`bun run build:container`)

The [`Dockerfile`](../Dockerfile) builds with `bun run build:container` on a `node:22-slim` base and runs `dist/server/entry.mjs` with Node on port `4321`. Node is needed because Astro requires Node >=22.12 and Bun's Node shim reports an older version.

- `PUBLIC_SITE_ENV`, `SITE` and `BASE_PATH` are inlined at build time, so they are Docker **build args** (defaults: `staging`, `https://twinsintheloop.com`, `/`).
- `STRAPI_*` values are read at request time from the `twins-strapi-secrets` Secret.
- There is no Vercel Runtime Cache outside Vercel. `@vercel/functions` falls back to an in-memory cache per instance (logged as `Runtime Cache unavailable…`). With one instance, the Strapi webhook still invalidates correctly. If you scale above one instance, a webhook only clears the instance that received it.

## One-time setup

1. **Request Compute access for the project.** It is not enabled by default, and the request may need approval before workloads can be created:

   ```bash
   datumctl services enable compute.datumapis.com --project=project-2h27h
   datumctl services status compute.datumapis.com --project=project-2h27h
   ```

2. **Create the Strapi Secret** in Datum Cloud. The workload reads it from the cloud by name. Each key becomes an env var of the same name.

   | Key                     | Required                        |
   | ----------------------- | ------------------------------- |
   | `STRAPI_URL`            | yes                             |
   | `STRAPI_TOKEN`          | yes                             |
   | `STRAPI_WEBHOOK_SECRET` | yes, or the webhook returns 503 |
   | `STRAPI_ASSETS_URL`     | no                              |

   **A. Manifest via `datumctl` (recommended).** Copy [`datum/secret.example.yaml`](../datum/secret.example.yaml) to `datum/secret.yaml` (gitignored) and fill in the plain values under `stringData`. The API server does the base64 encoding. Then:

   ```bash
   datumctl apply -f datum/secret.yaml --project=project-2h27h
   ```

   Re-run the same command to rotate values.

   **B. Console (avoid for tokens).** [cloud.datum.net → project-2h27h → Secrets](https://cloud.datum.net/project/project-2h27h/secrets) → **New Secret**, untick **Auto-generate**, **Resource Name** `twins-strapi-secrets`, **Type** `Opaque`.

   > The form skips base64 encoding for values that already look like base64, such as the hex `STRAPI_TOKEN` and `STRAPI_WEBHOOK_SECRET`. The workload then gets binary bytes, and the instance fails with `ConfigurationError`. See [the bug write-up](./datum-compute-secret-bug.md). If you used the console, check that every value decodes to readable text:
   >
   > ```bash
   > datumctl get secret twins-strapi-secrets --project=project-2h27h -o json \
   >   | jq -r '.data | to_entries[] | .key + " printable=" + ((.value | @base64d) | test("^[[:print:]]+$") | tostring)'
   > ```

   After creating or changing the Secret, check it exists (values are not printed) and restart the workload:

   ```bash
   datumctl get secret twins-strapi-secrets --project=project-2h27h
   datumctl compute restart twins-secret --project=project-2h27h
   ```

   A Secret with another name works too: `SECRET_NAME=<name> ./datum/deploy.sh`. `deploy.sh` stops before deploying if the Secret is missing or lacks `STRAPI_URL`/`STRAPI_TOKEN`.

3. **Create a service account for CI** with edit access to `project-2h27h`, download its credentials JSON, and save the whole file as the GitHub Actions secret `DATUM_SA_CREDENTIALS`.

4. **Make the image public.** After the first workflow run pushes the image, open the `twins-in-the-loop` package under the `datum-cloud` GitHub org → **Package settings** → set visibility to **Public**. Datum pulls the image anonymously; a private package fails with an image pull error.

## Deploy

GitHub → **Actions → Deploy Datum Compute → Run workflow**. The job:

1. Builds the image for `linux/amd64` and pushes `sha-<commit>` and `latest` to GHCR.
2. Logs in to Datum with `DATUM_SA_CREDENTIALS`.
3. Runs [`datum/deploy.sh`](../datum/deploy.sh) with the image pinned by digest.

`deploy.sh` creates the workload with `datumctl compute deploy` the first time (this also creates the public URL), then patches image, `HOST`/`PORT` and the Secret reference onto the workload with `datumctl apply`. `compute deploy` has no env flags, which is why the patch step exists. The URL is printed as the last line and shown on the workflow's environment.

To deploy from your machine instead (logged in with `datumctl login`, image already pushed):

```bash
IMAGE=ghcr.io/datum-cloud/twins-in-the-loop:latest ./datum/deploy.sh
```

## Inspect

```bash
datumctl compute workloads --project=project-2h27h
datumctl compute workloads describe twins-in-the-loop --project=project-2h27h
datumctl compute instances --project=project-2h27h
```

Local container check:

```bash
docker build --platform linux/amd64 -t twins-in-the-loop:local .
docker run --rm -p 4321:4321 --env-file .env twins-in-the-loop:local
```

## Troubleshooting

**Instances healthy but the URL never answers.** Datum networks are IPv6-only. The server must bind `::`, not `0.0.0.0`. The Dockerfile and `deploy.sh` both set `HOST="::"`; keep it if you change either.

**Still unreachable with healthy logs.** A known platform bug can leave the network's edge-router `BGPVRFInstance` stuck at generation 1. Network and runtime class are fixed for a workload's lifetime, so the workaround is to destroy and redeploy on a fresh network:

```bash
datumctl compute destroy twins-in-the-loop --project=project-2h27h
datumctl compute deploy twins-in-the-loop --project=project-2h27h --network=twins-2 \
  --image=ghcr.io/datum-cloud/twins-in-the-loop:latest --location=us-central-1 \
  --http-port=4321 --runtime-class=general-purpose --yes
IMAGE=ghcr.io/datum-cloud/twins-in-the-loop:latest ./datum/deploy.sh
```

**Instance stuck in `ConfigurationError` after adding the Secret.** A Secret value is not valid text, usually because it was created in the console. Run the `printable=` check above, re-create the Secret with `datumctl apply`, then destroy and redeploy the workload: a broken instance is not replaced by a later deploy (datum-cloud/compute#297).

**Posts missing.** First open `/api/diag` on the workload URL. If DNS lookups time out, the instance has no outbound network access (see the [report](./datum-compute-report.md)). Otherwise check the Secret exists and holds `STRAPI_URL` and `STRAPI_TOKEN`.
