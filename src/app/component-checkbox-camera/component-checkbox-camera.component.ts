import { Component } from '@angular/core';
import { CheckBoxComponent } from '../component-checkbox/component-checkbox.component';
import { Device } from '../device';

@Component({
    selector: 'app-component-checkbox-camera',
    templateUrl: './component-checkbox-camera.component.html',
    styleUrls: ['./component-checkbox-camera.component.css']
})

export class CheckBoxComponentCamera extends CheckBoxComponent {
    dims = [32, 40, 64, 128, 256];
    width = 32;
    height = 40;

    widthChange(eventValue) {
        this.width = parseInt(eventValue);
        this.emitComponent("add");
    }

    heightChange(eventValue) {
        this.height = parseInt(eventValue);
        this.emitComponent("add");
    }


    emitComponent(type: string): void {
        let device = new Device(this.dictName, this.name, this.customName, type, this.x, this.y, this.z, this.rx, this.ry, this.rz, this.a, [this.width, this.height]);
        this.component.emit(device);
    }
}
