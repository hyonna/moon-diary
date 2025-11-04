import { createClient } from '@supabase/supabase-js'
import { DiaryEntry } from '@/types/diary'

// Supabase 환경 변수는 .env.local에 설정해야 합니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 테이블 이름
export const DIARY_TABLE = 'diary_entries'

// Storage 버킷 이름
export const STORAGE_BUCKET = 'diary-media'

// 파일 업로드 함수
export const uploadFile = async (file: File, entryId?: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = entryId ? `${entryId}/${fileName}` : `temp/${fileName}`

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      
      // 버킷이 없는 경우 에러 메시지 반환
      if (error.message?.includes('Bucket not found') || error.message?.includes('not found')) {
        throw new Error('Storage 버킷이 설정되지 않았습니다. Supabase 대시보드에서 "diary-media" 버킷을 생성해주세요.')
      }
      
      // RLS 정책 오류
      if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        throw new Error('Storage 버킷 정책이 설정되지 않았습니다. Storage → Policies → diary-media에서 정책을 생성해주세요. (SELECT, INSERT, UPDATE, DELETE 모두 허용)')
      }
      
      throw new Error(`파일 업로드 실패: ${error.message || '알 수 없는 오류'}`)
    }

    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Error in uploadFile:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('파일 업로드 중 오류가 발생했습니다.')
  }
}

// 파일 삭제 함수
export const deleteFile = async (url: string): Promise<boolean> => {
  try {
    // URL에서 파일 경로 추출
    // Supabase Storage 공개 URL 형식: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    const bucketIndex = pathParts.indexOf(STORAGE_BUCKET)
    
    if (bucketIndex === -1) {
      console.error('Bucket not found in URL')
      return false
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/')
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Error deleting file:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteFile:', error)
    return false
  }
}

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
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Entry data:', JSON.stringify(entry, null, 2))
      
      // UNIQUE 제약조건 오류 (같은 날짜에 이미 일기가 있는 경우)
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        throw new Error(`이미 ${entry.date}에 일기가 존재합니다. 수정 모드로 변경하거나 다른 날짜를 선택해주세요.`)
      }
      
      throw new Error(`일기 저장 실패: ${error.message || error.code || '알 수 없는 오류'}`)
    }

    // 임시 파일들을 실제 entry ID 경로로 이동 (필요시)
    if (data.id && entry.media_urls && entry.media_urls.length > 0) {
      // 여기서는 업로드 시 이미 올바른 경로로 저장되므로 추가 작업 불필요
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
  },

  // 일기 삭제
  async deleteEntry(id: string): Promise<boolean> {
    // 먼저 일기 정보를 가져와서 미디어 파일 삭제
    const entry = await this.getEntryById(id)
    
    if (entry && entry.media_urls && entry.media_urls.length > 0) {
      // 미디어 파일들 삭제
      for (const url of entry.media_urls) {
        await deleteFile(url)
      }
    }

    // 일기 삭제
    const { error } = await supabase.from(DIARY_TABLE).delete().eq('id', id)

    if (error) {
      console.error('Error deleting entry:', error)
      return false
    }

    return true
  }
}
