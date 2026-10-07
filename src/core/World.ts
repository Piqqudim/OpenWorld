import type { WorldCamera } from './WorldCamera';
import type { WorldCoordinate } from './WorldCoordinate';
import type { WorldObject } from './WorldObject';

export type WorldListener = (
  coordinate: WorldCoordinate,
) => void;

export type WorldObjectListener = (
  object: WorldObject,
) => void;

export class World {
  readonly camera: WorldCamera;

  private objects =
    new Map<string, WorldObject>();

  private cameraListeners =
    new Set<WorldListener>();

  private objectAddedListeners =
    new Set<WorldObjectListener>();

  private objectRemovedListeners =
    new Set<(id: string) => void>();

  constructor(
    camera: WorldCamera,
  ) {
    this.camera = camera;
  }

  addObject(
    object: WorldObject,
  ): void {
    if (
      this.objects.has(object.id)
    ) {
      return;
    }

    this.objects.set(
      object.id,
      object,
    );

    for (
      const listener of
        this.objectAddedListeners
    ) {
      listener(object);
    }
  }

  removeObject(
    id: string,
  ): void {
    if (
      !this.objects.has(id)
    ) {
      return;
    }

    this.objects.delete(id);

    for (
      const listener of
        this.objectRemovedListeners
    ) {
      listener(id);
    }
  }

  getObject(
    id: string,
  ): WorldObject | undefined {
    return this.objects.get(id);
  }

  getObjects(): WorldObject[] {
    return [
      ...this.objects.values(),
    ];
  }

  getObjectsByType(
    type: WorldObject['type'],
  ): WorldObject[] {
    return this.getObjects()
      .filter(
        (object) =>
          object.type === type,
      );
  }

  getLocation(): WorldCoordinate {
    return {
      ...this.camera.position,
    };
  }

  updateCamera(
    coordinate: WorldCoordinate,
    zoom: number,
    bearing: number,
    pitch: number,
  ): void {
    this.camera.position =
      coordinate;

    this.camera.zoom =
      zoom;

    this.camera.bearing =
      bearing;

    this.camera.pitch =
      pitch;

    for (
      const listener of
        this.cameraListeners
    ) {
      listener(
        this.getLocation(),
      );
    }
  }

  onCameraChanged(
    listener: WorldListener,
  ): () => void {
    this.cameraListeners.add(
      listener,
    );

    return () => {
      this.cameraListeners.delete(
        listener,
      );
    };
  }

  onObjectAdded(
    listener: WorldObjectListener,
  ): () => void {
    this.objectAddedListeners.add(
      listener,
    );

    return () => {
      this.objectAddedListeners.delete(
        listener,
      );
    };
  }

  onObjectRemoved(
    listener: (id: string) => void,
  ): () => void {
    this.objectRemovedListeners.add(
      listener,
    );

    return () => {
      this.objectRemovedListeners.delete(
        listener,
      );
    };
  }
  removeObjectsBySource(
  provider: string,
  tilePrefix: string,
): void {
  const idsToRemove: string[] = [];

  for (
    const object of
      this.objects.values()
  ) {
    if (
      object.source?.provider !==
      provider
    ) {
      continue;
    }

    if (
      !object.id.startsWith(
        tilePrefix,
      )
    ) {
      continue;
    }

    idsToRemove.push(
      object.id,
    );
  }

  for (
    const id of idsToRemove
  ) {
    this.removeObject(id);
  }
}
}