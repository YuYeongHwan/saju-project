// src/App.jsx

import { useState, useEffect } from 'react'

const API_BASE = 'http://54.116.89.93:8000'

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

    try {
      const response = await fetch(`${API_BASE}/saju`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: Number(year),
          month: Number(month),
          day: Number(day),
          hour: Number(hour),
          minute: Number(minute),
          longitude: Number(longitude),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || '요청에 실패했습니다.')
      }

      const data = await response.json()
      setResult(data)
      fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-400">
          온라인 사주
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 rounded-2xl p-6 shadow-lg space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">연도(양력)</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="1990"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">월</label>
              <input
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="10"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">일</label>
              <input
                type="number"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="10"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">시(24시간)</label>
              <input
                type="number"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                placeholder="14"
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-slate-400 mb-1">분</label>
              <input
                type="number"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                className="w-full rounded-lg bg-slate-700 border border-slate-600 px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg py-3 transition-colors"
          >
            {loading ? '계산 중...' : '사주 보기'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-center text-red-400 bg-red-900/30 rounded-lg py-2 px-4">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 bg-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-amber-400">결과</h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: '연주', pillar: result.year_pillar },
                { label: '월주', pillar: result.month_pillar },
                { label: '일주', pillar: result.day_pillar },
                { label: '시주', pillar: result.hour_pillar },
              ].map((item) => (
                <div key={item.label} className="bg-slate-700 rounded-lg py-3">
                  <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                  <p className="text-xl font-bold">{item.pillar.hanja}</p>
                  <p className="text-xs text-slate-400">{item.pillar.hangul}</p>
                </div>
              ))}
            </div>
          </div>
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