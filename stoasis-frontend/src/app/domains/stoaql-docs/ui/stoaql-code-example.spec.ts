import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoaQlCodeExampleComponent } from './stoaql-code-example';

describe('StoaQlCodeExampleComponent', () => {
  let fixture: ComponentFixture<StoaQlCodeExampleComponent>;
  const originalExecCommand = Object.getOwnPropertyDescriptor(document, 'execCommand');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoaQlCodeExampleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StoaQlCodeExampleComponent);
    fixture.componentRef.setInput('code', 'ADD "SSH"');
    await fixture.whenStable();
  });

  afterEach(() => {
    if (originalExecCommand) {
      Object.defineProperty(document, 'execCommand', originalExecCommand);
    } else {
      Reflect.deleteProperty(document, 'execCommand');
    }
  });

  it('renders and copies the supplied example', async () => {
    const copyCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: copyCommand,
    });

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    button?.click();
    await fixture.whenStable();

    expect(copyCommand).toHaveBeenCalledWith('copy');
    expect(button?.textContent).toContain('Kopiert');
  });
});
