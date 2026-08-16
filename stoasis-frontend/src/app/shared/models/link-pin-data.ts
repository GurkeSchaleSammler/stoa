export interface LinkPinData {
  url: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  siteName: string | null;
  readingTimeMin: number | null;
  parseStatus: 'ok' | 'failed' | 'pending';
}
