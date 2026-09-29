// src/pages/InputPage.jsx
// 사주 정보 입력 폼 페이지. 제출 시 /saju를 호출하고 결과와 함께 /result로 이동한다.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, BIRTH_CITIES, inputClass } from '../shared'

// 최근 조회 기록 기능은 화면에서 숨김 처리. 백엔드 /history는 그대로 유지되며,
// 다시 노출하려면 아래 주석 처리된 fetchHistory 호출과 렌더링 블록(ResultPage 하단 참고 없음, 여기 없음)을 복원하면 됨.
// import { useEffect } from 'react'
// const [history, setHistory] = useState([])
// async function fetchHistory() {
//   const response = await fetch(`${API_BASE}/history`)
//   setHistory(await response.json())
// }
// useEffect(() => { fetchHistory() }, [])

function InputPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('0')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('solar')
  const [isLeapMonth, setIsLeapMonth] = useState(false)
  const [birthCity, setBirthCity] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (!gender) {
      setError('성별을 선택해주세요.')
      return
    }

    setLoading(true)
    setError('')

    const requestBody = {
      name,
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
      navigate('/result', { state: { result: data, requestBody } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 py-8 px-4">
      <div className="max-w-md md:max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-center mb-8 text-slate-800">
          온라인 사주
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5"
        >
          <div>
            <label className="block text-sm text-slate-400 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
              className={inputClass}
            />
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
      </div>
    </div>
  )
}

export default InputPage
