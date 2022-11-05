import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreejsRenderComponent } from './threejs-render.component';

describe('ThreejsRenderComponent', () => {
  let component: ThreejsRenderComponent;
  let fixture: ComponentFixture<ThreejsRenderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ThreejsRenderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ThreejsRenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
