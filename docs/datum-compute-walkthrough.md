# Deploy twins-in-the-loop to Datum Compute (test walkthrough)

This guide walks you through deploying the `twins-in-the-loop` site to Datum
Cloud Compute on the **unikernel** runtime class, using your own GitHub
Container Registry (GHCR) namespace and a test project. It adds the setup
problems we hit on macOS and what we saw when we ran it end to end.

For the production-style setup (CI deploy, `general-purpose` runtime, Datum
organization namespace), see the `docs/datum-compute.md` on the
`feat/datum-compute` branch. This guide is the quick manual test.

**Audience:** engineers new to Datum Compute and GHCR.
**Time:** about 30 minutes, plus waiting for Compute access if you lack it.

## Prerequisites

| Requirement                                           | How to check                                                   |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| Docker Desktop (macOS), running                       | `docker version` shows a Server version                        |
| `datumctl` with the `compute` plugin v0.10.9 or later | `datumctl plugin list`                                         |
| GitHub CLI (`gh`), logged in                          | `gh auth status`                                               |
| A Datum project with **Compute access approved**      | `datumctl compute access` says `Status: Active`                |
| The Strapi Secret in that project                     | `datumctl get secrets -n default` lists `twins-strapi-secrets` |

To upgrade the plugin: `datumctl plugin upgrade compute`.

Replace these placeholders throughout:

- `<gh-user>`: your GitHub username, **lowercase** (GHCR requires lowercase).
- `<org>/<project>`: your Datum org and project, such as
  `personal-org-86e0525b/project-2h27h`.
- `<hostname>`: the URL host that the deploy prints.

### The Strapi Secret

The site reads its content from Strapi at request time. The workload imports the
Secret `twins-strapi-secrets`, and each key becomes an env var of the same name:

| Key                     | Required                                  |
| ----------------------- | ----------------------------------------- |
| `STRAPI_URL`            | yes                                       |
| `STRAPI_TOKEN`          | yes                                       |
| `STRAPI_WEBHOOK_SECRET` | yes, or `/api/strapi-webhook` returns 503 |
| `STRAPI_ASSETS_URL`     | no                                        |

The Secret must already exist in the project. Do not create it with the console
form for tokens: the form can store hex values wrongly and the instance then
fails with `ConfigurationError`. Check that every value is readable text:

```bash
datumctl get secret twins-strapi-secrets -n default -o json | python3 -c '
import sys,json,base64
for k,v in json.load(sys.stdin)["data"].items():
    s=base64.b64decode(v).decode("utf8","ignore")
    print(k, "printable" if s.isprintable() else "NOT printable", len(s), "chars")'
```

Never paste the values into chat, logs, or commits.

## Part 1: One-time Docker Desktop setup (macOS)

Two Docker Desktop defaults break `datumctl compute build`.

### 1.1 Enable the default Docker socket

Symptom:
`Error: building root filesystem: could not connect to BuildKit`

1. Open Docker Desktop → **Settings** → **Advanced**.
2. Enable **Allow the default Docker socket to be used (requires password)**.
3. Select **Apply & restart**.
4. Confirm the socket exists: `ls -l /var/run/docker.sock`.

### 1.2 Put the Docker credential helper on your PATH

Symptom:
`error getting credentials ... "docker-credential-desktop": executable file not found in $PATH`

```bash
echo 'export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin"' >> ~/.zshrc
source ~/.zshrc
which docker-credential-desktop    # must print a path
```

Alternatively, set Docker Desktop → Settings → Advanced → **Installation of
system binaries** to **System**.

## Part 2: Get the right code

The site normally deploys to Vercel, so `main` has no container setup. You need
four things in the repo before you build:

| File               | Purpose                                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `Dockerfile.datum` | Two-stage build on `node:22-slim`; runs `node ./dist/server/entry.mjs` on port `4321` with `HOST=::` |
| `.dockerignore`    | Keeps `.env`, `.git`, `node_modules`, and docs out of the image                                      |
| `astro.config.mjs` | Picks `@astrojs/node` (standalone) when `ADAPTER=node`, otherwise the Vercel adapter                 |
| `package.json`     | `@astrojs/node` dependency and the `build:container` script (`ADAPTER=node astro build`)             |

Check whether they are on `main` yet. If they are not, work on a branch from an
up-to-date `main` and add them:

```bash
git checkout main && git pull --ff-only origin main
git checkout -b feat/datum-compute-unikernel
ls Dockerfile.datum .dockerignore            # both must exist
grep -n "ADAPTER" astro.config.mjs           # must match
grep -n "build:container" package.json       # must match
```

The older `feat/datum-compute` branch has a `Dockerfile` and a `.dockerignore`
you can copy from, but it is far behind `main`. Copy the files; do not merge the
branch.

Add `workload.yaml` to `.gitignore`: `datumctl compute deploy` writes it into
the current folder, and it must never be committed.

> Run every `datumctl compute build` command from this repo root. Running it in
> another repo builds the wrong project.

## Part 3: Check the build locally

This dry run builds the image, analyzes it for unikernel compatibility, and
discards it. It pushes nothing.

```bash
datumctl compute build --analyze --fix .
```

Expect `No compatibility issues found` and `Preview complete (image discarded)`.
The first run takes about 90 seconds. The `--fix` flag can edit the Dockerfile,
so run `git diff` afterward.

## Part 4: Publish the image to GHCR

GHCR (`ghcr.io`) is GitHub's container registry. Datum Cloud pulls your image
from it. For this test use your personal namespace, **not**
`ghcr.io/datum-cloud/...`, so you never overwrite a real release tag. A package
in the organization namespace is the official one and is normally pushed by CI.

### 4.1 Give your GitHub login permission to push

```bash
gh auth refresh -s write:packages    # approve in the browser
gh auth status                       # scopes must include write:packages
```

### 4.2 Log Docker in to GHCR

```bash
gh auth token | docker login ghcr.io -u <gh-user> --password-stdin
```

Expect `Login Succeeded`.

### 4.3 Build and push

```bash
datumctl compute build --push --output ghcr.io/<gh-user>/twins-in-the-loop:test .
```

The push is about 650 MB and takes 2 to 3 minutes. The last line prints the
image digest.

> **Do not** use `docker build` or `docker push` for the image you deploy. A
> plain container image pulls without error but cannot boot on the unikernel
> runtime. It fails with `ImageUnavailable: The instance image could not be
pulled`. Only `datumctl compute build` produces the right artifact. The same
> reason means you cannot `docker run` the pushed image on your laptop.

### 4.4 Make the package public

New GHCR packages are private, and Datum Cloud cannot pull a private image.

1. Open `https://github.com/<gh-user>?tab=packages`.
2. Select `twins-in-the-loop`, then **Package settings** in the right column
   under "Total downloads".
3. Under **Danger Zone**, select **Change visibility** → **Public**, type the
   package name to confirm.

The image contains only the site build, with no secrets. Confirm that `.env` is
excluded by `.dockerignore` before you make the package public.

Check that the package is public (expect `200`; `403` means still private):

```bash
tok=$(curl -s "https://ghcr.io/token?scope=repository:<gh-user>/twins-in-the-loop:pull" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer $tok" \
  -H "Accept: application/vnd.oci.image.index.v1+json, application/vnd.oci.image.manifest.v1+json" \
  https://ghcr.io/v2/<gh-user>/twins-in-the-loop/manifests/test
```

## Part 5: Select your Datum project

```bash
datumctl ctx --refresh               # refresh the context cache
datumctl ctx list                    # find your project; * marks the current one
datumctl ctx use <org>/<project>     # example: personal-org-86e0525b/project-2h27h
datumctl compute access              # Status: Active
```

A newly created project can take a moment to appear. If `ctx use` says
`Context ... not found`, run `datumctl ctx --refresh` again. As a workaround,
pass `--project <project>` on each command.

Before you deploy, list what already runs in the project and remove any old
test workload you replace:

```bash
datumctl get workloads -n default
datumctl compute destroy <old-workload> --yes     # deletes its instances and URL
```

`destroy` does not delete the Secret.

## Part 6: Deploy

```bash
datumctl compute deploy twins-in-the-loop \
  --image=ghcr.io/<gh-user>/twins-in-the-loop:test \
  --location=us-central-1 \
  --http-port=4321 \
  --instance-type=datumcloud/d1-standard-2 \
  --runtime-class=unikernel \
  --env="HOST=::" \
  --env-from-secret=twins-strapi-secrets \
  --yes
```

- If the command says `Network "default" does not exist`, answer **Y** to
  create it.
- The command saves a `workload.yaml` in your current folder. **Do not commit
  it.**
- The last line of output is your URL, such as
  `https://opening-patio-c6fbh.datumproxy.net`.

> **`HOST=::` is critical.** Datum Cloud networks are IPv6-only. `0.0.0.0` opens
> only an IPv4 socket, so the app starts with no error but never responds.

`deploy` carries forward every env value and import you omit, so repeating the
command is safe. There is no second deploy for the hostname: the site URL
(`SITE`) is inlined at build time, not at deploy time.

### Redeploying a new build

The deploy compares the image reference. Pushing a new build to the **same tag**
and deploying again does **not** replace the running instance. Use a new tag, or
retag an image already in the registry without rebuilding:

```bash
docker buildx imagetools create -t ghcr.io/<gh-user>/twins-in-the-loop:<new-tag> \
  ghcr.io/<gh-user>/twins-in-the-loop@sha256:<digest>
```

Then deploy with `--image=...:<new-tag>`. When you pass `--image` on a redeploy,
also pass `--location` or the command stops with `--location is required`.

If the rollout succeeds but publishing the URL fails with `the object has been
modified; please apply your changes to the latest version`, run the same deploy
command again.

## Part 7: Verify

The instance name is generated (`<workload>-default-<location>-0`), so list
instances instead of guessing it:

```bash
datumctl compute instances                              # STATUS Available
datumctl compute workloads describe twins-in-the-loop   # Serving: Healthy, 1 of 1 backends
curl -i https://<hostname>/                             # 200 with page content
curl -s https://<hostname>/rss.xml | grep -c '<item>'   # more than 0 when Strapi works
```

A unikernel instance has no `logs` command and no `kubectl logs` equivalent.
`workloads describe` and `instances` are the deepest status views `datumctl`
offers.

### If the hostname does not resolve on your machine

If `curl` says `Could not resolve host` while `dig +short AAAA <hostname>`
works, your local resolver is the problem. Turning on 1.1.1.1 (WARP) or setting
it as your DNS fixes it. As a workaround, pin the address:

```bash
IP=$(dig +short AAAA <hostname> | head -1)
curl -sS --resolve "<hostname>:443:[$IP]" https://<hostname>/
```

Two edge addresses are returned. If one returns 503 or times out, try the other
or retry.

## Part 8: Diagnose missing articles

The site can load (200) while the article list is empty. The app swallows a
failed Strapi fetch and shows an empty list, and the error goes only to a log you
cannot read on a unikernel. To see outbound connectivity from inside the
instance, add the diagnostic endpoint from the `feat/datum-compute` branch:

```bash
git show origin/feat/datum-compute:src/pages/api/diag.ts > src/pages/api/diag.ts
```

Rebuild, push under a **new tag** (see "Redeploying a new build"), deploy, then:

```bash
curl -s https://<hostname>/api/diag
```

It resolves the Strapi hostnames and fetches a few URLs from inside the
instance. **It has no authentication. Use it for the test only and never commit
it.** Delete the file when you finish.

Healthy output shows `addrs` for each host and `status` for each fetch. In our
test every lookup returned `EAI_AGAIN` and IPv4 returned `ENETUNREACH`: the
instance had no working DNS or IPv4 egress, so no Strapi content loaded. The
same image built as a plain container and run locally with the same Secret
loaded articles, so the cause is the platform network, not the app or the
Secret. Report it to the Datum team with the `/api/diag` output.

## Troubleshooting

| Symptom                                                          | Cause                                                          | Fix                                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `could not connect to BuildKit`                                  | Default Docker socket disabled                                 | Part 1.1                                                                                     |
| `docker-credential-desktop: executable file not found`           | Docker `bin` not on PATH                                       | Part 1.2                                                                                     |
| `Dockerfile.datum: No such file`                                 | The container files are not on your branch                     | Part 2                                                                                       |
| `ImageUnavailable: The instance image could not be pulled`       | Image came from `docker build`, or the GHCR package is private | Rebuild with `datumctl compute build`; make the package public (4.4)                         |
| `no matching manifest for linux/amd64` on `docker run`           | The pushed image is a unikernel artifact, not a container      | Build a plain image from `Dockerfile.datum` for local tests only; never push it              |
| App starts, never responds                                       | `HOST=0.0.0.0` instead of `HOST=::`                            | Redeploy with `--env="HOST=::"`                                                              |
| `503 upstream_reset_before_response_started{connection_timeout}` | The edge your machine reaches cannot connect to the instance   | Retry, try the other edge address, or test from another network; the instance may be healthy |
| `Could not resolve host` for `*.datumproxy.net`                  | Local DNS resolver                                             | Turn on 1.1.1.1, or use `--resolve` (Part 7)                                                 |
| 200 but no articles, empty RSS                                   | Instance has no outbound DNS or IPv4                           | Part 8                                                                                       |
| `/api/diag` returns 404                                          | The endpoint is not on `main`, or the old instance still runs  | Add it (Part 8) and redeploy under a new tag                                                 |
| Redeploy finished but nothing changed                            | Same image tag, so no new instance                             | Use a new tag (Part 6)                                                                       |
| `instance "<workload>" not found`                                | Instance names are generated                                   | `datumctl compute instances`                                                                 |
| `ConfigurationError` after adding the Secret                     | A Secret value is not valid text                               | Run the printable check in Prerequisites, re-create the Secret, then destroy and redeploy    |
| Context `not found` for a new project                            | Stale context cache                                            | `datumctl ctx --refresh`, or use `--project`                                                 |
| Compute rejects the deploy                                       | Compute access not approved for the project                    | `datumctl compute access`; ask the Datum team to approve it                                  |
| `Runtime class can't be changed`                                 | A workload keeps its runtime class                             | Destroy it and redeploy, or use a new name                                                   |

## Cleanup

The deploy creates real cloud resources. Delete them when you finish.

```bash
datumctl compute destroy twins-in-the-loop --yes   # instances and URL; the Secret stays
rm workload.yaml                                   # generated file (never commit it)
rm src/pages/api/diag.ts                           # only if you added it in Part 8
```

Optionally delete the `twins-in-the-loop` package under your GitHub profile →
Packages → Package settings → Danger Zone.
