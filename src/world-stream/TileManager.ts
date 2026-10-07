import type { World } from '../core/World';

import {
  tileId,
  worldToTile,
  type TileKey,
} from './TileKey';

import type {
  WorldDataProvider,
} from '../world-data/WorldDataProvider';

import type {
  WorldFeatureStore,
} from '../world-data/WorldFeatureStore';

type TileState =
  | 'loading'
  | 'loaded'
  | 'unloading';

interface ManagedTile {
  tile: TileKey;
  state: TileState;
}

export interface TileManagerOptions {
  radius?: number;
  minZoom?: number;
  maxZoom?: number;
}

export class TileManager {
  private readonly radius: number;
  private readonly minZoom: number;
  private readonly maxZoom: number;

  private readonly tiles =
    new Map<string, ManagedTile>();

  private updateVersion = 0;

  private updateRunning = false;

  constructor(
    private readonly world: World,

    private readonly provider:
      WorldDataProvider,

    private readonly store:
      WorldFeatureStore,

    options: TileManagerOptions = {},
  ) {
    this.radius =
      options.radius ?? 2;

    this.minZoom =
      options.minZoom ?? 0;

    this.maxZoom =
      options.maxZoom ?? 14;
  }

  async update(): Promise<void> {
    const version =
      ++this.updateVersion;

    if (this.updateRunning) {
      return;
    }

    this.updateRunning = true;

    try {
      await this.processUpdate(
        version,
      );
    } finally {
      this.updateRunning = false;

      /*
       * Camera may have moved while
       * we were loading tiles.
       *
       * Run again using the newest
       * camera position.
       */

      if (
        version !== this.updateVersion
      ) {
        void this.update();
      }
    }
  }

  getActiveTiles(): TileKey[] {
    return [
      ...this.tiles.values(),
    ]
      .filter(
        (entry) =>
          entry.state === 'loaded' ||
          entry.state === 'loading',
      )
      .map(
        (entry) =>
          entry.tile,
      );
  }

  private async processUpdate(
    version: number,
  ): Promise<void> {
    const required =
      this.calculateRequiredTiles();

    /*
     * Start loading required tiles.
     */

    const loading: Promise<void>[] = [];

    for (
      const [id, tile] of required
    ) {
      const existing =
        this.tiles.get(id);

      if (existing) {
        continue;
      }

      this.tiles.set(id, {
        tile,
        state: 'loading',
      });

      loading.push(
        this.loadTile(
          id,
          tile,
          version,
        ),
      );
    }

    /*
     * Remove tiles that are no
     * longer required.
     */

    const unloading: Promise<void>[] = [];

    for (
      const [id, managed] of this.tiles
    ) {
      if (
        required.has(id)
      ) {
        continue;
      }

      if (
        managed.state ===
        'unloading'
      ) {
        continue;
      }

      managed.state =
        'unloading';

      unloading.push(
        this.unloadTile(
          id,
          managed.tile,
        ),
      );
    }

    await Promise.all([
      ...loading,
      ...unloading,
    ]);
  }

  private async loadTile(
    id: string,
    tile: TileKey,
    version: number,
  ): Promise<void> {
    try {
      const data =
        await this.provider.loadTile(
          tile,
        );

      /*
       * If the camera moved while
       * this tile was downloading,
       * don't blindly keep it.
       */

      if (
        version !== this.updateVersion
      ) {
        return;
      }

      this.store.setTile(data);

      const managed =
        this.tiles.get(id);

      if (managed) {
        managed.state =
          'loaded';
      }

      console.log(
        '[WorldStream] loaded',
        id,
        'features:',
        data.features.length,
      );
    } catch (error) {
      this.tiles.delete(id);

      console.error(
        '[WorldStream] failed',
        id,
        error,
      );
    }
  }

  private async unloadTile(
    id: string,
    tile: TileKey,
  ): Promise<void> {
    try {
      this.store.removeTile(
        tile,
      );

      await this.provider.unloadTile(
        tile,
      );

      this.tiles.delete(id);

      console.log(
        '[WorldStream] unloaded',
        id,
      );
    } catch (error) {
      console.error(
        '[WorldStream] unload failed',
        id,
        error,
      );

      this.tiles.delete(id);
    }
  }

  private calculateRequiredTiles():
    Map<string, TileKey> {
    const location =
      this.world.getLocation();

    const zoom =
      Math.round(
        Math.min(
          Math.max(
            this.world.camera.zoom,
            this.minZoom,
          ),
          this.maxZoom,
        ),
      );

    const center =
      worldToTile(
        location.longitude,
        location.latitude,
        zoom,
      );

    return this.getRequiredTiles(
      center,
      this.radius,
    );
  }

  private getRequiredTiles(
    center: TileKey,
    radius: number,
  ): Map<string, TileKey> {
    const required =
      new Map<string, TileKey>();

    const tileCount =
      2 ** center.z;

    for (
      let dy = -radius;
      dy <= radius;
      dy++
    ) {
      for (
        let dx = -radius;
        dx <= radius;
        dx++
      ) {
        let x =
          center.x + dx;

        const y =
          center.y + dy;

        if (
          y < 0 ||
          y >= tileCount
        ) {
          continue;
        }

        x =
          ((x % tileCount) +
            tileCount) %
          tileCount;

        const tile: TileKey = {
          z: center.z,
          x,
          y,
        };

        required.set(
          tileId(tile),
          tile,
        );
      }
    }

    return required;
  }
}