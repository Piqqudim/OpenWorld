import './style.css';

import {
  OpenFreeMapProvider,
} from './world-data/OpenFreeMapProvider';

import { World } from './core/World';

import {
  createWorldCamera,
} from './core/WorldCamera';

import {
  createCoordinate,
} from './core/WorldCoordinate';

import {
  WorldFeatureStore,
} from './world-data/WorldFeatureStore';

import {
  MapRenderer,
} from './renderer/MapRenderer';

import {
  InteractionSystem,
} from './interaction/InteractionSystem';

import {
  WorldFeatureRenderer,
} from './renderer/WorldFeatureRenderer';

import {
  TileManager,
} from './world-stream/TileManager';


/*
 * --------------------------------------------------
 * WORLD
 * --------------------------------------------------
 */

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

const world =
  new World(camera);


/*
 * --------------------------------------------------
 * MAP CONTAINER
 * --------------------------------------------------
 */

const container =
  document.querySelector<HTMLDivElement>(
    '#world',
  );

if (!container) {
  throw new Error(
    'World container not found',
  );
}


/*
 * --------------------------------------------------
 * MAP RENDERER
 * --------------------------------------------------
 */

const renderer =
  new MapRenderer(
    container,
    world,
  );


/*
 * --------------------------------------------------
 * DATA SYSTEM
 * --------------------------------------------------
 */

const dataProvider =
  new OpenFreeMapProvider();

const featureStore =
  new WorldFeatureStore();


/*
 * --------------------------------------------------
 * WORLD FEATURE RENDERER
 * --------------------------------------------------
 */

const featureRenderer =
  new WorldFeatureRenderer(
    renderer.map,
    featureStore,
);


/*
 * --------------------------------------------------
 * SELECTION CONNECTION
 * --------------------------------------------------
 *
 * World owns the selection state.
 *
 * WorldFeatureRenderer owns the visual
 * selection highlight.
 */

world.onSelectionChanged(
  (object) => {
    featureRenderer.setSelectedObject(
      object?.id ?? null,
    );
  },
);


/*
 * --------------------------------------------------
 * INTERACTION
 * --------------------------------------------------
 *
 * InteractionSystem handles clicks and
 * updates World selection state.
 */

new InteractionSystem(
  world,
  renderer,
);


/*
 * --------------------------------------------------
 * MAP READY
 * --------------------------------------------------
 *
 * WorldFeatureRenderer must wait until the
 * MapLibre style has loaded before adding
 * sources and layers.
 */

renderer.onReady(() => {
  featureRenderer.initialize();
});


/*
 * --------------------------------------------------
 * STORE -> RENDERER
 * --------------------------------------------------
 *
 * Whenever streamed world data changes,
 * update the MapLibre source.
 */

featureStore.onChanged(() => {
  featureRenderer.update();
});


/*
 * --------------------------------------------------
 * WORLD STREAMING
 * --------------------------------------------------
 */

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


/*
 * --------------------------------------------------
 * INITIAL TILE LOAD
 * --------------------------------------------------
 */

void tileManager.update();


/*
 * --------------------------------------------------
 * CAMERA / TILE STREAM UPDATES
 * --------------------------------------------------
 *
 * Whenever the map finishes moving,
 * refresh the active world tiles.
 */

renderer.onMoveEnd(() => {
  void tileManager.update();

  console.log(
    '[WorldStream] active tiles:',
    tileManager.getActiveTiles(),
  );
});