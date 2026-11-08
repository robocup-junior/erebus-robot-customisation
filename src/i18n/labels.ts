import { DISTANCE_SENSOR_NAME, SENSORS, type SensorSpec, WHEEL_NAME } from '../robot/catalog';
import type { Device } from '../robot/device';
import type { I18n } from './I18n';

export const sensorLabel = ({ t }: Pick<I18n, 't'>, spec: SensorSpec) =>
  t(spec.label.key, { number: spec.label.number ?? '' });

/** What a component is called on screen, e.g. "Distance Sensor 2" or "距離センサー 2". */
export function deviceLabel(i18n: Pick<I18n, 't'>, device: Pick<Device, 'dictName' | 'name'>) {
  const spec = SENSORS.find((sensor) => sensor.dictName === device.dictName);
  if (spec) return sensorLabel(i18n, spec);
  const number = device.dictName.split(' ').at(-1) ?? '';
  if (device.name === DISTANCE_SENSOR_NAME) return i18n.t('distanceSensor', { number });
  if (device.name === WHEEL_NAME) return i18n.t('wheel', { number });
  return device.dictName;
}
