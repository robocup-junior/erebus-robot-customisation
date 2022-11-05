import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Device } from '../device';


@Component({
    selector: 'app-component-slider',
    templateUrl: './component-slider.component.html',
    styleUrls: ['./component-slider.component.css']
})

export class SliderComponent {
    @Input() number: number;
    @Input() name: string;
    @Input() zxmax: number;
    @Input() wheel: boolean;

    @Input() values;

    @Output() component = new EventEmitter<any>();

    x: number = 0;
    y: number = 0;
    z: number = 0;
    rx: number = 0;
    ry: number = 0;
    rz: number = 0;
    a: number = 0;

    dictName: string = "";
    customName: string = "";
    maxNumber: number;

    ngOnInit(): void {
        this.dictName = this.name + " " + this.number.toString();
        this.customName = this.name.toLowerCase() + this.number;
        this.maxNumber = this.zxmax;
        this.emitComponent();
    }

    ngOnChanges(changes): void {
        if (changes.values.currentValue != undefined && changes.values.currentValue != "") {
            this.customName = changes.values.currentValue.customName;
        }
    }

    updateName($event): void {
        this.customName = $event.target.value;
        this.emitComponent();
    }

    updatePosition($event): void {
        this.x = $event.x;
        this.y = $event.y;
        this.z = $event.z;
        this.rx = $event.rx;
        this.ry = $event.ry;
        this.rz = $event.rz;
        this.a = $event.a;
        this.emitComponent()
    }


    emitComponent() {
        let device = new Device(this.dictName, this.name, this.customName, '', this.x, this.y, this.z, this.rx, this.ry, this.rz, this.a);
        this.component.emit(device);
    }
}
