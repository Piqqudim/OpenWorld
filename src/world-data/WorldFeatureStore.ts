import type {
  WorldFeature,
  WorldTileData,
} from './WorldData';

import {
  tileId,
  type TileKey,
} from '../world-stream/TileKey';

export class WorldFeatureStore {
  private tiles =
    new Map<
      string,
      WorldTileData
    >();
    private listeners =
  new Set<() => void>();

 setTile(
  data: WorldTileData,
): void {
  this.tiles.set(
    tileId(data.tile),
    data,
  );

  this.notify();
}
removeTile(
  tile: TileKey,
): void {
  this.tiles.delete(
    tileId(tile),
  );

  this.notify();
}
  getTile(
    tile: TileKey,
  ): WorldTileData | undefined {
    return this.tiles.get(
      tileId(tile),
    );
  }

  getFeatures(): WorldFeature[] {
    const features: WorldFeature[] = [];

    for (
      const tile of this.tiles.values()
    ) {
      features.push(
        ...tile.features,
      );
    }

    return features;
  }

  getFeatureCount(): number {
    let count = 0;

    for (
      const tile of this.tiles.values()
    ) {
      count += tile.features.length;
    }

    return count;
  }

  clear(): void {
    this.tiles.clear();
  }
  onChanged(
  listener: () => void,
): () => void {
  this.listeners.add(listener);

  return () => {
    this.listeners.delete(listener);
  };
}

private notify(): void {
  for (const listener of this.listeners) {
    listener();
  }
}
}