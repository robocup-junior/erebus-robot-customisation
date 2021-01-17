import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CheckBoxComponent } from './component-checkbox/component-checkbox.component';
import { SliderComponent } from './component-slider/component-slider.component';
import { PositionRotationComponent } from './position-rot-inputs/position-rot.component';

@NgModule({
  declarations: [
    AppComponent,
    CheckBoxComponent,
    SliderComponent,
    PositionRotationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CommonModule
  ],
  providers: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
