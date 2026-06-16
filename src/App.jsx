import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PantallaEspera from './PantallaEspera'
import PanelAdmin     from './PanelAdmin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Navigate to="/pantalla" replace />} />
        <Route path="/pantalla" element={<PantallaEspera />} />
        <Route path="/admin"    element={<PanelAdmin onLogout={() => {}} />} />
      </Routes>
    </BrowserRouter>
  )
}
