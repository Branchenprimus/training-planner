#!/usr/bin/env bash
set -euo pipefail

cd /app

lock_hash_file="node_modules/.training-planner-lockhash"
current_hash="$(
  {
    sha256sum package.json
    sha256sum package-lock.json
  } | sha256sum | awk '{ print $1 }'
)"

needs_install=0

if [ ! -d node_modules ]; then
  needs_install=1
elif [ ! -f "$lock_hash_file" ]; then
  needs_install=1
elif [ "$(cat "$lock_hash_file")" != "$current_hash" ]; then
  needs_install=1
fi

if [ "$needs_install" -eq 1 ]; then
  echo "[dev-entrypoint] Dependency change detected. Running npm ci..."
  npm ci --prefer-offline --no-audit
  mkdir -p "$(dirname "$lock_hash_file")"
  printf '%s' "$current_hash" > "$lock_hash_file"
else
  echo "[dev-entrypoint] Dependencies already up to date."
fi

if [ -d .nuxt ]; then
  echo "[dev-entrypoint] Clearing stale .nuxt cache..."
  rm -rf .nuxt/*
fi

exec npm run dev:host
