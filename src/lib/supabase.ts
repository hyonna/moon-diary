import { createClient } from '@supabase/supabase-js'
import { DiaryEntry } from '@/types/diary'

// Supabase 환경 변수는 .env.local에 설정해야 합니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 테이블 이름
export const DIARY_TABLE = 'diary_entries'

// 일기 엔트리 관련 함수들
export const diaryService = {
  // 특정 날짜의 일기들 가져오기
  async getEntriesByDate(date: string): Promise<DiaryEntry[]> {
    const { data, error } = await supabase
      .from(DIARY_TABLE)
      .select('*')
      .eq('date', date)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching entries by date:', error)
      return []
    }

    return data || []
  },

  // ID로 특정 일기 가져오기
  async getEntryById(id: string): Promise<DiaryEntry | null> {
    const { data, error } = await supabase.from(DIARY_TABLE).select('*').eq('id', id).single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching entry by id:', error)
      return null
    }

    return data
  },

  // 새 일기 저장
  async insertEntry(entry: DiaryEntry): Promise<DiaryEntry | null> {
    const { data, error } = await supabase.from(DIARY_TABLE).insert(entry).select().single()

    if (error) {
      console.error('Error inserting entry:', error)
      return null
    }

    return data
  },

  // 일기 수정 (id 기반)
  async updateEntry(id: string, entry: Partial<DiaryEntry>): Promise<DiaryEntry | null> {
    const { data, error } = await supabase.from(DIARY_TABLE).update(entry).eq('id', id).select().single()

    if (error) {
      console.error('Error updating entry:', error)
      return null
    }

    return data
  },

  // 기간 내 모든 일기 가져오기
  async getEntriesByDateRange(startDate: string, endDate: string): Promise<DiaryEntry[]> {
    const { data, error } = await supabase
      .from(DIARY_TABLE)
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching entries:', error)
      return []
    }

    return data || []
  },

  // 전체 일기 가져오기 (클라이언트에서 날짜 기준 정렬)
  async getAllEntries(): Promise<DiaryEntry[]> {
    const { data, error } = await supabase.from(DIARY_TABLE).select('*')

    if (error) {
      console.error('Error fetching all entries:', error)
      return []
    }

    return data || []
  }
}
