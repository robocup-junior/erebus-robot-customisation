import { Component, OnInit, ViewChild, ElementRef, Input, DoCheck, Output, EventEmitter } from '@angular/core';

import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { Device } from '../device';


@Component({
  selector: 'app-threejs-render',
  templateUrl: './threejs-render.component.html',
  styleUrls: ['./threejs-render.component.css']
})
export class ThreejsRenderComponent implements OnInit {

  @Input() deviceUpdate: Device;
  @ViewChild('three') threeDiv: ElementRef;

  axesHelper: THREE.Group;
  deviceModels = {};
  scene = new THREE.Scene();

  control: TransformControls;
  showLables: boolean = true;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;

  textureW1: THREE.Texture;
  textureW2: THREE.Texture;
  sensor_texture: THREE.Texture;

  constructor() { }

  ngOnInit(): void {
    this.textureW1 = new THREE.TextureLoader().load("./../assets/textures/wheel1.png");
    this.textureW2 = new THREE.TextureLoader().load("./../assets/textures/wheel2.png");
    this.sensor_texture = new THREE.TextureLoader().load("./../assets/textures/sensor.png");
  }

  ngOnChanges(changes): void {
    let cv = changes.deviceUpdate.currentValue;
    if (cv == undefined)
      return;
    if (cv.type == "add") {
      this.addSelectedComponent(cv);
    } else if (cv.type == "sub") {
      this.destoryDevice(cv);
    } else {
      this.createThreeModel(cv);
    }
  }

  // Create THREE.js view
  ngAfterViewInit(): void {

    let body = this;

    let width_ratio = 3.2;
    let height_ratio = 2.16;

    init();
    animate();

    function createAxisArrow(dir: THREE.Vector3, color: THREE.Color): THREE.ArrowHelper {
      return new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 0.1, color, 0.03, 0.03);
    }

    function initAxisHelper(): THREE.Group {
      const axisGroup = new THREE.Group();
      const x = createAxisArrow(new THREE.Vector3(1, 0, 0), new THREE.Color(1, 0, 0));
      const y = createAxisArrow(new THREE.Vector3(0, 1, 0), new THREE.Color(0, 1, 0));
      const z = createAxisArrow(new THREE.Vector3(0, 0, 1), new THREE.Color(0, 0, 1));

      axisGroup.add(x);
      axisGroup.add(y);
      axisGroup.add(z);
      return axisGroup;
    }

    function createRobot(): THREE.Mesh {
      const geometry = new THREE.CylinderGeometry(0.37, 0.37, 0.45, 100);
      const texture = new THREE.TextureLoader().load("./../assets/textures/top.png");
      texture.rotation = 0;
      const top_material = new THREE.MeshPhongMaterial({ map: texture });
      const side_material = new THREE.MeshPhongMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
      const bot_material = new THREE.MeshPhongMaterial({ color: 0xffffff });
      const materials = [side_material, top_material, bot_material]
      const robotModel = new THREE.Mesh(geometry, materials);
      robotModel.position.set(0, 0.05, 0);
      return robotModel;
    }

    function initLabelRenderer(): CSS2DRenderer {
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize((window.innerWidth / width_ratio), (window.innerHeight / height_ratio));
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0px';
      labelRenderer.domElement.style.display = 'block';
      return labelRenderer;
    }

    function init(): void {

      body.camera = new THREE.PerspectiveCamera(45, (window.innerWidth / width_ratio) / (window.innerHeight / height_ratio), 0.1, 200);
      body.camera.position.set(1, 1, 1);

      const skyColor = 0xFFFFFF;  // light blue
      const groundColor = 0x000000;  // brownish orange
      const intensity = 1;

      const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);

      body.scene.add(light);

      body.axesHelper = initAxisHelper();
      body.scene.add(body.axesHelper);

      const robotModel = createRobot();
      body.scene.add(robotModel);

      body.renderer = new THREE.WebGLRenderer();
      body.renderer.setPixelRatio(window.devicePixelRatio);
      body.renderer.setSize((window.innerWidth / width_ratio), (window.innerHeight / height_ratio));
      body.threeDiv.nativeElement.appendChild(body.renderer.domElement);

      body.labelRenderer = initLabelRenderer();
      body.threeDiv.nativeElement.appendChild(body.labelRenderer.domElement);

      body.controls = new OrbitControls(body.camera, body.labelRenderer.domElement);

      window.addEventListener('resize', onWindowResize, false);

    }

    function onWindowResize(): void {
      body.camera.aspect = (window.innerWidth / width_ratio) / (window.innerHeight / height_ratio);
      body.camera.updateProjectionMatrix();
      body.renderer.setSize((window.innerWidth / width_ratio), (window.innerHeight / height_ratio));
      body.labelRenderer.setSize((window.innerWidth / width_ratio), (window.innerHeight / height_ratio));
    }

    function animate(): void {
      requestAnimationFrame(animate);
      body.labelRenderer.render(body.scene, body.camera);
      const axesPos = body.camera.localToWorld(new THREE.Vector3(0.6 * body.camera.aspect, -0.6, -2));
      body.axesHelper.position.copy(axesPos);
      body.renderer.render(body.scene, body.camera);
    }

  }

  destoryDevice(device: Device): void {
    var body = this;
    document.getElementById(device.dictName).remove();
    body.scene.remove(this.deviceModels[device.dictName]);
    delete this.deviceModels[device.dictName];
  }

  createLabel(id: string, text: string): CSS2DObject {
    const labelDiv = document.createElement('div');
    labelDiv.id = id;
    labelDiv.textContent = text;
    labelDiv.style.marginTop = '-1em';
    labelDiv.style.color = 'rgb(255, 255, 255)';
    labelDiv.style.padding = '2px';
    labelDiv.style.background = 'rgba(0, 0, 0, 0.6)';
    const deviceLabel = new CSS2DObject(labelDiv);
    deviceLabel.position.set(0, 0.05, 0);
    return deviceLabel;
  }

  createWheel(): THREE.Mesh {
    const wheel_geometry = new THREE.CylinderGeometry(0.205, 0.205, 0.05, 100);
    const wheel_material_side1 = new THREE.MeshPhongMaterial({ map: this.textureW1 });
    const wheel_material_side2 = new THREE.MeshPhongMaterial({ map: this.textureW2 });
    const wheel_material_bot = new THREE.MeshPhongMaterial({ color: 0xfffffff, opacity: 0.5, transparent: true });

    const materials = [wheel_material_bot, wheel_material_side1, wheel_material_side2]
    return new THREE.Mesh(wheel_geometry, materials);
  }

  createSensor(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material_top = new THREE.MeshPhongMaterial({ map: this.sensor_texture });
    const material_side = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const materials = [material_side, material_side, material_side, material_side, material_top, material_side]

    return new THREE.Mesh(geometry, materials);
  }

  createThreeModel(device: Device): void {
    let body = this;
    let model = null;
    let dictName = device.dictName;
    if (device.name == "Wheel") {
      model = this.createWheel();
    }
    else {
      model = this.createSensor();
    }
    if (model != null) {
      if (this.deviceModels[dictName] == undefined) {
        const deviceLabel = this.createLabel(device.dictName, device.customName);
        model.add(deviceLabel);
        model.name = dictName;
        this.deviceModels[dictName] = model;
        body.scene.add(this.deviceModels[dictName]);
      }

      var eulerRot = new THREE.Euler(0, 0, 0);
      var rotationVector = new THREE.Vector3(device.rx, device.rz, device.ry);
      this.deviceModels[dictName].rotation.set(eulerRot.x, eulerRot.z, eulerRot.y);
      this.deviceModels[dictName].rotateOnAxis(rotationVector.normalize(), device.a);
      this.deviceModels[dictName].position.set(device.x / 1000, device.y / 1000, device.z / 1000);

      // Update label name
      this.deviceModels[dictName].children[0].element.innerHTML = device.customName;
    }
  }

  addSelectedComponent(device: Device): void {
    if (device.type == "sub" || device.type == 'modelSub') {
      this.destoryDevice(device);
      return;
    }
    this.createThreeModel(device);
  }

}
