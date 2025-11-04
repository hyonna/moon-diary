// 감정 상태를 달의 모양으로 표현
export type MoonPhase = 'new' | 'waxing' | 'full' | 'waning';

export interface MoodMapping {
  phase: MoonPhase;
  emoji: string;
  name: string;
  description: string;
}

export const MOOD_MAPPINGS: Record<MoonPhase, MoodMapping> = {
  new: {
    phase: 'new',
    emoji: '🌑',
    name: '신월',
    description: '우울/무기력',
  },
  waxing: {
    phase: 'waxing',
    emoji: '🌓',
    name: '상현달',
    description: '집중/성취',
  },
  full: {
    phase: 'full',
    emoji: '🌕',
    name: '보름달',
    description: '기쁨/에너지 충만',
  },
  waning: {
    phase: 'waning',
    emoji: '🌗',
    name: '하현달',
    description: '평온/안정',
  },
};

export interface DiaryEntry {
  id?: string;
  date: string; // YYYY-MM-DD 형식
  mood: MoonPhase;
  note?: string;
  media_urls?: string[]; // 이미지/동영상 URL 배열
  created_at?: string;
  updated_at?: string;
}

