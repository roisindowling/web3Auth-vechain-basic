#!/bin/bash
# Fail on any error
set -e

# Assuming config.json is in the working directory
tmp=$(mktemp)
ls -alh
jq '.url="'${VECHAIN_NODE}'"' config.json > "$tmp" && mv -f "$tmp" config.json
exec npm run start
