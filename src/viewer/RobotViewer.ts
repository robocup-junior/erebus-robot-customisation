import {
  ArrowHelper,
  BoxGeometry,
  CameraHelper,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Euler,
  ExtrudeGeometry,
  Group,
  GridHelper,
  HemisphereLight,
  type Material,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Scene,
  Shape,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import topTextureUrl from '../assets/textures/top.png';
import sensorTextureUrl from '../assets/textures/sensor.png';
import wheel1TextureUrl from '../assets/textures/wheel1.png';
import wheel2TextureUrl from '../assets/textures/wheel2.png';
import {
  type Device,
  type Devices,
  isCamera,
  isWheel,
  type Position,
  positionBounds,
  type Rotation,
} from '../robot/device';
import { quaternionToRotation, rotationToQuaternion } from '../robot/rotation';

export type TransformMode = 'translate' | 'rotate';
export type ViewName = 'iso' | 'top' | 'front' | 'side';

export interface ViewerCallbacks {
  onSelect(dictName: string | null): void;
  /** `dragId` is the same for all the changes of one gizmo drag. */
  onTransform(dictName: string, position: Position, rotation: Rotation, dragId: number): void;
}

interface Entry {
  model: Mesh;
  materials: MeshStandardMaterial[];
  label: CSS2DObject;
  frustum?: { camera: PerspectiveCamera; helper: CameraHelper };
}

const MM_PER_METRE = 1000;
const TARGET = new Vector3(0, 0.05, 0);
const VIEWS: Record<ViewName, Vector3> = {
  iso: new Vector3(1, 1, -1),
  // Front of the robot at the top of the screen, like a map.
  top: new Vector3(0, 1.9, 0.001),
  front: new Vector3(0, 0.25, -1.9),
  side: new Vector3(1.9, 0.25, 0),
};
const SELECTED_GLOW = new Color(0x2f6feb);
/** Pointer travel in pixels above which a press counts as a drag, not a click. */
const CLICK_TOLERANCE = 4;

function createAxes(): Group {
  const axes = new Group();
  const origin = new Vector3();
  axes.add(
    new ArrowHelper(new Vector3(1, 0, 0), origin, 0.1, 0xe5484d, 0.03, 0.03),
    new ArrowHelper(new Vector3(0, 1, 0), origin, 0.1, 0x30a46c, 0.03, 0.03),
    new ArrowHelper(new Vector3(0, 0, 1), origin, 0.1, 0x3e63dd, 0.03, 0.03),
  );
  return axes;
}

function createFrontIndicator(): Mesh {
  const width = 0.25;
  const length = 0.15;
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width / 2, -length);
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, { depth: 0.075, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2);
  const material = new MeshStandardMaterial({
    color: 0x33dd66,
    opacity: 0.6,
    transparent: true,
    side: DoubleSide,
  });
  const arrow = new Mesh(geometry, material);
  arrow.position.set(-width / 2, 0.2, -0.5);
  return arrow;
}

export class RobotViewer {
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(45, 1, 0.1, 200);
  private readonly renderer = new WebGLRenderer({ antialias: true, alpha: true });
  private readonly labelRenderer = new CSS2DRenderer();
  private readonly orbit: OrbitControls;
  private readonly transform: TransformControls;
  private readonly axes = createAxes();
  private readonly raycaster = new Raycaster();
  private readonly resizeObserver: ResizeObserver;
  private readonly textures: Record<'top' | 'sensor' | 'wheel1' | 'wheel2', Texture>;
  private readonly entries = new Map<string, Entry>();

  private showFrustums = false;
  private selected: string | null = null;
  private pressedAt: Vector2 | null = null;
  private frame = 0;
  private dragId = 0;

  constructor(
    private readonly container: HTMLElement,
    private readonly callbacks: ViewerCallbacks,
  ) {
    this.textures = {
      top: this.loadTexture(topTextureUrl),
      sensor: this.loadTexture(sensorTextureUrl),
      wheel1: this.loadTexture(wheel1TextureUrl),
      wheel2: this.loadTexture(wheel2TextureUrl),
    };

    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.append(this.renderer.domElement);

    const labels = this.labelRenderer.domElement;
    labels.className = 'scene-labels';
    container.append(labels);

    const canvas = this.renderer.domElement;
    this.orbit = new OrbitControls(this.camera, canvas);
    this.orbit.target.copy(TARGET);
    this.orbit.minDistance = 0.6;
    this.orbit.maxDistance = 8;
    this.orbit.addEventListener('change', this.requestRender);

    this.transform = new TransformControls(this.camera, canvas);
    this.transform.addEventListener('change', this.requestRender);
    this.transform.addEventListener('dragging-changed', (event) => {
      this.orbit.enabled = !event.value;
      if (event.value) this.dragId++;
    });
    this.transform.addEventListener('objectChange', this.onObjectChange);

    this.buildScene();
    this.setView('iso');

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(container);
    this.resize();
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    this.transform.detach();
    this.transform.dispose();
    this.orbit.dispose();
    for (const dictName of [...this.entries.keys()]) this.removeDevice(dictName);
    for (const texture of Object.values(this.textures)) texture.dispose();
    this.renderer.dispose();
    canvas.remove();
    this.labelRenderer.domElement.remove();
  }

  /** Makes the scene match the given devices. */
  sync(devices: Devices): void {
    for (const dictName of [...this.entries.keys()]) {
      if (!(dictName in devices)) this.removeDevice(dictName);
    }
    for (const device of Object.values(devices)) {
      const entry = this.entries.get(device.dictName) ?? this.addDevice(device);
      this.updateDevice(entry, device);
    }
    this.requestRender();
  }

  select(dictName: string | null): void {
    this.setGlow(this.selected, false);
    this.selected = dictName;
    this.setGlow(dictName, true);

    const entry = dictName ? this.entries.get(dictName) : undefined;
    if (entry) this.transform.attach(entry.model);
    else this.transform.detach();
    this.requestRender();
  }

  setMode(mode: TransformMode): void {
    this.transform.setMode(mode);
  }

  setShowFrustums(show: boolean): void {
    this.showFrustums = show;
    for (const { frustum } of this.entries.values()) {
      if (frustum) frustum.helper.visible = show;
    }
    this.requestRender();
  }

  setShowLabels(show: boolean): void {
    this.labelRenderer.domElement.style.display = show ? '' : 'none';
    this.requestRender();
  }

  setView(view: ViewName): void {
    this.orbit.target.copy(TARGET);
    this.camera.position.copy(VIEWS[view]);
    this.orbit.update();
    this.requestRender();
  }

  private loadTexture(url: string): Texture {
    const texture = new TextureLoader().load(url, this.requestRender);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }

  private buildScene(): void {
    const key = new DirectionalLight(0xffffff, 1.4);
    key.position.set(1, 2, -1.5);
    const grid = new GridHelper(3, 30, 0x8a93a3, 0x8a93a3);
    grid.position.y = -0.19;
    for (const material of [grid.material].flat() as Material[]) {
      material.transparent = true;
      material.opacity = 0.25;
    }
    this.scene.add(
      new HemisphereLight(0xffffff, 0x777777, 2.2),
      key,
      grid,
      this.axes,
      this.createBody(),
      createFrontIndicator(),
      this.transform.getHelper(),
    );
  }

  private createBody(): Mesh {
    const body = new Mesh(new CylinderGeometry(0.37, 0.37, 0.45, 96), [
      new MeshStandardMaterial({ color: 0xffffff, opacity: 0.4, transparent: true }),
      new MeshStandardMaterial({ map: this.textures.top }),
      new MeshStandardMaterial({ color: 0xffffff }),
    ]);
    body.position.copy(TARGET);
    return body;
  }

  private createWheel(): { model: Mesh; materials: MeshStandardMaterial[] } {
    const materials = [
      new MeshStandardMaterial({ color: 0x8d96a5, opacity: 0.6, transparent: true }),
      new MeshStandardMaterial({ map: this.textures.wheel1 }),
      new MeshStandardMaterial({ map: this.textures.wheel2 }),
    ];
    return { model: new Mesh(new CylinderGeometry(0.205, 0.205, 0.05, 64), materials), materials };
  }

  private createSensor(): { model: Mesh; materials: MeshStandardMaterial[] } {
    const side = new MeshStandardMaterial({ color: 0xf2f4f7 });
    const top = new MeshStandardMaterial({ map: this.textures.sensor });
    const faces = [side, side, side, side, top, side];
    return { model: new Mesh(new BoxGeometry(0.1, 0.1, 0.1), faces), materials: [side, top] };
  }

  private createFrustum(model: Mesh): Entry['frustum'] {
    const camera = new PerspectiveCamera(57.2958, 1, 0.05, 1.5);
    // Undo the default sensor rotation so a default camera looks at the front of the robot.
    camera.quaternion.setFromEuler(new Euler(-1.57, 0, 1.57)).invert();
    model.add(camera);
    const helper = new CameraHelper(camera);
    helper.visible = this.showFrustums;
    this.scene.add(helper);
    return { camera, helper };
  }

  private addDevice(device: Device): Entry {
    const { model, materials } = isWheel(device) ? this.createWheel() : this.createSensor();
    model.name = device.dictName;
    model.userData.device = { name: device.name };

    const element = document.createElement('div');
    element.className = 'scene-label';
    const label = new CSS2DObject(element);
    label.position.set(0, 0.05, 0);
    model.add(label);

    const entry: Entry = { model, materials, label };
    if (isCamera(device)) entry.frustum = this.createFrustum(model);
    this.scene.add(model);
    this.entries.set(device.dictName, entry);
    return entry;
  }

  private updateDevice(entry: Entry, device: Device): void {
    entry.label.element.textContent = device.customName;

    if (entry.frustum) {
      entry.frustum.camera.aspect = device.custom[0] / device.custom[1];
      entry.frustum.camera.updateProjectionMatrix();
    }

    // While dragging, the gizmo owns the transform. The device holds rounded values.
    if (this.transform.dragging && this.transform.object === entry.model) return;
    entry.model.position.set(device.x, device.y, device.z).divideScalar(MM_PER_METRE);
    entry.model.quaternion.copy(rotationToQuaternion(device));
  }

  private removeDevice(dictName: string): void {
    const entry = this.entries.get(dictName);
    if (!entry) return;
    if (this.transform.object === entry.model) this.transform.detach();

    entry.label.element.remove();
    this.scene.remove(entry.model);
    entry.model.geometry.dispose();
    for (const material of entry.materials) material.dispose();
    if (entry.frustum) {
      this.scene.remove(entry.frustum.helper);
      entry.frustum.helper.dispose();
    }
    this.entries.delete(dictName);
  }

  private setGlow(dictName: string | null, on: boolean): void {
    const entry = dictName ? this.entries.get(dictName) : undefined;
    entry?.label.element.classList.toggle('is-selected', on);
    for (const material of entry?.materials ?? []) {
      material.emissive.copy(SELECTED_GLOW);
      material.emissiveIntensity = on ? 0.45 : 0;
    }
  }

  private readonly onObjectChange = () => {
    const object: Object3D | undefined = this.transform.object;
    if (!object) return;

    const position = object.position.clone().multiplyScalar(MM_PER_METRE);
    const bounds = positionBounds(object.userData.device);
    position.set(
      Math.round(Math.min(bounds.x, Math.max(-bounds.x, position.x))),
      Math.round(Math.min(bounds.yMax, Math.max(bounds.yMin, position.y))),
      Math.round(Math.min(bounds.z, Math.max(-bounds.z, position.z))),
    );
    object.position.copy(position).divideScalar(MM_PER_METRE);

    this.callbacks.onTransform(
      object.name,
      { x: position.x, y: position.y, z: position.z },
      quaternionToRotation(new Quaternion().copy(object.quaternion)),
      this.dragId,
    );
  };

  private readonly onPointerDown = (event: PointerEvent) => {
    this.pressedAt = new Vector2(event.clientX, event.clientY);
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    const pressedAt = this.pressedAt;
    this.pressedAt = null;
    if (!pressedAt || this.transform.axis) return;
    const travel = pressedAt.distanceTo(new Vector2(event.clientX, event.clientY));
    if (travel > CLICK_TOLERANCE) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(pointer, this.camera);
    const models = [...this.entries.values()].map((entry) => entry.model);
    const hit = this.raycaster.intersectObjects(models, false)[0];
    this.callbacks.onSelect(hit ? hit.object.name : null);
  };

  private readonly resize = () => {
    const { clientWidth: width, clientHeight: height } = this.container;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
    this.requestRender();
  };

  private readonly requestRender = () => {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  };

  private render(): void {
    this.camera.updateMatrixWorld();
    this.scene.updateMatrixWorld();
    this.axes.position.copy(
      this.camera.localToWorld(new Vector3(0.6 * this.camera.aspect, -0.6, -2)),
    );
    for (const { frustum } of this.entries.values()) frustum?.helper.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }
}
