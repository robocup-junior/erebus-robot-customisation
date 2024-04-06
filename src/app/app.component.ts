import { Component, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { components, dims } from './component_costs';
import { Device } from './device';
import {MatSnackBar} from '@angular/material/snack-bar';

import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  budget: number = 3000;
  overbudget: boolean = false;
  title: string = 'robot-customisation';
  components = components;

  distCost: number = 50;
  wheelCost: number = 300;

  previousWheelNumber: number = 2;
  numberOfWheels: number = 2;
  wheelsIterator: Array<number> = Array(this.numberOfWheels).fill(0);

  previousDistNumber: number = 4;
  numberOfDists: number = 4;
  distsIterator: Array<number> = Array(this.numberOfDists).fill(0);

  cost: number = this.numberOfWheels * this.wheelCost + this.numberOfDists * this.distCost;
  costColor = '#000000';

  selectedDevices = {};

  @ViewChild('three') threeDiv: ElementRef;
  @ViewChild('fileNameInput') fileNameField;

  fileName: string = "MyAwesomeRobot";

  distanceSensorValues: Array<number> = []
  wheelSensorValues: Array<number> = []
  checkboxValues = {}
  checkboxImport = {}

  renderDeviceUpdate: Device;

  constructor(private http: HttpClient, private cd: ChangeDetectorRef, private snackBar: MatSnackBar) {
  }

  // Create THREE.js view
  ngAfterViewInit(): void {
    this.selectedDevices = [];

    this.http.get('assets/default_position.json', { responseType: 'text' })
      .subscribe(
        (data) => this.importFromJson(JSON.parse(data))
      );

    for (let c in components) {
      this.checkboxImport[components[c].dictName] = true
    }
  }

  changeFileName($event): void {
    this.fileName = $event.target.value;
  }

  checkBoxChecked(value: number): void {
    this.cost += value;
  }

  eulerToAngleAxis(rotation, wheel) {
    // https://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToAngle/

    // Assuming the angles are in radians.
    let c1 = Math.cos(rotation.z / 2);
    let s1 = Math.sin(rotation.z / 2);
    let c2 = Math.cos(rotation.y / 2);
    let s2 = Math.sin(rotation.y / 2);
    let c3 = Math.cos(rotation.x / 2);
    let s3 = Math.sin(rotation.x / 2);
    let c1c2 = c1 * c2;
    let s1s2 = s1 * s2;

    let w = c1c2 * c3 - s1s2 * s3;
    let x = c1c2 * s3 + s1s2 * c3;
    let y = s1 * c2 * c3 + c1 * s2 * s3;
    let z = c1 * s2 * c3 - s1 * c2 * s3;

    let angle = 2 * Math.acos(w);
    let norm = x * x + y * y + z * z;

    if (norm < 0.001) { // when all euler angles are zero angle =0 so
        // we can set axis to anything to avoid divide by zero
        x = 1;
        y = z = 0;
    } else {
        norm = Math.sqrt(norm);
        x /= norm;
        y /= norm;
        z /= norm;
    }

    let rx, ry, rz, a;
    rx = +x.toFixed(2);
    if (wheel) {
        ry = +y.toFixed(2);
        rz = +z.toFixed(2);
    } else {
        rz = +y.toFixed(2);
        ry = +z.toFixed(2);
    }
    a = +angle.toFixed(2);
    return [rx, ry, rz, a]
  }

  threejsUpdate($event) {
    this.distanceSensorValues = []
    this.wheelSensorValues = []
    this.checkboxValues = {}

    this.selectedDevices[$event.name].x = $event.position.x * 1000;
    this.selectedDevices[$event.name].y = $event.position.y * 1000;
    this.selectedDevices[$event.name].z = $event.position.z * 1000;
    let values;
    if ($event.name.includes("Wheel")) {
      values = this.eulerToAngleAxis($event.rotation, false)
    } else {
      values = this.eulerToAngleAxis($event.rotation, false)
    }
    this.selectedDevices[$event.name].rx = values[0];
    this.selectedDevices[$event.name].ry = values[2];
    this.selectedDevices[$event.name].rz = values[1];
    this.selectedDevices[$event.name].a = values[3];

    if ($event.name.includes("Distance Sensor")) {
      this.distanceSensorValues[parseInt($event.name.split(" ")[2])-1] = this.selectedDevices[$event.name]
    }
    else if ($event.name.includes("Wheel")) {
      this.wheelSensorValues[parseInt($event.name.split(" ")[1])-1] = this.selectedDevices[$event.name]
    }
    else {
      this.checkboxValues[$event.name] = this.selectedDevices[$event.name]
    }
  }

  withinBudget(value: number): boolean {
    return (this.cost + (value)) <= this.budget
  }

  checkOverBudget() {
    this.overbudget = this.cost > this.budget;
    // this.overbudget = true;
    if (this.overbudget) this.costColor = '#FF0000';
    else this.costColor = '#000000';
  }

  addRenderDevice(device: Device): Promise<unknown> {
    if (device.type == "sub") {
      return this.destroyRenderDevice(device);
    }
    this.selectedDevices[device.dictName] = device;
    this.renderDeviceUpdate = {...device};
    this.cd.detectChanges();
    this.checkOverBudget();
    return new Promise(resolve => { setTimeout(() => resolve('added')), 10000 });
  }

  destroyRenderDevice(device: Device) {
    device.type = 'sub';
    this.renderDeviceUpdate = {...device};
    this.cd.detectChanges();
    delete this.selectedDevices[device.dictName];
    this.checkOverBudget();
    return new Promise(resolve => { setTimeout(() => resolve('destroyed')), 10000 });
  }

  onWheelSliderChange($event): void {
    this.previousWheelNumber = this.numberOfWheels;
    this.numberOfWheels = parseInt($event.value);
    this.wheelsIterator = Array(this.numberOfWheels).fill(0);
    if (this.previousWheelNumber - this.numberOfWheels > 0) {        
      let numWheelToRmv = this.previousWheelNumber - this.numberOfWheels;
      for (let i = this.previousWheelNumber; i > this.previousWheelNumber - numWheelToRmv; i --) {
        //decreased slider
        this.selectedDevices["Wheel " + i].type = "sub";
        this.destroyRenderDevice(this.selectedDevices["Wheel " + i]);
      }
    }
    this.cost += (this.numberOfWheels * this.wheelCost) - (this.previousWheelNumber * this.wheelCost)
    this.checkOverBudget();
  }

  onDistSliderChange($event): void {
    this.previousDistNumber = this.numberOfDists;
    this.numberOfDists = parseInt($event.value);
    this.distsIterator = Array(this.numberOfDists).fill(0);
    let numDistsToRmv = this.previousDistNumber - this.numberOfDists;
    if (numDistsToRmv > 0) {
      for (let i = this.previousDistNumber; i > this.numberOfDists; i --) {
        //decreased slider
        this.selectedDevices["Distance Sensor " + i].type = "sub";
        this.destroyRenderDevice(this.selectedDevices["Distance Sensor " + i]);
      }
    }
    this.cost += (this.numberOfDists * this.distCost) - (this.previousDistNumber * this.distCost)
    this.checkOverBudget();
  }

  //https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
  download(filename: string, text: string): void {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  export_to_json(): void {
    if (this.overbudget) {
      this.snackBar.open('You are over budget! Try removing some components.');
      return;
    }
    let customNames = [];
    let exportFLU_selectedDevices = JSON.parse(JSON.stringify(this.selectedDevices));
    //customName check
    for (let k of Object.keys(exportFLU_selectedDevices)) {
      let device = exportFLU_selectedDevices[k]
      let cn = exportFLU_selectedDevices[k]["customName"]
      if (!cn || cn == "") {
        Swal.fire(
          'Name error',
          `The name of the "${device["dictName"]}" has not been set properly.`,
          'error'
        )
        return;
      } else {
        if (customNames.indexOf(cn) >= 0) {
          Swal.fire(
            'Name error',
            `"${cn}" has already been specified by another sensor/motor. A non-duplicate name must be specified.`,
            'error'
          )
          return;
        } else {
          customNames.push(cn)
        }
      }
    }
    this.download(this.fileNameField.nativeElement.value + ".json", JSON.stringify(exportFLU_selectedDevices, null, "\t"));
  }

  async importFromJson(json): Promise<void> {
    this.cost = 0;
    for (let component in this.selectedDevices) {
      await this.destroyRenderDevice(this.selectedDevices[component]);
    }

    this.distanceSensorValues = []
    this.wheelSensorValues = []
    this.checkboxValues = {}

    for (let c in components) {
      this.checkboxValues[components[c].dictName] = ""
    }

    for (let c in components) {
      this.checkboxImport[components[c].dictName] = !this.checkboxImport[components[c].dictName]
    }

    // Create new selectedDevices
    for (let component in json) {
      if (json[component].name == "Distance Sensor") {
        this.distanceSensorValues.push(json[component])
        this.cost += this.distCost;
      }
      else if (json[component].name == "Wheel") {
        this.wheelSensorValues.push(json[component])
        this.cost += this.wheelCost;
      }
      else if (json[component].name == "Camera" && json[component].custom != undefined) {
        this.cost += dims.get(json[component].custom[0]) + dims.get(json[component].custom[1])
      }

      for (let c in components) {
        if (components[c].dictName == component) {
          this.checkboxValues[component] = json[component]
          this.cost += components[c].cost
        }
      }

    }
    this.selectedDevices = json;

    this.previousWheelNumber = this.numberOfWheels;
    this.numberOfWheels = this.wheelSensorValues.length
    this.wheelsIterator = Array(this.numberOfWheels).fill(0);
    // this.cost += (this.numberOfWheels * this.wheelCost) - (this.previousWheelNumber * this.wheelCost)

    this.previousDistNumber = this.numberOfDists
    this.numberOfDists = this.distanceSensorValues.length
    this.distsIterator = Array(this.numberOfDists).fill(0);
    // this.cost += (this.numberOfDists * this.distCost) - (this.previousDistNumber * this.distCost)

    for (let component in this.selectedDevices) {
      await this.addRenderDevice(this.selectedDevices[component]);
    }
  }

  jsonSelected($event): void {
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
