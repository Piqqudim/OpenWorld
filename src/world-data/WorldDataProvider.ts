import type { TileKey } from '../world-stream/TileKey';
import type { WorldTileData } from './WorldData';

export interface WorldDataProvider {
  loadTile(
    tile: TileKey,
  ): Promise<WorldTileData>;

  unloadTile(
    tile: TileKey,
  ): Promise<void>;
}