#!/usr/bin/env bash

# This script hits the local dev server to instantly seed the mock Strava connection 
# bypassing the UI entirely.

set -e

PORT=${1:-3000}
URL="http://localhost:$PORT/api/auth/strava/start"

echo "Connecting mock Strava for local development on port $PORT..."
echo "Hitting: $URL"

# We just need to trigger the endpoint. It will return a 302 redirect, which means success!
HTTP_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$URL")

if [[ "$HTTP_CODE" == "302" || "$HTTP_CODE" == "200" || "$HTTP_CODE" == "303" ]]; then
  echo "✅ Success! The dev database is now seeded with mock Strava data."
  echo "Refresh your dashboard in the browser to see the changes."
else
  echo "❌ Failed to connect. The dev server returned HTTP $HTTP_CODE."
  echo "Make sure the container is actually running on port $PORT."
  exit 1
fi
