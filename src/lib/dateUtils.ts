import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('ko');
dayjs.extend(relativeTime);

export const dateUtils = {
  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환
  getTodayString: (): string => {
    return dayjs().format('YYYY-MM-DD');
  },

  // 날짜 문자열을 dayjs 객체로 변환
  parseDate: (dateString: string): dayjs.Dayjs => {
    return dayjs(dateString);
  },

  // 날짜를 YYYY-MM-DD 형식으로 포맷
  formatDate: (date: string | Date | dayjs.Dayjs): string => {
    return dayjs(date).format('YYYY-MM-DD');
  },

  // 날짜를 한국어 형식으로 포맷 (2025년 11월 2일 (일))
  formatDateKorean: (date: string | Date | dayjs.Dayjs): string => {
    return dayjs(date).format('YYYY년 M월 D일 (ddd)');
  },

  // 상대적 날짜 표시 (오늘, 어제, 또는 날짜)
  formatRelativeDate: (dateString: string): string => {
    const date = dayjs(dateString);
    const today = dayjs();
    const yesterday = today.subtract(1, 'day');

    if (date.isSame(today, 'day')) {
      return '오늘';
    } else if (date.isSame(yesterday, 'day')) {
      return '어제';
    } else {
      return date.format('YYYY년 M월 D일 ddd');
    }
  },

  // 년, 월 추출
  getYear: (date: string | Date | dayjs.Dayjs): number => {
    return dayjs(date).year();
  },

  getMonth: (date: string | Date | dayjs.Dayjs): number => {
    return dayjs(date).month() + 1; // 1-12 형식
  },

  // 월의 첫 번째 날과 마지막 날
  getFirstDayOfMonth: (year: number, month: number): dayjs.Dayjs => {
    return dayjs(`${year}-${month}-01`);
  },

  getLastDayOfMonth: (year: number, month: number): dayjs.Dayjs => {
    return dayjs(`${year}-${month}-01`).endOf('month');
  },

  // 월의 첫 번째 날 요일 (0=일요일)
  getFirstDayOfWeek: (year: number, month: number): number => {
    return dayjs(`${year}-${month}-01`).day();
  },

  // 월의 일수
  getDaysInMonth: (year: number, month: number): number => {
    return dayjs(`${year}-${month}-01`).daysInMonth();
  },

  // 시간 포맷 (HH:mm 형식)
  formatTime: (dateString: string | Date | dayjs.Dayjs): string => {
    return dayjs(dateString).format('HH:mm');
  },

  // 날짜와 시간 포맷 (YYYY-MM-DD HH:mm 형식)
  formatDateTime: (dateString: string | Date | dayjs.Dayjs): string => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm');
  },

  // 상대 시간 표시 (24시간 이내면 상대 시간, 아니면 날짜+시간)
  formatRelativeTime: (dateString: string | Date | dayjs.Dayjs): string => {
    const date = dayjs(dateString);
    const now = dayjs();
    const diffInHours = now.diff(date, 'hour');
    
    // 24시간 이내면 상대 시간 표시
    if (diffInHours < 24) {
      const diffInMinutes = now.diff(date, 'minute');
      
      if (diffInMinutes < 1) {
        return '방금 전';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes}분 전`;
      } else {
        return `${diffInHours}시간 전`;
      }
    } else {
      // 24시간 이상이면 날짜+시간 형식
      return date.format('YYYY-MM-DD HH:mm');
    }
  },
};

