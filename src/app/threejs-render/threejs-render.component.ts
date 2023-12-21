import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';

import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Device } from '../device';


@Component({
  selector: 'app-threejs-render',
  templateUrl: './threejs-render.component.html',
  styleUrls: ['./threejs-render.component.css']
})
export class ThreejsRenderComponent implements OnInit {

  @Input() deviceUpdate: Device;
  @Input() showFrustums;
  @ViewChild('three') threeDiv: ElementRef;

  @Output() deviceOutput = new EventEmitter<any>();

  width_ratio = 3.2;
  height_ratio = 2.16;

  max_clamp = new THREE.Vector3(0.370, 0.370, 0.370);
  min_clamp = new THREE.Vector3(-0.370, -0.100, -0.370);

  max_clamp_wheel = new THREE.Vector3(0.370, 0.370, 0.260);
  min_clamp_wheel = new THREE.Vector3(-0.370, -0.100, -0.260);

  axesHelper: THREE.Group;
  deviceModels = {};
  deviceFrustums = {};
  scene = new THREE.Scene();

  transformControl: TransformControls;
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  showLables: boolean = true;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;

  textureW1: THREE.Texture;
  textureW2: THREE.Texture;
  sensor_texture: THREE.Texture;
  down: boolean = false;

  showFrustum = false;

  constructor() { }

  ngOnInit(): void {
    this.textureW1 = new THREE.TextureLoader().load("./../assets/textures/wheel1.png");
    this.textureW2 = new THREE.TextureLoader().load("./../assets/textures/wheel2.png");
    this.sensor_texture = new THREE.TextureLoader().load("./../assets/textures/sensor.png");
  }

  ngOnChanges(changes): void {
    if (changes.deviceUpdate != undefined) {
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
  }

  toggleFrustums($event) {
    for (let device of Object.keys(this.deviceFrustums)) {
      this.deviceFrustums[device][1].visible = $event.checked;
    }
    this.showFrustum = $event.checked;
  }

  // Create THREE.js view
  ngAfterViewInit(): void {

    let body = this;

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

    function createFrontIndicator(): THREE.Mesh {
      const width = 0.25;
      const length = 0.15;
      const thickness = 0.075;

      const triTop = new THREE.Triangle(new THREE.Vector3(0,0,0), 
                                          new THREE.Vector3(width,0,0),
                                          new THREE.Vector3(width / 2,0,-length));
      const triBot = new THREE.Triangle(new THREE.Vector3(0,-thickness,0), 
                                          new THREE.Vector3(width,-thickness,0),
                                          new THREE.Vector3(width / 2,-thickness,-length));
      const geometry = new THREE.Geometry();
      geometry.vertices.push(triTop.a);
      geometry.vertices.push(triTop.b);
      geometry.vertices.push(triTop.c);
      
      geometry.vertices.push(triBot.a);
      geometry.vertices.push(triBot.b);
      geometry.vertices.push(triBot.c);

      // Top and bot
      geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
      geometry.faces.push( new THREE.Face3( 4, 3, 5 ) );

      // Left side
      geometry.faces.push( new THREE.Face3( 0, 2, 3 ) );
      geometry.faces.push( new THREE.Face3( 2, 5, 3 ) );

      // Right side
      geometry.faces.push( new THREE.Face3( 2, 1, 5 ) );
      geometry.faces.push( new THREE.Face3( 1, 4, 5 ) );

      // Back side
      geometry.faces.push( new THREE.Face3( 0, 4, 1 ) );
      geometry.faces.push( new THREE.Face3( 3, 4, 0 ) );

      geometry.computeFaceNormals();
      const material = new THREE.MeshPhongMaterial({ color: 0x33ff33, opacity: 0.5, transparent: true  });
      const arrowModel = new THREE.Mesh(geometry, material);
      arrowModel.position.set(-width/2, 0.2, -0.5)
      return arrowModel;
    }

    function initLabelRenderer(): CSS2DRenderer {
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize((window.innerWidth / body.width_ratio), (window.innerHeight / body.height_ratio));
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0px';
      labelRenderer.domElement.style.display = 'block';
      return labelRenderer;
    }

    function init(): void {

      body.camera = new THREE.PerspectiveCamera(45, (window.innerWidth / body.width_ratio) / (window.innerHeight / body.height_ratio), 0.1, 200);
      body.camera.position.set(1, 1, -1);

      const skyColor = 0xFFFFFF;
      const groundColor = 0x000000;
      const intensity = 1;

      const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);

      body.scene.add(light);

      body.axesHelper = initAxisHelper();
      body.scene.add(body.axesHelper);

      const robotModel = createRobot();
      body.scene.add(robotModel);

      const frontArrow = createFrontIndicator();
      body.scene.add(frontArrow);

      body.renderer = new THREE.WebGLRenderer();
      body.renderer.setPixelRatio(window.devicePixelRatio);
      body.renderer.setSize((window.innerWidth / body.width_ratio), (window.innerHeight / body.height_ratio));
      body.threeDiv.nativeElement.appendChild(body.renderer.domElement);

      body.labelRenderer = initLabelRenderer();
      body.threeDiv.nativeElement.appendChild(body.labelRenderer.domElement);

      body.controls = new OrbitControls(body.camera, body.labelRenderer.domElement);
      body.controls.addEventListener("change", body.render.bind(body));

      body.transformControl = new TransformControls( body.camera, body.labelRenderer.domElement );
      body.transformControl.addEventListener( 'change', body.controlChange.bind(body) );
      body.transformControl.addEventListener( 'dragging-changed', function ( event ) {
          body.controls.enabled = ! event.value;
      }.bind(body));
      body.scene.add( body.transformControl );

      document.addEventListener( 'pointerdown', body.onPointerDown.bind(body) );
      window.addEventListener('resize', onWindowResize, false);


      window.addEventListener( 'keydown', function ( event ) {
        switch ( event.keyCode ) {
          case 87: // W
            body.transformControl.setMode( 'translate' );
            break;

          case 82: // R
            body.transformControl.setMode( 'rotate' );
            break;
        }
      }.bind(body));

    }

    function onWindowResize(): void {
      body.camera.aspect = (window.innerWidth / body.width_ratio) / (window.innerHeight / body.height_ratio);
      body.camera.updateProjectionMatrix();
      body.renderer.setSize((window.innerWidth / body.width_ratio), (window.innerHeight / body.height_ratio));
      body.labelRenderer.setSize((window.innerWidth / body.width_ratio), (window.innerHeight / body.height_ratio));
      body.renderer.render(body.scene, body.camera);
    }

    function animate(): void {
      requestAnimationFrame(animate);
      body.labelRenderer.render(body.scene, body.camera);
      const axesPos = body.camera.localToWorld(new THREE.Vector3(0.6 * body.camera.aspect, -0.6, -2));
      body.axesHelper.position.copy(axesPos);
      body.renderer.render(body.scene, body.camera);
    }

  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  controlChange() {
    this.render();
    if (!this.down) return;
    if (this.transformControl.object != null) {
      if (this.transformControl.object.name.includes("Wheel")) {
        this.transformControl.object.position.clamp(this.min_clamp_wheel, this.max_clamp_wheel);
      } else {
        this.transformControl.object.position.clamp(this.min_clamp, this.max_clamp);
      }
      this.deviceOutput.emit(this.transformControl.object);
    }
  }

  destoryDevice(device: Device): void {
    var body = this;
    document.getElementById(device.dictName).remove();
    body.scene.remove(this.deviceModels[device.dictName]);
    if (this.deviceFrustums[device.dictName] != undefined) {
      body.scene.remove(this.deviceFrustums[device.dictName][0]);
      body.scene.remove(this.deviceFrustums[device.dictName][1]);
      delete this.deviceFrustums[device.dictName];
    }
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
    const materials = [material_side, material_side, material_side, material_side, material_top, material_side];

    const mesh = new THREE.Mesh(geometry, materials);
    return mesh;
  }

  createCamera(device) {
      let camera = new THREE.PerspectiveCamera(57.2958, device.custom[0] / device.custom[1], 0.0001);
      return [camera, new THREE.CameraHelper( camera )];
  }

  angleAxisToEuler(rx, ry, rz, a) {
    let eulerRot = new THREE.Euler();
    let rotationVector = new THREE.Vector3(rx, ry, rz);
    let object = new THREE.Object3D();

    object.rotation.set(eulerRot.x, eulerRot.y, eulerRot.z);
    object.rotateOnAxis(rotationVector.normalize(), a);

    let ex, ey, ez;
    ex = +object.rotation.x.toFixed(2);
    ez = +object.rotation.y.toFixed(2);
    ey = +object.rotation.z.toFixed(2);
    
    return new THREE.Euler(ex, ey, ez);
  }

  onPointerDown( event ) {
    this.down = true;

    if (this.transformControl.dragging) {
      return
    };

    let canvas = this.renderer.getContext().canvas as Element;
    let xoff = canvas.getBoundingClientRect().x;
    let yoff = canvas.getBoundingClientRect().y;
    this.pointer.x = (( (event.clientX - xoff) / (window.innerWidth / (this.width_ratio)) ) * 2 - 1) ;
    this.pointer.y = (-((event.clientY - yoff) / (window.innerHeight / (this.height_ratio)) ) * 2 + 1);
    this.raycaster.setFromCamera( this.pointer, this.camera );
    const intersects = this.raycaster.intersectObjects( Object.values(this.deviceModels), false );
    if ( intersects.length > 0 ) {
      const object = intersects[ 0 ].object;
      if ( object !== this.transformControl.object && this.down ) {
        this.transformControl.attach( object );
        this.render();
      }
    } else {
      this.transformControl.detach();
    }
  }


  createThreeModel(device: Device): void {
    let body = this;
    let model = null;
    let frustum = null;
    let cam = null;
    let dictName = device.dictName;
    if (device.name == "Wheel") {
      model = this.createWheel();
    }
    else if (device.name == "Camera") {
      model = this.createSensor();
      let cam_frust = this.createCamera(device);
      cam = cam_frust[0];
      frustum = cam_frust[1];
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

      var eulerRot = new THREE.Euler(-1.57, 0, 1.57);
      this.deviceModels[dictName].rotation.set(eulerRot.x, eulerRot.y, eulerRot.z);

      if (cam != null) {
        if (this.deviceFrustums[dictName] != undefined) {
          this.deviceFrustums[device.dictName][0].aspect = device.custom[0] / device.custom[1]
          this.deviceFrustums[device.dictName][0].updateProjectionMatrix();
          this.deviceFrustums[device.dictName][1].update();
        }
        if (this.deviceFrustums[dictName] == undefined) {
          this.deviceFrustums[dictName] = [cam, frustum];
          cam.position.set(0, 0, 0);
          frustum.visible = this.showFrustum;
          body.scene.add( cam );
          body.scene.add( frustum );
          this.deviceModels[dictName].attach(cam)
        }
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
