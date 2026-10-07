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

export interface TileManagerOptions {
  radius?: number;
  minZoom?: number;
  maxZoom?: number;
}

export class TileManager {
  private readonly radius: number;
  private readonly minZoom: number;
  private readonly maxZoom: number;

  private activeTiles =
    new Map<string, TileKey>();

  constructor(
  private readonly world: World,
  private readonly provider: WorldDataProvider,
  private readonly store: WorldFeatureStore,
  options: TileManagerOptions = {},
) {
    this.radius =
      options.radius ?? 2;

    this.minZoom =
      options.minZoom ?? 0;

    this.maxZoom =
      options.maxZoom ?? 14;
  }

  update(): void {
    const location =
      this.world.getLocation();

    const zoom = Math.round(
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

    const required =
      this.getRequiredTiles(
        center,
        this.radius,
      );

    void this.loadRequired(required);

    void this.unloadUnused(required);
  }

  getActiveTiles(): TileKey[] {
    return [
      ...this.activeTiles.values(),
    ];
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
        let x = center.x + dx;
        const y = center.y + dy;

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

  private async loadRequired(
    required: Map<string, TileKey>,
  ): Promise<void> {
    
    for (
      const [id, tile] of required
    ) {
      if (
        this.activeTiles.has(id)
      ) {
        continue;
      }

      this.activeTiles.set(
        id,
        tile,
      );

      try {
        await this.provider.loadTile(
          tile,
        );

        console.log(
          '[WorldStream] loaded',
          id,
        );
      } catch (error) {
        this.activeTiles.delete(id);

        console.error(
          '[WorldStream] failed',
          id,
          error,
        );
      }
      const data =
  await this.provider.loadTile(
    tile,
  );

this.store.setTile(data);

console.log(
  '[WorldStream] loaded',
  id,
  'features:',
  data.features.length,
  'total:',
  this.store.getFeatureCount(),
);
    }
  }

  private async unloadUnused(
    required: Map<string, TileKey>,
  ): Promise<void> {
    for (
      const [id, tile] of this.activeTiles
    ) {
      if (
        required.has(id)
      ) {
        continue;
      }

      this.activeTiles.delete(id);

     this.store.removeTile(tile);

    await this.provider.unloadTile(tile);

      console.log(
        '[WorldStream] unloaded',
        id,
      );
      
    }
  }
}