#!/usr/bin/env bash

HERE=$(dirname "$0")
PROJECT_ROOT=$(realpath "$HERE/../..")
TILES_LOCATION=${PROJECT_ROOT}/tileset
OUT_FILENAME="data.osm.pbf"
OUT_FILE="$TILES_LOCATION/$OUT_FILENAME"

mkdir -p "$TILES_LOCATION"

if [ -f "$PROJECT_ROOT/.env" ]; then
  export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
else
  echo "Please set TILES_CONTINENT and optionally TILES_COUNTRY environement variables in .env"
  exit 1
fi

# We do not need to check if the file exists, download-osm does it for us
docker run --rm -v $PROJECT_ROOT/tileset:/tileset:Z openmaptiles/openmaptiles-tools download-osm ${TILES_CONTINENT}${TILES_COUNTRY:+/${TILES_COUNTRY}} -o "/tileset/$OUT_FILENAME"
