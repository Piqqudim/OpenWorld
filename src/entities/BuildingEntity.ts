import type { WorldDimensions } from '../core/WorldDimensions';
import type { WorldObject } from '../core/WorldObject';
import type { WorldSpace } from '../core/WorldSpace';
import type { WorldTransform } from '../core/WorldTransform';
import type { MeshGeometry } from '../core/MeshGeometry';

import {
  createBuildingMesh,
} from './BuildingMesh';

export interface BuildingEntity {
  id: string;

  type: 'building';

  transform: WorldTransform;

  dimensions: WorldDimensions;

  mesh: MeshGeometry;

  source?: WorldObject['source'];

  properties: Record<string, unknown>;
}

export function createBuildingEntity(
  object: WorldObject,
  worldSpace: WorldSpace,
): BuildingEntity | null {
  if (
    object.type !== 'building'
  ) {
    return null;
  }

  if (
    !object.geometry ||
    !object.dimensions
  ) {
    return null;
  }

  const mesh =
    createBuildingMesh(
      object.geometry,
      object.transform.position,
      object.dimensions.height,
      object.dimensions.baseHeight,
      worldSpace,
    );

  return {
    id: object.id,

    type: 'building',

    transform: {
      position: {
        ...object.transform.position,
      },

      rotation: {
        ...object.transform.rotation,
      },

      scale: {
        ...object.transform.scale,
      },
    },

    dimensions: {
      ...object.dimensions,
    },

    mesh,

    source: object.source,

    properties: {
      ...object.properties,
    },
  };
}