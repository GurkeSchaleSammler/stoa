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
export const themeModes = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof themeModes)[number];
export const colorPalettes = [
  'default',
  'yellow',
  'dark-green',
  'pink',
  'purple',
  'burgundy',
] as const;
export type ColorPalette = (typeof colorPalettes)[number];
export interface Preferences {
  theme: ThemeMode;
  palette: ColorPalette;
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
