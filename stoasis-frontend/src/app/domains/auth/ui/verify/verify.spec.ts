import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { VerifyComponent } from './verify';

describe('Verify', () => {
  let component: VerifyComponent;
  let fixture: ComponentFixture<VerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyComponent],
      providers: [provideTranslateService({ fallbackLang: 'de', lang: 'de' })],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyComponent);
    fixture.componentRef.setInput('status', 'verifying');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
