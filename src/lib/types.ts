export type StepType = 'text' | 'video' | 'flashcard' | 'quiz';

export interface Step {
  id: string | number; // 'number' for DB rows, 'string' (uuid) for new temp items
  type: StepType;
  sort_order: number;
  content: any; // We will refine this per type later
  isNew?: boolean; // Helper to know if we need INSERT or UPDATE
  isDeleted?: boolean; // (Optional) If you want to soft-delete before saving
}
