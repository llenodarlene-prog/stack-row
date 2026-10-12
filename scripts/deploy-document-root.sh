#!/usr/bin/env bash
set -euo pipefail

: "${DEPLOY_HOST:?DEPLOY_HOST is required}"
: "${DEPLOY_USER:?DEPLOY_USER is required}"
: "${DEPLOY_ROOT:?DEPLOY_ROOT is required}"
: "${DEPLOY_SSH_KEY:?DEPLOY_SSH_KEY is required}"
: "${SSH_KNOWN_HOSTS:?SSH_KNOWN_HOSTS is required}"

deploy_port="${DEPLOY_PORT:-65002}"
if [[ ! "$deploy_port" =~ ^[0-9]{1,5}$ ]] || (( 10#$deploy_port < 1 || 10#$deploy_port > 65535 )); then
  echo "DEPLOY_PORT must be an integer from 1 to 65535" >&2
  exit 2
fi

case "$DEPLOY_ROOT" in
  /|"") echo "Refusing unsafe DEPLOY_ROOT" >&2; exit 2 ;;
esac
if [[ ! "$DEPLOY_ROOT" =~ ^/[A-Za-z0-9._/-]+$ ]]; then
  echo "DEPLOY_ROOT contains unsafe characters" >&2
  exit 2
fi

require_suffix="${DEPLOY_REQUIRE_SUFFIX:-}"
if [[ -n "$require_suffix" && "${DEPLOY_ROOT%/}" != *"$require_suffix" ]]; then
  echo "DEPLOY_ROOT must end with $require_suffix for this environment" >&2
  exit 2
fi

if [[ ! -f dist/index.html ]]; then
  echo "dist/index.html is required" >&2
  exit 2
fi

if grep -q '"environment": "production"' dist/build-manifest.json 2>/dev/null && [[ "${DEPLOY_ROOT%/}" == */staging ]]; then
  echo "Refusing to upload a production build into a staging document root" >&2
  exit 2
fi

preserve_dir="${DEPLOY_PRESERVE_DIR:-}"
rsync_opts=(-az --delete)
if [[ -n "$preserve_dir" ]]; then
  if [[ ! "$preserve_dir" =~ ^[A-Za-z0-9._-]+$ ]] || [[ "$preserve_dir" == "." || "$preserve_dir" == ".." ]]; then
    echo "DEPLOY_PRESERVE_DIR must be one safe top-level directory name" >&2
    exit 2
  fi
  rsync_opts+=(--exclude "/$preserve_dir/")
fi

known_hosts="$(mktemp)"
key_file="$(mktemp)"
cleanup(){ rm -f "$known_hosts" "$key_file"; }
trap cleanup EXIT

printf '%s\n' "$SSH_KNOWN_HOSTS" > "$known_hosts"
printf '%s\n' "$DEPLOY_SSH_KEY" > "$key_file"
chmod 600 "$key_file"

ssh_opts=(-p "$deploy_port" -i "$key_file" -o BatchMode=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$known_hosts")

ssh "${ssh_opts[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "mkdir -p '$DEPLOY_ROOT'"
rsync "${rsync_opts[@]}" -e "ssh ${ssh_opts[*]}" dist/ "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_ROOT/"
ssh "${ssh_opts[@]}" "$DEPLOY_USER@$DEPLOY_HOST" "test -f '$DEPLOY_ROOT/index.html'"

echo "Published dist/ to $DEPLOY_ROOT"
