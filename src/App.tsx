import {
  CircleAlert,
  CircleCheck,
  Download,
  FileJson,
  Lock,
  Redo2,
  RotateCcw,
  Undo2,
  Upload,
} from 'lucide-react';
import { type DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import roboCupLogoUrl from './assets/images/robocup.png';
import { BudgetCard } from './components/BudgetCard';
import { ComponentPanel } from './components/ComponentPanel';
import { TYPING_TARGETS } from './keyboard';
import { BUDGET, DISTANCE_SENSOR_NAME, type SensorSpec } from './robot/catalog';
import {
  costBreakdown,
  createDistanceSensor,
  createSensor,
  type Device,
  type Devices,
  findNameProblems,
  numberedDevices,
  type Position,
  type Rotation,
  totalCost,
} from './robot/device';
import { createDefaultRobot, parseRobot, RobotFileError, serializeRobot } from './robot/robotFile';
import { useHistory } from './useHistory';
import { Viewport } from './viewer/Viewport';

const DEFAULT_FILE_NAME = 'MyAwesomeRobot';
const DRAFT_KEY = 'erebus-robot-customisation:draft';

interface Notice {
  text: string;
  error?: boolean;
  canUndo?: boolean;
}

function loadDraft(): { devices: Devices; fileName: string } | null {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
    if (!draft) return null;
    return { devices: parseRobot(draft.robot).devices, fileName: String(draft.fileName) };
  } catch {
    return null;
  }
}

function saveDraft(devices: Devices, fileName: string) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ robot: serializeRobot(devices), fileName }));
  } catch {
    // Storage can be unavailable or full. The draft is only a convenience.
  }
}

function download(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function without(devices: Devices, dictName: string): Devices {
  const { [dictName]: _removed, ...others } = devices;
  return others;
}

export function App() {
  const [initial] = useState(loadDraft);
  const history = useHistory<Devices>(() => initial?.devices ?? createDefaultRobot());
  const { value: devices, set: setDevices, undo, redo } = history;
  const [fileName, setFileName] = useState(initial?.fileName ?? DEFAULT_FILE_NAME);
  const [selection, setSelection] = useState<string | null>(null);
  const [hovered, setHovered] = useState<SensorSpec | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dropping, setDropping] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // The robot as last loaded (the default robot or an imported file). Like the previous
  // version, a distance sensor that is added back starts from its values in this robot.
  const loadedRobot = useRef<Devices>(createDefaultRobot());

  // Undo can remove the selected device and redo can bring it back.
  const selected = selection !== null && selection in devices ? selection : null;
  const cost = totalCost(devices);
  const overBudget = cost > BUDGET;
  const preview = hovered && !(hovered.dictName in devices) ? hovered : null;

  useEffect(() => saveDraft(devices, fileName), [devices, fileName]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest(TYPING_TARGETS)) return;
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === 'z' && !event.shiftKey) undo();
      else if (key === 'y' || (key === 'z' && event.shiftKey)) redo();
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  const updateDevice = useCallback(
    (dictName: string, patch: Partial<Device>) => {
      const fields = Object.keys(patch).join();
      setDevices(
        (current) =>
          current[dictName]
            ? { ...current, [dictName]: { ...current[dictName], ...patch } }
            : current,
        { key: `${dictName}:${fields}` },
      );
    },
    [setDevices],
  );

  const onTransform = useCallback(
    (dictName: string, position: Position, rotation: Rotation, dragId: number) => {
      setDevices(
        (current) => ({
          ...current,
          [dictName]: { ...current[dictName], ...position, ...rotation },
        }),
        { key: `drag:${dragId}`, anyTime: true },
      );
    },
    [setDevices],
  );

  const toggleSensor = (spec: SensorSpec) => {
    if (spec.dictName in devices) {
      setDevices((current) => without(current, spec.dictName));
    } else {
      setDevices((current) => ({ ...current, [spec.dictName]: createSensor(spec) }));
      setSelection(spec.dictName);
    }
  };

  const setDistanceCount = (count: number) => {
    const sensors = numberedDevices(devices, DISTANCE_SENSOR_NAME);
    if (count < sensors.length) {
      const { dictName } = sensors[sensors.length - 1];
      setDevices((current) => without(current, dictName));
      return;
    }
    let index = 1;
    while (`${DISTANCE_SENSOR_NAME} ${index}` in devices) index++;
    const dictName = `${DISTANCE_SENSOR_NAME} ${index}`;
    const sensor = loadedRobot.current[dictName] ?? createDistanceSensor(index);
    setDevices((current) => ({ ...current, [sensor.dictName]: sensor }));
    setSelection(sensor.dictName);
  };

  const exportRobot = () => {
    if (overBudget) {
      const excess = (cost - BUDGET).toLocaleString('en');
      setNotice({ text: `${excess} over budget. Remove some components to export.`, error: true });
      return;
    }
    const [problem] = Object.entries(findNameProblems(devices));
    if (problem) {
      const [dictName, message] = problem;
      setSelection(dictName);
      setNotice({ text: `${dictName}: ${message}`, error: true });
      return;
    }
    const name = `${fileName || DEFAULT_FILE_NAME}.json`;
    download(name, serializeRobot(devices));
    setNotice({ text: `Exported ${name}.` });
  };

  const importFile = async (file: File) => {
    try {
      const robot = parseRobot(await file.text());
      setDevices(() => robot.devices);
      loadedRobot.current = robot.devices;
      setFileName(file.name.replace(/\.json$/i, ''));
      setSelection(null);
      const ignored = robot.ignored.length ? ` Ignored: ${robot.ignored.join(', ')}.` : '';
      setNotice({ text: `Imported ${file.name}.${ignored}`, canUndo: true });
    } catch (error) {
      if (!(error instanceof RobotFileError)) throw error;
      setNotice({ text: `${file.name}: ${error.message}`, error: true });
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDropping(false);
    const file = event.dataTransfer.files[0];
    if (file) void importFile(file);
  };

  const resetRobot = () => {
    setDevices(createDefaultRobot);
    loadedRobot.current = createDefaultRobot();
    setFileName(DEFAULT_FILE_NAME);
    setSelection(null);
    setNotice({ text: 'Reset to the default robot.', canUndo: true });
  };

  return (
    <div
      className="app"
      onDragOver={(event) => {
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(event) => {
        if (event.relatedTarget === null) setDropping(false);
      }}
      onDrop={onDrop}
    >
      <header className="header">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" />
          <h1>Erebus Robot Customisation</h1>
        </div>
        <div className="file-actions">
          <div className="icon-group">
            <button
              className="button button--icon"
              aria-label="Undo"
              title="Undo (Ctrl/⌘ Z)"
              disabled={!history.canUndo}
              onClick={undo}
            >
              <Undo2 size={16} />
            </button>
            <button
              className="button button--icon"
              aria-label="Redo"
              title="Redo (Ctrl/⌘ Shift Z)"
              disabled={!history.canRedo}
              onClick={redo}
            >
              <Redo2 size={16} />
            </button>
            <button
              className="button button--icon"
              aria-label="Reset to the default robot"
              title="Reset to the default robot"
              onClick={resetRobot}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <button
            className="button"
            title="Or drop a robot file anywhere"
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={16} /> Import
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label="Robot file"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void importFile(file);
            }}
          />
          <div className="file-name">
            <input
              aria-label="File name"
              value={fileName}
              spellCheck={false}
              onChange={(event) => setFileName(event.target.value)}
            />
            <span>.json</span>
          </div>
          <button
            className="button button--primary"
            aria-disabled={overBudget}
            onClick={exportRobot}
          >
            {overBudget ? <Lock size={16} /> : <Download size={16} />} Export
          </button>
        </div>
      </header>

      <main className="workspace">
        <Viewport
          devices={devices}
          selected={selected}
          selectedName={selected ? devices[selected].customName : undefined}
          onSelect={setSelection}
          onTransform={onTransform}
        />
        <aside className="sidebar" aria-label="Components">
          <BudgetCard
            cost={cost}
            breakdown={costBreakdown(devices)}
            preview={preview && { label: preview.label, cost: preview.cost }}
          />
          <ComponentPanel
            devices={devices}
            selected={selected}
            remaining={BUDGET - cost}
            onSelect={setSelection}
            onToggleSensor={toggleSensor}
            onPreview={setHovered}
            onDistanceCountChange={setDistanceCount}
            onChange={updateDevice}
          />
          <footer className="compat">
            <small>© 2020–2026 Erebus Development Team</small>
            <img src={roboCupLogoUrl} alt="RoboCupJunior Rescue" />
          </footer>
        </aside>
      </main>

      {dropping && (
        <div className="drop-overlay">
          <p>
            <FileJson size={32} aria-hidden />
            Drop a robot file to import it
          </p>
        </div>
      )}

      <div className="toast-region" role="status" aria-live="polite">
        {notice && (
          <div className="toast" data-error={notice.error === true}>
            {notice.error ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
            <span className="toast-text">{notice.text}</span>
            {notice.canUndo && (
              <button
                className="toast-action"
                onClick={() => {
                  undo();
                  setNotice(null);
                }}
              >
                <Undo2 size={16} /> Undo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
