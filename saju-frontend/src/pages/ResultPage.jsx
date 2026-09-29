// src/pages/ResultPage.jsx
// 입력 페이지에서 navigate로 전달받은 결과(state)를 보여주는 페이지.
// state가 없으면(새로고침, 직접 접근 등) 입력 페이지로 리다이렉트한다.

import { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import {
  API_BASE, OHENG_COLORS, TABS, PILLAR_ITEMS,
  InterpretationCard, FamilyGlyphRow,
} from '../shared'

function ResultPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const result = location.state?.result
  const requestBody = location.state?.requestBody

  const [activeTab, setActiveTab] = useState('overall')

  // 유명인 매칭은 별도 엔드포인트라 "닮은꼴" 탭을 처음 열 때만 지연 조회
  const [celebrityMatches, setCelebrityMatches] = useState(null)
  const [celebrityLoading, setCelebrityLoading] = useState(false)
  const [celebrityError, setCelebrityError] = useState('')

  if (!result) {
    return <Navigate to="/" replace />
  }

  async function loadCelebrityMatches() {
    if (celebrityMatches || celebrityLoading) return
    setCelebrityLoading(true)
    setCelebrityError('')

    try {
      const response = await fetch(`${API_BASE}/saju/celebrity-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
    <div className="min-h-screen bg-[#FAFAFA] text-slate-800 py-8 px-4 pb-24 md:pb-8">
      <div className="max-w-md md:max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-slate-800">
            {result.name ? `${result.name}님의 사주` : '사주 결과'}
          </h1>
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg px-3 py-2 transition-colors"
          >
            새로운 사주 보기
          </button>
        </div>

        {/* 탭 내비게이션: 모바일은 하단 고정, md 이상은 결과 영역 상단에 위치 */}
        <nav className="fixed bottom-0 inset-x-0 z-10 bg-white border-t border-slate-100 md:static md:mb-6 md:border md:rounded-2xl md:shadow-sm">
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

        <div className="space-y-4">
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
      </div>
    </div>
  )
}

export default ResultPage
