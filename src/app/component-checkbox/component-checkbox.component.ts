import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { Device } from '../device';

@Component({
  selector: 'app-component-checkbox',
  templateUrl: './component-checkbox.component.html',
  styleUrls: ['./component-checkbox.component.css']
})

export class CheckBoxComponent {
    @Input() type: string;
    @Input() cost: number;
    @Input() name: string;
    @Input() dictName: string;
    @Input() totalCost: number;
    @Input() budget: number;
    @Input() customName: string;

    @Output() outputCost = new EventEmitter<number>();
    @Output() component = new EventEmitter<any>()
    @Output() sliderValue = new EventEmitter<number>();

    check = new Subject<CheckBoxComponent>();

    checked: boolean = false;
    x: number = 0.0;
    y: number = 0.0;
    z: number = 0.0;
    rx: number = 0;
    ry: number = 0;
    rz: number = 0;
    a: number = 0;

    min: number = -370;
    max: number = 370;

    click($event): void{
        if ($event.target.checked){
            if (this.totalCost + this.cost > this.budget){
                this.checked = false
                $event.target.checked = false;
            } else {
                this.checked = true
                this.outputCost.emit(this.cost);
                this.emitComponent("add");
            }
        } else {
            this.checked = false;
            this.outputCost.emit(-this.cost);
            this.emitComponent("sub");
        }
        
    }

    updatePosition($event){
        this.x = $event.x;
        this.y = $event.y;
        this.z = $event.z;
        this.rx = $event.rx;
        this.ry = $event.ry;
        this.rz = $event.rz;
        this.a = $event.a;
        this.emitComponent("add")
    }

    updateName($event){
        this.customName = $event.target.value;
        this.emitComponent("add");
    }

    emitComponent(type: string){
        let device = new Device(this.dictName, this.name, this.customName, type, this.x, this.y, this.z, this.rx, this.ry, this.rz, this.a);
        this.component.emit(device);
    }
}
