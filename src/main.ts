import './style.css';
import {
  OpenFreeMapProvider,
} from './world-data/OpenFreeMapProvider';
import { World } from './core/World';
import { createWorldCamera } from './core/WorldCamera';
import { createCoordinate } from './core/WorldCoordinate';
import {
  WorldFeatureStore,
} from './world-data/WorldFeatureStore';
import { MapRenderer } from './renderer/MapRenderer';
import { InteractionSystem } from './interaction/InteractionSystem';
import {
  WorldFeatureRenderer,
} from './renderer/WorldFeatureRenderer';

import { TileManager } from './world-stream/TileManager';


const camera =
  createWorldCamera(
    createCoordinate(
      6.5244,
      3.3792,
      0,
    ),
  );

camera.zoom = 15;
camera.pitch = 55;
camera.bearing = -20;
const world = new World(camera);

const container =
  document.querySelector<HTMLDivElement>(
    '#world',
  );

if (!container) {
  throw new Error(
    'World container not found',
  );
}
const renderer =
  new MapRenderer(
    container,
    world,
  );

new InteractionSystem(
  world,
  renderer,
);

const dataProvider =
  new OpenFreeMapProvider();

const featureStore =
  new WorldFeatureStore();

const featureRenderer =
  new WorldFeatureRenderer(
    renderer.map,
    featureStore,
  );

renderer.onReady(() => {
  featureRenderer.initialize();
});

featureStore.onChanged(() => {
  featureRenderer.update();
});

const tileManager =
  new TileManager(
    world,
    dataProvider,
    featureStore,
    {
      radius: 1,
      minZoom: 5,
      maxZoom: 14,
    },
  );

void tileManager.update();

renderer.onMoveEnd(() => {
 void tileManager.update();

  console.log(
    '[WorldStream] active tiles:',
    tileManager.getActiveTiles(),
  );
});