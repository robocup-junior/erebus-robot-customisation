import { Component } from '@angular/core';
import { CheckBoxComponent } from '../component-checkbox/component-checkbox.component';
import { Device } from '../device';
import { dims } from '../component_costs';

@Component({
    selector: 'app-component-checkbox-camera',
    templateUrl: './component-checkbox-camera.component.html',
    styleUrls: ['./component-checkbox-camera.component.css']
})

export class CheckBoxComponentCamera extends CheckBoxComponent {
    
    dimKeys;
    dimMap;

    width;
    height;
    prev_width = [0, 0];
    prev_height = [0, 0];

    constructor() {
        super();
        this.dimKeys = Array.from(dims.keys());
        let dimValues = Array.from(dims.values());
        this.dimMap = this.dimKeys.map(function(e, i) { // Simple zip
            return [e, dimValues[i]];
        });
        this.width = this.dimMap[1];
        this.height = this.dimMap[0];
    }

    ngOnChanges(changes): void {
        super.ngOnChanges(changes);
        if ("values" in changes) {
            if (changes.values.currentValue != undefined && changes.values.currentValue.custom != undefined) {
                let widx = this.dimKeys.indexOf(changes.values.currentValue.custom[0]);
                let hidx = this.dimKeys.indexOf(changes.values.currentValue.custom[1]);
                this.width = this.dimMap[widx];
                this.prev_width = this.width;
                this.height = this.dimMap[hidx];
                this.prev_height = this.height;
                this.cost += this.width[1];
                this.cost += this.height[1];
            }
        }

    }

    widthChange(event) {
        this.cost += this.width[1] - this.prev_width[1];
        this.outputCost.emit(this.width[1] - this.prev_width[1]);
        this.prev_width = event;
        this.emitComponent("add");
    }

    heightChange(event) {
        this.cost += this.height[1] - this.prev_height[1];
        this.outputCost.emit(this.height[1] - this.prev_height[1]);
        this.prev_height = event;
        this.emitComponent("add");
    }

    emitComponent(type: string): void {
        let device = new Device(this.dictName, this.name, this.customName, type, this.x, this.y, this.z, this.rx, this.ry, this.rz, this.a, [this.width[0], this.height[0]]);
        this.component.emit(device);
    }
}
