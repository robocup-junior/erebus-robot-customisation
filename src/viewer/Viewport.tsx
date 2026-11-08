import {
  MousePointerClick,
  Move3d,
  Orbit,
  Rotate3d,
  Tag,
  Triangle,
  Video,
  ZoomIn,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ViewIcon } from '../components/icons';
import { useI18n } from '../i18n/I18n';
import type { MessageKey } from '../i18n/messages/en';
import type { Devices } from '../robot/device';
import { TYPING_TARGETS } from '../keyboard';
import {
  RobotViewer,
  type TransformMode,
  type ViewerCallbacks,
  type ViewName,
} from './RobotViewer';

const VIEWS: { id: ViewName; label: MessageKey }[] = [
  { id: 'iso', label: 'view3d' },
  { id: 'top', label: 'viewTop' },
  { id: 'front', label: 'viewFront' },
  { id: 'side', label: 'viewSide' },
];

interface ViewportProps {
  devices: Devices;
  selected: string | null;
  selectedName?: string;
  onSelect(dictName: string | null): void;
  onTransform: ViewerCallbacks['onTransform'];
}

export function Viewport({
  devices,
  selected,
  selectedName,
  onSelect,
  onTransform,
}: ViewportProps) {
  const { t } = useI18n();
  const stage = useRef<HTMLDivElement>(null);
  const viewer = useRef<RobotViewer | null>(null);
  const callbacks = useRef({ onSelect, onTransform });
  const [mode, setMode] = useState<TransformMode>('translate');
  const [frustums, setFrustums] = useState(false);
  const [labels, setLabels] = useState(true);

  useEffect(() => {
    callbacks.current = { onSelect, onTransform };
  });

  useEffect(() => {
    const instance = new RobotViewer(stage.current!, {
      onSelect: (dictName) => callbacks.current.onSelect(dictName),
      onTransform: (...args) => callbacks.current.onTransform(...args),
    });
    viewer.current = instance;
    return () => instance.dispose();
  }, []);

  useEffect(() => {
    viewer.current?.sync(devices);
  }, [devices]);
  useEffect(() => viewer.current?.select(selected), [selected]);
  useEffect(() => viewer.current?.setMode(mode), [mode]);
  useEffect(() => viewer.current?.setShowFrustums(frustums), [frustums]);
  useEffect(() => viewer.current?.setShowLabels(labels), [labels]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(TYPING_TARGETS)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'w' || event.key === 'W') setMode('translate');
      if (event.key === 'r' || event.key === 'R') setMode('rotate');
      if (event.key === 'Escape') callbacks.current.onSelect(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const ModeIcon = mode === 'translate' ? Move3d : Rotate3d;

  return (
    <section className="viewport" aria-label={t('robotPreview')}>
      <div className="viewport-stage" ref={stage} />

      <div className="viewport-bar viewport-bar--top">
        {/* The modes change the gizmo of the selected component, so they only show with one. */}
        {selected ? (
          <div className="segmented" role="group" aria-label={t('gizmoMode')}>
            <button aria-pressed={mode === 'translate'} onClick={() => setMode('translate')}>
              <Move3d size={16} /> {t('move')} <kbd>W</kbd>
            </button>
            <button aria-pressed={mode === 'rotate'} onClick={() => setMode('rotate')}>
              <Rotate3d size={16} /> {t('rotate')} <kbd>R</kbd>
            </button>
          </div>
        ) : (
          <span />
        )}
        <div className="segmented" role="group" aria-label={t('views')}>
          {VIEWS.map((view) => (
            <button key={view.id} onClick={() => viewer.current?.setView(view.id)}>
              <ViewIcon view={view.id} /> {t(view.label)}
            </button>
          ))}
        </div>
      </div>

      <p className="viewport-hint" role="status">
        {selected ? (
          <>
            <ModeIcon size={15} />
            {t(mode === 'translate' ? 'dragToMove' : 'dragToRotate', {
              name: selectedName || selected,
            })}
          </>
        ) : (
          <>
            <span>
              <MousePointerClick size={15} /> {t('clickToEdit')}
            </span>
            <span>
              <Orbit size={15} /> {t('dragToOrbit')}
            </span>
            <span>
              <ZoomIn size={15} /> {t('scrollToZoom')}
            </span>
          </>
        )}
      </p>

      <div className="viewport-bar viewport-bar--bottom">
        <p className="legend">
          <span className="axis axis--x">X</span>
          <span className="axis axis--y">Y</span>
          <span className="axis axis--z">Z</span>
          <span className="legend-front">
            <Triangle size={12} fill="currentColor" aria-hidden /> {t('frontOfRobot')}
          </span>
        </p>
        <div className="viewport-toggles">
          <button
            className="chip"
            aria-pressed={labels}
            onClick={() => setLabels(!labels)}
          >
            <Tag size={14} /> {t('labels')}
          </button>
          <button
            className="chip"
            title={t('fieldOfViewHint')}
            aria-pressed={frustums}
            onClick={() => setFrustums(!frustums)}
          >
            <Video size={14} /> {t('fieldOfView')}
          </button>
        </div>
      </div>
    </section>
  );
}
