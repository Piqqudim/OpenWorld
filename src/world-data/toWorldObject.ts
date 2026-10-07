import type {
  Geometry,
} from 'geojson';

import type {
  WorldFeature,
} from './WorldData';

import type {
  WorldObject,
} from '../core/WorldObject';

export function toWorldObject(
  feature: WorldFeature,
): WorldObject {
  return {
    id: feature.id,

    type: feature.type,

    position:
      getFeaturePosition(
        feature.geometry,
      ),

    geometry:
      feature.geometry,

    properties: {
      ...feature.properties,
    },

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
      return geometry.coordinates[0];

    case 'Polygon':
      return geometry.coordinates[0][0];

    case 'MultiPoint':
      return geometry.coordinates[0];

    case 'MultiLineString':
      return geometry.coordinates[0][0];

    case 'MultiPolygon':
      return geometry.coordinates[0][0][0];

    case 'Point':
      return geometry.coordinates;

    case 'GeometryCollection':
      return getFirstCoordinate(
        geometry.geometries[0],
      );

    default:
      throw new Error(
        'Unsupported geometry',
      );
  }
}