import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { RegisterComponent } from './register';

describe('Register', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentRef.setInput('fieldErrors', {
      name: null,
      email: null,
      password: null,
      passwordConfirm: null,
    });
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
