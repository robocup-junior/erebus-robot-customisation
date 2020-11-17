import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-component-checkbox',
  templateUrl: './component-checkbox.component.html',
  styleUrls: ['./component-checkbox.component.css']
})
export class CheckBoxComponent {
    @Input() type: String;
    @Input() cost: number;
    @Input() name: String;
    @Input() dictName: String;
    @Input() totalCost: number;
    @Input() budget: number;

    @Output() outputCost = new EventEmitter<number>();
    @Output() component = new EventEmitter<any>()
    @Output() sliderValue = new EventEmitter<number>();

    check = new Subject<CheckBoxComponent>();

    checked = false;
    x: number = 0.0;
    y: number = 0.0;
    z: number = 0.0;
    customName: string = "";

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

    sliderChange($event, slider: string): void{
        if (slider == 'x'){
            this.x = parseInt($event.target.value);
        }
        else if (slider == 'y'){
            this.y = parseInt($event.target.value);
        }
        else if (slider == 'z'){
            this.z = parseInt($event.target.value);
        }
        if (this.checked){
            this.emitComponent("add");
        }
    }

    specificValue($event, slider: string): void{
        var newVal = parseInt($event.target.value);
        if ($event.target.value != "" && newVal >= 0 && newVal <= 100){
            if (slider == 'x'){
                this.x = newVal;
            }
            else if (slider == 'y'){
                this.y = newVal;
            }
            else if (slider == 'z'){
                this.z = newVal;
            }
            if (this.checked){
                this.emitComponent("add");
            }
        }
    }

    updateName($event){
        this.customName = $event.target.value;
        this.emitComponent("add");
    }

    updateSlider($event){
        console.log($event,"updateSlider")
    }

    emitComponent(type: string){
        this.component.emit({
            dictName: this.dictName,
            name: this.name,
            customName: this.customName, 
            type:type,
            x: this.x,
            y: this.y,
            z: this.z});
    }
}
