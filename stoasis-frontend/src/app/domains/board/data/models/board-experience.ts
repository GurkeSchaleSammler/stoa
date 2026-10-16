import { Pin } from '../../../../shared/models/pin';

export interface PresentationPath {
  id: string;
  name: string;
  pinIds: string[];
}
export interface PathDraft {
  id?: string;
  name: string;
  pinIds: string[];
}
export interface PinDate {
  pinId: string;
  startDate: string;
  endDate: string | null;
}
export interface DateDraft {
  pinId: string;
  startDate: string | null;
  endDate: string | null;
}
export interface BoardExperience {
  paths: PresentationPath[];
  dates: PinDate[];
  presentationPathLimit: number | null;
  connectorLabelLimit: number | null;
}
export function pinTitle(pin: Pin): string {
  switch (pin.type) {
    case 'link':
      return pin.data.title || pin.data.url;
    case 'note':
      return pin.data.title || pin.data.content.slice(0, 100);
    case 'photo':
      return pin.data.caption || '📷';
    case 'portal':
      return pin.data.label;
    case 'skill':
      return pin.data.skillName;
  }
}
export function orderedTimeline(
  pins: Pin[],
  dates: PinDate[],
): { pin: Pin; date: PinDate | null }[] {
  const byId = new Map(dates.map((date) => [date.pinId, date]));
  return pins
    .map((pin) => ({ pin, date: byId.get(pin.id) ?? null }))
    .sort(
      (a, b) =>
        (a.date?.startDate ?? '99999').localeCompare(b.date?.startDate ?? '99999') ||
        a.pin.sortOrder - b.pin.sortOrder ||
        a.pin.id.localeCompare(b.pin.id),
    );
}
