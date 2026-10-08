import type { Geometry } from 'geojson';

import type { WorldDimensions } from './WorldDimensions';
import type { WorldCoordinate } from './WorldCoordinate';
import type { WorldTransform } from './WorldTransform';

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

  transform: WorldTransform;

  geometry?: Geometry;

  dimensions?: WorldDimensions;

  properties: Record<string, unknown>;

  source?: {
    provider: string;
    layer: string;
    id?: number;
  };
}