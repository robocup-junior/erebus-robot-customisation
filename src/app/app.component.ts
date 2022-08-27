import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { components } from './component_costs';
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { Device } from './device';
import { $ } from 'protractor';
import * as cjson from 'compressed-json';

import {MatSnackBar} from '@angular/material/snack-bar';
import {LZString} from './LZW';

import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2'
import { Vector3 } from 'three';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  budget = 3000;
  title = 'robot-customisation';
  components = components;

  distCost = 50;
  wheelCost = 300;

  previousWheelNumber = 2;
  numberOfWheels = 2;
  wheelsIterator = Array(this.numberOfWheels).fill(0);

  previousDistNumber = 4;
  numberOfDists = 4;
  distsIterator = Array(this.numberOfDists).fill(0);

  cost = this.numberOfWheels * this.wheelCost + this.numberOfDists * this.distCost;

  selectedDevices = {};

  @ViewChild('three') threeDiv: ElementRef;  
  @ViewChild('fileNameInput') fileNameField;  
  
  robotModel: THREE.Mesh;
  axesHelper: THREE.Group;
  deviceModels = {};
  scene = new THREE.Scene();

  control: TransformControls;
  showLables = true;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;

  fileName: string = "MyAwesomeRobot";
  shareLocalCode: string = "";
  shareCode: string = "";

  distanceSensorValues = []
  wheelSensorValues = []
  checkboxValues = {}
  checkboxImport = {}
  

  constructor(private snackBar: MatSnackBar, private http: HttpClient) {
  }

  // Create THREE.js view
  ngAfterViewInit() {
    /*
    
    */
    
    let body = this;

    let width_ratio = 3.2;
    let height_ratio = 2.16;
    
    init();
    animate();

    function createAxisArrow(dir: THREE.Vector3, color: THREE.Color): THREE.ArrowHelper {
      return new THREE.ArrowHelper(dir, new THREE.Vector3(0,0,0), 0.1, color, 0.03, 0.03);
    }
  
    function initAxisHelper(): THREE.Group {
      const axisGroup = new THREE.Group();
      const x = createAxisArrow(new THREE.Vector3(1,0,0), new THREE.Color(1,0,0));
      const y = createAxisArrow(new THREE.Vector3(0,1,0), new THREE.Color(0,1,0));
      const z = createAxisArrow(new THREE.Vector3(0,0,1), new THREE.Color(0,0,1));
      console.log(x);
      axisGroup.add(x);
      axisGroup.add(y);
      axisGroup.add(z);
      return axisGroup;
    }

    function init(){

      body.camera = new THREE.PerspectiveCamera( 45, (window.innerWidth/width_ratio) / (window.innerHeight/height_ratio), 0.1, 200 );
      body.camera.position.set( 1, 1, 1 );
      
      const skyColor = 0xFFFFFF;  // light blue
      const groundColor = 0x000000;  // brownish orange
      const intensity = 1;

      const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);

      body.scene.add(light);

      body.axesHelper = initAxisHelper();
      body.scene.add( body.axesHelper );
      

      const geometry = new THREE.CylinderGeometry(0.37,0.37,0.45,100);
      const texture = new THREE.TextureLoader().load("./../assets/textures/top.png");
      texture.rotation = 0;
      const top_material = new THREE.MeshPhongMaterial( { map: texture } );
      const side_material = new THREE.MeshPhongMaterial( { color: 0xffffff, opacity: 0.5, transparent: true} );
      const bot_material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
      const materials = [side_material,top_material,bot_material]
      body.robotModel = new THREE.Mesh( geometry, materials );
      body.robotModel.position.set(0,0.05,0);
      body.scene.add( body.robotModel );

      body.renderer = new THREE.WebGLRenderer();
      body.renderer.setPixelRatio( window.devicePixelRatio );
			body.renderer.setSize( (window.innerWidth/width_ratio), (window.innerHeight/height_ratio) );
      body.threeDiv.nativeElement.appendChild( body.renderer.domElement );
      
      body.labelRenderer = new CSS2DRenderer();
      body.labelRenderer.setSize( (window.innerWidth/width_ratio), (window.innerHeight/height_ratio) );
      body.labelRenderer.domElement.style.position = 'absolute';
      body.labelRenderer.domElement.style.top = '0px'; 
      body.labelRenderer.domElement.style.display = 'block';
      body.threeDiv.nativeElement.appendChild( body.labelRenderer.domElement );

      body.controls = new OrbitControls( body.camera, body.labelRenderer.domElement );
      
      // const axesHelper = new THREE.AxesHelper( 1 );
      // body.scene.add( axesHelper );

      window.addEventListener( 'resize', onWindowResize, false );

    }

    function onWindowResize(){
      body.camera.aspect = (window.innerWidth/width_ratio) / (window.innerHeight/height_ratio);
      body.camera.updateProjectionMatrix();
      body.renderer.setSize( (window.innerWidth/width_ratio), (window.innerHeight/height_ratio) );
      body.labelRenderer.setSize( (window.innerWidth/width_ratio), (window.innerHeight/height_ratio) );
    }

    function animate() {
      requestAnimationFrame( animate );
      body.labelRenderer.render( body.scene, body.camera );
      const axesPos = body.camera.localToWorld(new THREE.Vector3(0.6 * body.camera.aspect,-0.6, -2));
      body.axesHelper.position.copy(axesPos);
     // body.axesHelper.position.set(0.5,0.05,0.2);
      body.renderer.render( body.scene, body.camera );
    }

    this.http.get('assets/default_position.json', {responseType: 'text'}).subscribe(data => this.importFromJson(JSON.parse(data)));
    
    for (let c in components){
      this.checkboxImport[components[c].dictName] = true
    }
    
  }

  changeFileName($event){
    this.fileName = $event.target.value;
  }

  checkBoxChecked(value){
    this.cost += value;
  }

  withinBudget(value){
    return (this.cost + (value)) <= this.budget
  }

  onWheelSliderChange($event) {
    this.previousWheelNumber = this.numberOfWheels;
    if (this.withinBudget((parseInt($event.value) * this.wheelCost) - (this.previousWheelNumber * this.wheelCost))){
      this.numberOfWheels = parseInt($event.value);
      this.wheelsIterator = Array(this.numberOfWheels).fill(0);
      if (this.previousWheelNumber - this.numberOfWheels > 0){
        //decreased slider
        //console.log("Wheel " + this.previousWheelNumber)
        this.selectedDevices["Wheel " + this.previousWheelNumber].type = "sub";
        this.addSelectedComponent(this.selectedDevices[ "Wheel " + this.previousWheelNumber]);
      }
      this.cost += (this.numberOfWheels * this.wheelCost) - (this.previousWheelNumber * this.wheelCost)
    } else {
      $event.value = this.previousWheelNumber;
    }
    
  }
  
  onDistSliderChange($event) {
    this.previousDistNumber = this.numberOfDists;
    if (this.withinBudget((parseInt($event.value) * this.distCost) - (this.previousDistNumber * this.distCost))){
      this.numberOfDists = parseInt($event.value);
      this.distsIterator = Array(this.numberOfDists).fill(0);
      if (this.previousDistNumber - this.numberOfDists > 0){
        //decreased slider
        this.selectedDevices["Distance Sensor " + this.previousDistNumber].type = "sub";
        this.addSelectedComponent(this.selectedDevices["Distance Sensor " + this.previousDistNumber]);
      }
      this.cost += (this.numberOfDists * this.distCost) - (this.previousDistNumber * this.distCost)
    } else {
      $event.value = this.previousDistNumber;
    }
  }

  destoryDevice(device) {
    console.log(device.dictName)
    var body = this;
    document.getElementById(device.dictName).remove();
    body.scene.remove(this.deviceModels[device.dictName]);
    delete this.selectedDevices[device.dictName];
    delete this.deviceModels[device.dictName];
  }

  createThreeModel(dictName){
    let body = this;
    let model = null;
    if(this.selectedDevices[dictName].name == "Wheel"){
      const wheel_geometry = new THREE.CylinderGeometry(0.205,0.205,0.05, 100);
      const textureW1 = new THREE.TextureLoader().load("./../assets/textures/wheel1.png");
      const textureW2 = new THREE.TextureLoader().load("./../assets/textures/wheel2.png");

      const wheel_material_side1 = new THREE.MeshPhongMaterial( { map: textureW1} );
      const wheel_material_side2 = new THREE.MeshPhongMaterial( { map: textureW2} );
      const wheel_material_bot = new THREE.MeshPhongMaterial( { color: 0xfffffff, opacity: 0.5, transparent: true} );
        
      const materials = [wheel_material_bot,wheel_material_side1,wheel_material_side2]
      model = new THREE.Mesh( wheel_geometry, materials );
    }
    else{
      const geometry = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );
      const texture = new THREE.TextureLoader().load("./../assets/textures/sensor.png");
      // texture.center.set(0.5,0.5);
      // texture.rotation = -1.57;
      const material_top = new THREE.MeshPhongMaterial( {map: texture} );
      const material_side = new THREE.MeshPhongMaterial( { color: 0xffffff} );
      const materials = [material_side,material_side,material_side,material_side,material_top,material_side]

      model = new THREE.Mesh( geometry, materials );
    }
    if (model != null){
      if(this.deviceModels[dictName] == undefined){
        const labelDiv = document.createElement('div');
        labelDiv.id = this.selectedDevices[dictName].dictName;
        labelDiv.textContent = this.selectedDevices[dictName].customName;
        labelDiv.style.marginTop = '-1em';
        labelDiv.style.color = 'rgb(255, 255, 255)';
        labelDiv.style.padding = '2px';
        labelDiv.style.background = 'rgba(0, 0, 0, 0.6)';
        const deviceLabel = new CSS2DObject( labelDiv );
        deviceLabel.position.set(0, 0.05, 0);
        model.add(deviceLabel);
        //console.log(model)
        model.name = dictName;

        this.deviceModels[dictName] = model; 
        body.scene.add(this.deviceModels[dictName]);

      }

      var eulerRot = new THREE.Euler(0,0,0);
      var rotationVector = new THREE.Vector3(this.selectedDevices[dictName].rx,this.selectedDevices[dictName].rz,this.selectedDevices[dictName].ry);

      this.deviceModels[dictName].rotation.set(eulerRot.x, eulerRot.z, eulerRot.y);

      this.deviceModels[dictName].rotateOnAxis(rotationVector.normalize(), this.selectedDevices[dictName].a);
      //console.log(this.deviceModels[dictName].rotation)
      // if(this.selectedDevices[dictName].name != "Wheel"){
      //     this.deviceModels[dictName].rotation.set(this.deviceModels[dictName].rotation.x, this.deviceModels[dictName].rotation.y+1.57, this.deviceModels[dictName].rotation.z);
      // }


      this.deviceModels[dictName].position.set(this.selectedDevices[dictName].x / 1000, this.selectedDevices[dictName].y / 1000, this.selectedDevices[dictName].z / 1000);

      // Update label name
      this.deviceModels[dictName].children[0].element.innerHTML = this.selectedDevices[dictName].customName;
    }
  }

  addSelectedComponent($event){
    var body = this;
    if ($event.type != "sub"){
      this.selectedDevices[$event.dictName] = $event;
    } else {
      this.destoryDevice($event);
      return;
    }
    
    this.createThreeModel($event.dictName);
    
  }

  //https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
  download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }

  createSnackBar(message){
    let snackBarRef = this.snackBar.open(message, '', {
      duration: 1000,
    });
  }

  copyCodeToClipboard(){
    var dummy_element = document.createElement("textarea");
    // dummy_element.style.display = 'none'
    document.body.appendChild(dummy_element);
    dummy_element.value = this.shareCode;
    dummy_element.select();
    document.execCommand("copy");
    document.body.removeChild(dummy_element);
  }

  shareCodeToClip(){
    console.log(this.selectedDevices)

    let json = Object.assign({},this.selectedDevices)
    for(let component in json){
      json[component] = {
        "name": json[component].name,
        "customName": json[component].customName,
        "pos": [json[component].x,json[component].y,json[component].z],
        "ang":[json[component].rx,json[component].ry,json[component].rz,json[component].a]
      }
    }
    
    // this.shareCode = btoa(JSON.stringify(cjson.compress(json)));
    this.shareCode = LZString.compressToBase64(JSON.stringify(cjson.compress(json)))

    this.copyCodeToClipboard();

    this.createSnackBar('Copied to clipboard!');
  }


  export_to_json(){
    let customNames = [];
    let exportFLU_selectedDevices = JSON.parse(JSON.stringify(this.selectedDevices));
    //customName check
    for(let k of Object.keys(exportFLU_selectedDevices)){
      let device = exportFLU_selectedDevices[k]
      let cn = exportFLU_selectedDevices[k]["customName"]
      if(!cn || cn==""){
        Swal.fire(
          'Name error',
          `The name of the "${device["dictName"]}" has not been set properly.`,
          'error'
        )
        return;
      }else{
        if (customNames.indexOf(cn) >= 0){
          Swal.fire(
            'Name error',
            `"${cn}" has already been specified by another sensor/motor. A non-duplicate name must be specified.`,
            'error'
          )
          return;
        }else{
          customNames.push(cn)
        }
      }
      // let rots = this.angleAxisToEuler(exportFLU_selectedDevices[k]["rx"],exportFLU_selectedDevices[k]["ry"],exportFLU_selectedDevices[k]["rz"],exportFLU_selectedDevices[k]["a"]);
      // rots[0] -= Math.PI / 2;
      // let erots = this.eulerToAngleAxis(rots[0], rots[1], rots[2]);
      // exportFLU_selectedDevices[k]["rx"] = erots[0];
      // exportFLU_selectedDevices[k]["ry"] = erots[1];
      // exportFLU_selectedDevices[k]["rz"] = erots[2];
      // exportFLU_selectedDevices[k]["a"] = erots[3];
    }
    console.log(exportFLU_selectedDevices);
    console.log(this.selectedDevices);
    this.download(this.fileNameField.nativeElement.value+".json",JSON.stringify(exportFLU_selectedDevices, null , "\t"));
  }
  
  import(inputElement){
    
    let json;
    
    try {
      if (inputElement.value == ""){
        this.createSnackBar('Invalid Code');
        return
      }
      json = Object.assign({},cjson.decompress.fromString(LZString.decompressFromBase64(inputElement.value)))
    } catch (error) {
      this.createSnackBar('Invalid Code');
      return
    }

    this.distanceSensorValues = []
    this.wheelSensorValues = []
    this.checkboxValues = {}

    for (let c in components){
      this.checkboxValues[components[c].dictName] = ""
    }
    
    // Create new selectedDevices
    for(let component in json){
      let value = {
        pos: [json[component].pos[0],json[component].pos[1],json[component].pos[2]],
        ang: [json[component].ang[0],json[component].ang[1],json[component].ang[2],json[component].ang[3]]
      }
      if (json[component].name == "Distance Sensor"){
        this.distanceSensorValues.push(value)
      }
      else if (json[component].name == "Wheel"){
        this.wheelSensorValues.push(value)
      } else {
        for (let c in components){
          if (components[c].dictName == component){
            this.checkboxValues[component] = value
            if (this.selectedDevices[component] == undefined)
            {
              this.cost += components[c].cost
            }
          }
        }
      }
      json[component] = {
        "dictName": component,
        "name": json[component].name,
        "customName": json[component].customName,
        "x": json[component].pos[0],
        "y": json[component].pos[1],
        "z": json[component].pos[2],
        "rx":json[component].ang[0],
        "ry":json[component].ang[1],
        "rz":json[component].ang[2],
        "a":json[component].ang[3]
      }
    }

    this.selectedDevices = json;

    this.previousWheelNumber = this.numberOfWheels;
    this.numberOfWheels = this.wheelSensorValues.length
    this.wheelsIterator = Array(this.numberOfWheels).fill(0);
    this.cost += (this.numberOfWheels * this.wheelCost) - (this.previousWheelNumber * this.wheelCost)
    
    this.previousDistNumber = this.numberOfDists
    this.numberOfDists = this.distanceSensorValues.length
    this.distsIterator = Array(this.numberOfDists).fill(0);
    this.cost += (this.numberOfDists * this.distCost) - (this.previousDistNumber * this.distCost)

    for (let component in this.selectedDevices){
      this.createThreeModel(this.selectedDevices[component].dictName);
    }
    inputElement.value = ""
  }

  importFromJson(json){
    console.log("import from json");
    
    this.cost = 0;

    for (let component in this.selectedDevices){
      this.destoryDevice(this.selectedDevices[component]);
    }
    
    this.distanceSensorValues = []
    this.wheelSensorValues = []
    this.checkboxValues = {}

    for (let c in components){
      this.checkboxValues[components[c].dictName] = ""
    }
    
    for (let c in components){
      this.checkboxImport[components[c].dictName] = !this.checkboxImport[components[c].dictName]
    }
    
    // Create new selectedDevices
    for(let component in json){
      // let rots = this.angleAxisToEuler(json[component].rx,json[component].ry,json[component].rz,json[component].a);
      // rots[0] += Math.PI/2;
      // let erots = this.eulerToAngleAxis(rots[2], rots[0], rots[1]);
      // let erots = this.eulerToAngleAxis(rots[0], rots[1], rots[2]);
      // json[component].rx = erots[0];
      // json[component].ry = erots[1];
      // json[component].rz = erots[2];
      // json[component].a = erots[3];

      if (json[component].name == "Distance Sensor"){
        this.distanceSensorValues.push(json[component])
        this.cost += this.distCost;
      }
      else if (json[component].name == "Wheel"){
        this.wheelSensorValues.push(json[component])
        this.cost += this.wheelCost;
      } 
      console.log(component)

      for (let c in components){
        if (components[c].dictName == component){
          console.log(components[c].dictName,components[c])

          this.checkboxValues[component] = json[component]
          this.cost += components[c].cost
        }
      }
      
    }
    console.log(json)
    this.selectedDevices = json;

    this.previousWheelNumber = this.numberOfWheels;
    this.numberOfWheels = this.wheelSensorValues.length
    this.wheelsIterator = Array(this.numberOfWheels).fill(0);
    this.cost += (this.numberOfWheels * this.wheelCost) - (this.previousWheelNumber * this.wheelCost)
    
    this.previousDistNumber = this.numberOfDists
    this.numberOfDists = this.distanceSensorValues.length
    this.distsIterator = Array(this.numberOfDists).fill(0);
    this.cost += (this.numberOfDists * this.distCost) - (this.previousDistNumber * this.distCost)

    for (let component in this.selectedDevices){
      this.createThreeModel(this.selectedDevices[component].dictName);
    }
  }

  jsonSelected($event){
  
    if (typeof (FileReader) !== 'undefined') {
      let reader = new FileReader();
  
      reader.onload = (e) => {
        let jsonFile = e.target.result.toString();
        this.importFromJson(JSON.parse(jsonFile))
      };
      reader.readAsText($event.srcElement.files[0]);
    }
  }
  
}
