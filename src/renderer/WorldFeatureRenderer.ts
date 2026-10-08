
import type {
  Map,
  GeoJSONSource,
} from 'maplibre-gl';

import type {
  FeatureCollection,
  Geometry,
} from 'geojson';

import type {
  WorldFeature,
} from '../world-data/WorldData';

import type {
  WorldFeatureStore,
} from '../world-data/WorldFeatureStore';

const SOURCE_ID =
  'world-features';

const SELECTION_SOURCE_ID =
  'world-selection';

const SELECTION_FILL_LAYER_ID =
  'world-selection-fill';

const SELECTION_LINE_LAYER_ID =
  'world-selection-line';

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
    /*
     * Create the main world feature source
     * if it does not already exist.
     */
    if (
      !this.map.getSource(
        SOURCE_ID,
      )
    ) {
      this.map.addSource(
        SOURCE_ID,
        {
          type: 'geojson',

          data:
            this.createFeatureCollection(),
        },
      );
    }

    /*
     * Create the selection source
     * if it does not already exist.
     */
    if (
      !this.map.getSource(
        SELECTION_SOURCE_ID,
      )
    ) {
      this.map.addSource(
        SELECTION_SOURCE_ID,
        {
          type: 'geojson',

          data: {
            type: 'FeatureCollection',
            features: [],
          },
        },
      );
    }

    /*
     * Add the world layers only if
     * they have not already been added.
     */
    if (
      !this.map.getLayer(
        'world-land',
      )
    ) {
      this.addLayers();
    }

    /*
     * Add selection layers only if
     * they have not already been added.
     */
    if (
      !this.map.getLayer(
        SELECTION_FILL_LAYER_ID,
      )
    ) {
      this.addSelectionLayers();
    }

    this.selectedObjectInitialized =
      true;

    this.update();

    this.updateSelection();
  }

  update(): void {
    const source =
      this.map.getSource(
        SOURCE_ID,
      ) as
        | GeoJSONSource
        | undefined;

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
    if (
      !this.selectedObjectInitialized
    ) {
      return;
    }

    const source =
      this.map.getSource(
        SELECTION_SOURCE_ID,
      ) as
        | GeoJSONSource
        | undefined;

    if (!source) {
      return;
    }

    /*
     * Nothing is selected.
     */
    if (
      this.selectedObjectId === null
    ) {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });

      return;
    }

    /*
     * Find the selected world feature.
     */
    const object =
      this.store
        .getFeatures()
        .find(
          (feature) =>
            feature.id ===
            this.selectedObjectId,
        );

    /*
     * The selected object may have
     * disappeared because its tile was
     * unloaded.
     */
    if (!object) {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });

      return;
    }

    /*
     * Render the selected geometry
     * through the separate selection source.
     */
    source.setData({
      type: 'FeatureCollection',

      features: [
        {
          type: 'Feature',

          id:
            object.id,

          geometry:
            object.geometry,

          properties: {
            worldId:
              object.id,

            worldType:
              object.type,
          },
        },
      ],
    });
  }

  private createFeatureCollection():
    FeatureCollection {
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

              /*
               * IMPORTANT:
               *
               * This preserves the WorldFeature
               * ID inside the MapLibre feature.
               *
               * InteractionSystem can therefore
               * map a clicked feature back to the
               * WorldObject.
               */
              id:
                feature.id,

              geometry:
                feature.geometry as Geometry,

              properties: {
                ...feature.properties,

                /*
                 * World identity.
                 */
                worldType:
                  feature.type,

                worldId:
                  feature.id,

                /*
                 * Building information.
                 */
                worldHeight:
                  this.getWorldHeight(
                    feature,
                  ),

                worldBaseHeight:
                  this.getWorldBaseHeight(
                    feature,
                  ),
              },
            }),
          ),
    };
  }

  private getWorldHeight(
    feature: WorldFeature,
  ): number {
    if (
      feature.type !==
      'building'
    ) {
      return 0;
    }

    /*
     * Try explicit building height
     * first.
     */
    const height =
      this.readNumber(
        feature.properties,
        [
          'height',
          'render_height',
        ],
      );

    if (
      height !== undefined
    ) {
      return Math.max(
        height,
        1,
      );
    }

    /*
     * Otherwise estimate height
     * from building levels.
     *
     * Approximately 3m per floor.
     */
    const levels =
      this.readNumber(
        feature.properties,
        [
          'building:levels',
          'levels',
        ],
      );

    if (
      levels !== undefined
    ) {
      return Math.max(
        levels * 3,
        1,
      );
    }

    /*
     * Default building height.
     */
    return 8;
  }

  private getWorldBaseHeight(
    feature: WorldFeature,
  ): number {
    if (
      feature.type !==
      'building'
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
    properties:
      Record<string, unknown>,

    keys: string[],
  ): number | undefined {
    for (
      const key of keys
    ) {
      const value =
        properties[key];

      /*
       * Already a number.
       */
      if (
        typeof value ===
          'number' &&
        Number.isFinite(value)
      ) {
        return value;
      }

      /*
       * Numeric string.
       */
      if (
        typeof value ===
        'string'
      ) {
        const parsed =
          Number.parseFloat(
            value,
          );

        if (
          Number.isFinite(
            parsed,
          )
        ) {
          return parsed;
        }
      }
    }

    return undefined;
  }

  private addSelectionLayers(): void {
    /*
     * Polygon selection highlight.
     */
    if (
      !this.map.getLayer(
        SELECTION_FILL_LAYER_ID,
      )
    ) {
      this.map.addLayer({
        id:
          SELECTION_FILL_LAYER_ID,

        type:
          'fill',

        source:
          SELECTION_SOURCE_ID,

        filter: [
          '==',
          '$type',
          'Polygon',
        ],

        paint: {
          'fill-color':
            '#00e5ff',

          'fill-opacity':
            0.35,

          'fill-outline-color':
            '#00e5ff',
        },
      });
    }

    /*
     * Line selection highlight.
     */
    if (
      !this.map.getLayer(
        SELECTION_LINE_LAYER_ID,
      )
    ) {
      this.map.addLayer({
        id:
          SELECTION_LINE_LAYER_ID,

        type:
          'line',

        source:
          SELECTION_SOURCE_ID,

        filter: [
          '==',
          '$type',
          'LineString',
        ],

        paint: {
          'line-color':
            '#00e5ff',

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

          'line-opacity':
            1,
        },
      });
    }
  }

  private addLayers(): void {
    /*
     * LAND
     */
    if (
      !this.map.getLayer(
        'world-land',
      )
    ) {
      this.map.addLayer({
        id:
          'world-land',

        type:
          'fill',

        source:
          SOURCE_ID,

        filter: [
          'all',

          [
            '==',
            '$type',
            'Polygon',
          ],

          [
            '==',
            'worldType',
            'land',
          ],
        ],

        paint: {
          'fill-opacity':
            0.25,

          'fill-color':
            '#7fa87f',
        },
      });
    }

    /*
     * WATER
     */
    if (
      !this.map.getLayer(
        'world-water',
      )
    ) {
      this.map.addLayer({
        id:
          'world-water',

        type:
          'fill',

        source:
          SOURCE_ID,

        filter: [
          'all',

          [
            '==',
            '$type',
            'Polygon',
          ],

          [
            '==',
            'worldType',
            'water',
          ],
        ],

        paint: {
          'fill-opacity':
            0.45,

          'fill-color':
            '#5ca8d6',
        },
      });
    }

    /*
     * ROADS
     */
    if (
      !this.map.getLayer(
        'world-roads',
      )
    ) {
      this.map.addLayer({
        id:
          'world-roads',

        type:
          'line',

        source:
          SOURCE_ID,

        filter: [
          'all',

          [
            '==',
            '$type',
            'LineString',
          ],

          [
            '==',
            'worldType',
            'road',
          ],
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
    }

    /*
     * BUILDINGS
     */
    if (
      !this.map.getLayer(
        'world-buildings',
      )
    ) {
      this.map.addLayer({
        id:
          'world-buildings',

        type:
          'fill',

        source:
          SOURCE_ID,

        filter: [
          'all',

          [
            '==',
            '$type',
            'Polygon',
          ],

          [
            '==',
            'worldType',
            'building',
          ],
        ],

        paint: {
          'fill-opacity':
            0.35,

          'fill-color':
            '#b0a08a',
        },
      });
    }

    /*
     * 3D BUILDINGS
     */
    if (
      !this.map.getLayer(
        'world-buildings-3d',
      )
    ) {
      this.map.addLayer({
        id:
          'world-buildings-3d',

        type:
          'fill-extrusion',

        source:
          SOURCE_ID,

        minzoom:
          14,

        filter: [
          'all',

          [
            '==',
            '$type',
            'Polygon',
          ],

          [
            '==',
            'worldType',
            'building',
          ],
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

  destroy(): void {
    /*
     * Remove selection layers.
     */
    if (
      this.map.getLayer(
        SELECTION_LINE_LAYER_ID,
      )
    ) {
      this.map.removeLayer(
        SELECTION_LINE_LAYER_ID,
      );
    }

    if (
      this.map.getLayer(
        SELECTION_FILL_LAYER_ID,
      )
    ) {
      this.map.removeLayer(
        SELECTION_FILL_LAYER_ID,
      );
    }

    /*
     * Remove world layers.
     */
    const worldLayerIds = [
      'world-buildings-3d',
      'world-buildings',
      'world-roads',
      'world-water',
      'world-land',
    ];

    for (
      const layerId of
        worldLayerIds
    ) {
      if (
        this.map.getLayer(
          layerId,
        )
      ) {
        this.map.removeLayer(
          layerId,
        );
      }
    }

    /*
     * Remove sources.
     */
    if (
      this.map.getSource(
        SELECTION_SOURCE_ID,
      )
    ) {
      this.map.removeSource(
        SELECTION_SOURCE_ID,
      );
    }

    if (
      this.map.getSource(
        SOURCE_ID,
      )
    ) {
      this.map.removeSource(
        SOURCE_ID,
      );
    }

    this.selectedObjectId =
      null;

    this.selectedObjectInitialized =
      false;
  }
}
