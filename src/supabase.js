import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://rwktqbtzowcuwzhoetwi.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3a3RxYnR6b3djdXd6aG9ldHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODYwODIsImV4cCI6MjA5NzE2MjA4Mn0.sXIEUeHvQoKuD6CcfGMUY-UYpM6zwV_mxwIbsafQ5HY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

export async function registrarTurno({ placa, nombre, codigo, categoria, color, numero }) {
  const { data, error } = await supabase
    .from('turnos')
    .insert({ codigo, numero: Number(numero), categoria, color, placa_vehiculo: placa, nombre_cliente: nombre, cedula_cliente: '' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function llamarSiguiente(codigo) {
  const { data, error } = await supabase.rpc('llamar_siguiente_turno', { p_codigo: codigo })
  if (error) throw new Error(error.message)
  return Array.isArray(data) ? data[0] : data
}

export async function marcarAtendido(id) {
  const { error } = await supabase.rpc('marcar_atendido', { p_id: id })
  if (error) throw new Error(error.message)
}

export function suscribirseACambios(callback) {
  return supabase
    .channel('turnos-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, callback)
    .subscribe()
}
