import type { WorldCamera } from './WorldCamera';
import type { WorldCoordinate } from './WorldCoordinate';
import type { WorldObject } from './WorldObject';

import {
  WorldSpace,
} from './WorldSpace';

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
  readonly space: WorldSpace;

  private readonly objects =
    new Map<string, WorldObject>();

  private selectedObjectId:
    string | null = null;

  private readonly cameraListeners =
    new Set<WorldListener>();

  private readonly objectAddedListeners =
    new Set<WorldObjectListener>();

  private readonly objectRemovedListeners =
    new Set<(id: string) => void>();

  private readonly selectionListeners =
    new Set<WorldSelectionListener>();

  constructor(
    camera: WorldCamera,
  ) {
    this.camera = camera;

    this.space =
      new WorldSpace(
        camera.position,
      );
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
    return this
      .getObjects()
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

  getObjectLocalPosition(
    object: WorldObject,
  ) {
    return this.space.toLocal(
      object.transform.position,
    );
  }

  selectObject(
    id: string | null,
  ): void {
    /*
     * Clear selection.
     */
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

    /*
     * The renderer may have given us an ID
     * that does not exist in the World.
     */
    if (!object) {
      console.warn(
        `World.selectObject(): object "${id}" was not found.`,
      );

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
    this.camera.position = {
      ...coordinate,
    };

    this.space.setOrigin(
      coordinate,
    );

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
    listener: (
      id: string,
    ) => void,
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

  updateObjectTransform(
    id: string,
    transform: WorldObject['transform'],
  ): void {
    const object =
      this.objects.get(id);

    if (!object) {
      return;
    }

    object.transform = {
      position: {
        ...transform.position,
      },

      rotation: {
        ...transform.rotation,
      },

      scale: {
        ...transform.scale,
      },
    };
  }
}