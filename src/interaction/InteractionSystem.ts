import type { MapMouseEvent } from 'maplibre-gl';

import type { World } from '../core/World';
import type { WorldObject } from '../core/WorldObject';
import type { MapRenderer } from '../renderer/MapRenderer';

const PICKABLE_LAYERS = [
  'world-buildings-3d',
  'world-buildings',
  'world-roads',
  'world-water',
  'world-land',
];

export class InteractionSystem {
  private readonly panel: HTMLElement;

  constructor(
    private readonly world: World,
    private readonly renderer: MapRenderer,
  ) {
    this.panel =
      this.createPanel();

    this.renderer.onClick(
      this.handleClick.bind(this),
    );

    this.world.onSelectionChanged(
      this.handleSelectionChanged.bind(
        this,
      ),
    );
  }

  private handleClick(
    event: MapMouseEvent,
  ): void {
    const features =
      this.renderer.map.queryRenderedFeatures(
        event.point,
        {
          layers: PICKABLE_LAYERS,
        },
      );

    if (features.length === 0) {
      this.world.selectObject(null);
      return;
    }

    const feature =
      features[0];

    if (feature.id == null) {
      this.world.selectObject(null);
      return;
    }

    const objectId =
      String(feature.id);

    const object =
      this.world.getObject(
        objectId,
      );

    if (!object) {
      console.warn(
        'Rendered feature has no WorldObject:',
        objectId,
      );

      this.world.selectObject(null);
      return;
    }

    this.world.selectObject(
      object.id,
    );
  }

  private handleSelectionChanged(
    object: WorldObject | null,
  ): void {
    this.updatePanel(object);
  }

  private createPanel(): HTMLElement {
    const existing =
      document.querySelector<HTMLElement>(
        '#selection-panel',
      );

    if (existing) {
      return existing;
    }

    const panel =
      document.createElement('aside');

    panel.id =
      'selection-panel';

    panel.hidden = true;

    document.body.appendChild(panel);

    return panel;
  }

  private updatePanel(
    object: WorldObject | null,
  ): void {
    if (!object) {
      this.panel.hidden = true;
      this.panel.replaceChildren();
      return;
    }

    this.panel.hidden = false;

    const title =
      document.createElement('div');

    title.className =
      'selection-title';

    title.textContent =
      object.type.toUpperCase();

    const id =
      document.createElement('div');

    id.className =
      'selection-id';

    id.textContent =
      object.id;

    const location =
      document.createElement('div');
    
    const localPosition =
  document.createElement('div');

localPosition.className =
  'selection-local-position';

const local =
  this.world.getObjectLocalPosition(
    object,
  );

localPosition.textContent =
  `World: X ${local.x.toFixed(2)}m • ` +
  `Y ${local.y.toFixed(2)}m • ` +
  `Z ${local.z.toFixed(2)}m`;


    location.className =
      'selection-location';

    location.textContent =
      `${object.transform.position.latitude.toFixed(6)}, ` +
`${object.transform.position.longitude.toFixed(6)}`
    const dimensions =
    document.createElement('div');

    dimensions.className =
        'selection-dimensions';

        if (object.dimensions) {
        dimensions.textContent =
            `Height: ${object.dimensions.height.toFixed(1)}m • ` +
            `Base: ${object.dimensions.baseHeight.toFixed(1)}m`;
    } else {
    dimensions.textContent =
        'No 3D dimensions';
    }

    const properties =
      document.createElement('pre');

    properties.className =
      'selection-properties';

    properties.textContent =
      JSON.stringify(
        object.properties,
        null,
        2,
      );

    this.panel.replaceChildren(
  title,
  id,
  location,
  localPosition,
  dimensions,
  properties,
);
  }
}