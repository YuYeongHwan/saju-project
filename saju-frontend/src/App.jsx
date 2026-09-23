// src/App.jsx

import { useState, useEffect } from 'react'

// 배포 환경별로 다른 백엔드 주소를 쓰기 위해 Vite 환경변수로 분리 (.env.local 참고)
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

// 오행별 배지 색상 (다크 테마 위에서 구분이 잘 되도록 선정)
const OHENG_COLORS = {
  목: 'bg-emerald-500',
  화: 'bg-red-500',
  토: 'bg-amber-500',
  금: 'bg-slate-400',
  수: 'bg-sky-500',
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

function InterpretationCard({ title, text }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-lg font-semibold mb-2 text-amber-400">{title}</h2>
      <p className="text-slate-300 leading-relaxed">{text}</p>
    </div>
  )
}

function FamilyGlyphRow({ glyph }) {
  return (
    <div className="bg-slate-700 rounded-lg px-3 py-2">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold">{glyph.hanja}</span>
        {glyph.sipsin && (
          <span className="text-xs bg-slate-600 text-amber-300 rounded px-1.5 py-0.5">{glyph.sipsin}</span>
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
  const [longitude, setLongitude] = useState('126.9784')

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
      longitude: Number(longitude),
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
    <div className={`min-h-screen bg-slate-900 text-slate-100 py-8 px-4 ${result ? 'pb-24 md:pb-8' : ''}`}>
      <div className="max-w-md md:max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-400">
          온라인 사주
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-2xl p-6 shadow-lg space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">연도(양력)</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="1990"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">월</label>
              <input
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="10"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">일</label>
              <input
                type="number"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="10"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">시(24시간)</label>
              <input
                type="number"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                placeholder="14"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-400 mb-1">분</label>
              <input
                type="number"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] bg-amber-400 hover:bg-amber-300 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg py-3 transition-colors"
          >
            {loading ? '해석 생성 중...' : '사주 보기'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-red-400 bg-red-900/30 rounded-lg py-2 px-4">
            {error}
          </p>
        )}

        {result && (
          <>
            {/* 탭 내비게이션: 모바일은 하단 고정, md 이상은 결과 영역 상단에 위치 */}
            <nav className="fixed bottom-0 inset-x-0 z-10 bg-slate-800 border-t border-slate-700 md:static md:mt-6 md:border md:rounded-2xl md:shadow-lg">
              <div className="max-w-md md:max-w-2xl mx-auto flex justify-around md:justify-center md:gap-2 md:p-2">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex-1 md:flex-none min-h-[44px] px-2 md:px-4 text-xs md:text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'text-amber-400 bg-slate-700 md:bg-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="mt-6 space-y-4">
              <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-amber-400">사주 결과</h2>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {PILLAR_ITEMS.map((item) => (
                    <div key={item.key} className="bg-slate-700 rounded-lg py-3">
                      <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                      <p className="text-xl font-bold">{result[item.key].hanja}</p>
                      <p className="text-xs text-slate-400">{result[item.key].hangul}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {Object.entries(result.oheng_analysis.distribution).map(([element, count]) => (
                    <span
                      key={element}
                      className={`${OHENG_COLORS[element]} text-slate-900 text-sm font-semibold rounded-full px-3 py-1`}
                    >
                      {element} {count}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  일간: <span className="text-slate-200 font-medium">{result.oheng_analysis.day_master.hanja}</span>
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
                <div className="bg-slate-800 rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-semibold mb-1 text-amber-400">가정</h2>
                  <p className="text-xs text-slate-500 mb-4">{result.family_analysis.disclaimer}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {PILLAR_ITEMS.map((item) => {
                      const pillar = result.family_analysis.pillars[item.key]
                      return (
                        <div key={item.key} className="bg-slate-900/50 rounded-xl p-3">
                          <p className="text-xs text-slate-400 mb-2">
                            {pillar.label} <span className="text-slate-500">· {pillar.position_meaning}</span>
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
                    <p className="text-center text-slate-400 bg-slate-800 rounded-2xl p-6">
                      닮은 유명인을 찾는 중...
                    </p>
                  )}
                  {celebrityError && (
                    <p className="text-center text-red-400 bg-red-900/30 rounded-lg py-2 px-4">
                      {celebrityError}
                    </p>
                  )}
                  {celebrityMatches?.map((m) => (
                    <div key={m.name} className="bg-slate-800 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-amber-400">{m.name}</h3>
                        <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-1">
                          {m.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">매칭 기준: {m.match_reason}</p>
                      <p className="text-slate-400 text-sm mb-3">{m.bio}</p>
                      {m.comparison && (
                        <p className="text-slate-200 leading-relaxed border-t border-slate-700 pt-3">
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
          <h2 className="text-lg font-semibold mb-3 text-slate-300">최근 조회 기록</h2>
          {history.length === 0 ? (
            <p className="text-slate-500 text-sm">아직 조회 기록이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="bg-slate-800 rounded-lg px-4 py-3 text-sm flex justify-between items-center"
                >
                  <span className="text-slate-400">
                    {item.year}.{item.month}.{item.day} {item.hour}시{item.minute}분
                  </span>
                  <span className="font-medium">
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
