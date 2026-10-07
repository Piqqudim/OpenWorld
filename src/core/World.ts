// src/core/World.ts

import type { WorldCamera } from './WorldCamera';
import type { WorldCoordinate } from './WorldCoordinate';
import type { WorldObject } from './WorldObject';

export type WorldListener = (
  coordinate: WorldCoordinate
) => void;

export class World {
  readonly camera: WorldCamera;

  private objects = new Map<string, WorldObject>();
  private listeners = new Set<WorldListener>();

  constructor(camera: WorldCamera) {
    this.camera = camera;
  }

  addObject(object: WorldObject): void {
    if (this.objects.has(object.id)) {
      throw new Error(`Object already exists: ${object.id}`);
    }

    this.objects.set(object.id, object);
  }

  removeObject(id: string): void {
    this.objects.delete(id);
  }

  getObject(id: string): WorldObject | undefined {
    return this.objects.get(id);
  }

  getObjects(): WorldObject[] {
    return [...this.objects.values()];
  }

  getLocation(): WorldCoordinate {
    return { ...this.camera.position };
  }

  updateCamera(
    coordinate: WorldCoordinate,
    zoom: number,
    bearing: number,
    pitch: number,
  ): void {
    this.camera.position = coordinate;
    this.camera.zoom = zoom;
    this.camera.bearing = bearing;
    this.camera.pitch = pitch;

    for (const listener of this.listeners) {
      listener(this.getLocation());
    }
  }

  onCameraChanged(listener: WorldListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}