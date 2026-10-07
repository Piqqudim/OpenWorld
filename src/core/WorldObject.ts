import type { Geometry } from 'geojson';

import type { WorldCoordinate } from './WorldCoordinate';

export type WorldObjectType =
  | 'road'
  | 'water'
  | 'land'
  | 'building'
  | 'place'
  | 'other';

export interface WorldObject {
  id: string;

  type: WorldObjectType;

  position: WorldCoordinate;

  geometry?: Geometry;

  properties: Record<string, unknown>;

  source?: {
    provider: string;
    layer: string;
    id?: number;
  };
}