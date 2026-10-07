import type { MapMouseEvent } from 'maplibre-gl';

import type { World } from '../core/World';
import type { WorldCoordinate } from '../core/WorldCoordinate';
import type { MapRenderer } from '../renderer/MapRenderer';

export class InteractionSystem {
  constructor(
    private readonly world: World,
    private readonly renderer: MapRenderer,
  ) {
    this.renderer.onClick(
      this.handleClick.bind(this),
    );
  }

  private handleClick(event: MapMouseEvent): void {
    const coordinate: WorldCoordinate = {
      latitude: event.lngLat.lat,
      longitude: event.lngLat.lng,
      elevation: 0,
    };

    console.log('World coordinate selected:', coordinate);
  }
}