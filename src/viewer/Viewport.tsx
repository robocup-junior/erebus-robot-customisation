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
import type { Devices } from '../robot/device';
import { TYPING_TARGETS } from '../keyboard';
import {
  RobotViewer,
  type TransformMode,
  type ViewerCallbacks,
  type ViewName,
} from './RobotViewer';

const VIEWS: { id: ViewName; label: string }[] = [
  { id: 'iso', label: '3D' },
  { id: 'top', label: 'Top' },
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
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
    <section className="viewport" aria-label="Robot preview">
      <div className="viewport-stage" ref={stage} />

      <div className="viewport-bar viewport-bar--top">
        <div className="segmented" role="group" aria-label="Gizmo mode">
          <button aria-pressed={mode === 'translate'} onClick={() => setMode('translate')}>
            <Move3d size={16} /> Move <kbd>W</kbd>
          </button>
          <button aria-pressed={mode === 'rotate'} onClick={() => setMode('rotate')}>
            <Rotate3d size={16} /> Rotate <kbd>R</kbd>
          </button>
        </div>
        <div className="segmented" role="group" aria-label="Camera view">
          {VIEWS.map((view) => (
            <button key={view.id} onClick={() => viewer.current?.setView(view.id)}>
              <ViewIcon view={view.id} /> {view.label}
            </button>
          ))}
        </div>
      </div>

      <p className="viewport-hint" role="status">
        {selected ? (
          <>
            <ModeIcon size={15} />
            {mode === 'translate' ? 'Drag an arrow to move' : 'Drag a ring to rotate'}{' '}
            {selectedName || selected}
          </>
        ) : (
          <>
            <span>
              <MousePointerClick size={15} /> Click to edit
            </span>
            <span>
              <Orbit size={15} /> Drag to orbit
            </span>
            <span>
              <ZoomIn size={15} /> Scroll to zoom
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
            <Triangle size={12} fill="currentColor" aria-hidden /> Front of the robot
          </span>
        </p>
        <div className="viewport-toggles">
          <button
            className="chip"
            aria-pressed={labels}
            onClick={() => setLabels(!labels)}
          >
            <Tag size={14} /> Labels
          </button>
          <button
            className="chip"
            title="Estimate of the field of view in Webots"
            aria-pressed={frustums}
            onClick={() => setFrustums(!frustums)}
          >
            <Video size={14} /> Camera view
          </button>
        </div>
      </div>
    </section>
  );
}
