#!/bin/bash
# This is the entrypoint script for the web docker container. It is responsible for running database migrations and launching the production server.

set -e

# Since the DATABASE_URL en var is constructed using other en vars, we need to export it here to account for overrides from docker-compose
export DATABASE_URL="postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

retries=0
echo "Checking database connection to $POSTGRES_HOST:$POSTGRES_PORT..."
until nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
  retries=$((retries + 1))
  echo "Waiting for database to be ready ($retries)..."
  if [ $retries -ge 30 ]; then
    echo "Error: Unable to connect to database at $POSTGRES_HOST:$POSTGRES_PORT after 30 attempts."
    exit 1
  fi
  sleep 2
done
echo "Database is ready!"

# Run database migrations
bun run db:migrate

echo "Running Dine Map version $(cat ./VERSION)"

# Launch prod server
bun --bun run build/index.js
