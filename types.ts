
export type Tone = 'Professional' | 'Persuasive' | 'Minimalist' | 'Luxury';

export interface ImageState {
  original: string | null;
  edited: string | null;
  loading: boolean;
  error: string | null;
}

export interface CaptionState {
  text: string | null;
  loading: boolean;
  tone: Tone;
}
