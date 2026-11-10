export type StepType = 'text' | 'video' | 'flashcard' | 'quiz';

export interface FlashcardItem {
  front_latin: string;
  front_tifinagh?: string;
  back_text: string;
  audio_url?: string;
  notes?: string;
}

export interface QuizQuestion {
  question: string;
  answers: string[];
  correct_index: number;
  explanation?: string;
}

export interface Step {
  id: string | number;
  type: StepType;
  sort_order: number;
  linked_headword_id?: number | null;
  content: any;
  isNew?: boolean;
  isDeleted?: boolean;
}
