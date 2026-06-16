import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import PantallaTV from './PantallaTV'
import PanelAdmin from './PanelAdmin'
import Login      from './Login'

function AdminGuard() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null // cargando

  if (!session) return <Login />

  return (
    <PanelAdmin
      onLogout={() => supabase.auth.signOut()}
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Navigate to="/pantalla" replace />} />
        <Route path="/pantalla" element={<PantallaTV />} />
        <Route path="/admin"    element={<AdminGuard />} />
      </Routes>
    </BrowserRouter>
  )
}
