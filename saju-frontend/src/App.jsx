// src/App.jsx

import { useState, useEffect } from 'react'

// 배포 환경별로 다른 백엔드 주소를 쓰기 위해 Vite 환경변수로 분리 (.env.local 참고)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// 진태양시 보정용 주요 도시 목록. cities.py의 CITY_LONGITUDE 키와 동일하게 유지할 것
const BIRTH_CITIES = [
  '서울', '인천', '수원', '춘천', '대전', '세종', '청주',
  '대구', '포항', '안동', '부산', '울산', '창원', '진주',
  '광주', '전주', '목포', '여수', '제주', '강릉',
]

// 오행별 배지 색상 (화이트/파스텔 톤에 맞춘 저채도 배색)
const OHENG_COLORS = {
  목: 'bg-emerald-50 text-emerald-600',
  화: 'bg-rose-50 text-rose-600',
  토: 'bg-amber-50 text-amber-600',
  금: 'bg-slate-100 text-slate-600',
  수: 'bg-sky-50 text-sky-600',
}

// 결과 화면 탭 구성
const TABS = [
  { id: 'overall', label: '종합' },
  { id: 'personality', label: '성격' },
  { id: 'career', label: '직업' },
  { id: 'love', label: '연애' },
  { id: 'family', label: '가정' },
  { id: 'celebrity', label: '닮은꼴' },
]

const PILLAR_ITEMS = [
  { key: 'year_pillar', label: '연주' },
  { key: 'month_pillar', label: '월주' },
  { key: 'day_pillar', label: '일주' },
  { key: 'hour_pillar', label: '시주' },
]

const inputClass =
  'w-full rounded-lg bg-white border border-slate-200 px-3 py-3 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-colors'

function InterpretationCard({ title, text }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h2 className="text-base font-semibold mb-2 text-violet-600">{title}</h2>
      <p className="text-slate-600 leading-relaxed">{text}</p>
    </div>
  )
}

function FamilyGlyphRow({ glyph }) {
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

function App() {
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('0')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')
  const [isLeapMonth, setIsLeapMonth] = useState(false)
  const [birthCity, setBirthCity] = useState('')

  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('overall')

  // 유명인 매칭은 별도 엔드포인트라 "닮은꼴" 탭을 처음 열 때만 지연 조회
  const [lastRequestBody, setLastRequestBody] = useState(null)
  const [celebrityMatches, setCelebrityMatches] = useState(null)
  const [celebrityLoading, setCelebrityLoading] = useState(false)
  const [celebrityError, setCelebrityError] = useState('')

  async function fetchHistory() {
    try {
      const response = await fetch(`${API_BASE}/history`)
      const data = await response.json()
      setHistory(data)
    } catch (err) {
      console.error('히스토리 불러오기 실패:', err)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!gender) {
      setError('성별을 선택해주세요.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setActiveTab('overall')
    setCelebrityMatches(null)
    setCelebrityError('')

    const requestBody = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      gender,
      calendar_type: calendarType,
      is_leap_month: calendarType === 'lunar' ? isLeapMonth : false,
      birth_city: birthCity || null,
    }

    try {
      const response = await fetch(`${API_BASE}/saju`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '요청에 실패했습니다.')
      }

      const data = await response.json()
      setResult(data)
      setLastRequestBody(requestBody)
      fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCelebrityMatches() {
    if (!lastRequestBody || celebrityMatches || celebrityLoading) return
    setCelebrityLoading(true)
    setCelebrityError('')

    try {
      const response = await fetch(`${API_BASE}/saju/celebrity-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastRequestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '유명인 매칭에 실패했습니다.')
      }

      const data = await response.json()
      setCelebrityMatches(data.matches)
    } catch (err) {
      setCelebrityError(err.message)
    } finally {
      setCelebrityLoading(false)
    }
  }

  function handleTabClick(tabId) {
    setActiveTab(tabId)
    if (tabId === 'celebrity') loadCelebrityMatches()
  }

  return (
    // 하단 고정 탭바(모바일)에 콘텐츠가 가리지 않도록 결과가 있을 때만 여백 확보
    <div className={`min-h-screen bg-[#FAFAFA] text-slate-800 py-8 px-4 ${result ? 'pb-24 md:pb-8' : ''}`}>
      <div className="max-w-md md:max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-center mb-8 text-slate-800">
          온라인 사주
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">연도</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="1990"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">월</label>
              <input
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="10"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">일</label>
              <input
                type="number"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="10"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">시(24시간)</label>
              <input
                type="number"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                placeholder="14"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">분</label>
            <input
              type="number"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">양력 / 음력</p>
            <div className="flex gap-2">
              {[
                { value: 'solar', label: '양력' },
                { value: 'lunar', label: '음력' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 min-h-[44px] flex items-center justify-center rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                    calendarType === opt.value
                      ? 'border-violet-300 bg-violet-50 text-violet-600'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="calendarType"
                    value={opt.value}
                    checked={calendarType === opt.value}
                    onChange={(e) => setCalendarType(e.target.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            {calendarType === 'lunar' && (
              <label className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={isLeapMonth}
                  onChange={(e) => setIsLeapMonth(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-500 focus:ring-violet-200"
                />
                윤달입니다
              </label>
            )}
          </div>

          <div>
            <p className="text-sm text-slate-400 mb-2">성별</p>
            <div className="flex gap-2">
              {[
                { value: '남성', label: '남성' },
                { value: '여성', label: '여성' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 min-h-[44px] flex items-center justify-center rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                    gender === opt.value
                      ? 'border-violet-300 bg-violet-50 text-violet-600'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={gender === opt.value}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">출생 도시 (선택)</label>
            <select
              value={birthCity}
              onChange={(e) => setBirthCity(e.target.value)}
              className={inputClass}
            >
              <option value="">선택 안 함 (서울 기준)</option>
              {BIRTH_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">출생 도시를 입력하면 진태양시 보정으로 정확도가 높아집니다.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] bg-violet-300 hover:bg-violet-400 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 transition-colors"
          >
            {loading ? '해석 생성 중...' : '사주 보기'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-rose-500 bg-rose-50 rounded-lg py-2 px-4">
            {error}
          </p>
        )}

        {result && (
          <>
            {/* 탭 내비게이션: 모바일은 하단 고정, md 이상은 결과 영역 상단에 위치 */}
            <nav className="fixed bottom-0 inset-x-0 z-10 bg-white border-t border-slate-100 md:static md:mt-6 md:border md:rounded-2xl md:shadow-sm">
              <div className="max-w-md md:max-w-2xl mx-auto flex justify-around md:justify-center md:gap-2 md:p-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex-1 md:flex-none min-h-[44px] px-2 md:px-4 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-violet-600 bg-violet-50'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="mt-6 space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold mb-4 text-slate-800">사주 결과</h2>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {PILLAR_ITEMS.map((item) => (
                    <div key={item.key} className="bg-slate-50 rounded-lg py-3">
                      <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                      <p className="text-xl font-bold text-slate-800">{result[item.key].hanja}</p>
                      <p className="text-xs text-slate-400">{result[item.key].hangul}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {Object.entries(result.oheng_analysis.distribution).map(([element, count]) => (
                    <span
                      key={element}
                      className={`${OHENG_COLORS[element]} text-sm font-medium rounded-full px-3 py-1`}
                    >
                      {element} {count}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  일간: <span className="text-slate-600 font-medium">{result.oheng_analysis.day_master.hanja}</span>
                  {' '}({result.oheng_analysis.day_master.element})
                </p>
              </div>

              {activeTab === 'overall' && (
                <>
                  <InterpretationCard title="종합운" text={result.interpretation.overall} />
                  <InterpretationCard title="금전운" text={result.interpretation.money} />
                </>
              )}
              {activeTab === 'personality' && (
                <InterpretationCard title="성격" text={result.interpretation.personality} />
              )}
              {activeTab === 'career' && (
                <InterpretationCard title="직업운" text={result.interpretation.career} />
              )}
              {activeTab === 'love' && (
                <InterpretationCard title="연애운" text={result.interpretation.love} />
              )}

              {activeTab === 'family' && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-base font-semibold mb-1 text-slate-800">가정</h2>
                  <p className="text-xs text-slate-400 mb-4">{result.family_analysis.disclaimer}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PILLAR_ITEMS.map((item) => {
                      const pillar = result.family_analysis.pillars[item.key]
                      return (
                        <div key={item.key} className="bg-slate-50/60 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-2">
                            {pillar.label} <span className="text-slate-300">· {pillar.position_meaning}</span>
                          </p>
                          <div className="space-y-2">
                            <FamilyGlyphRow glyph={pillar.cheongan} />
                            <FamilyGlyphRow glyph={pillar.jiji} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'celebrity' && (
                <div className="space-y-4">
                  {celebrityLoading && (
                    <p className="text-center text-slate-400 bg-white rounded-2xl p-6 border border-slate-100">
                      닮은 유명인을 찾는 중...
                    </p>
                  )}
                  {celebrityError && (
                    <p className="text-center text-rose-500 bg-rose-50 rounded-lg py-2 px-4">
                      {celebrityError}
                    </p>
                  )}
                  {celebrityMatches?.map((m) => (
                    <div key={m.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold text-violet-600">{m.name}</h3>
                        <span className="text-xs bg-slate-50 text-slate-500 rounded-full px-2 py-1">
                          {m.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">매칭 기준: {m.match_reason}</p>
                      <p className="text-slate-500 text-sm mb-3">{m.bio}</p>
                      {m.comparison && (
                        <p className="text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                          {m.comparison}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-8">
          <h2 className="text-base font-semibold mb-3 text-slate-500">최근 조회 기록</h2>
          {history.length === 0 ? (
            <p className="text-slate-300 text-sm">아직 조회 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="bg-white rounded-lg px-4 py-3 text-sm flex justify-between items-center border border-slate-100"
                >
                  <span className="text-slate-400">
                    {item.year}.{item.month}.{item.day} {item.hour}시{item.minute}분
                  </span>
                  <span className="font-medium text-slate-600">
                    {item.result.day_pillar.hanja} ({item.result.day_pillar.hangul})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
