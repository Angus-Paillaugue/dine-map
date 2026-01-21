# Getting started

First, clone the repo :

```bash
git clone https://github.com/Angus-Paillaugue/dine-map
cd dine-map
```

Then, copy the `.env` file :

```bash
mv .env.example .env
```

You can now set strong variables for the `POSTGRES_PASSWORD` if you want.
If you are running the frontend behind a web

## With custom self-hosted tiles

You first need to generate the tiles.
To do so, open [.env](.env) and set the `TILES_CONTINENT` to the continent you want to download the tiles, and optionally (it's heavily recommended), set `TILES_COUNTRY` to the country of your choosing.

Then run the generation script

```bash
./scripts/customTiles/all.sh
```

This script will download and process the tiles of the area you choose previously.

> [!WARNING]
> This can be a long and intensive process.
> The resulting file can be weigh then's of Gb

Once finished, you should have a file called [tileset/tiles.mbtiles](tileset/tiles.mbtiles). This will be used by the file server to render the map tiles with the custom matching styles.

You can now run everything :

```bash
docker compose up -d
```

# Ressources

## Maps

- [https://nominatim.org/release-docs/latest/api/Search/](https://nominatim.org/release-docs/latest/api/Search/)
- [https://svelte-openlayers.com/](https://svelte-openlayers.com/)
- [https://github.com/openmaptiles/openmaptiles-tools?tab=readme-ov-file#multi-streamed-osm-data-downloader](https://github.com/openmaptiles/openmaptiles-tools?tab=readme-ov-file#multi-streamed-osm-data-downloader)
- [https://github.com/systemed/tilemaker?tab=readme-ov-file#getting-started](https://github.com/systemed/tilemaker?tab=readme-ov-file#getting-started)
- [https://download.geofabrik.de/](https://download.geofabrik.de/)
- [https://github.com/maptiler/tileserver-gl](https://github.com/maptiler/tileserver-gl)

## Runtime

- [https://bun.com/docs/runtime/sql](https://bun.com/docs/runtime/sql)
