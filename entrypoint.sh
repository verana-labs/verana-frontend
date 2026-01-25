#!/bin/sh
set -e

# Runtime environment variables are handled by next-runtime-env
# No file modification needed - NEXT_PUBLIC_* vars are read at runtime
# See: https://github.com/expatfile/next-runtime-env

# Validate required environment variables
REQUIRED_VARS="
NEXT_PUBLIC_VERANA_CHAIN_ID
NEXT_PUBLIC_VERANA_CHAIN_NAME
NEXT_PUBLIC_VERANA_RPC_ENDPOINT
NEXT_PUBLIC_VERANA_REST_ENDPOINT
"

echo "Validating environment variables..."
missing_vars=""

for var in $REQUIRED_VARS; do
    val=$(eval echo "\$$var")
    if [ -z "$val" ]; then
        missing_vars="$missing_vars $var"
        echo "ERROR: Missing required environment variable: $var"
    fi
done

if [ -n "$missing_vars" ]; then
    echo "FATAL: Required environment variables are missing:$missing_vars"
    echo "Please configure these variables in your Kubernetes deployment."
    exit 1
fi

echo "Environment validation passed"
echo "Starting Next.js"
exec "$@"
