import { boardShortcut } from './board-shortcut';

describe('board clipboard shortcuts', () => {
  it('supports Ctrl and Command without intercepting text selection', () => {
    expect(boardShortcut(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }), false)).toBe(
      'copy',
    );
    expect(boardShortcut(new KeyboardEvent('keydown', { key: 'v', metaKey: true }), false)).toBe(
      'paste',
    );
    expect(
      boardShortcut(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true }), true),
    ).toBeNull();
    expect(
      boardShortcut(
        new KeyboardEvent('keydown', { key: 'v', ctrlKey: true, shiftKey: true }),
        false,
      ),
    ).toBeNull();
  });

  it('leaves text inputs, editable content and open native dialogs alone', () => {
    for (const tag of ['input', 'textarea', 'select', 'div', 'dialog']) {
      const element = document.createElement(tag);
      if (tag === 'div') element.setAttribute('contenteditable', 'true');
      if (tag === 'dialog') element.setAttribute('open', '');
      let command: string | null = 'unexpected';
      element.addEventListener(
        'keydown',
        (event) => (command = boardShortcut(event as KeyboardEvent, false)),
      );
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', ctrlKey: true }));
      expect(command).toBeNull();
    }
  });
});
