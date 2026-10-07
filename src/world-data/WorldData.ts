import type {

  Geometry,
} from 'geojson';

export type WorldFeatureType =
  | 'road'
  | 'water'
  | 'land'
  | 'building'
  | 'place'
  | 'other';

export interface WorldFeature {
  id: string;

  type: WorldFeatureType;

  geometry: Geometry;

  properties: Record<string, unknown>;

  source: {
    provider: string;
    layer: string;
    id?: number;
  };
}

export interface WorldTileData {
  tile: {
    z: number;
    x: number;
    y: number;
  };

  features: WorldFeature[];
}