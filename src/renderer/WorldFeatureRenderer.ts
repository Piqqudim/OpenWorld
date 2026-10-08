
import type {
  Map,
  GeoJSONSource,
} from 'maplibre-gl';

import type {
  FeatureCollection,
  Geometry,
} from 'geojson';

import type { WorldFeature } from '../world-data/WorldData';
import type {
  WorldFeatureStore,
} from '../world-data/WorldFeatureStore';

const SOURCE_ID =
  'world-features';

export class WorldFeatureRenderer {
    private selectedObjectId:
  string | null = null;

private selectedObjectInitialized =
  false;
  constructor(
    private readonly map: Map,
    private readonly store: WorldFeatureStore,
  ) {}

  initialize(): void {
    if (
      this.map.getSource(
        SOURCE_ID,
      )
    ) {
      return;
    }

    this.map.addSource(
      SOURCE_ID,
      {
        type: 'geojson',

        data:
          this.createFeatureCollection(),
      },
    );
    this.map.addSource('world-selection', {
    type: 'geojson',
    data: {
     type: 'FeatureCollection',
     features: [],
     },
    });

    this.addLayers();
    this.addSelectionLayers();

this.selectedObjectInitialized = true;

this.updateSelection();

    this.update();
  }

  update(): void {
    const source =
      this.map.getSource(
        SOURCE_ID,
      ) as GeoJSONSource | undefined;

    if (!source) {
      return;
    }

    source.setData(
      this.createFeatureCollection(),
    );
    this.updateSelection();
  }
  setSelectedObject(
  objectId: string | null,
): void {
  this.selectedObjectId =
    objectId;

  this.updateSelection();
}
private updateSelection(): void {
  if (!this.selectedObjectInitialized) {
    return;
  }

  const source =
    this.map.getSource(
      'world-selection',
    ) as GeoJSONSource | undefined;

  if (
    !source ||
    source.type !== 'geojson'
  ) {
    return;
  }

  if (
    !this.selectedObjectId
  ) {
    source.setData({
      type: 'FeatureCollection',
      features: [],
    });

    return;
  }

  const object =
    this.store
      .getFeatures()
      .find(
        (feature) =>
          feature.id ===
          this.selectedObjectId,
      );

  if (!object) {
    source.setData({
      type: 'FeatureCollection',
      features: [],
    });

    return;
  }

  source.setData({
    type: 'FeatureCollection',

    features: [
      {
        type: 'Feature',
        id: object.id,
        geometry: object.geometry,
        properties: {},
      },
    ],
  });
}

  private createFeatureCollection(): FeatureCollection {
    const features =
      this.store.getFeatures();

    return {
      type: 'FeatureCollection',

      features:
        features
          .filter(
            (feature) =>
              feature.geometry != null,
          )
          .map(
            (feature) => ({
              type: 'Feature' as const,

              id:
                feature.id,

              geometry:
                feature.geometry as Geometry,
properties: {
  ...feature.properties,

  worldType:
    feature.type,

  worldId:
    feature.id,

  worldHeight:
    this.getWorldHeight(feature),

  worldBaseHeight:
    this.getWorldBaseHeight(feature),
},
            }),
          ),
    };
  }
  private getWorldHeight(
  feature: WorldFeature,
): number {
  if (
    feature.type !== 'building'
  ) {
    return 0;
  }

  const height =
    this.readNumber(
      feature.properties,
      [
        'height',
        'render_height',
      ],
    );

  const levels =
    this.readNumber(
      feature.properties,
      [
        'building:levels',
        'levels',
      ],
    );

  if (height !== undefined) {
    return Math.max(
      height,
      1,
    );
  }

  if (levels !== undefined) {
    return Math.max(
      levels * 3,
      1,
    );
  }

  return 8;
}

private getWorldBaseHeight(
  feature: WorldFeature,
): number {
  if (
    feature.type !== 'building'
  ) {
    return 0;
  }

  const base =
    this.readNumber(
      feature.properties,
      [
        'min_height',
        'render_min_height',
      ],
    );

  return Math.max(
    base ?? 0,
    0,
  );
}

private readNumber(
  properties: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value =
      properties[key];

    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === 'string'
    ) {
      const parsed =
        Number.parseFloat(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}
  private addSelectionLayers(): void {
  this.map.addLayer({
    id: 'world-selection-fill',
    type: 'fill',
    source: 'world-selection',
    filter: [
      '==',
      '$type',
      'Polygon',
    ],
    paint: {
      'fill-color': '#00e5ff',
      'fill-opacity': 0.35,
      'fill-outline-color': '#00e5ff',
    },
  });

  this.map.addLayer({
    id: 'world-selection-line',
    type: 'line',
    source: 'world-selection',
    filter: [
      '==',
      '$type',
      'LineString',
    ],
    paint: {
      'line-color': '#00e5ff',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8,
        3,
        14,
        7,
        18,
        10,
      ],
      'line-opacity': 1,
    },
  });
}

  private addLayers(): void {
    this.map.addLayer({
      id:
        'world-land',

      type:
        'fill',

      source:
        SOURCE_ID,

      filter: [
        'all',
        ['==', '$type', 'Polygon'],
        ['==', 'worldType', 'land'],
      ],

      paint: {
        'fill-opacity':
          0.25,

        'fill-color':
          '#7fa87f',
      },
    });

    this.map.addLayer({
      id:
        'world-water',

      type:
        'fill',

      source:
        SOURCE_ID,

      filter: [
        'all',
        ['==', '$type', 'Polygon'],
        ['==', 'worldType', 'water'],
      ],

      paint: {
        'fill-opacity':
          0.45,

        'fill-color':
          '#5ca8d6',
      },
    });

    this.map.addLayer({
      id:
        'world-roads',

      type:
        'line',

      source:
        SOURCE_ID,

      filter: [
        'all',
        ['==', '$type', 'LineString'],
        ['==', 'worldType', 'road'],
      ],

      paint: {
        'line-opacity':
          0.8,

        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5,
          0.5,
          10,
          1.5,
          15,
          4,
        ],

        'line-color':
          '#ff7a45',
      },
    });

    this.map.addLayer({
      id:
        'world-buildings',

      type:
        'fill',

      source:
        SOURCE_ID,

      filter: [
        'all',
        ['==', '$type', 'Polygon'],
        ['==', 'worldType', 'building'],
      ],

      paint: {
        'fill-opacity':
          0.35,

        'fill-color':
          '#b0a08a',
      },
    });
 
    this.map.addLayer({
      id: 'world-buildings-3d',
      type: 'fill-extrusion',
      source: SOURCE_ID,

      minzoom: 14,

      filter: [
        'all',
        ['==', '$type', 'Polygon'],
        ['==', 'worldType', 'building'],
      ],

      paint: {
        'fill-extrusion-color':
          '#b8aa96',

      'fill-extrusion-height': [
  'get',
  'worldHeight',
],

'fill-extrusion-base': [
  'get',
  'worldBaseHeight',
],
        'fill-extrusion-opacity':
          0.9,

        'fill-extrusion-vertical-gradient':
          true,
      },
    });
  }
}