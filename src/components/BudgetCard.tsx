import { ArrowRight, CircleCheck, Lock, Plus, TriangleAlert, Wallet } from 'lucide-react';
import { useI18n } from '../i18n/I18n';
import type { MessageKey } from '../i18n/messages/en';
import { BUDGET } from '../robot/catalog';
import type { CostBreakdown } from '../robot/device';
import { CATEGORY_ICONS } from './icons';

const CATEGORIES: { key: keyof CostBreakdown; label: MessageKey }[] = [
  { key: 'wheels', label: 'categoryWheels' },
  { key: 'distance', label: 'categoryDistance' },
  { key: 'sensors', label: 'categorySensors' },
  { key: 'cameras', label: 'categoryCameras' },
];

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
  const { t, number: format } = useI18n();
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
        <b>
          {after < 0
            ? t('previewOver', { amount: format(-after) })
            : t('previewLeft', { amount: format(after) })}
        </b>
      </>
    );
  }
  if (remaining < 0) {
    return (
      <>
        <Lock size={14} />
        <span>{t('removeToExport', { amount: format(-remaining) })}</span>
      </>
    );
  }
  return (
    <>
      <CircleCheck size={14} />
      <span>{t('stayWithin', { amount: format(BUDGET) })}</span>
    </>
  );
}

export function BudgetCard({ cost, breakdown, preview }: BudgetCardProps) {
  const { t, rich, number: format } = useI18n();
  const remaining = BUDGET - cost;
  const over = remaining < 0;
  const scale = Math.max(cost + (preview?.cost ?? 0), BUDGET);
  const percent = (value: number) => `${(value / scale) * 100}%`;
  const previewOver = preview !== null && preview.cost > remaining;

  return (
    <section className="budget" aria-label={t('budget')} data-over={over}>
      <div className="budget-head">
        <p className="budget-left">
          {over ? <TriangleAlert size={22} /> : <Wallet size={22} />}
          <span>
            {rich(over ? 'budgetOver' : 'budgetLeft', {
              amount: <strong>{format(Math.abs(remaining))}</strong>,
            })}
          </span>
        </p>
        <p className="budget-total">
          {rich('budgetUsed', {
            used: <span className="budget-used">{format(cost)}</span>,
            total: format(BUDGET),
          })}
        </p>
      </div>

      <div
        className="budget-track"
        role="meter"
        aria-label={t('budgetMeter')}
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
              {t(label)} <b>{format(breakdown[key])}</b>
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
