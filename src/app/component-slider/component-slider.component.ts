import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-component-slider',
  templateUrl: './component-slider.component.html',
  styleUrls: ['./component-slider.component.css']
})
export class SliderComponent {
    @Input() number: number;
    @Input() displayName: string;

    @Output() component = new EventEmitter<any>();

    x: number = 0;
    y: number = 0;
    z: number = 0;
    rx: number = 0;
    ry: number = 0;
    rz: number = 0;
    a: number = 0;
    name: string = "";
    customName: string = "";

    ngOnInit(){
        this.name = this.displayName+" "+this.number.toString();
        this.customName = this.displayName.toLowerCase()+this.number;
        this.emitComponent();
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
        this.emitComponent();
    }

    updateName($event){
        this.customName = $event.target.value;
        this.emitComponent();
    }

    specificValue($event, slider: string){
        var newVal = parseInt($event.target.value);
        if ($event.target.value != "" && newVal >= -370 && newVal <= 370){
            if (slider == 'x'){
                this.x = newVal;
            }
            else if (slider == 'y'){
                this.y = newVal;
            }
            else if (slider == 'z'){
                this.z = newVal;
            }
            this.emitComponent();
        }
        
    }

    valueChange($event, slider: string){
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
            this.emitComponent();
        }
    }

    emitComponent(){
        this.component.emit({
            dictName: this.name,
            name: this.displayName,
            customName: this.customName, 
            x: this.x,
            y: this.y,
            z: this.z,
            rx: this.rx,
            ry: this.ry,
            rz: this.rz,
            a: this.a});
    }
}
