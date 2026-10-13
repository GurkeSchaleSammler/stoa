import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NativeModalDirective } from './native-modal';

@Component({
  imports: [NativeModalDirective],
  template: '<dialog uiNativeModal><button>Close image</button></dialog>',
})
class ModalHost {}

describe('Native overlay focus restoration', () => {
  afterEach(() => vi.restoreAllMocks());

  function render(remainingModal: HTMLDialogElement | null, opener: HTMLButtonElement) {
    TestBed.configureTestingModule({ imports: [ModalHost] });
    const fixture = TestBed.createComponent(ModalHost);
    const dialog: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    Object.defineProperties(dialog, {
      showModal: {
        value: () => {
          dialog.open = true;
          dialog.querySelector('button')!.focus();
        },
      },
      close: {
        value: () => {
          dialog.open = false;
        },
      },
    });
    const select = document.querySelector.bind(document);
    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) =>
      selector === 'dialog:modal' ? remainingModal : select(selector),
    );
    let restore: FrameRequestCallback | undefined;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      restore = callback;
      return 1;
    });
    opener.focus();
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    fixture.destroy();
    restore!(0);
  }

  it('returns focus inside the parent modal after a nested image overlay closes', () => {
    const parent = document.createElement('dialog');
    parent.open = true;
    const opener = document.createElement('button');
    parent.append(opener);
    document.body.append(parent);
    try {
      render(parent, opener);
      expect(document.activeElement).toBe(opener);
    } finally {
      parent.remove();
    }
  });

  it('does not steal focus from another modal that opens during close', () => {
    const opener = document.createElement('button');
    const otherModal = document.createElement('dialog');
    document.body.append(opener, otherModal);
    try {
      const focus = vi.spyOn(opener, 'focus');
      render(otherModal, opener);
      expect(focus).toHaveBeenCalledTimes(1);
    } finally {
      opener.remove();
      otherModal.remove();
    }
  });
});
