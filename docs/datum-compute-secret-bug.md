# Cloud console stores some Secret values without base64-encoding them

## Summary

The **New Secret** form in the Datum Cloud console (Project → Secrets) says _"Values will be base64-encoded automatically"_. For values that already look like base64, such as hex API tokens, it skips the encoding and stores the raw string in `data`. Kubernetes then base64-decodes that string, so the value the workload receives is random binary bytes instead of the token.

On Datum Compute this shows up as an instance that never starts: any workload that imports the Secret with `envFrom.secretRef` (`--env-from-secret`) fails with a generic `ConfigurationError`.

## Environment

| Item    | Value                                                         |
| ------- | ------------------------------------------------------------- |
| Project | `project-2h27h` (org `personal-org-86e0525b`)                 |
| Secret  | `twins-strapi-secrets`, type `Opaque`, created in the console |
| Date    | 2026-09-28                                                    |

## Reproduction

1. Console → project → **Secrets** → **New Secret**, type `Opaque`.
2. Add a key with a value made only of hex characters whose length is a multiple of 4, for example a 64-character hex string (`openssl rand -hex 32`).
3. Add a key with a URL, for example `https://example.com`.
4. Create the Secret and read it back:

   ```bash
   datumctl get secret <name> --project=<project> -o json | jq '.data'
   ```

**Result:** the URL is stored as proper base64. The hex value is stored as the raw hex string. Decoding it gives binary.

What we saw on `twins-strapi-secrets` (lengths only; values not shown):

| Key                     | Stored in `data`              | Decoded                      | Correct? |
| ----------------------- | ----------------------------- | ---------------------------- | -------- |
| `STRAPI_URL`            | 72 base64 chars               | 52-char URL, printable       | ✅       |
| `STRAPI_TOKEN`          | 256 hex chars = the raw token | 192 bytes, 127 non-printable | ❌       |
| `STRAPI_WEBHOOK_SECRET` | 64 hex chars = the raw value  | 48 bytes, 31 non-printable   | ❌       |

Hex uses only characters from the base64 alphabet, and both lengths are multiples of 4, so the value passes as "already base64". The form likely detects that and does not encode it.

## Impact on Compute

| Workload (all same image, `general-purpose`)       | Secret state             | Instance                       |
| -------------------------------------------------- | ------------------------ | ------------------------------ |
| `twins-in-the-loop`, `--env-from-secret`           | as stored by the console | `Unknown / ConfigurationError` |
| `twins-probe`, no Secret                           | –                        | `True / Available`             |
| `twins-probe`, plain `--env=PROBE=plain`           | –                        | `True / Available`             |
| `twins-probe`, then `--env-from-secret`            | as stored by the console | `Unknown / ConfigurationError` |
| `twins-secret`, `--env-from-secret` (new workload) | re-encoded correctly     | `True / Available`             |

The only change between the failing and working runs is the encoding of the two hex values. Env vars holding non-UTF-8 bytes are presumably rejected when the instance is programmed, but the condition only says:

```
The instance could not be started due to a configuration error
```

The WorkloadDeployment still reports `ReferencedDataReady=True` (`All 1 referenced companion(s) are materialised`), so nothing points at the Secret's contents.

## Fix applied

Each wrongly stored value was the original string, so it was base64-encoded once and re-applied:

```bash
datumctl get secret twins-strapi-secrets --project=project-2h27h -o json \
  | jq 'del(.metadata.managedFields, .metadata.resourceVersion, .metadata.uid, .metadata.creationTimestamp)
        | .data.STRAPI_TOKEN |= @base64
        | .data.STRAPI_WEBHOOK_SECRET |= @base64' \
  | datumctl apply -f - --project=project-2h27h
```

After that, all three keys decode to printable text and `twins-secret` starts normally.

To avoid the bug entirely, create Secrets with `stringData` through the CLI. The API server does the encoding:

```bash
datumctl apply -f datum/secret.yaml --project=project-2h27h
```

## Expected

1. The console always base64-encodes what the user types, or offers an explicit "value is already base64" option.
2. When an instance cannot start because of an env value, the condition names the variable and the reason (for example, "env STRAPI_TOKEN is not valid UTF-8").
3. `ReferencedDataReady` does not report ready when referenced data cannot be used as env vars.

## Earlier misdiagnosis

This was first reported internally as "`envFrom.secretRef` breaks sandbox instances". That was wrong: `envFrom` works once the Secret holds correctly encoded values. The stuck rollout seen on the broken workload matches datum-cloud/compute#297 (spec changes do not roll running instances) and is tracked there.
