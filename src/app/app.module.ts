import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CheckBoxComponent } from './component-checkbox/component-checkbox.component';
import { SliderComponent } from './component-slider/component-slider.component';
import { PositionRotationComponent } from './position-rot-inputs/position-rot.component';

import { MatSliderModule } from '@angular/material/slider';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButtonModule} from '@angular/material/button';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatInputModule} from '@angular/material/input';
import {MatSnackBarModule} from '@angular/material/snack-bar';

import { HttpClientModule  } from '@angular/common/http';
import { ThreejsRenderComponent } from './threejs-render/threejs-render.component';
import { CheckBoxComponentCamera } from './component-checkbox-camera/component-checkbox-camera.component';
import { FormsModule } from '@angular/forms'; // Import FormsModule

@NgModule({
  declarations: [
    AppComponent,
    CheckBoxComponent,
    CheckBoxComponentCamera,
    SliderComponent,
    PositionRotationComponent,
    ThreejsRenderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CommonModule,
    
    MatSliderModule,
    MatCheckboxModule,
    MatButtonModule,
    MatExpansionModule,
    MatInputModule,
    MatSnackBarModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [AppComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
