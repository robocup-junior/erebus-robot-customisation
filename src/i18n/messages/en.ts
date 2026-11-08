/**
 * English text, and the fallback for any text a language doesn't translate.
 * `{name}` is replaced with a value. Keep the placeholders when translating.
 */
export const en = {
  // Header
  undo: 'Undo',
  redo: 'Redo',
  reset: 'Reset to the default robot',
  import: 'Import',
  importHint: 'Or drop a robot file anywhere',
  robotFile: 'Robot file',
  fileName: 'File name',
  export: 'Export',
  language: 'Language',

  // Notices
  noticeOverBudget: '{amount} over budget. Remove some components to export.',
  noticeExported: 'Exported {file}.',
  noticeImported: 'Imported {file}.',
  noticeIgnored: 'Ignored: {keys}.',
  noticeReset: 'Reset to the default robot.',
  noticeProblem: '{subject}: {problem}',
  dropToImport: 'Drop a robot file to import it',

  // Robot file errors
  fileNotJson: 'This file is not valid JSON.',
  fileNotRobot: 'This file is not a robot file.',
  fileEmpty: 'This file does not contain any robot components.',
  fileUnknownComponent: '"{key}" is not a valid component.',
  fileInvalidValues: '"{key}" has a missing or invalid position or rotation.',

  // Budget
  budget: 'Budget',
  budgetLeft: '{amount} left',
  budgetOver: '{amount} over budget',
  budgetUsed: '{used} / {total} used',
  budgetMeter: 'Budget used',
  previewLeft: '{amount} left',
  previewOver: '{amount} over',
  removeToExport: 'Remove {amount} to export',
  stayWithin: 'Stay within {amount} to export',
  categoryWheels: 'Wheels',
  categoryDistance: 'Distance',
  categorySensors: 'Sensors',
  categoryCameras: 'Cameras',

  // Components
  components: 'Components',
  sensors: 'Sensors',
  cameras: 'Cameras',
  distanceSensors: 'Distance sensors',
  wheels: 'Wheels',
  costEach: '{cost} each',
  wheelsNote: 'required, {cost} each',
  distanceCount: 'Number of distance sensors',
  addDistance: 'Add a distance sensor',
  removeDistance: 'Remove a distance sensor',
  tooExpensive: 'More than you have left',
  unnamed: 'unnamed',
  gyro: 'Gyro',
  inertialUnit: 'Inertial unit',
  gps: 'GPS',
  camera: 'Camera {number}',
  colourSensor: 'Colour sensor',
  accelerometer: 'Accelerometer',
  lidar: 'Lidar',
  distanceSensor: 'Distance Sensor {number}',
  wheel: 'Wheel {number}',

  // Inspector
  name: 'Name',
  nameRequired: 'A name is required.',
  nameDuplicate: '"{name}" is already used by another component.',
  inController: 'In your controller:',
  resolution: 'Resolution',
  width: 'Width',
  height: 'Height',
  position: 'Position',
  rotation: 'Rotation',
  pointSensor: 'Point the sensor',
  facingFront: 'Front',
  facingBack: 'Back',
  facingLeft: 'Left',
  facingRight: 'Right',
  facingUp: 'Up',
  facingDown: 'Down',
  angleAxis: 'Angle-axis values',
  angle: 'angle',

  // 3D view
  robotPreview: 'Robot preview',
  gizmoMode: 'Gizmo mode',
  move: 'Move',
  rotate: 'Rotate',
  views: 'Camera view',
  view3d: '3D',
  viewTop: 'Top',
  viewFront: 'Front',
  viewSide: 'Side',
  dragToMove: 'Drag an arrow to move {name}',
  dragToRotate: 'Drag a ring to rotate {name}',
  clickToEdit: 'Click to edit',
  dragToOrbit: 'Drag to orbit',
  scrollToZoom: 'Scroll to zoom',
  frontOfRobot: 'Front of the robot',
  labels: 'Labels',
  fieldOfView: 'Camera view',
  fieldOfViewHint: 'Estimate of the field of view in Webots',

  // Build information
  buildInfo: 'Build information',
  commit: 'Commit',
  branch: 'Branch',
  committed: 'Committed',
  built: 'Built',
  unknown: 'Unknown',
  uncommitted: '+ uncommitted changes',
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Partial<Record<MessageKey, string>>;
