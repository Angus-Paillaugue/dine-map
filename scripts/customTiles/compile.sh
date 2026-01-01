#!/usr/bin/env bash

HERE=$(dirname "$0")
PROJECT_ROOT=$(realpath "$HERE/../..")
TILES_LOCATION="$PROJECT_ROOT/tileset"
IN_FILENAME="data.osm.pbf"
IN_FILE="$TILES_LOCATION/data.osm.pbf"
OUT_FILENAME="tiles.mbtiles"

# If the in file does not ests, throw
if [ ! -f "$IN_FILE" ]; then
  echo "Input file $IN_FILE does not exist. Please run the downloader first."
  exit 1
fi

# If the required files do not exist, throw
for required_file in config-openmaptiles.json process-openmaptiles.lua; do
  if [ ! -f "$TILES_LOCATION/$required_file" ]; then
    echo "Required file $required_file does not exist in $TILES_LOCATION. Please add it."
    exit 1
  fi
done

docker run --rm -v $TILES_LOCATION:/tileset:Z ghcr.io/systemed/tilemaker:master /tileset/$IN_FILENAME --output /tileset/$OUT_FILENAME --config /tileset/config-openmaptiles.json --process /tileset/process-openmaptiles.lua --store /tileset/tmp

# Once all of the data has been processed successfully, we can remove the input file
if [ $? -eq 0 ]; then
  rm -f "$IN_FILE"
fi
