import type { WorldCamera } from './WorldCamera';
import type { WorldCoordinate } from './WorldCoordinate';
import type { WorldObject } from './WorldObject';

export type WorldListener = (
  coordinate: WorldCoordinate,
) => void;

export type WorldObjectListener = (
  object: WorldObject,
) => void;

export type WorldSelectionListener = (
  object: WorldObject | null,
) => void;

export class World {
  readonly camera: WorldCamera;

  private objects =
    new Map<string, WorldObject>();

  private selectedObjectId: string | null =
    null;

  private cameraListeners =
    new Set<WorldListener>();

  private objectAddedListeners =
    new Set<WorldObjectListener>();

  private objectRemovedListeners =
    new Set<(id: string) => void>();

  private selectionListeners =
    new Set<WorldSelectionListener>();

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

    if (
      this.selectedObjectId === id
    ) {
      this.selectedObjectId = null;

      for (
        const listener of
          this.selectionListeners
      ) {
        listener(null);
      }
    }

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

  selectObject(
    id: string | null,
  ): void {
    if (id === null) {
      this.selectedObjectId = null;

      for (
        const listener of
          this.selectionListeners
      ) {
        listener(null);
      }

      return;
    }

    const object =
      this.objects.get(id);

    if (!object) {
      return;
    }

    this.selectedObjectId = id;

    for (
      const listener of
        this.selectionListeners
    ) {
      listener(object);
    }
  }

  getSelectedObject():
    WorldObject | null {
    if (
      this.selectedObjectId === null
    ) {
      return null;
    }

    return (
      this.objects.get(
        this.selectedObjectId,
      ) ?? null
    );
  }

  onSelectionChanged(
    listener: WorldSelectionListener,
  ): () => void {
    this.selectionListeners.add(
      listener,
    );

    return () => {
      this.selectionListeners.delete(
        listener,
      );
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
}