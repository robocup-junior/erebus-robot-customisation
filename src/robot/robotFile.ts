import { DEFAULT_CAMERA_SIZE, DISTANCE_SENSOR_NAME, SENSORS, WHEEL_NAME } from './catalog';
import type { Device, Devices } from './device';
import defaultRobot from './defaultRobot.json';

const NUMBER_FIELDS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 'a'] as const;

export type RobotFileProblem =
  | { code: 'fileNotJson' }
  | { code: 'fileNotRobot' }
  | { code: 'fileEmpty' }
  | { code: 'fileUnknownComponent'; key: string }
  | { code: 'fileInvalidValues'; key: string };

/** Why a file can't be read. `problem.code` is also the key of the message shown. */
export class RobotFileError extends Error {
  constructor(readonly problem: RobotFileProblem) {
    super('key' in problem ? `${problem.code}: ${problem.key}` : problem.code);
  }
}

export interface ParsedRobot {
  devices: Devices;
  /** Keys in the file that aren't components of a robot. */
  ignored: string[];
}

function identify(key: string): { name: string; type: string } | undefined {
  const sensor = SENSORS.find((spec) => spec.dictName === key);
  if (sensor) return { name: sensor.name, type: 'add' };
  const numbered = key.match(/^(Distance Sensor|Wheel) \d+$/)?.[1];
  if (numbered === DISTANCE_SENSOR_NAME || numbered === WHEEL_NAME) {
    return { name: numbered, type: '' };
  }
  return undefined;
}

function parseDevice(key: string, value: unknown, kind: { name: string; type: string }): Device {
  const entry = value as Partial<Device> | null;
  if (typeof entry !== 'object' || entry === null) {
    throw new RobotFileError({ code: 'fileUnknownComponent', key });
  }
  const numbers = NUMBER_FIELDS.map((field) => entry[field]);
  if (!numbers.every(Number.isFinite)) {
    throw new RobotFileError({ code: 'fileInvalidValues', key });
  }
  const custom = Array.isArray(entry.custom) ? entry.custom : [];
  return {
    ...(entry as Device),
    dictName: key,
    name: kind.name,
    type: kind.type,
    customName: typeof entry.customName === 'string' ? entry.customName : '',
    custom: kind.name === 'Camera' && custom.length < 2 ? [...DEFAULT_CAMERA_SIZE] : custom,
  };
}

export function parseRobot(text: string): ParsedRobot {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new RobotFileError({ code: 'fileNotJson' });
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new RobotFileError({ code: 'fileNotRobot' });
  }

  const devices: Devices = {};
  const ignored: string[] = [];
  for (const [key, value] of Object.entries(json)) {
    const kind = identify(key);
    if (kind) devices[key] = parseDevice(key, value, kind);
    else ignored.push(key);
  }
  if (Object.keys(devices).length === 0) {
    throw new RobotFileError({ code: 'fileEmpty' });
  }
  return { devices, ignored };
}

export const serializeRobot = (devices: Devices) => JSON.stringify(devices, null, '\t');

export const createDefaultRobot = () => parseRobot(JSON.stringify(defaultRobot)).devices;
