export interface ConfirmationDialogRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: 'danger' | 'default';
}
