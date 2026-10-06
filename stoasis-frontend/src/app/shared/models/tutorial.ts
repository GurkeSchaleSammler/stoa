export interface TutorialStep {
  title: string;
  text: string;
  anchor: string;
}
export interface Tutorial {
  key: string;
  title: string;
  introduction: string;
  steps: TutorialStep[];
}
export interface UserFlag {
  key: string;
  outcome: 'completed' | 'skipped';
  seenAt: string;
}
