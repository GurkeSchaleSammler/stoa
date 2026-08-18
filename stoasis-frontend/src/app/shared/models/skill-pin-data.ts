import { SkillLevel } from '../../domains/skill/data/profile-board.models';

export interface SkillPinData {
  skillName: string;
  level: SkillLevel;
  yearsExperience: number | null;
}
