import {
  Camera,
  ChevronDown,
  Cpu,
  type LucideIcon,
  Minus,
  Plus,
  TriangleAlert,
} from 'lucide-react';
import {
  CAMERA_NAME,
  DISTANCE_SENSOR_COST,
  DISTANCE_SENSOR_NAME,
  MAX_DISTANCE_SENSORS,
  SENSORS,
  type SensorSpec,
  WHEEL_COST,
  WHEEL_NAME,
} from '../robot/catalog';
import {
  type Device,
  deviceCost,
  type Devices,
  findNameProblems,
  numberedDevices,
} from '../robot/device';
import { useI18n } from '../i18n/I18n';
import { deviceLabel, sensorLabel } from '../i18n/labels';
import { DistanceIcon, sensorIcon, WheelIcon } from './icons';
import { Inspector } from './Inspector';

const SIMPLE_SENSORS = SENSORS.filter((spec) => spec.name !== CAMERA_NAME);
const CAMERAS = SENSORS.filter((spec) => spec.name === CAMERA_NAME);

const compact = (text: string) => text.toLowerCase().replace(/[\s_]/g, '');

interface ComponentPanelProps {
  devices: Devices;
  selected: string | null;
  remaining: number;
  onSelect(dictName: string | null): void;
  onToggleSensor(spec: SensorSpec): void;
  onPreview(spec: SensorSpec | null): void;
  onDistanceCountChange(count: number): void;
  onChange(dictName: string, patch: Partial<Device>): void;
}

export function ComponentPanel({
  devices,
  selected,
  remaining,
  onSelect,
  onToggleSensor,
  onPreview,
  onDistanceCountChange,
  onChange,
}: ComponentPanelProps) {
  const i18n = useI18n();
  const { t } = i18n;
  const nameProblems = findNameProblems(devices);
  const problemText = (device: Device) => {
    const problem = nameProblems[device.dictName];
    if (problem === 'required') return t('nameRequired');
    if (problem === 'duplicate') return t('nameDuplicate', { name: device.customName });
    return undefined;
  };
  const distanceSensors = numberedDevices(devices, DISTANCE_SENSOR_NAME);
  const wheels = numberedDevices(devices, WHEEL_NAME);
  const toggle = (dictName: string) => onSelect(selected === dictName ? null : dictName);

  /**
   * The row's label, and the name used in the controller when it isn't the default one
   * (`defaultName`), so that a renamed component can be recognised.
   */
  const title = (device: Device | undefined, label: string, defaultName: string, Icon: LucideIcon) => (
    <>
      <span className="row-title">
        <Icon className="row-icon" size={17} aria-hidden />
        {label}
        {device && nameProblems[device.dictName] && (
          <TriangleAlert className="row-alert" size={14} aria-label={problemText(device)} />
        )}
      </span>
      {device && compact(device.customName) !== compact(defaultName) && (
        <span className="row-name">{device.customName || t('unnamed')}</span>
      )}
    </>
  );

  const inspector = (device: Device) => (
    <Inspector
      device={device}
      nameProblem={problemText(device)}
      onChange={(patch) => onChange(device.dictName, patch)}
    />
  );

  const renderRow = (device: Device) => {
    const open = selected === device.dictName;
    return (
      <li key={device.dictName} className="row" data-open={open}>
        <div className="row-head">
          <button className="row-main" aria-expanded={open} onClick={() => toggle(device.dictName)}>
            {title(
              device,
              deviceLabel(i18n, device),
              device.dictName,
              device.name === WHEEL_NAME ? WheelIcon : DistanceIcon,
            )}
          </button>
          <ChevronDown className="row-chevron" size={16} aria-hidden />
        </div>
        {open && inspector(device)}
      </li>
    );
  };

  const renderSensor = (spec: SensorSpec) => {
    const device = devices[spec.dictName];
    const open = selected === spec.dictName && device !== undefined;
    const tooExpensive = !device && spec.cost > remaining;
    const label = sensorLabel(i18n, spec);
    const previewHandlers = {
      onPointerEnter: () => onPreview(spec),
      onPointerLeave: () => onPreview(null),
      onFocus: () => onPreview(spec),
      onBlur: () => onPreview(null),
    };

    return (
      <li key={spec.dictName} className="row" data-open={open} data-off={!device}>
        <div className="row-head" {...previewHandlers}>
          <button
            className="switch"
            role="switch"
            aria-checked={device !== undefined}
            aria-label={label}
            onClick={() => onToggleSensor(spec)}
          />
          <button
            className="row-main"
            aria-expanded={device ? open : undefined}
            onClick={() => (device ? toggle(spec.dictName) : onToggleSensor(spec))}
          >
            {title(device, label, spec.defaultName, sensorIcon(spec.dictName))}
          </button>
          <span
            className="cost"
            data-warn={tooExpensive}
            title={tooExpensive ? t('tooExpensive') : undefined}
          >
            {device ? deviceCost(device) : `+${spec.cost}`}
          </span>
          {device && <ChevronDown className="row-chevron" size={16} aria-hidden />}
        </div>
        {open && inspector(device)}
      </li>
    );
  };

  return (
    <div className="panel">
      <section>
        <h2>
          <Cpu size={14} /> {t('sensors')}
        </h2>
        <ul className="rows">{SIMPLE_SENSORS.map(renderSensor)}</ul>
      </section>

      <section>
        <h2>
          <Camera size={14} /> {t('cameras')}
        </h2>
        <ul className="rows">{CAMERAS.map(renderSensor)}</ul>
      </section>

      <section>
        <div className="section-head">
          <h2>
            <DistanceIcon size={14} /> {t('distanceSensors')}
            <span className="section-note">
              {t('costEach', { cost: i18n.number(DISTANCE_SENSOR_COST) })}
            </span>
          </h2>
          <div className="stepper" role="group" aria-label={t('distanceCount')}>
            <button
              aria-label={t('removeDistance')}
              disabled={distanceSensors.length === 0}
              onClick={() => onDistanceCountChange(distanceSensors.length - 1)}
            >
              <Minus size={14} />
            </button>
            <output>{distanceSensors.length}</output>
            <button
              aria-label={t('addDistance')}
              disabled={distanceSensors.length >= MAX_DISTANCE_SENSORS}
              onClick={() => onDistanceCountChange(distanceSensors.length + 1)}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
        <ul className="rows">{distanceSensors.map(renderRow)}</ul>
      </section>

      <section>
        <h2>
          <WheelIcon size={14} /> {t('wheels')}
          <span className="section-note">{t('wheelsNote', { cost: i18n.number(WHEEL_COST) })}</span>
        </h2>
        <ul className="rows">{wheels.map(renderRow)}</ul>
      </section>
    </div>
  );
}
