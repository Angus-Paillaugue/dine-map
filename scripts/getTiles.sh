#!/usr/bin/env bash

TILES_LOCATION="/tileset"

mkdir -p "$TILES_LOCATION"

: "${TILES_CONTINENT:?Need to set TILES_CONTINENT non-empty variable}"
: "${TILES_COUNTRY:?Need to set TILES_COUNTRY non-empty variable}"

OSM_OUT_FILE="$TILES_LOCATION/data.osm.pbf"
MBTILES_OUT_FILE="$TILES_LOCATION/tiles.mbtiles"

if [ -f "$MBTILES_OUT_FILE" ]; then
  echo "Mbtiles data file $MBTILES_OUT_FILE already exists. Skipping download."
  exit 0
fi

echo "Downloading OSM data to $OSM_OUT_FILE..."
PYTHONPATH=/app/openmaptiles-tools python3 openmaptiles-tools/bin/download-osm ${TILES_CONTINENT}${TILES_COUNTRY:+/${TILES_COUNTRY}} -o "$OSM_OUT_FILE"

requiredFiles=("config-openmaptiles.json" "process-openmaptiles.lua" "config.json" "styles.json")

for file in "${requiredFiles[@]}"; do
  if [ ! -f "$TILES_LOCATION/$file" ]; then
    echo "Downloading missing file $file..."
    curl -o "$TILES_LOCATION/$file" "https://github.com/Angus-Paillaugue/dine-map/blob/main/tileset/$file"
  fi
done


if [ -f "$MBTILES_OUT_FILE" ]; then
  echo "Mbtiles data file $MBTILES_OUT_FILE already exists. Skipping compilation."
else

  if [ ! -f "$OSM_OUT_FILE" ]; then
    echo "Input file $OSM_OUT_FILE does not exist. Please run the downloader first."
    exit 1
  fi

  echo "Compiling tiles from $OSM_OUT_FILE..."
  tilemaker --input "$OSM_OUT_FILE" \
            --output "$MBTILES_OUT_FILE" \
            --config "$TILES_LOCATION/config-openmaptiles.json" \
            --process "$TILES_LOCATION/process-openmaptiles.lua" \
            --store "$TILES_LOCATION/tmp"

  if [ $? -eq 0 ]; then
    echo "Successfully compiled tiles to $MBTILES_OUT_FILE"
    rm -f "$OSM_OUT_FILE"
  else
    echo "Failed to compile tiles"
    exit 1
  fi
fi
