// src/App.jsx
// 라우팅만 담당 (입력 페이지 / 결과 페이지 분리)

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InputPage from './pages/InputPage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
