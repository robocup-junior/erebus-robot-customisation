import { Component } from '@angular/core';
import { components } from './component_costs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  cost = 0;
  budget = 900;
  title = 'robot-customisation';
  components = components;

  previousWheelNumber = 2;
  numberOfWheels = 2;
  wheelsIterator = Array(this.numberOfWheels).fill(0);

  previousDistNumber = 4;
  numberOfDists = 4;
  distsIterator = Array(this.numberOfDists).fill(0);

  //selectedComponents = {"Wheels": {count: this.numberOfWheels, x: 0, y: 0}};
  selectedComponents = {};

  checkBoxChecked(value){
    this.cost += value;
  }
  onWheelSliderChange($event) {
    this.previousWheelNumber = this.numberOfWheels;
    this.numberOfWheels = parseInt($event.target.value);
    this.wheelsIterator = Array(this.numberOfWheels).fill(0);
    if (this.previousWheelNumber - this.numberOfWheels > 0){
      //decreased slider
      this.addSelectedComponent({dictName: "Wheel " + this.previousWheelNumber, type: "sub"});
    }
  }

  onDistSliderChange($event) {
    this.previousDistNumber = this.numberOfDists;
    this.numberOfDists = parseInt($event.target.value);
    this.distsIterator = Array(this.numberOfDists).fill(0);
    if (this.previousDistNumber - this.numberOfDists > 0){
      //decreased slider
      this.addSelectedComponent({dictName: "Dist " + this.previousDistNumber, type: "sub"});
    }
  }
  addSelectedComponent($event){
    if ($event["type"] != "sub"){
      this.selectedComponents[$event["dictName"]] = {
                                         name: $event["name"],
                                         x: $event["x"]/10000,
                                         y: $event["y"]/10000,
                                         z: $event["y"]/10000,
                                         customName: $event["customName"]};
    } else {
      delete this.selectedComponents[$event["dictName"]];
    }
    console.log(this.selectedComponents)
  }
  export(){
    var proto_code = `
    PROTO E-puck-custom [
      field SFVec3f            translation                  0 0 0                    
      field SFRotation         rotation                     0 1 0 0                  
      field SFString           name                         "e-puck"                 
      field SFString           controller                   "" 
      field MFString           controllerArgs               ""                       
      field SFString           customData                   ""                       
      field SFBool             supervisor                   FALSE                    
      field SFBool             synchronization              TRUE                     
      field SFString{"1"}      version                      "1"                      
      field SFFloat            camera_fieldOfView           0.84                     
      field SFInt32            camera_width                 52                       
      field SFInt32            camera_height                39                       
      field SFBool             camera_antiAliasing          FALSE                    
      field SFRotation         camera_rotation              1 0 0 0                  
      field SFFloat            camera_noise                 0.0                      
      field SFFloat            camera_motionBlur            0.0                      
      field SFBool             using_detection_api          FALSE
      field SFInt32            emitter_channel              1                        
      field SFInt32            receiver_channel             1                        
      field MFFloat            battery                      []                       
      field MFNode             turretSlot                   []                       
      field MFNode             groundSensorsSlot            []                       
      field SFBool             kinematic                    FALSE                    
      hiddenField  SFFloat            max_velocity                 6.28
    ]
    {
    %{
      local v1 = fields.version.value:find("^1") ~= nil
      local v2 = fields.version.value:find("^2") ~= nil
      local kinematic = fields.kinematic.value
      local usingDetectionApi = fields.using_detection_api.value
    }%
    Robot {
      translation IS translation
      rotation IS rotation
      children [ 
        SpotLight {
          attenuation      0 0 12.56
          intensity   0.01
          location    0 0.01 -0.03
          direction   0 -1 0
          cutOffAngle 0.3
        }
        `;
    
    var closeBracket = "\n\t\t}\n";
    console.log(this.selectedComponents)
    for(let component in this.selectedComponents){
      if(this.selectedComponents[component]["name"] == "Camera"){
        proto_code += `
        Camera {
          name "${this.selectedComponents[component]["customName"]}"
          translation ${this.selectedComponents[component]["x"]} ${this.selectedComponents[component]["y"]} ${this.selectedComponents[component]["z"]}
          rotation 0 1 0 0
          children [
            Transform {
              rotation 0 0.707107 0.707107 3.14159
              children [
                Transform {
                  rotation IS camera_rotation
                  children [
                    Shape {
                      appearance PBRAppearance {
                        baseColor 0 0 0
                        roughness 0.4
                        metalness 0
                      }
                      geometry IndexedFaceSet {
                        coord Coordinate {
                          point [
                            -0.003 -0.000175564 0.003 -0.003 -0.00247555 -0.003 -0.003 -0.00247555 -4.65661e-09 -0.003 -0.00247555 0.003 -0.003 -2.55639e-05 0.0035 -0.003 -2.55639e-05 -0.003 -0.003 0.000427256 0.00574979 -0.003 -0.000175564 0.0035 -0.003 0.000557156 0.0056748 -0.003 0.00207465 0.00739718 -0.003 0.00214964 0.00726728 -0.003 0.00432444 0.008 -0.003 0.00432444 0.00785 -0.003 0.00757444 0.008 -0.003 0.00757444 0.0095 -0.003 0.0115744 0.0095 -0.003 0.0115744 0.008 -0.003 0.0128244 0.008 -0.003 0.0128244 0.00785 0.003 -2.55639e-05 -0.003 0.003 -0.000175564 0.0035 0.003 -0.000175564 0.003 0.003 -0.00247555 0.003 0.003 -0.00247555 -4.65661e-09 0.003 -0.00247555 -0.003 0.003 -2.55639e-05 0.0035 0.003 0.000427256 0.00574979 0.003 0.000557156 0.0056748 0.003 0.00207465 0.00739718 0.003 0.00214964 0.00726728 0.003 0.00432444 0.00785 0.003 0.00432444 0.008 0.003 0.0115744 0.0095 0.003 0.00757444 0.0095 0.003 0.0115744 0.008 0.003 0.00757444 0.008 0.003 0.0128244 0.00785 0.003 0.0128244 0.008 0 -0.00247555 -0.003 -0.00149971 -0.00247555 -0.0025982 0.00149971 -0.00247555 -0.0025982 0.00259801 -0.00247555 -0.00150004 -0.00259801 -0.00247555 -0.00150004 0.00149971 -0.00247555 0.00259821 0.00259801 -0.00247555 0.00150005 0 -0.00247555 0.003 -0.00149971 -0.00247555 0.00259821 -0.00259801 -0.00247555 0.00150005 0.00212127 -0.00377555 0.00212128 0 -0.00377555 0.003 -0.00212127 -0.00377555 0.00212128 -0.0015 -0.00377555 0.002 -0.002 -0.00377555 0.0015 -0.003 -0.00377555 -4.65661e-09 0.0015 -0.00377555 0.002 0.002 -0.00377555 0.0015 0.003 -0.00377555 -4.65661e-09 -0.002 -0.00377555 -0.0015 0.002 -0.00377555 -0.0015 -0.00212127 -0.00377555 -0.0021213 0.0015 -0.00377555 -0.002 -0.0015 -0.00377555 -0.002 0.00212127 -0.00377555 -0.0021213 0 -0.00377555 -0.003 -0.00256063 -0.00377555 0.00106064 -0.00106063 -0.00377555 0.00256064 0.00106063 -0.00377555 0.00256064 0.00256063 -0.00377555 0.00106064 0.00256063 -0.00377555 -0.00106063 0.00106063 -0.00377555 -0.0025606 -0.00106063 -0.00377555 -0.0025606 -0.00256063 -0.00377555 -0.00106063 0.0015 -0.00417556 -0.002 0.002 -0.00417556 -0.0015 -0.0015 -0.00417556 -0.002 -0.002 -0.00417556 -0.0015 0.002 -0.00417556 0.0015 0 -0.00417556 0.000245125 0.00021198 -0.00417556 0.000122716 0.00021198 -0.00417556 -0.000122714 0 -0.00417556 -0.000245124 -0.00021198 -0.00417556 -0.000122714 -0.00021198 -0.00417556 0.000122716 -0.002 -0.00417556 0.0015 0.0015 -0.00417556 0.002 -0.0015 -0.00417556 0.002
                          ]
                        }
                        coordIndex [
                          33, 14, 35, -1, 13, 35, 14, -1, 15, 32, 16, -1, 34, 16, 32, -1, 14, 33, 15, -1, 32, 15, 33, -1, 72, 74, 60, -1, 61, 60, 74, -1, 74, 75, 61, -1, 57, 61, 75, -1, 75, 83, 57, -1, 52, 57, 83, -1, 83, 85, 52, -1, 51, 52, 85, -1, 85, 84, 51, -1, 54, 51, 84, -1, 84, 76, 54, -1, 55, 54, 76, -1, 76, 73, 55, -1, 58, 55, 73, -1, 73, 72, 58, -1, 60, 58, 72, -1, 72, 73, 74, -1, 75, 74, 73, -1, 76, 77, 78, -1, 76, 78, 79, -1, 79, 80, 75, -1, 79, 75, 73, -1, 73, 76, 79, -1, 75, 80, 81, -1, 75, 81, 82, -1, 82, 77, 76, -1, 82, 76, 83, -1, 83, 75, 82, -1, 76, 84, 83, -1, 85, 83, 84, -1, 56, 68, 23, -1, 41, 23, 68, -1, 68, 62, 41, -1, 40, 41, 62, -1, 62, 69, 40, -1, 40, 69, 63, -1, 38, 40, 63, -1, 63, 70, 38, -1, 39, 38, 70, -1, 70, 59, 39, -1, 42, 39, 59, -1, 59, 71, 42, -1, 42, 71, 53, -1, 2, 42, 53, -1, 53, 64, 2, -1, 47, 2, 64, -1, 64, 50, 47, -1, 46, 47, 50, -1, 50, 65, 46, -1, 46, 65, 49, -1, 45, 46, 49, -1, 49, 66, 45, -1, 43, 45, 66, -1, 66, 48, 43, -1, 44, 43, 48, -1, 48, 67, 44, -1, 44, 67, 56, -1, 23, 44, 56, -1, 48, 49, 50, -1, 51, 48, 50, -1, 52, 51, 50, -1, 50, 53, 52, -1, 48, 51, 54, -1, 48, 54, 55, -1, 56, 48, 55, -1, 57, 52, 53, -1, 55, 58, 56, -1, 59, 60, 61, -1, 59, 61, 57, -1, 53, 59, 57, -1, 60, 59, 62, -1, 58, 60, 62, -1, 62, 56, 58, -1, 59, 63, 62, -1, 0, 45, 22, -1, 21, 0, 22, -1, 45, 0, 3, -1, 38, 39, 1, -1, 40, 38, 24, -1, 41, 40, 24, -1, 24, 23, 41, -1, 1, 39, 42, -1, 2, 1, 42, -1, 22, 43, 44, -1, 23, 22, 44, -1, 45, 43, 22, -1, 46, 45, 3, -1, 47, 46, 3, -1, 3, 2, 47, -1, 20, 26, 7, -1, 6, 7, 26, -1, 26, 28, 6, -1, 9, 6, 28, -1, 28, 31, 9, -1, 11, 9, 31, -1, 31, 35, 11, -1, 13, 11, 35, -1, 34, 37, 16, -1, 17, 16, 37, -1, 36, 18, 37, -1, 17, 37, 18, -1, 36, 30, 18, -1, 12, 18, 30, -1, 4, 8, 25, -1, 27, 25, 8, -1, 8, 10, 27, -1, 29, 27, 10, -1, 10, 12, 29, -1, 30, 29, 12, -1, 25, 19, 4, -1, 5, 4, 19, -1, 24, 38, 19, -1, 19, 38, 1, -1, 5, 19, 1, -1, 20, 7, 21, -1, 0, 21, 7, -1, 19, 20, 21, -1, 19, 21, 22, -1, 19, 22, 23, -1, 24, 19, 23, -1, 20, 19, 25, -1, 26, 20, 25, -1, 25, 27, 26, -1, 28, 26, 27, -1, 27, 29, 28, -1, 28, 29, 30, -1, 31, 28, 30, -1, 32, 33, 34, -1, 34, 33, 35, -1, 36, 34, 35, -1, 36, 35, 31, -1, 30, 36, 31, -1, 37, 34, 36, -1, 0, 1, 2, -1, 3, 0, 2, -1, 0, 4, 5, -1, 1, 0, 5, -1, 4, 0, 6, -1, 6, 0, 7, -1, 8, 4, 6, -1, 6, 9, 8, -1, 10, 8, 9, -1, 9, 11, 10, -1, 12, 10, 11, -1, 11, 13, 12, -1, 14, 15, 13, -1, 13, 15, 16, -1, 12, 13, 16, -1, 12, 16, 17, -1, 18, 12, 17, -1
                        ]
                        creaseAngle 0.785398
                      }
                    }
                  ]
                }
              ]
            }
          ]
          fieldOfView IS camera_fieldOfView
          width IS camera_width
          height IS camera_height
          near 0.0055
          antiAliasing IS camera_antiAliasing
          motionBlur IS camera_motionBlur
          noise IS camera_noise
          zoom Zoom {
          }
          %{ if usingDetectionApi == true then }%
          recognition Recognition {
          }
          %{ end }%
        }`
      }
      if(this.selectedComponents[component]["name"] in ["Gyro","GPS",]){
        proto_code += `
        ${this.selectedComponents[component]["name"]} {
          translation ${this.selectedComponents[component]["x"]} ${this.selectedComponents[component]["y"]} ${this.selectedComponents[component]["z"]}
          name ${this.selectedComponents[component]["customName"]}
        }
        `;
      }
      if(this.selectedComponents[component]["name"] == "Light sensor"){
        proto_code += `
        LightSensor {
          translation ${this.selectedComponents[component]["x"]} ${this.selectedComponents[component]["y"]} ${this.selectedComponents[component]["z"]}
          name "${this.selectedComponents[component]["customName"]}"
          lookupTable [
            0 21 0
            2 25 0
            5 30 0
            12 37 0
            1000 38 0
          ]
          colorFilter 1 0 0
          occlusion TRUE
        }
        `;
      }
      if(this.selectedComponents[component]["name"] == "Colour sensor"){
        proto_code += `
        Camera {
          translation ${this.selectedComponents[component]["x"]} ${this.selectedComponents[component]["y"]} ${this.selectedComponents[component]["z"]}
          name "${this.selectedComponents[component]["customName"]}"
          width 1
          height 1
        }
        `;
      }
      if(this.selectedComponents[component]["name"] == "Sensor"){
        proto_code += `
        DistanceSensor {
          translation ${this.selectedComponents[component]["x"]} ${this.selectedComponents[component]["y"]} ${this.selectedComponents[component]["z"]}
          name "${this.selectedComponents[component]["customName"]}"
          lookupTable [
            0 0 0
            0.8 0.8 0
          ]
          type "infra-red"
        }
        `;
      }
      if(this.selectedComponents[component]["name"]== "Accelerometer") {
        proto_code += `
        Accelerometer {
          lookupTable [ -100 -100 0.003 100 100 0.003 ]
          translation ${this.selectedComponents[component]["x"]} ${this.selectedComponents[component]["y"]} ${this.selectedComponents[component]["z"]}
        }`;
      }
      if(this.selectedComponents[component]["name"] == "Wheel"){
        proto_code += `
        HingeJoint {
          jointParameters HingeJointParameters {
            axis -1 0 0
            anchor 0 0.02 0
          }
          device [
            RotationalMotor {
              name "${this.selectedComponents[component]["customName"]} motor"
              consumptionFactor -0.001 # small trick to encourage the movement (calibrated for the rat's life contest)
              maxVelocity IS max_velocity
            }
            PositionSensor {
              name "${this.selectedComponents[component]["customName"]} sensor"
              resolution 0.00628  # (2 * pi) / 1000
            }
          ]
          endPoint Solid {
            translation ${this.selectedComponents[component]["x"]} ${this.selectedComponents[component]["y"]} ${this.selectedComponents[component]["z"]}
            rotation 1 0 0 0
            children [
              DEF EPUCK_WHEEL Transform {
                rotation 0 0 1 1.57
                children [
                  Shape {
                    appearance DEF EPUCK_TRANSPARENT_APPEARANCE PBRAppearance {
                      baseColor 0.5 0.5 0.5
                      transparency 0.4
                      roughness 0.5
                      metalness 0
                    }
                    geometry Cylinder {
                      height 0.003
                      radius 0.02
                      subdivision 24
                    }
                  }
                  Transform {
                    translation 0 0.0016 0
                    children [
                      Shape {
                        appearance PBRAppearance {
                          metalness 0
                          roughness 0.4
                          baseColorMap ImageTexture {
                            url [
                              "textures/gctronic_logo.png"
                            ]
                          }
                        }
                        geometry IndexedFaceSet {
                          coord Coordinate {
                            point [
                              -0.014 0 -0.014 -0.014 0 0.014 0.014 0 0.014 0.014 0 -0.014
                            ]
                          }
                          texCoord TextureCoordinate {
                            point [
                              0 0 1 0 1 1 0 1
                            ]
                          }
                          coordIndex [
                            0, 1, 2, 3
                          ]
                          texCoordIndex [
                            0, 1, 2, 3
                          ]
                        }
                      }
                    ]
                  }
                  Shape {
                    appearance PBRAppearance {
                      metalness 0
                      roughness 0.4
                      %{ if v1 then }%
                      baseColor 0.117647 0.815686 0.65098
                      %{ else }%
                      baseColor 0 0 0
                      %{ end }%
                    }
                    geometry Cylinder {
                      height 0.0015
                      radius 0.0201
                      subdivision 24
                      top FALSE
                      bottom FALSE
                    }
                  }
                  Transform {
                    translation 0 0.0035 0
                    children [
                      Shape {
                        appearance USE EPUCK_TRANSPARENT_APPEARANCE
                        geometry Cylinder {
                          height 0.004
                          radius 0.005
                        }
                      }
                    ]
                  }
                  Transform {
                    children [
                      Shape {
                        appearance PBRAppearance {
                        }
                        geometry Cylinder {
                          height 0.013
                          radius 0.003
                          subdivision 6
                        }
                      }
                    ]
                  }
                  Transform {
                    translation 0 0.0065 0
                    children [
                      Shape {
                        appearance PBRAppearance {
                          baseColor 1 0.647059 0
                          metalness 0
                          roughness 0.6
                        }
                        geometry Cylinder {
                          height 0.0001
                          radius 0.002
                        }
                      }
                    ]
                  }
                ]
              }
            ]
            name "${this.selectedComponents[component]["customName"]}"
            boundingObject DEF EPUCK_WHEEL_BOUNDING_OBJECT Transform {
              rotation 0 0 1 1.57
              children [
                Cylinder {
                  height 0.005
                  radius 0.02
                  subdivision 24
                }
              ]
            }
            %{ if kinematic == false then }%
              physics DEF EPUCK_WHEEL_PHYSICS Physics {
                density -1
                mass 0.005
              }
            %{ end }%
          }
        }
        `
      }
    }
    proto_code += "\n\t]\n}"
    proto_code += closeBracket;
    this.download("robot.proto",proto_code);
    console.log(proto_code);

  }
  //https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server
  download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
  }
  
}
