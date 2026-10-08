import type { WorldObjectType } from '../core/WorldObject';
import type { WorldDimensions } from '../core/WorldDimensions';

export function getWorldDimensions(
  type: WorldObjectType,
  properties: Record<string, unknown>,
): WorldDimensions | undefined {
  if (type !== 'building') {
    return undefined;
  }

  const height =
    readNumber(
      properties,
      [
        'height',
        'render_height',
      ],
    );

  const levels =
    readNumber(
      properties,
      [
        'building:levels',
        'levels',
      ],
    );

  const baseHeight =
    readNumber(
      properties,
      [
        'min_height',
        'render_min_height',
      ],
    ) ?? 0;

  let resolvedHeight =
    height;

  if (
    resolvedHeight === undefined &&
    levels !== undefined
  ) {
    resolvedHeight =
      levels * 3;
  }

  resolvedHeight =
    resolvedHeight ?? 8;

  return {
    height: Math.max(
      resolvedHeight,
      baseHeight + 1,
    ),

    baseHeight: Math.max(
      baseHeight,
      0,
    ),
  };
}

function readNumber(
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