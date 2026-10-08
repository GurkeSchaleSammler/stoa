import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ProfileSkillsPageComponent } from './profile-skills-page';
import { ProfileBoardApi } from './data/profile-board.api';
import { ProfileSkill } from './data/profile-board.models';
import { SessionContextStore } from '../../shared/application/session-context.store';
import { SnackbarService } from '../../shared/application/snackbar.service';
import { ViewportService } from '../../shared/application/viewport.service';

describe('Mobile skill cards', () => {
  const compact = signal(true);
  const skill: ProfileSkill = {
    id: 'skill',
    skillName: 'Research',
    level: 'ADVANCED',
    yearsExperience: 3,
    createdAt: '2026-10-08T12:00:00Z',
    grid: { id: 'grid', x: 10, y: 20, width: 24, heightClips: 20, layer: 1, contentType: 'skill' },
  };

  beforeEach(() => {
    compact.set(true);
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: ProfileBoardApi, useValue: {} },
        { provide: SessionContextStore, useValue: { user: signal(null) } },
        { provide: SnackbarService, useValue: {} },
        { provide: ViewportService, useValue: { compact } },
      ],
    });
  });

  it('lets touch gestures scroll without capturing or moving a card', () => {
    const component = TestBed.createComponent(ProfileSkillsPageComponent).componentInstance;
    const preventDefault = vi.fn();
    const capture = vi.fn();
    component.startDrag(
      {
        button: 0,
        pointerId: 1,
        preventDefault,
        currentTarget: { setPointerCapture: capture },
      } as unknown as PointerEvent,
      skill,
    );
    expect(preventDefault).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
    expect(component.dragState()).toBeNull();
  });

  it('keeps desktop board dragging available', () => {
    compact.set(false);
    const component = TestBed.createComponent(ProfileSkillsPageComponent).componentInstance;
    const capture = vi.fn();
    component.startDrag(
      {
        button: 0,
        pointerId: 1,
        clientX: 100,
        clientY: 150,
        preventDefault: vi.fn(),
        currentTarget: { setPointerCapture: capture },
      } as unknown as PointerEvent,
      skill,
    );
    expect(capture).toHaveBeenCalledWith(1);
    expect(component.dragState()?.origin).toEqual(skill.grid);
  });
});
