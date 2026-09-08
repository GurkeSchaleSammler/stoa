export type BoardKind = 'WORK' | 'PERSONAL';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
export type ProfileBoardVisibility = 'private' | 'link' | 'public';

export interface SkillGrid {
  id: string;
  x: number;
  y: number;
  width: number;
  heightClips: number;
  layer: number;
  contentType: 'skill';
}

export interface ProfileSkill {
  id: string;
  skillName: string;
  level: SkillLevel;
  yearsExperience: number | null;
  createdAt: string;
  grid: SkillGrid;
}

export interface ProfileBoard {
  id: string;
  name: string;
  boardKind: BoardKind;
  visibility: ProfileBoardVisibility;
  shareToken: string | null;
  accent: string | null;
  ownerName: string;
  ownerAvatarUrl: string | null;
  skills: ProfileSkill[];
}

export interface SaveProfileSkillRequest {
  skillName: string;
  level: SkillLevel;
  yearsExperience: number | null;
}
