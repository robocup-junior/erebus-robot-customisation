export const BUDGET = 3000;

export const WHEEL_COST = 300;
export const DISTANCE_SENSOR_COST = 50;
export const MAX_DISTANCE_SENSORS = 8;
export const CAMERA_NAME = 'Camera';
export const DISTANCE_SENSOR_NAME = 'Distance Sensor';
export const WHEEL_NAME = 'Wheel';

import type { MessageKey } from '../i18n/messages/en';

export interface SensorSpec {
  /** Name written to the robot file. */
  name: string;
  /** Text shown to the user; `number` fills in `{number}`, as in "Camera 2". */
  label: { key: MessageKey; number?: number };
  /** Key of the sensor in the robot file. Erebus depends on these values. */
  dictName: string;
  defaultName: string;
  cost: number;
}

export const SENSORS: readonly SensorSpec[] = [
  { name: 'Gyro', label: { key: 'gyro' }, dictName: 'gyro', defaultName: 'gyro', cost: 100 },
  { name: 'InertialUnit', label: { key: 'inertialUnit' }, dictName: 'iu', defaultName: 'inertial_unit', cost: 100 },
  { name: 'GPS', label: { key: 'gps' }, dictName: 'gps', defaultName: 'gps', cost: 250 },
  { name: CAMERA_NAME, label: { key: 'camera', number: 1 }, dictName: 'camera1', defaultName: 'camera1', cost: 500 },
  { name: CAMERA_NAME, label: { key: 'camera', number: 2 }, dictName: 'camera2', defaultName: 'camera2', cost: 500 },
  { name: CAMERA_NAME, label: { key: 'camera', number: 3 }, dictName: 'camera3', defaultName: 'camera3', cost: 500 },
  { name: 'Colour sensor', label: { key: 'colourSensor' }, dictName: 'colsensor', defaultName: 'colour_sensor', cost: 100 },
  { name: 'Accelerometer', label: { key: 'accelerometer' }, dictName: 'acc', defaultName: 'accelerometer', cost: 100 },
  { name: 'Lidar', label: { key: 'lidar' }, dictName: 'lidar', defaultName: 'lidar', cost: 500 },
];

/** Camera dimension in pixels -> extra cost. Width and height are charged separately. */
export const CAMERA_DIMENSIONS: ReadonlyMap<number, number> = new Map([
  [32, 0],
  [40, 0],
  [64, 100],
  [128, 200],
  [256, 300],
]);

export const DEFAULT_CAMERA_SIZE: readonly [number, number] = [40, 32];
