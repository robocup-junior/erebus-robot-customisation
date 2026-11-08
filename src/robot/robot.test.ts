import { Euler, Quaternion, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { SENSORS } from './catalog';
import {
  costBreakdown,
  createSensor,
  findNameProblems,
  tagNames,
  totalCost,
  type Devices,
} from './device';
import { createDefaultRobot, parseRobot, RobotFileError, serializeRobot } from './robotFile';
import {
  eulerToRotation,
  FACINGS,
  type Facing,
  facingToRotation,
  findFacing,
  quaternionToRotation,
  rotationToEuler,
  rotationToQuaternion,
} from './rotation';

const spec = (dictName: string) => SENSORS.find((sensor) => sensor.dictName === dictName)!;

describe('cost', () => {
  it('matches the default robot: two wheels and four distance sensors', () => {
    expect(totalCost(createDefaultRobot())).toBe(800);
  });

  it('charges cameras for both dimensions', () => {
    const camera = { ...createSensor(spec('camera1')), custom: [256, 64] };
    expect(totalCost({ camera1: camera })).toBe(500 + 300 + 100);
  });
});

describe('cost breakdown', () => {
  it('adds up to the total', () => {
    const devices: Devices = {
      ...createDefaultRobot(),
      gps: createSensor(spec('gps')),
      camera1: { ...createSensor(spec('camera1')), custom: [64, 32] },
    };
    const breakdown = costBreakdown(devices);
    expect(breakdown).toEqual({ wheels: 600, distance: 200, sensors: 250, cameras: 600 });
    expect(Object.values(breakdown).reduce((a, b) => a + b)).toBe(totalCost(devices));
  });
});

describe('robot file', () => {
  it('keeps the field names and values Erebus reads', () => {
    const devices: Devices = { ...createDefaultRobot(), gps: createSensor(spec('gps')) };
    const file = JSON.parse(serializeRobot(devices));
    expect(file['Wheel 1']).toEqual({
      dictName: 'Wheel 1',
      name: 'Wheel',
      customName: 'wheel1',
      type: '',
      x: 260,
      y: 15,
      z: 0,
      rx: 0,
      ry: -1,
      rz: 0,
      a: 1.57,
      custom: [],
    });
    expect(file.gps).toMatchObject({ dictName: 'gps', name: 'GPS', customName: 'gps', type: 'add' });
  });

  it('survives an export and import', () => {
    const devices = { ...createDefaultRobot(), camera2: createSensor(spec('camera2')) };
    expect(parseRobot(serializeRobot(devices)).devices).toEqual(devices);
  });

  it('gives a camera without a resolution the default one', () => {
    const { camera1 } = parseRobot(
      JSON.stringify({ camera1: { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, a: 0 } }),
    ).devices;
    expect(camera1.custom).toEqual([40, 32]);
  });

  it('reports keys it does not know', () => {
    const text = JSON.stringify({ ...createDefaultRobot(), rocket: {} });
    expect(parseRobot(text).ignored).toEqual(['rocket']);
  });

  it.each([
    ['not json', '{', { code: 'fileNotJson' }],
    ['an array', '[]', { code: 'fileNotRobot' }],
    ['no components', '{}', { code: 'fileEmpty' }],
    ['a component that is not an object', '{"gps": 1}', { code: 'fileUnknownComponent', key: 'gps' }],
    ['a component without numbers', '{"gps": {"x": "1"}}', { code: 'fileInvalidValues', key: 'gps' }],
  ])('rejects %s', (_, text, problem) => {
    expect(() => parseRobot(text)).toThrow(RobotFileError);
    try {
      parseRobot(text);
    } catch (error) {
      expect((error as RobotFileError).problem).toEqual(problem);
    }
  });
});

describe('names', () => {
  it('flags empty and duplicate names', () => {
    const gps = { ...createSensor(spec('gps')), customName: '' };
    const gyro = { ...createSensor(spec('gyro')), customName: 'imu' };
    const acc = { ...createSensor(spec('acc')), customName: 'imu' };
    expect(findNameProblems({ gps, gyro, acc })).toEqual({ gps: 'required', acc: 'duplicate' });
  });

  it('gives wheels a motor and a sensor tag', () => {
    expect(tagNames(createDefaultRobot()['Wheel 1'])).toEqual(['wheel1 motor', 'wheel1 sensor']);
  });
});

describe('rotation', () => {
  const close = (a: Quaternion, b: Quaternion) => Math.abs(a.dot(b));

  it('maps ry and rz to the scene Z and Y axes', () => {
    const wheel = rotationToQuaternion({ rx: 0, ry: -1, rz: 0, a: Math.PI / 2 });
    expect(close(wheel, new Quaternion().setFromEuler(new Euler(0, 0, -Math.PI / 2)))).toBeCloseTo(1);
  });

  it('round-trips a rotation around several axes', () => {
    const original = new Quaternion().setFromEuler(new Euler(0.4, -1.1, 0.7));
    const result = rotationToQuaternion(quaternionToRotation(original));
    expect(close(original, result)).toBeCloseTo(1, 5);
  });

  it('round-trips through the Euler degrees shown in the UI', () => {
    const euler = { x: 30, y: -45, z: 60 };
    expect(rotationToEuler(eulerToRotation(euler))).toEqual(euler);
  });

  it('accepts an empty axis', () => {
    expect(rotationToEuler({ rx: 0, ry: 0, rz: 0, a: 1 })).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('points the default sensor rotation at the front of the robot', () => {
    const { x, y, z } = rotationToEuler({ rx: -0.5858, ry: 0.5858, rz: 0.5858, a: 2.09 });
    expect([x, y, z].map(Math.round)).toEqual([-90, 0, 90]);
  });
});

describe('rotation file format', () => {
  // Expected values come from the previous version's conversion, which is exact for one axis.
  it.each([
    ['X', new Euler(0.8, 0, 0), { rx: 1, ry: 0, rz: 0 }],
    ['Y', new Euler(0, 0.8, 0), { rx: 0, ry: 0, rz: 1 }],
    ['Z', new Euler(0, 0, 0.8), { rx: 0, ry: 1, rz: 0 }],
  ])('writes a turn around the scene %s axis to the same fields', (_, euler, axis) => {
    const rotation = quaternionToRotation(new Quaternion().setFromEuler(euler));
    expect(rotation).toEqual({ ...axis, a: 0.8 });
  });
});

describe('rotation in Erebus', () => {
  // Erebus writes `rotation rx rz ry a` into the robot proto, in the same Y-up frame as the scene.
  const inErebus = ({ rx, ry, rz, a }: { rx: number; ry: number; rz: number; a: number }) =>
    new Quaternion().setFromAxisAngle(new Vector3(rx, rz, ry).normalize(), a);

  it.each([
    [30, 40, 0],
    [0, 30, 40],
    [30, 0, 40],
    [20, 30, 40],
    [-90, 0, 90],
  ])('places a rotation of %d°, %d°, %d° as it is shown', (x, y, z) => {
    const shown = new Quaternion().setFromEuler(
      new Euler(...([x, y, z].map((v) => (v * Math.PI) / 180) as [number, number, number])),
    );
    const rotation = eulerToRotation({ x, y, z });
    expect(inErebus(rotation).angleTo(shown)).toBeLessThan(1e-3);
    expect(rotationToEuler(rotation)).toEqual({ x, y, z });
  });
});

describe('facing presets', () => {
  // The direction a sensor looks along when it has no rotation.
  const FRONT = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, Math.PI / 2));
  const lookDirection = new Vector3(0, 0, -1).applyQuaternion(FRONT.clone().invert());

  it.each<[Facing, [number, number, number]]>([
    ['Front', [0, 0, -1]],
    ['Back', [0, 0, 1]],
    ['Left', [-1, 0, 0]],
    ['Right', [1, 0, 0]],
    ['Up', [0, 1, 0]],
    ['Down', [0, -1, 0]],
  ])('%s looks the right way in the scene', (facing, expected) => {
    const looks = lookDirection
      .clone()
      .applyQuaternion(rotationToQuaternion(facingToRotation(facing)));
    expected.forEach((value, index) => expect(looks.getComponent(index)).toBeCloseTo(value, 3));
  });

  it('recognises every preset', () => {
    for (const facing of Object.keys(FACINGS) as Facing[]) {
      expect(findFacing(facingToRotation(facing))).toBe(facing);
    }
  });

  it('recognises the default rotation as the front', () => {
    expect(findFacing({ rx: -0.5858, ry: 0.5858, rz: 0.5858, a: 2.09 })).toBe('Front');
  });

  it('does not match a rotation between presets', () => {
    expect(findFacing(eulerToRotation({ x: 10, y: 20, z: 30 }))).toBeUndefined();
  });
});
