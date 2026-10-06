export interface BoardTemplate {
  id: 'project' | 'week' | 'research' | 'moodboard' | 'learning';
  motif: string;
  sections: { title: string; color: string }[];
}
