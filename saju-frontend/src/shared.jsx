// src/shared.jsx
// 입력 페이지와 결과 페이지가 공통으로 쓰는 상수/컴포넌트 모음

// 배포 환경별로 다른 백엔드 주소를 쓰기 위해 Vite 환경변수로 분리 (.env.local 참고)
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// 진태양시 보정용 주요 도시 목록. cities.py의 CITY_LONGITUDE 키와 동일하게 유지할 것
export const BIRTH_CITIES = [
  '서울', '인천', '수원', '춘천', '대전', '세종', '청주',
  '대구', '포항', '안동', '부산', '울산', '창원', '진주',
  '광주', '전주', '목포', '여수', '제주', '강릉',
]

// 오행별 배지 색상 (화이트/파스텔 톤에 맞춘 저채도 배색)
export const OHENG_COLORS = {
  목: 'bg-emerald-50 text-emerald-600',
  화: 'bg-rose-50 text-rose-600',
  토: 'bg-amber-50 text-amber-600',
  금: 'bg-slate-100 text-slate-600',
  수: 'bg-sky-50 text-sky-600',
}

export const TABS = [
  { id: 'overall', label: '종합' },
  { id: 'personality', label: '성격' },
  { id: 'career', label: '직업' },
  { id: 'love', label: '연애' },
  { id: 'family', label: '가정' },
  { id: 'celebrity', label: '닮은꼴' },
]

export const PILLAR_ITEMS = [
  { key: 'year_pillar', label: '연주' },
  { key: 'month_pillar', label: '월주' },
  { key: 'day_pillar', label: '일주' },
  { key: 'hour_pillar', label: '시주' },
]

export const inputClass =
  'w-full rounded-lg bg-white border border-slate-200 px-3 py-3 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-colors'

export function InterpretationCard({ title, text }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h2 className="text-base font-semibold mb-2 text-violet-600">{title}</h2>
      <p className="text-slate-600 leading-relaxed">{text}</p>
    </div>
  )
}

export function FamilyGlyphRow({ glyph }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-slate-800">{glyph.hanja}</span>
        {glyph.sipsin && (
          <span className="text-xs bg-violet-50 text-violet-500 rounded px-1.5 py-0.5">{glyph.sipsin}</span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-1">{glyph.family_label}</p>
    </div>
  )
}
