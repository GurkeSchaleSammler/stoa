import { InterpolationParameters } from '@ngx-translate/core';
import { SnackbarTone } from './snackbar-tone';

export interface SnackbarMessage {
  id: number;
  message: string;
  params?: InterpolationParameters;
  tone: SnackbarTone;
  actionLabel?: string;
  action?: () => void;
}
