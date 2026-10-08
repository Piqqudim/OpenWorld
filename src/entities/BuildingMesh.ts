import earcut from 'earcut';
import type {
  Geometry,
  Polygon,
} from 'geojson';

import type { MeshGeometry } from '../core/MeshGeometry';
import type { WorldCoordinate } from '../core/WorldCoordinate';
import { WorldSpace } from '../core/WorldSpace';

interface Point2D {
  x: number;
  z: number;
}

export function createBuildingMesh(
  geometry: Geometry,
  anchor: WorldCoordinate,
  height: number,
  baseHeight: number,
  worldSpace: WorldSpace,
): MeshGeometry {
  const polygons =
    extractPolygons(geometry);

  const vertices: number[] = [];
  const indices: number[] = [];

  for (const polygon of polygons) {
    appendPolygonMesh(
      polygon,
      anchor,
      height,
      baseHeight,
      worldSpace,
      vertices,
      indices,
    );
  }

  return {
    vertices:
      new Float32Array(vertices),

    indices:
      new Uint32Array(indices),
  };
}

function appendPolygonMesh(
  polygon: Polygon,
  anchor: WorldCoordinate,
  height: number,
  baseHeight: number,
  worldSpace: WorldSpace,
  vertices: number[],
  indices: number[],
): void {
  const rings =
    polygon.coordinates
      .map((ring) =>
        normalizeRing(
          ring,
          anchor,
          worldSpace,
        ),
      )
      .filter(
        (ring) =>
          ring.length >= 3,
      );

  if (rings.length === 0) {
    return;
  }

  const flatCoordinates: number[] = [];
  const holes: number[] = [];
  const points: Point2D[] = [];

  for (
    let ringIndex = 0;
    ringIndex < rings.length;
    ringIndex++
  ) {
    const ring =
      rings[ringIndex];

    if (
      ringIndex > 0
    ) {
      holes.push(
        points.length,
      );
    }

    for (const point of ring) {
      points.push(point);

      flatCoordinates.push(
        point.x,
        point.z,
      );
    }
  }

  const triangles =
    earcut(
      flatCoordinates,
      holes,
      2,
    );

  const vertexStart =
    vertices.length / 3;

  for (const point of points) {
    // Bottom vertex
    vertices.push(
      point.x,
      baseHeight,
      point.z,
    );

    // Top vertex
    vertices.push(
      point.x,
      height,
      point.z,
    );
  }

  for (
    let i = 0;
    i < points.length;
    i++
  ) {
    const bottom =
      vertexStart + i * 2;

    const top =
      bottom + 1;

    const next =
      vertexStart +
      ((i + 1) % points.length) *
        2;

    const nextTop =
      next + 1;

    // Side wall
    indices.push(
      bottom,
      next,
      nextTop,

      bottom,
      nextTop,
      top,
    );
  }

  // Top and bottom surfaces.
  for (
    let i = 0;
    i < triangles.length;
    i += 3
  ) {
    const a =
      triangles[i];

    const b =
      triangles[i + 1];

    const c =
      triangles[i + 2];

    // Top
    indices.push(
      vertexStart + a * 2 + 1,
      vertexStart + b * 2 + 1,
      vertexStart + c * 2 + 1,
    );

    // Bottom, reversed winding
    indices.push(
      vertexStart + c * 2,
      vertexStart + b * 2,
      vertexStart + a * 2,
    );
  }
}

function normalizeRing(
  ring: number[][],
  anchor: WorldCoordinate,
  worldSpace: WorldSpace,
): Point2D[] {
  const points: Point2D[] = [];

  for (const coordinate of ring) {
    if (coordinate.length < 2) {
      continue;
    }

    const local =
      worldSpace.toLocal({
        latitude: coordinate[1],
        longitude: coordinate[0],
        elevation: 0,
      });

    const anchorLocal =
      worldSpace.toLocal(
        anchor,
      );

    points.push({
      x:
        local.x -
        anchorLocal.x,

      z:
        local.z -
        anchorLocal.z,
    });
  }

  // GeoJSON rings normally repeat
  // their first coordinate at the end.
  if (
    points.length > 1 &&
    samePoint(
      points[0],
      points[points.length - 1],
    )
  ) {
    points.pop();
  }

  return points;
}

function samePoint(
  a: Point2D,
  b: Point2D,
): boolean {
  return (
    Math.abs(a.x - b.x) <
      0.000001 &&
    Math.abs(a.z - b.z) <
      0.000001
  );
}

function extractPolygons(
  geometry: Geometry,
): Polygon[] {
  switch (geometry.type) {
    case 'Polygon':
      return [geometry];

    case 'MultiPolygon':
      return geometry.coordinates.map(
        (coordinates) => ({
          type: 'Polygon',
          coordinates,
        }),
      );

    default:
      return [];
  }
}