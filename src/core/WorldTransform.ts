import type { WorldCoordinate } from './WorldCoordinate';

export interface WorldRotation {
  /**
   * Rotation around X axis.
   * Radians.
   */
  pitch: number;

  /**
   * Rotation around Y axis.
   * Radians.
   */
  yaw: number;

  /**
   * Rotation around Z axis.
   * Radians.
   */
  roll: number;
}

export interface WorldScale {
  x: number;
  y: number;
  z: number;
}

export interface WorldTransform {
  position: WorldCoordinate;
  rotation: WorldRotation;
  scale: WorldScale;
}

export function createWorldTransform(
  position: WorldCoordinate,
): WorldTransform {
  return {
    position: {
      ...position,
    },

    rotation: {
      pitch: 0,
      yaw: 0,
      roll: 0,
    },

    scale: {
      x: 1,
      y: 1,
      z: 1,
    },
  };
}