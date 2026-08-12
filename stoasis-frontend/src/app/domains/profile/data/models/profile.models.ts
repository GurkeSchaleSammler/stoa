import { BoardViewMode, Plan, User } from '../../../../shared/models/core.models';

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
}
export interface AvatarUpload {
  imageUrl: string;
  fileKey: string;
  originalName: string;
}
export type ExportFormat = 'json' | 'csv';
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
export type Theme = 'light' | 'dark' | 'system';
export interface Preferences {
  theme: Theme;
  defaultView: BoardViewMode;
}
export interface ProfileFormValue {
  name: string;
  avatarUrl: string;
}
export interface ProfileState {
  user: User | null;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
  success: string | null;
}
export type { Plan } from '../../../../shared/models/core.models';
