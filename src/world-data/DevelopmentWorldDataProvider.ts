import type { TileKey } from '../world-stream/TileKey';
import type {
  WorldDataProvider,
} from './WorldDataProvider';

import type {
  WorldTileData,
} from './WorldData';

export class DevelopmentWorldDataProvider
  implements WorldDataProvider
{
  async loadTile(
    tile: TileKey,
  ): Promise<WorldTileData> {
    console.log(
      '[WorldData] loading tile',
      tile,
    );

    return {
      tile: {
        z: tile.z,
        x: tile.x,
        y: tile.y,
      },

      features: [],
    };
  }

  async unloadTile(
    tile: TileKey,
  ): Promise<void> {
    console.log(
      '[WorldData] unloading tile',
      tile,
    );
  }
}