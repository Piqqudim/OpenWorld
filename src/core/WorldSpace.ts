import type { WorldCoordinate } from './WorldCoordinate';

export interface LocalWorldPosition {
  x: number;
  y: number;
  z: number;
}

interface EcefPosition {
  x: number;
  y: number;
  z: number;
}

const WGS84_A =
  6378137;

const WGS84_F =
  1 / 298.257223563;

const WGS84_E2 =
  WGS84_F * (2 - WGS84_F);

export class WorldSpace {
  private origin:
    WorldCoordinate;

  private originEcef:
    EcefPosition;

  constructor(
    origin: WorldCoordinate,
  ) {
    this.origin = {
      ...origin,
    };

    this.originEcef =
      geographicToEcef(
        origin,
      );
  }

  getOrigin(): WorldCoordinate {
    return {
      ...this.origin,
    };
  }

  setOrigin(
    origin: WorldCoordinate,
  ): void {
    this.origin = {
      ...origin,
    };

    this.originEcef =
      geographicToEcef(
        origin,
      );
  }

  toLocal(
    coordinate: WorldCoordinate,
  ): LocalWorldPosition {
    const point =
      geographicToEcef(
        coordinate,
      );

    const dx =
      point.x -
      this.originEcef.x;

    const dy =
      point.y -
      this.originEcef.y;

    const dz =
      point.z -
      this.originEcef.z;

    const lat =
      degreesToRadians(
        this.origin.latitude,
      );

    const lon =
      degreesToRadians(
        this.origin.longitude,
      );

    const sinLat =
      Math.sin(lat);

    const cosLat =
      Math.cos(lat);

    const sinLon =
      Math.sin(lon);

    const cosLon =
      Math.cos(lon);

    // East
    const east =
      -sinLon * dx +
      cosLon * dy;

    // North
    const north =
      -sinLat * cosLon * dx -
      sinLat * sinLon * dy +
      cosLat * dz;

    // Up
    const up =
      cosLat * cosLon * dx +
      cosLat * sinLon * dy +
      sinLat * dz;

    return {
      x: east,
      y: up,
      z: -north,
    };
  }

  distance(
    a: WorldCoordinate,
    b: WorldCoordinate,
  ): number {
    const local =
      this.toLocal(b);

    const origin =
      this.origin;

    const base =
      this.toLocal(origin);

    const dx =
      local.x - base.x;

    const dy =
      local.y - base.y;

    const dz =
      local.z - base.z;

    return Math.sqrt(
      dx * dx +
      dy * dy +
      dz * dz,
    );
  }
}

function geographicToEcef(
  coordinate: WorldCoordinate,
): EcefPosition {
  const latitude =
    degreesToRadians(
      coordinate.latitude,
    );

  const longitude =
    degreesToRadians(
      coordinate.longitude,
    );

  const sinLatitude =
    Math.sin(latitude);

  const cosLatitude =
    Math.cos(latitude);

  const sinLongitude =
    Math.sin(longitude);

  const cosLongitude =
    Math.cos(longitude);

  const radius =
    WGS84_A /
    Math.sqrt(
      1 -
        WGS84_E2 *
          sinLatitude *
          sinLatitude,
    );

  const x =
    (radius + coordinate.elevation) *
    cosLatitude *
    cosLongitude;

  const y =
    (radius + coordinate.elevation) *
    cosLatitude *
    sinLongitude;

  const z =
    (
      radius *
        (1 - WGS84_E2) +
      coordinate.elevation
    ) *
    sinLatitude;

  return {
    x,
    y,
    z,
  };
}

function degreesToRadians(
  degrees: number,
): number {
  return (
    (degrees * Math.PI) / 180
  );
}