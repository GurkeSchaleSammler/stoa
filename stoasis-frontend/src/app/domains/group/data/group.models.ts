import { BoardKind, SkillLevel } from '../../skill/data/profile-board.models';

export type SharingPreference = 'NONE' | 'WORK_ONLY' | 'PERSONAL_ONLY' | 'BOTH';

export interface GroupSummary {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  mySharingPreference: SharingPreference;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  sharingPreference: SharingPreference | null;
  joinedAt: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  ownerId: string;
  inviteToken: string | null;
  mySharingPreference: SharingPreference;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupSkill {
  pinId: string;
  boardKind: BoardKind;
  skillName: string;
  level: SkillLevel;
  yearsExperience: number | null;
}

export interface GroupSkillMember {
  userId: string;
  name: string;
  skills: GroupSkill[];
}
