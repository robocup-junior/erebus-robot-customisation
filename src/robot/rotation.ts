import { Euler, MathUtils, Quaternion, Vector3 } from 'three';
import type { Rotation } from './device';

const round = (value: number, digits: number) => +value.toFixed(digits) + 0;

export function rotationToQuaternion({ rx, ry, rz, a }: Rotation): Quaternion {
  const axis = new Vector3(rx, rz, ry);
  if (axis.lengthSq() === 0) return new Quaternion();
  return new Quaternion().setFromAxisAngle(axis.normalize(), a);
}

export function quaternionToRotation(quaternion: Quaternion): Rotation {
  const q = quaternion.clone().normalize();
  const sine = Math.sqrt(Math.max(0, 1 - q.w * q.w));
  const angle = 2 * Math.acos(MathUtils.clamp(q.w, -1, 1));
  if (sine < 1e-4) return { rx: 1, ry: 0, rz: 0, a: round(angle, 4) };
  return {
    rx: round(q.x / sine, 4),
    ry: round(q.z / sine, 4),
    rz: round(q.y / sine, 4),
    a: round(angle, 4),
  };
}

export interface EulerDegrees {
  x: number;
  y: number;
  z: number;
}

export function rotationToEuler(rotation: Rotation): EulerDegrees {
  const euler = new Euler().setFromQuaternion(rotationToQuaternion(rotation));
  return {
    x: round(MathUtils.radToDeg(euler.x), 1),
    y: round(MathUtils.radToDeg(euler.y), 1),
    z: round(MathUtils.radToDeg(euler.z), 1),
  };
}

export function eulerToRotation({ x, y, z }: EulerDegrees): Rotation {
  const euler = new Euler(MathUtils.degToRad(x), MathUtils.degToRad(y), MathUtils.degToRad(z));
  return quaternionToRotation(new Quaternion().setFromEuler(euler));
}

/** Rotation that makes a sensor look at the front of the robot, as a default sensor does. */
const FRONT = new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, Math.PI / 2));

/** Where a sensor can be pointed with one click: degrees of yaw and pitch from the front. */
export const FACINGS = {
  Front: [0, 0],
  Left: [90, 0],
  Back: [180, 0],
  Right: [-90, 0],
  Up: [0, 90],
  Down: [0, -90],
} as const;

export type Facing = keyof typeof FACINGS;

const FACING_TOLERANCE = MathUtils.degToRad(1.5);

function facingQuaternion(facing: Facing): Quaternion {
  const [yaw, pitch] = FACINGS[facing];
  const turn = new Euler(MathUtils.degToRad(pitch), MathUtils.degToRad(yaw), 0, 'YXZ');
  return new Quaternion().setFromEuler(turn).multiply(FRONT);
}

export const facingToRotation = (facing: Facing) => quaternionToRotation(facingQuaternion(facing));

export function findFacing(rotation: Rotation): Facing | undefined {
  const quaternion = rotationToQuaternion(rotation);
  const facings = Object.keys(FACINGS) as Facing[];
  return facings.find((facing) => facingQuaternion(facing).angleTo(quaternion) < FACING_TOLERANCE);
}
