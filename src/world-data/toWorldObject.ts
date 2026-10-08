import type { Geometry } from 'geojson';

import type { WorldObject } from '../core/WorldObject';
import {
  createWorldTransform,
} from '../core/WorldTransform';

import type { WorldFeature } from './WorldData';

import {
  getWorldDimensions,
} from './getWorldDimensions';
export function toWorldObject(
  feature: WorldFeature,
): WorldObject {
  const properties = {
    ...feature.properties,
  };

  const position =
    getFeaturePosition(
      feature.geometry,
    );

  const dimensions =
    getWorldDimensions(
      feature.type,
      properties,
    );

  return {
    id: feature.id,

    type: feature.type,

    transform:
      createWorldTransform(
        position,
      ),

    geometry:
      feature.geometry,

    dimensions,

    properties,

    source: {
      ...feature.source,
    },
  };
}

function getFeaturePosition(
  geometry: Geometry,
) {
  if (
    geometry.type === 'Point'
  ) {
    return {
      longitude:
        geometry.coordinates[0],

      latitude:
        geometry.coordinates[1],

      elevation: 0,
    };
  }

  /*
   * For lines and polygons,
   * we calculate a simple center.
   *
   * Later we'll have a proper
   * geographic centroid system.
   */

  const first =
    getFirstCoordinate(
      geometry,
    );

  return {
    longitude: first[0],
    latitude: first[1],
    elevation: 0,
  };
}

function getFirstCoordinate(
  geometry: Geometry,
): [number, number] {
  switch (geometry.type) {
    case 'LineString':
      return [ geometry.coordinates[0][0], geometry.coordinates[1][1]];

    case 'Polygon':
      return [geometry.coordinates[0][0][0], geometry.coordinates[0][0][1]];

    case 'MultiPoint':
      return [geometry.coordinates[0][0], geometry.coordinates[0][1]];

    case 'MultiLineString':
      return [geometry.coordinates[0][0][0], geometry.coordinates[0][0][1]];

    case 'MultiPolygon':
      return [geometry.coordinates[0][0][0][0], geometry.coordinates[0][0][0][1]];

    case 'Point':
      return [geometry.coordinates[0],geometry.coordinates[1]];

    case 'GeometryCollection':
        if(geometry.geometries.length === 0){
            throw new Error("Geometry Collection contains no geometries");
        }
      return getFirstCoordinate(
        geometry.geometries[0],
      );

    default:
      throw new Error(
        'Unsupported geometry',
      );
  }
}