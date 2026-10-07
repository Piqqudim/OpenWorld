import type { WorldCoordinate } from './WorldCoordinate';

export interface WorldObject {
  id: string;
  type: string;
  position: WorldCoordinate;
}