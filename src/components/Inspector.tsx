import {
  ArrowBigDown,
  ArrowBigLeft,
  ArrowBigRight,
  ArrowBigUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bot,
  Code2,
  Image,
  type LucideIcon,
  Move3d,
  MoveHorizontal,
  MoveVertical,
  Rotate3d,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import { useId } from 'react';
import { CAMERA_DIMENSIONS } from '../robot/catalog';
import {
  type Device,
  isCamera,
  isWheel,
  positionBounds,
  type Rotation,
  tagNames,
} from '../robot/device';
import {
  eulerToRotation,
  type Facing,
  FACINGS,
  facingToRotation,
  findFacing,
  rotationToEuler,
} from '../robot/rotation';
import { NumberField, SliderField } from './fields';

const FACING_ICONS: Record<Facing, LucideIcon> = {
  Front: ArrowBigUp,
  Left: ArrowBigLeft,
  Back: ArrowBigDown,
  Right: ArrowBigRight,
  Up: ArrowUpFromLine,
  Down: ArrowDownToLine,
};

const ANGLE_AXIS_FIELDS: { field: keyof Rotation; label: string }[] = [
  { field: 'rx', label: 'rx' },
  { field: 'ry', label: 'ry' },
  { field: 'rz', label: 'rz' },
  { field: 'a', label: 'angle' },
];

interface InspectorProps {
  device: Device;
  nameProblem?: string;
  onChange(patch: Partial<Device>): void;
}

export function Inspector({ device, nameProblem, onChange }: InspectorProps) {
  const nameId = useId();
  const bounds = positionBounds(device);
  const euler = rotationToEuler(device);
  const setEuler = (axis: keyof typeof euler, value: number) =>
    onChange(eulerToRotation({ ...euler, [axis]: value }));
  const tags = tagNames(device);

  return (
    <div className="inspector">
      <div className="field">
        <label className="field-label" htmlFor={nameId}>
          <Tag size={13} />
          <span>Name</span>
        </label>
        <input
          id={nameId}
          className="text-input"
          value={device.customName}
          aria-invalid={nameProblem !== undefined}
          aria-describedby={nameProblem ? `${nameId}-error` : undefined}
          spellCheck={false}
          onChange={(event) => onChange({ customName: event.target.value })}
        />
        {nameProblem && (
          <span className="field-error" id={`${nameId}-error`}>
            {nameProblem}
          </span>
        )}
      </div>
      {tags.length > 0 && (
        <p className="tags">
          <Code2 size={14} aria-hidden />
          <span>In your controller:</span>
          {tags.map((tag) => (
            <code key={tag}>{tag}</code>
          ))}
        </p>
      )}

      {isCamera(device) && (
        <fieldset className="group">
          <legend>
            <Image size={13} /> Resolution
          </legend>
          <div className="resolution">
            {(
              [
                ['Width', MoveHorizontal],
                ['Height', MoveVertical],
              ] as const
            ).map(([label, Icon], index) => (
              <label className="field" key={label}>
                <span className="field-label">
                  <Icon size={14} /> <span>{label}</span>
                </span>
                <select
                  className="text-input"
                  value={device.custom[index]}
                  onChange={(event) => {
                    const custom = [...device.custom];
                    custom[index] = Number(event.target.value);
                    onChange({ custom });
                  }}
                >
                  {[...CAMERA_DIMENSIONS].map(([size, cost]) => (
                    <option key={size} value={size}>
                      {size}px{cost > 0 ? ` (+${cost})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="group">
        <legend>
          <Move3d size={13} /> Position
        </legend>
        <SliderField
          label="Position"
          axis="x"
          value={device.x}
          min={-bounds.x}
          max={bounds.x}
          step={1}
          unit="mm"
          onChange={(x) => onChange({ x })}
        />
        <SliderField
          label="Position"
          axis="y"
          value={device.y}
          min={bounds.yMin}
          max={bounds.yMax}
          step={1}
          unit="mm"
          onChange={(y) => onChange({ y })}
        />
        <SliderField
          label="Position"
          axis="z"
          value={device.z}
          min={-bounds.z}
          max={bounds.z}
          step={1}
          unit="mm"
          onChange={(z) => onChange({ z })}
        />
      </fieldset>

      <fieldset className="group">
        <legend>
          <Rotate3d size={13} /> Rotation
        </legend>
        {!isWheel(device) && (
          <div className="facing" role="group" aria-label="Point the sensor">
            {(Object.keys(FACINGS) as Facing[]).map((facing) => {
              const Icon = FACING_ICONS[facing];
              return (
                <button
                  key={facing}
                  className={`facing-${facing.toLowerCase()}`}
                  aria-pressed={findFacing(device) === facing}
                  onClick={() => onChange(facingToRotation(facing))}
                >
                  <Icon size={14} aria-hidden /> {facing}
                </button>
              );
            })}
            <Bot className="facing-robot" size={20} aria-hidden />
          </div>
        )}
        {(['x', 'y', 'z'] as const).map((axis) => (
          <SliderField
            key={axis}
            label="Rotation"
            axis={axis}
            value={euler[axis]}
            min={-180}
            max={180}
            step={0.1}
            unit="°"
            onChange={(value) => setEuler(axis, value)}
          />
        ))}
      </fieldset>

      <details className="advanced">
        <summary>
          <SlidersHorizontal size={13} /> Angle-axis values
        </summary>
        <div className="angle-axis">
          {ANGLE_AXIS_FIELDS.map(({ field, label }) => (
            <label className="field" key={field}>
              <span className="field-label">{label}</span>
              <NumberField
                label={label}
                value={device[field]}
                step={0.01}
                onChange={(value) => onChange({ [field]: value })}
              />
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
