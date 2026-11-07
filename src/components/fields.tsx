import { useId, useState } from 'react';

interface NumberFieldProps {
  value: number;
  onChange(value: number): void;
  label: string;
  min?: number;
  max?: number;
  step: number;
}

/** Keeps what the user is typing, so that "-" or "1." aren't overwritten mid-edit. */
export function NumberField({ value, onChange, label, min, max, step }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const change = (text: string) => {
    setDraft(text);
    const number = Number(text);
    const inRange = (min === undefined || number >= min) && (max === undefined || number <= max);
    if (text.trim() !== '' && Number.isFinite(number) && inRange) onChange(number);
  };

  return (
    <input
      className="number-input"
      type="number"
      aria-label={label}
      value={draft ?? value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => change(event.target.value)}
      onBlur={() => setDraft(null)}
    />
  );
}

interface SliderFieldProps {
  label: string;
  axis: 'x' | 'y' | 'z';
  value: number;
  onChange(value: number): void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export function SliderField({ label, axis, value, onChange, min, max, step, unit }: SliderFieldProps) {
  const id = useId();
  return (
    <div className="slider-field">
      <label className={`axis axis--${axis}`} htmlFor={id}>
        {axis.toUpperCase()}
      </label>
      <input
        id={id}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <NumberField
        label={`${label} ${axis.toUpperCase()}`}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
      />
      <span className="unit">{unit}</span>
    </div>
  );
}
