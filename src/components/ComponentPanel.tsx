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
  const nameProblems = findNameProblems(devices);
  const distanceSensors = numberedDevices(devices, DISTANCE_SENSOR_NAME);
  const wheels = numberedDevices(devices, WHEEL_NAME);
  const toggle = (dictName: string) => onSelect(selected === dictName ? null : dictName);

  const title = (device: Device | undefined, label: string, dictName: string, Icon: LucideIcon) => (
    <>
      <span className="row-title">
        <Icon className="row-icon" size={17} aria-hidden />
        {label}
        {nameProblems[dictName] && (
          <TriangleAlert className="row-alert" size={14} aria-label={nameProblems[dictName]} />
        )}
      </span>
      {device && compact(device.customName) !== compact(label) && (
        <span className="row-name">{device.customName || 'unnamed'}</span>
      )}
    </>
  );

  const inspector = (device: Device) => (
    <Inspector
      device={device}
      nameProblem={nameProblems[device.dictName]}
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
              device.dictName,
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
            aria-label={spec.label}
            onClick={() => onToggleSensor(spec)}
          />
          <button
            className="row-main"
            aria-expanded={device ? open : undefined}
            onClick={() => (device ? toggle(spec.dictName) : onToggleSensor(spec))}
          >
            {title(device, spec.label, spec.dictName, sensorIcon(spec.dictName))}
          </button>
          <span
            className="cost"
            data-warn={tooExpensive}
            title={tooExpensive ? 'More than you have left' : undefined}
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
          <Cpu size={14} /> Sensors
        </h2>
        <ul className="rows">{SIMPLE_SENSORS.map(renderSensor)}</ul>
      </section>

      <section>
        <h2>
          <Camera size={14} /> Cameras
        </h2>
        <ul className="rows">{CAMERAS.map(renderSensor)}</ul>
      </section>

      <section>
        <div className="section-head">
          <h2>
            <DistanceIcon size={14} /> Distance sensors
            <span className="section-note">{DISTANCE_SENSOR_COST} each</span>
          </h2>
          <div className="stepper" role="group" aria-label="Number of distance sensors">
            <button
              aria-label="Remove a distance sensor"
              disabled={distanceSensors.length === 0}
              onClick={() => onDistanceCountChange(distanceSensors.length - 1)}
            >
              <Minus size={14} />
            </button>
            <output>{distanceSensors.length}</output>
            <button
              aria-label="Add a distance sensor"
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
          <WheelIcon size={14} /> Wheels
          <span className="section-note">required, {WHEEL_COST} each</span>
        </h2>
        <ul className="rows">{wheels.map(renderRow)}</ul>
      </section>
    </div>
  );
}
