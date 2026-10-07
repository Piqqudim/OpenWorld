
import {PbfReader} from 'pbf';
import {VectorTile} from '@mapbox/vector-tile';

import type {Feature, Geometry, GeoJsonProperties} from 'geojson';

import type {TileKey} from '../world-stream/TileKey';

import type {
  WorldDataProvider,
} from './WorldDataProvider';

import type {
  WorldFeature,
  WorldTileData,
  WorldFeatureType,
} from './WorldData';

const TILE_URL =
  'https://tiles.openfreemap.org/planet/{z}/{x}/{y}';

export class OpenFreeMapProvider
  implements WorldDataProvider
{
  async loadTile(
    tile: TileKey,
  ): Promise<WorldTileData> {
    const url =
      TILE_URL
        .replace('{z}', String(tile.z))
        .replace('{x}', String(tile.x))
        .replace('{y}', String(tile.y));

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to load tile ${tile.z}/${tile.x}/${tile.y}: ${response.status}`,
      );
    }

    const buffer =
      await response.arrayBuffer();

    const vectorTile =
      new VectorTile(
        new PbfReader(
          new Uint8Array(buffer),
        ),
      );

    const features: WorldFeature[] = [];

    for (
      const layerName of Object.keys(
        vectorTile.layers,
      )
    ) {
      const layer =
        vectorTile.layers[layerName];

      for (
        let index = 0;
        index < layer.length;
        index++
      ) {
        const feature =
          layer.feature(index);

        const geojson =
          feature.toGeoJSON(
            tile.x,
            tile.y,
            tile.z,
          );

        const worldFeature =
          convertFeature(
            geojson,
            layerName,
            feature.id,
          );

        features.push(
          worldFeature,
        );
      }
    }

    return {
      tile,
      features,
    };
  }

  async unloadTile(
    tile: TileKey,
  ): Promise<void> {
    console.log(
      '[OpenFreeMap] unload',
      tile,
    );
  }
}

function convertFeature(
  feature: Feature<
    Geometry,
    GeoJsonProperties
  >,
  layerName: string,
  id?: number,
): WorldFeature {
  return {
    id: `${layerName}:${id ?? crypto.randomUUID()}`,

    type: classifyFeature(
      layerName,
      feature.properties ?? {},
    ),

    geometry:
      feature.geometry as WorldFeature['geometry'],

    properties: {
      ...(feature.properties ?? {}),
    },

    source: {
      provider: 'openfreemap',
      layer: layerName,
      id,
    },
  };
}

function classifyFeature(
  layer: string,
  properties: Record<string, unknown>,
): WorldFeatureType {
  const name =
    layer.toLowerCase();

  if (
    name.includes('building')
  ) {
    return 'building';
  }

  if (
    name.includes('water')
  ) {
    return 'water';
  }

  if (
    name.includes('transport') ||
    name.includes('road')
  ) {
    return 'road';
  }

  if (
    name.includes('place') ||
    name.includes('poi')
  ) {
    return 'place';
  }

  if (
    properties['landuse'] ||
    name.includes('landcover')
  ) {
    return 'land';
  }

  return 'other';
}

