import {
  Map,
  setWorkerUrl,
  type MapMouseEvent,
} from 'maplibre-gl';

import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';

import type { World } from '../core/World';

setWorkerUrl(workerUrl);

export class MapRenderer {
  readonly map: Map;

  constructor(
    container: HTMLElement,
    private readonly world: World,
  ) {
    this.map = new Map({
      container,

      style: 'https://tiles.openfreemap.org/styles/liberty',

      center: [
        world.camera.position.longitude,
        world.camera.position.latitude,
      ],

      zoom: world.camera.zoom,
      bearing: world.camera.bearing,
      pitch: world.camera.pitch,

      maxPitch: 85,
      attributionControl:{
        compact: true
      }
    });

    this.map.on('style.load', () => {
      this.enableGlobe();
      this.enableTerrain();
    });

    this.map.on('move', () => {
      this.syncWorldCamera();
    });
  }

  private enableGlobe(): void {
    this.map.setProjection({
      type: 'globe',
    });
  }

  private enableTerrain(): void {
    if (this.map.getSource('terrain-dem')) {
      return;
    }

    this.map.addSource('terrain-dem', {
      type: 'raster-dem',
      url: 'https://tiles.mapterhorn.com/tilejson.json',
      tileSize: 256,
    });

    this.map.setTerrain({
      source: 'terrain-dem',
      exaggeration: 1,
    });
  }

  private syncWorldCamera(): void {
    const center = this.map.getCenter();

    this.world.updateCamera(
      {
        latitude: center.lat,
        longitude: center.lng,
        elevation: 0,
      },
      this.map.getZoom(),
      this.map.getBearing(),
      this.map.getPitch(),
    );
  }

  getElevationAt(
    latitude: number,
    longitude: number,
  ): number {
    return (
      this.map.queryTerrainElevation({
        lng: longitude,
        lat: latitude,
      }) ?? 0
    );
  }

  onClick(
    callback: (event: MapMouseEvent) => void,
  ): void {
    this.map.on('click', callback);
  }

  onMoveEnd(
    callback: () => void,
  ): void {
    this.map.on('moveend', callback);
  }

  destroy(): void {
    this.map.remove();
  }
onReady(
  callback: () => void,
): void {
  if (this.map.isStyleLoaded()) {
    callback();
    return;
  }

  this.map.once(
    'style.load',
    callback,
  );
}
}