
import type {
  Map,
  GeoJSONSource,
} from 'maplibre-gl';

import type {
  FeatureCollection,
  Geometry,
} from 'geojson';


import type {
  WorldFeatureStore,
} from '../world-data/WorldFeatureStore';

const SOURCE_ID =
  'world-features';

export class WorldFeatureRenderer {
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

    this.addLayers();

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
              },
            }),
          ),
    };
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

  filter: [
    'all',
    ['==', '$type', 'Polygon'],
    ['==', 'worldType', 'building'],
  ],

  minzoom: 14,

  paint: {
    'fill-extrusion-color': '#b8aa96',

    'fill-extrusion-height': [
      'coalesce',
      ['get', 'render_height'],
      ['get', 'height'],
      8,
    ],

    'fill-extrusion-base': [
      'coalesce',
      ['get', 'render_min_height'],
      ['get', 'min_height'],
      0,
    ],

    'fill-extrusion-opacity': 0.9,
  },
});
  }
}

