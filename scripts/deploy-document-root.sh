#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_ROOT:?DEPLOY_ROOT is required}"
: "${DEPLOY_SSH_KEY:?DEPLOY_SSH_KEY is required}"
: "${SSH_KNOWN_HOSTS:?SSH_KNOWN_HOSTS is required}"

DEPLOY_PORT="${DEPLOY_PORT:-22}"
if ! [[ "$DEPLOY_PORT" =~ ^[0-9]+$ ]] || (( DEPLOY_PORT < 1 || DEPLOY_PORT > 65535 )); then
  echo "DEPLOY_PORT must be an integer from 1 to 65535" >&2
  exit 2
fi
if [[ "$DEPLOY_ROOT" != /* ]] || [[ "$DEPLOY_ROOT" == "/" ]] || [[ "$DEPLOY_ROOT" == *$'\n'* ]] || [[ "$DEPLOY_ROOT" == *$'\r'* ]]; then
  echo "DEPLOY_ROOT must be a clean absolute path and cannot be /" >&2
  exit 2
fi

preserve_args=()
if [[ -n "${DEPLOY_PRESERVE_DIR:-}" ]]; then
  if ! [[ "$DEPLOY_PRESERVE_DIR" =~ ^[A-Za-z0-9._-]+$ ]] || [[ "$DEPLOY_PRESERVE_DIR" == "." ]] || [[ "$DEPLOY_PRESERVE_DIR" == ".." ]]; then
    echo "DEPLOY_PRESERVE_DIR must be one safe top-level directory name" >&2
    exit 2
  fi
  preserve_args+=("--exclude=/$DEPLOY_PRESERVE_DIR/")
fi

key_file="$(mktemp)"
known_hosts_file="$(mktemp)"
cleanup() { rm -f "$key_file" "$known_hosts_file"; }
trap cleanup EXIT
printf '%s\n' "$DEPLOY_SSH_KEY" > "$key_file"
printf '%s\n' "$SSH_KNOWN_HOSTS" > "$known_hosts_file"
chmod 600 "$key_file" "$known_hosts_file"

ssh_opts=(-i "$key_file" -p "$DEPLOY_PORT" -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$known_hosts_file")
ssh "${ssh_opts[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p -- '$DEPLOY_ROOT'"
rsync -az --delete "${preserve_args[@]}" -e "ssh -i '$key_file' -p '$DEPLOY_PORT' -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile='$known_hosts_file'" dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_ROOT/"
echo "Published dist/ to $DEPLOY_ROOT"
