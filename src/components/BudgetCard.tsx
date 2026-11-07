import { ArrowRight, CircleCheck, Lock, Plus, TriangleAlert, Wallet } from 'lucide-react';
import { BUDGET } from '../robot/catalog';
import type { CostBreakdown } from '../robot/device';
import { CATEGORY_ICONS } from './icons';

const CATEGORIES: { key: keyof CostBreakdown; label: string }[] = [
  { key: 'wheels', label: 'Wheels' },
  { key: 'distance', label: 'Distance' },
  { key: 'sensors', label: 'Sensors' },
  { key: 'cameras', label: 'Cameras' },
];

const format = (value: number) => value.toLocaleString('en');

export interface CostPreview {
  label: string;
  cost: number;
}

interface BudgetCardProps {
  cost: number;
  breakdown: CostBreakdown;
  preview: CostPreview | null;
}

/** What the budget means right now. Numbers do the talking for a preview. */
function Status({ cost, preview }: Pick<BudgetCardProps, 'cost' | 'preview'>) {
  const remaining = BUDGET - cost;
  if (preview) {
    const after = remaining - preview.cost;
    return (
      <>
        {after < 0 ? <TriangleAlert size={14} /> : <Plus size={14} />}
        <span>
          {preview.label} −{format(preview.cost)}
        </span>
        <ArrowRight size={14} />
        <b>{after < 0 ? `${format(-after)} over` : `${format(after)} left`}</b>
      </>
    );
  }
  if (remaining < 0) {
    return (
      <>
        <Lock size={14} />
        <span>Remove {format(-remaining)} to export</span>
      </>
    );
  }
  return (
    <>
      <CircleCheck size={14} />
      <span>Stay within {format(BUDGET)} to export</span>
    </>
  );
}

export function BudgetCard({ cost, breakdown, preview }: BudgetCardProps) {
  const remaining = BUDGET - cost;
  const over = remaining < 0;
  const scale = Math.max(cost + (preview?.cost ?? 0), BUDGET);
  const percent = (value: number) => `${(value / scale) * 100}%`;
  const previewOver = preview !== null && preview.cost > remaining;

  return (
    <section className="budget" aria-label="Budget" data-over={over}>
      <div className="budget-head">
        <p className="budget-left">
          {over ? <TriangleAlert size={22} /> : <Wallet size={22} />}
          <strong>{format(Math.abs(remaining))}</strong> {over ? 'over budget' : 'left'}
        </p>
        <p className="budget-total">
          <span className="budget-used">{format(cost)}</span> / {format(BUDGET)} used
        </p>
      </div>

      <div
        className="budget-track"
        role="meter"
        aria-label="Budget used"
        aria-valuemin={0}
        aria-valuemax={BUDGET}
        aria-valuenow={Math.min(cost, BUDGET)}
      >
        {CATEGORIES.map(({ key }) => (
          <div
            key={key}
            className={`budget-segment budget-segment--${key}`}
            style={{ width: percent(breakdown[key]) }}
          />
        ))}
        {preview && (
          <div
            className="budget-segment budget-segment--preview"
            data-over={previewOver}
            style={{ width: percent(preview.cost) }}
          />
        )}
        {scale > BUDGET && <div className="budget-limit" style={{ left: percent(BUDGET) }} />}
      </div>

      <ul className="budget-legend">
        {CATEGORIES.map(({ key, label }) => {
          const Icon = CATEGORY_ICONS[key];
          return (
            <li key={key}>
              <Icon className={`budget-icon budget-icon--${key}`} size={13} />
              {label} <b>{format(breakdown[key])}</b>
            </li>
          );
        })}
      </ul>

      <p className="budget-status" data-warn={over || previewOver} role="status">
        <Status cost={cost} preview={preview} />
      </p>
    </section>
  );
}
