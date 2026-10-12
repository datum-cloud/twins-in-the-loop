# Datum Compute: `project-z6vm2` edge 503 investigation

On 12 October 2026 (GMT+7), deployments of this site to `datum/project-z6vm2`
returned 503 or timed out from the Datum edge, while the platform reported the
workload as healthy. The same image worked in another project. This page records
what we saw, how we ruled things out, and how to repeat the diagnosis.

**Status:** recovered without any change on our side. At 00:03 on 13 October,
20 of 20 requests returned 200 on both edge addresses. **The root cause is not
confirmed.** It sat in the data path between the edge and the instance, which
`datumctl` cannot see. See [Open questions](#open-questions).

## Setup

| Item     | Value                                                                           |
| -------- | ------------------------------------------------------------------------------- |
| Image    | `ghcr.io/datum-cloud/twins-in-the-loop:1.11.0-e08f15a` (built from `e08f15a`)   |
| Workload | `twins-in-the-loop`, runtime class `unikernel`, `datumcloud/d1-standard-2`      |
| Port     | `4321`, with `HOST=::` and the Secret `twins-strapi-secrets`                    |
| Broken   | `datum/project-z6vm2`, `us-central-1`, network `fd20:0:22::/48`                 |
| Healthy  | `personal-org-86e0525b/project-2h27h`, `us-central-1`, network `fd20:0:26::/48` |

## Symptom

- `curl` to the workload URL returned `503` after exactly 10 seconds, or timed
  out. The error page said
  `upstream_reset_before_response_started{connection_timeout}`.
- TCP and TLS to the edge connected in under half a second. The edge then waited
  for the instance and gave up.
- `datumctl compute workloads describe` showed `Serving: Healthy, 1 of 1 backends`
  and the instance was `Available`.
- `datumctl compute logs` showed `Server listening`, but no request ever reached
  the app. On a healthy instance the first request appears in that log.

## Timeline (12 October, GMT+7)

1. About 17:54: first deploy to `z6vm2` with an older image. It worked.
2. About 19:01: in-place redeploy to the `datum-cloud` image. Instance restarted,
   app listening, edge 503 on both addresses for more than 9 minutes.
3. About 19:55: destroyed the workload and deployed from scratch. Still 503.
4. A control workload with the older, known-good image in the same project also
   returned 503.
5. 20:16: the same image deployed to `project-2h27h` returned 200 on both edges,
   and the first request showed up in the instance log at once.
6. A workload in `us-east-1` in the same project failed the same way, so it was
   not tied to the `us-central-1` subnet.
7. About 23:25: requests started to succeed, mixed with 503. Sample of 12 per
   edge: one edge 11 of 12, the other 5 of 12.
8. 00:03 on 13 October: 10 of 10 on both edges.

## What we ruled out

| Suspect              | How we checked                                                          | Result                            |
| -------------------- | ----------------------------------------------------------------------- | --------------------------------- |
| The image or the app | Built the same commit with `Dockerfile.datum` and ran it locally        | 200 on all routes                 |
| In-place redeploy    | Destroyed and recreated; deployed an older image as a separate workload | Same failure                      |
| Wrong location       | Deployed to `us-east-1` in the same project                             | Same failure                      |
| Workload spec        | Diffed the full workload YAML between the two projects                  | Identical                         |
| Derived resources    | Diffed HTTPRoute, HTTPProxy, Instance, EndpointSlice                    | Only names and IP prefixes differ |
| Quota                | `datumctl compute quota` in both projects                               | Identical                         |
| Secret               | Compared a hash of the Secret data in both projects                     | Identical                         |

Two red herrings:

- The instance `eth0` shows `Programmed: Unknown, Waiting for controller` in both
  projects, including the healthy one.
- The `2h27h` project has Datum Tunnel resources (`connector`, a traffic
  protection policy). They belong to a different gateway and do not affect this
  workload.

What remained different: `z6vm2` was about three hours old, with Compute enabled
shortly before the first deploy, in the `datum` organization. `2h27h` was 14 days
old in a personal organization. One reading is that the edge route to a new
project's overlay network was not fully programmed yet. That is a guess, not a
finding.

## How to diagnose this next time

Start with the edge access log. It tells you in one command whether the edge or
the app is at fault.

```bash
datumctl compute logs twins-in-the-loop --project <project> --alb
```

| Pattern                            | Meaning                                                  |
| ---------------------------------- | -------------------------------------------------------- |
| `200` with a latency of tens of ms | Healthy                                                  |
| `503 ... ~10000ms`                 | The edge could not connect to the instance               |
| No lines at all                    | Requests never reached the edge (DNS, or the wrong host) |

Then check the instance side:

```bash
datumctl compute logs twins-in-the-loop --project <project>   # "Server listening", first request
datumctl compute instances --project <project>
datumctl get endpointslices -n default --project <project>    # ready: true, serving: true
```

If both look fine, test each edge address on its own, because one can be healthy
while the other is not:

```bash
H=<hostname>
for IP in $(dig +short AAAA $H); do
  curl -s -m 12 --resolve "$H:443:[$IP]" -o /dev/null -w "$IP %{http_code}\n" https://$H/
done
```

A new hostname can take about a minute to get DNS records, so a `000` right after
a deploy is not a failure yet.

To rule out the app, build the same commit as a plain container and run it with
`HOST=::`. It cannot be the pushed unikernel image, which only boots on Datum.

To rule out the project, deploy the same image to another project you own and
compare the edge logs.

## Open questions

These went to the Datum team:

- Is the edge route to the overlay network of a newly created project programmed
  later than the workload and its URL, and can that be seen anywhere?
- Why does the workload report `Serving: Healthy` while the edge cannot reach it?
  Does the health check look at the instance state only, and not at connectivity?
- What changed around 23:25 on 12 October that made the path recover?

## Workflow note

The manual workflow `deploy-datum.yml` ends with a smoke test that retries for
three minutes. During an incident like this one it fails even though the deploy
itself succeeded. Read the edge log before assuming the build is at fault.
