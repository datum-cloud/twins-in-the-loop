#!/usr/bin/env bash
# Deploys IMAGE to Datum Compute. Requires datumctl (logged in) and jq.
set -euo pipefail

: "${IMAGE:?set IMAGE, e.g. ghcr.io/datum-cloud/twins-in-the-loop:sha-abc1234}"
WORKLOAD="${WORKLOAD:-twins-in-the-loop}"
PROJECT="${DATUM_PROJECT:-project-2h27h}"
LOCATION="${LOCATION:-us-central-1}"
SECRET_NAME="${SECRET_NAME:-twins-strapi-secrets}"
PORT=4321

exists() {
  datumctl compute workloads --project="$PROJECT" -o json |
    jq -e --arg n "$WORKLOAD" 'any(.[]; .name == $n)' >/dev/null
}

if ! exists; then
  # Flags create the workload plus its Datum-managed HTTPS URL; runtime class
  # and network are fixed for the workload's lifetime after this.
  datumctl compute deploy "$WORKLOAD" \
    --project="$PROJECT" \
    --image="$IMAGE" \
    --location="$LOCATION" \
    --http-port="$PORT" \
    --runtime-class=general-purpose \
    --instance-type=datumcloud/d1-standard-2 \
    --yes
fi

# `compute deploy` has no env flags, so image + env are patched onto the
# workload spec directly. On updates this is a single rollout.
datumctl get workload "$WORKLOAD" --project="$PROJECT" -o json |
  jq --arg image "$IMAGE" --arg port "$PORT" --arg secret "$SECRET_NAME" '
    del(.status, .metadata.managedFields, .metadata.resourceVersion,
        .metadata.uid, .metadata.creationTimestamp, .metadata.generation)
    | .spec.template.spec.runtime.sandbox.containers[0] |= (
        .image = $image
        | .env = [{name: "HOST", value: "::"}, {name: "PORT", value: $port}]
        | .envFrom = [{secretRef: {name: $secret}}]
      )' |
  datumctl apply -f - --project="$PROJECT"

datumctl compute workloads describe "$WORKLOAD" --project="$PROJECT"

url="$(datumctl compute workloads --project="$PROJECT" -o json |
  jq -r --arg n "$WORKLOAD" '.[] | select(.name == $n) | .url // empty')"
echo "url=${url}"
