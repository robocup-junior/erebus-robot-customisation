import {
  CAMERA_DIMENSIONS,
  CAMERA_NAME,
  DEFAULT_CAMERA_SIZE,
  DISTANCE_SENSOR_COST,
  DISTANCE_SENSOR_NAME,
  SENSORS,
  WHEEL_COST,
  WHEEL_NAME,
  type SensorSpec,
} from './catalog';

export interface Position {
  x: number;
  y: number;
  z: number;
}

/**
 * Angle-axis rotation as stored in the robot file. The axis is in file order:
 * in the 3D scene, `ry` is the Z component and `rz` is the Y component.
 */
export interface Rotation {
  rx: number;
  ry: number;
  rz: number;
  a: number;
}

/** One entry of the robot file. Field names are read by Erebus, so don't rename them. */
export interface Device extends Position, Rotation {
  dictName: string;
  name: string;
  customName: string;
  type: string;
  custom: number[];
}

export type Devices = Record<string, Device>;

const DEFAULT_ROTATION: Rotation = { rx: -0.5858, ry: 0.5858, rz: 0.5858, a: 2.09 };
const ORIGIN: Position = { x: 0, y: 0, z: 0 };

type Named = Pick<Device, 'name'>;

export const isWheel = (device: Named) => device.name === WHEEL_NAME;
export const isCamera = (device: Named) => device.name === CAMERA_NAME;
export const isDistanceSensor = (device: Named) => device.name === DISTANCE_SENSOR_NAME;

export function createSensor(spec: SensorSpec): Device {
  return {
    dictName: spec.dictName,
    name: spec.name,
    customName: spec.defaultName,
    type: 'add',
    ...ORIGIN,
    ...DEFAULT_ROTATION,
    custom: spec.name === CAMERA_NAME ? [...DEFAULT_CAMERA_SIZE] : [],
  };
}

export function createDistanceSensor(index: number): Device {
  return {
    dictName: `${DISTANCE_SENSOR_NAME} ${index}`,
    name: DISTANCE_SENSOR_NAME,
    customName: `distance sensor${index}`,
    type: '',
    ...ORIGIN,
    ...DEFAULT_ROTATION,
    custom: [],
  };
}

export function deviceCost(device: Device): number {
  if (isWheel(device)) return WHEEL_COST;
  if (isDistanceSensor(device)) return DISTANCE_SENSOR_COST;
  const base = SENSORS.find((spec) => spec.dictName === device.dictName)?.cost ?? 0;
  if (!isCamera(device)) return base;
  return device.custom.reduce((cost, size) => cost + (CAMERA_DIMENSIONS.get(size) ?? 0), base);
}

export function totalCost(devices: Devices): number {
  return Object.values(devices).reduce((cost, device) => cost + deviceCost(device), 0);
}

export interface CostBreakdown {
  wheels: number;
  distance: number;
  sensors: number;
  cameras: number;
}

export function costBreakdown(devices: Devices): CostBreakdown {
  const breakdown: CostBreakdown = { wheels: 0, distance: 0, sensors: 0, cameras: 0 };
  for (const device of Object.values(devices)) {
    const cost = deviceCost(device);
    if (isWheel(device)) breakdown.wheels += cost;
    else if (isDistanceSensor(device)) breakdown.distance += cost;
    else if (isCamera(device)) breakdown.cameras += cost;
    else breakdown.sensors += cost;
  }
  return breakdown;
}

/** Devices of one kind, ordered by the number in their key. */
export function numberedDevices(devices: Devices, name: string): Device[] {
  const order = (device: Device) => Number(device.dictName.split(' ').at(-1));
  return Object.values(devices)
    .filter((device) => device.name === name)
    .sort((a, b) => order(a) - order(b));
}

/** Why a name can't be used from a controller. `required` or `duplicate` of another name. */
export type NameProblem = 'required' | 'duplicate';

/** Returns the devices whose names can't be used from a controller, keyed by dictName. */
export function findNameProblems(devices: Devices): Record<string, NameProblem> {
  const problems: Record<string, NameProblem> = {};
  const seen = new Set<string>();
  for (const device of Object.values(devices)) {
    if (!device.customName) {
      problems[device.dictName] = 'required';
    } else if (seen.has(device.customName)) {
      problems[device.dictName] = 'duplicate';
    }
    seen.add(device.customName);
  }
  return problems;
}

/** The names a controller uses to access the device. */
export function tagNames(device: Device): string[] {
  if (!device.customName) return [];
  if (isWheel(device)) return [`${device.customName} motor`, `${device.customName} sensor`];
  return [device.customName];
}

export function positionBounds(device: Named) {
  const horizontal = isWheel(device) ? 260 : 370;
  return { x: horizontal, z: horizontal, yMin: -100, yMax: 370 };
}
