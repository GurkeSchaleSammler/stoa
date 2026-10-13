import { TestBed } from '@angular/core/testing';
import { MarkdownContentComponent } from './markdown-content';

describe('MarkdownContentComponent', () => {
  it('renders headings, lists, emphasis, links, tables and code without exposing Markdown syntax', () => {
    const fixture = TestBed.createComponent(MarkdownContentComponent);
    fixture.componentRef.setInput(
      'content',
      '# SSH\n\n- **Keys**\n- *Config*\n\n[Docs](https://example.com)\n\n```sh\nssh host\n```\n\n| A | B |\n| - | - |\n| 1 | 2 |',
    );
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toBe('SSH');
    expect(element.querySelectorAll('li')).toHaveLength(2);
    expect(element.querySelector('strong')?.textContent).toBe('Keys');
    expect(element.querySelector('em')?.textContent).toBe('Config');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
    expect(element.querySelector('pre code')?.textContent?.trim()).toBe('ssh host');
    expect(element.querySelectorAll('td')).toHaveLength(2);
  });

  it('keeps raw HTML inert and prevents executable Markdown links', () => {
    const fixture = TestBed.createComponent(MarkdownContentComponent);
    fixture.componentRef.setInput(
      'content',
      '<img src=x onerror=alert(1)>\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)\n\n`<script>code</script>`',
    );
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('script')).toBeNull();
    expect(element.querySelector('img')).toBeNull();
    expect(element.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(element.querySelector('a')?.getAttribute('href')).not.toMatch(/^javascript:/);
    expect(element.querySelector('code')?.textContent).toBe('<script>code</script>');
  });

  it('preserves plain-text line breaks and renders task lists without interactive inputs', () => {
    const fixture = TestBed.createComponent(MarkdownContentComponent);
    fixture.componentRef.setInput('content', 'First line\nSecond line\n\n- [x] Done\n- [ ] Next');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('br')).not.toBeNull();
    expect(element.querySelectorAll('.markdown-checkbox')).toHaveLength(2);
    expect(element.querySelector('input')).toBeNull();
    expect(element.textContent).toContain('☑');
    expect(element.textContent).toContain('☐');
  });
});
