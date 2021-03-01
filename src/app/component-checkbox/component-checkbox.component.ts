import { Component, EventEmitter, Input, Output,ViewChild} from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Subject } from 'rxjs';
import { TubeBufferGeometry } from 'three';
import { Device } from '../device';

@Component({
  selector: 'app-component-checkbox',
  templateUrl: './component-checkbox.component.html',
  styleUrls: ['./component-checkbox.component.css']
})

export class CheckBoxComponent {
    @ViewChild(MatExpansionPanel) expPanel: MatExpansionPanel;

    @Input() type: string;
    @Input() cost: number;
    @Input() name: string;
    @Input() dictName: string;
    @Input() totalCost: number;
    @Input() budget: number;
    @Input() customName: string;

    @Input() values;

    @Output() outputCost = new EventEmitter<number>();
    @Output() component = new EventEmitter<any>()
    @Output() sliderValue = new EventEmitter<number>();

    check = new Subject<CheckBoxComponent>();

    checked: boolean = false;
    disabled: boolean = false;
    collapsed = true;
    x: number = 0.0;
    y: number = 0.0;
    z: number = 0.0;
    rx: number = 0;
    ry: number = 0;
    rz: number = 0;
    a: number = 0;

    min: number = -370;
    max: number = 370;

    withinBudget(totalCost){
        return totalCost + this.cost <= this.budget
    }

    ngOnChanges(changes) {
        if ("values" in changes){
            if (changes.values.currentValue != ""){
                if (changes.values.currentValue != undefined){
                    this.checked = true;
                } 
            }else {
                this.checked = false;
                if (this.expPanel != undefined){
                    this.expPanel.close();
                }
            }
        }
        if ("totalCost" in changes){
            this.disableCheckBox(changes.totalCost.currentValue);
        }
    }

    disableCheckBox(totalCost){
        if(!this.withinBudget(totalCost) && !this.checked){
            this.disabled = true;
        } else {
            this.disabled = false;
        }
    }

    click($event): void{
        console.log(this.check)
        if ($event.checked){
            if (!this.withinBudget(this.totalCost)){
                this.checked = false
                // $event.checked = false;
            } else {
                this.checked = true
                this.expPanel.open();
                this.outputCost.emit(this.cost);
                this.emitComponent("add");
            }
        } else {
            this.expPanel.close();
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
