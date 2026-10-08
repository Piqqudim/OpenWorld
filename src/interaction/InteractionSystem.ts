import type {
  MapMouseEvent,
} from 'maplibre-gl';

import type {
  World,
} from '../core/World';

import type {
  WorldObject,
} from '../core/WorldObject';

import type {
  MapRenderer,
} from '../renderer/MapRenderer';

const PICKABLE_LAYERS = [
  'world-buildings-3d',
  'world-buildings',
  'world-roads',
  'world-water',
  'world-land',
];

export class InteractionSystem {
  private readonly panel: HTMLElement;

  private readonly unsubscribeSelection:
    () => void;

  constructor(
    private readonly world: World,
    private readonly renderer: MapRenderer,
  ) {
    this.panel =
      this.createPanel();

    this.renderer.onClick(
      this.handleClick.bind(this),
    );

    this.unsubscribeSelection =
      this.world.onSelectionChanged(
        this.handleSelectionChanged.bind(
          this,
        ),
      );
  }

  destroy(): void {
    this.unsubscribeSelection();
  }

  private handleClick(
    event: MapMouseEvent,
  ): void {
    const map =
      this.renderer.map;

    /*
     * Query everything beneath the cursor first.
     *
     * This is intentional while we are
     * debugging the selection pipeline.
     */
    const features =
      map.queryRenderedFeatures(
        event.point,
      );

    console.log(
      '[InteractionSystem] Clicked features:',
      features,
    );

    if (
      features.length === 0
    ) {
      console.log(
        '[InteractionSystem] Nothing was clicked.',
      );

      this.world.selectObject(
        null,
      );

      return;
    }

    /*
     * Prefer one of our world layers.
     */
    const feature =
      features.find(
        (candidate) =>
          candidate.layer &&
          PICKABLE_LAYERS.includes(
            candidate.layer.id,
          ),
      ) ??
      features[0];

    console.log(
      '[InteractionSystem] Selected feature:',
      feature,
    );

    /*
     * Try MapLibre's feature ID first.
     */
    let objectId:
      string | null = null;

    if (
      feature.id !== undefined &&
      feature.id !== null
    ) {
      objectId =
        String(feature.id);
    }

    /*
     * Fall back to properties.objectId.
     */
    if (
      !objectId &&
      feature.properties?.objectId !==
        undefined &&
      feature.properties?.objectId !==
        null
    ) {
      objectId =
        String(
          feature.properties.objectId,
        );
    }

    /*
     * Fall back to properties.id.
     */
    if (
      !objectId &&
      feature.properties?.id !==
        undefined &&
      feature.properties?.id !==
        null
    ) {
      objectId =
        String(
          feature.properties.id,
        );
    }

    if (!objectId) {
      console.warn(
        '[InteractionSystem] Feature has no object ID:',
        feature,
      );

      this.world.selectObject(
        null,
      );

      return;
    }

    console.log(
      '[InteractionSystem] WorldObject ID:',
      objectId,
    );

    const object =
      this.world.getObject(
        objectId,
      );

    if (!object) {
      console.warn(
        '[InteractionSystem] No WorldObject found for rendered feature:',
        objectId,
      );

      console.log(
        '[InteractionSystem] Registered WorldObjects:',
        this.world.getObjects(),
      );

      this.world.selectObject(
        null,
      );

      return;
    }

    console.log(
      '[InteractionSystem] Selecting:',
      object,
    );

    this.world.selectObject(
      object.id,
    );
  }

  private handleSelectionChanged(
    object: WorldObject | null,
  ): void {
    console.log(
      '[InteractionSystem] Selection changed:',
      object,
    );

    this.updatePanel(
      object,
    );
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
      document.createElement(
        'aside',
      );

    panel.id =
      'selection-panel';

    panel.hidden = true;

    document.body.appendChild(
      panel,
    );

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
      document.createElement(
        'div',
      );

    title.className =
      'selection-title';

    title.textContent =
      object.type.toUpperCase();

    const id =
      document.createElement(
        'div',
      );

    id.className =
      'selection-id';

    id.textContent =
      `ID: ${object.id}`;

    const location =
      document.createElement(
        'div',
      );

    location.className =
      'selection-location';

    location.textContent =
      `Latitude: ${object.transform.position.latitude.toFixed(6)}\n` +
      `Longitude: ${object.transform.position.longitude.toFixed(6)}\n` +
      `Elevation: ${object.transform.position.elevation.toFixed(2)}m`;

    const localPosition =
      document.createElement(
        'div',
      );

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

    const dimensions =
      document.createElement(
        'div',
      );

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

    const source =
      document.createElement(
        'div',
      );

    source.className =
      'selection-source';

    if (object.source) {
      source.textContent =
        `Source: ${object.source.provider} • ` +
        `Layer: ${object.source.layer}`;
    } else {
      source.textContent =
        'Source: Unknown';
    }

    const properties =
      document.createElement(
        'pre',
      );

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
      source,
      properties,
    );
  }
}