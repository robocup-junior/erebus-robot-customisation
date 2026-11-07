import {
  Camera,
  Compass,
  Cpu,
  Disc3,
  Gauge,
  type LucideIcon,
  MapPin,
  Orbit,
  Palette,
  Radar,
  Ruler,
} from 'lucide-react';
import type { CostBreakdown } from '../robot/device';
import type { ViewName } from '../viewer/RobotViewer';

const SENSOR_ICONS: Record<string, LucideIcon> = {
  gyro: Orbit,
  iu: Compass,
  gps: MapPin,
  camera1: Camera,
  camera2: Camera,
  camera3: Camera,
  colsensor: Palette,
  acc: Gauge,
  lidar: Radar,
};

export const sensorIcon = (dictName: string) => SENSOR_ICONS[dictName] ?? Cpu;

export const WheelIcon = Disc3;
export const DistanceIcon = Ruler;

export const CATEGORY_ICONS: Record<keyof CostBreakdown, LucideIcon> = {
  wheels: WheelIcon,
  distance: DistanceIcon,
  sensors: Cpu,
  cameras: Camera,
};

/** Which faces of the cube are highlighted for each camera view. */
const VIEW_FACES: Record<ViewName, ('top' | 'left' | 'right')[]> = {
  iso: ['top', 'left', 'right'],
  top: ['top'],
  front: ['left'],
  side: ['right'],
};

const FACES = {
  top: 'M12 3 20 7.5 12 12 4 7.5Z',
  left: 'M4 7.5 12 12v9l-8-4.5Z',
  right: 'M20 7.5 12 12v9l8-4.5Z',
};

/** A cube with the visible side of the robot filled in. */
export function ViewIcon({ view }: { view: ViewName }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      {Object.entries(FACES).map(([face, path]) => (
        <path
          key={face}
          d={path}
          fill={VIEW_FACES[view].includes(face as 'top') ? 'currentColor' : 'none'}
          fillOpacity={view === 'iso' ? 0.25 : 0.9}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
