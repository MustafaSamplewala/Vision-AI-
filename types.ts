
export type AppState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING';

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

export interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
}
