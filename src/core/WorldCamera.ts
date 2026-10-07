import type { WorldCoordinate } from './WorldCoordinate';

export interface WorldCamera {
  position: WorldCoordinate;
  zoom: number;
  bearing: number;
  pitch: number;
}

export function createWorldCamera(
  position: WorldCoordinate,
): WorldCamera {
  return {
    position,
    zoom: 2,
    bearing: 0,
    pitch: 0,
  };
}