import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Device } from '../device';
import * as THREE from 'three';

@Component({
  selector: 'app-position-rot',
  templateUrl: './position-rot.component.html',
  styleUrls: ['./position-rot.component.css']
})

export class PositionRotationComponent {
    @Input() values;

    @Output() pos_rot = new EventEmitter<any>();

    x: number = 0;
    y: number = 0;
    z: number = 0;

    rx: number = -0.5858;
    ry: number = 0.5858;
    rz: number = 0.5858;
    a: number = 2.09;

    ex: number = 0;
    ey: number = 0;
    ez: number = 0;

    
    @Input() minPositionY: number = -100;
    @Input() maxPositionY: number = 370;

    
    @Input() minPositionX: number = -370;
    @Input() maxPositionX: number = 370;

    @Input() minPositionZ: number = -370;
    @Input() maxPositionZ: number = 370;

    @Input() positionStep: number = 1;

    @Input() minAngleAxis: number = -1;
    @Input() maxAngleAxis: number = 1;

    @Input() angleStep: number = 0.01;

    ngOnInit(){
        this.angleAxisToEuler();
        this.emitInfo();
    }

    ngOnChanges(changes){
        if (changes.values.currentValue != undefined && changes.values.currentValue != ""){
            this.x = changes.values.currentValue.x;
            this.y = changes.values.currentValue.y;
            this.z = changes.values.currentValue.z;
    
            this.rx = changes.values.currentValue.rx;
            this.ry = changes.values.currentValue.ry;
            this.rz = changes.values.currentValue.rz;
            this.a = changes.values.currentValue.a;
            this.angleAxisToEuler()
            this.emitInfo();
        }
    }

    sliderChange($event, slider: string): void{
        if (slider == 'x'){
            this.x = parseInt($event.value);
        }
        else if (slider == 'y'){
            this.y = parseInt($event.value);
        }
        else if (slider == 'z'){
            this.z = parseInt($event.value);
        }
        this.emitInfo();
    }


    specificValue($event, slider: string){
        var newVal = parseInt($event.target.value);
        if ($event.target.value != ""){
            if (slider == 'x' && newVal >= this.minPositionX && newVal <= this.maxPositionX){
                this.x = newVal;
            }
            else if (slider == 'y' && newVal >= this.minPositionY && newVal <= this.maxPositionY){
                this.y = newVal;
            }
            else if (slider == 'z' && newVal >= this.minPositionZ && newVal <= this.maxPositionZ){
                this.z = newVal;
            }
            this.emitInfo();
        }
        
    }

    axisAngleChange($event, slider: string){
        var newVal = parseFloat($event.target.value);
        if ($event.target.value != ""){
            if (slider == 'x'){
                this.rx = newVal;
            }
            else if (slider == 'y'){
                this.ry = newVal;
            }
            else if (slider == 'z'){
                this.rz = newVal;
            }
            else if (slider == 'a'){
                this.a = newVal;
            }
            this.angleAxisToEuler()
            this.emitInfo();
        }
    }

    angleAxisToEuler(){
        let eulerRot = new THREE.Euler();
        let rotationVector = new THREE.Vector3(this.rx,this.ry,this.rz);
        let object = new THREE.Object3D();

        object.rotation.set(eulerRot.x, eulerRot.y, eulerRot.z);
        object.rotateOnAxis(rotationVector.normalize(), this.a);

        this.ex = +object.rotation.x.toFixed(2);
        this.ey = +object.rotation.y.toFixed(2);
        this.ez = +object.rotation.z.toFixed(2);
    }

    eulerToAngleAxis(){        
        // https://www.euclideanspace.com/maths/geometry/rotations/conversions/eulerToAngle/

        // Assuming the angles are in radians.
        let c1 = Math.cos(this.ey/2);
        let s1 = Math.sin(this.ey/2);
        let c2 = Math.cos(this.ez/2);
        let s2 = Math.sin(this.ez/2);
        let c3 = Math.cos(this.ex/2);
        let s3 = Math.sin(this.ex/2);
        let c1c2 = c1*c2;
        let s1s2 = s1*s2;

        let w = c1c2*c3 - s1s2*s3;
        let x = c1c2*s3 + s1s2*c3;
        let y = s1*c2*c3 + c1*s2*s3;
        let z = c1*s2*c3 - s1*c2*s3;

        let angle = 2 * Math.acos(w);
        let norm = x*x+y*y+z*z;

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

        console.log("eulerToAngleAxis", x, y, z, angle)
        
        this.rx = +x.toFixed(2);
        this.ry = +y.toFixed(2);
        this.rz = +z.toFixed(2);
        this.a  = +angle.toFixed(2);
    }

    changeAngle($event, slider: string){
        var newVal = parseFloat($event.target.value);
        if ($event.target.value != ""){
            if (slider == 'x'){
                this.ex = newVal;
            }
            else if (slider == 'y'){
                this.ey = newVal;
            }
            else if (slider == 'z'){
                this.ez = newVal;
            }
            this.emitInfo();
            this.eulerToAngleAxis()
        }
    }

    emitInfo(){
        let data = {
            x: this.x,
            y: this.y,
            z: this.z,
            rx: this.rx,
            ry: this.ry,
            rz: this.rz,
            a: this.a
        }
        this.pos_rot.emit(data);
    }

    // emitComponent(){
    //     let device = new Device(this.dictName, this.name, this.customName, '', this.x, this.y, this.z, this.rx, this.ry, this.rz, this.a);
    //     this.component.emit(device);
    // }
}
