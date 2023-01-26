import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { components } from './component_costs';
import { Device } from './device';

import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  budget: number = 3000;
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

  selectedDevices = {};

  @ViewChild('three') threeDiv: ElementRef;
  @ViewChild('fileNameInput') fileNameField;

  fileName: string = "MyAwesomeRobot";

  distanceSensorValues: Array<number> = []
  wheelSensorValues: Array<number> = []
  checkboxValues = {}
  checkboxImport = {}

  renderDeviceUpdate: Device;

  constructor(private http: HttpClient) {
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

  withinBudget(value: number): boolean {
    return (this.cost + (value)) <= this.budget
  }

  addRenderDevice(device: Device): Promise<unknown> {
    if (device.type == 'sub') {
      this.destroyRenderDevice(device);
      return;
    }
    this.selectedDevices[device.dictName] = device;
    this.renderDeviceUpdate = device;
    return new Promise(resolve => { setTimeout(() => resolve('added')), 10000 });
  }

  destroyRenderDevice(device: Device): Promise<unknown> {
    device.type = 'sub';
    this.renderDeviceUpdate = {...device};
    delete this.selectedDevices[device.dictName];
    return new Promise(resolve => { setTimeout(() => resolve('destroyed')), 10000 });
  }

  onWheelSliderChange($event): void {
    this.previousWheelNumber = this.numberOfWheels;
    if (this.withinBudget((parseInt($event.value) * this.wheelCost) - (this.previousWheelNumber * this.wheelCost))) {
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
    } else {
      $event.value = this.previousWheelNumber;
    }

  }

  onDistSliderChange($event): void {
    this.previousDistNumber = this.numberOfDists;
    if (this.withinBudget((parseInt($event.value) * this.distCost) - (this.previousDistNumber * this.distCost))) {
      this.numberOfDists = parseInt($event.value);
      this.distsIterator = Array(this.numberOfDists).fill(0);
      if (this.previousDistNumber - this.numberOfDists > 0) {
        let numDistsToRmv = this.previousDistNumber - this.numberOfDists;
        for (let i = this.previousDistNumber; i > this.previousDistNumber - numDistsToRmv; i --) {
          //decreased slider
          this.selectedDevices["Distance Sensor " + i].type = "sub";
          this.destroyRenderDevice(this.selectedDevices["Distance Sensor " + i]);
        }
      }
      this.cost += (this.numberOfDists * this.distCost) - (this.previousDistNumber * this.distCost)
    } else {
      $event.value = this.previousDistNumber;
    }
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
    this.cost += (this.numberOfWheels * this.wheelCost) - (this.previousWheelNumber * this.wheelCost)

    this.previousDistNumber = this.numberOfDists
    this.numberOfDists = this.distanceSensorValues.length
    this.distsIterator = Array(this.numberOfDists).fill(0);
    this.cost += (this.numberOfDists * this.distCost) - (this.previousDistNumber * this.distCost)

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
