export interface TileKey {
  z: number;
  x: number;
  y: number;
}

export function tileId(tile: TileKey): string {
  return `${tile.z}/${tile.x}/${tile.y}`;
}

function clamp(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(Math.max(value, min), max);
}

export function longitudeToTileX(
  longitude: number,
  zoom: number,
): number {
  const n = 2 ** zoom;

  const normalized =
    (longitude + 180) / 360;

  return Math.floor(
    clamp(normalized, 0, 0.999999999) * n,
  );
}

export function latitudeToTileY(
  latitude: number,
  zoom: number,
): number {
  const n = 2 ** zoom;

  const lat = clamp(
    latitude,
    -85.05112878,
    85.05112878,
  );

  const radians =
    (lat * Math.PI) / 180;

  const mercator =
    Math.asinh(Math.tan(radians));

  return Math.floor(
    ((1 - mercator / Math.PI) / 2) * n,
  );
}

export function worldToTile(
  longitude: number,
  latitude: number,
  zoom: number,
): TileKey {
  return {
    z: zoom,
    x: longitudeToTileX(longitude, zoom),
    y: latitudeToTileY(latitude, zoom),
  };
}