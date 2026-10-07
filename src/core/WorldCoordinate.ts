export interface WorldCoordinate {
  latitude: number;
  longitude: number;
  elevation: number;
}

export function createCoordinate(
  latitude: number,
  longitude: number,
  elevation = 0,
): WorldCoordinate {
  if (latitude < -90 || latitude > 90) {
    throw new Error(`Invalid latitude: ${latitude}`);
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error(`Invalid longitude: ${longitude}`);
  }

  return {
    latitude,
    longitude,
    elevation,
  };
}