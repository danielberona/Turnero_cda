import { createClient } from '@supabase/supabase-js'

// ── Credenciales ────────────────────────────────────────────
// Reemplaza con los valores de tu proyecto en:
// Supabase Dashboard → Project Settings → API
const SUPABASE_URL  = 'https://rwktqbtzowcuwzhoetwi.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3a3RxYnR6b3djdXd6aG9ldHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODYwODIsImV4cCI6MjA5NzE2MjA4Mn0.sXIEUeHvQoKuD6CcfGMUY-UYpM6zwV_mxwIbsafQ5HY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ── Categorías disponibles ───────────────────────────────────
export const CATEGORIAS = {
  A: { label: 'Revisión Técnico-Mecánica', color: '#2196F3' },
  R: { label: 'Reinspección',              color: '#FF9800' },
  B: { label: 'SOAT / Documentos',         color: '#4CAF50' },
  V: { label: 'VIP / Preferencial',        color: '#9C27B0' },
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Registra un nuevo turno en la cola.
 *
 * @param {{ placa: string, nombre: string, cedula: string,
 *            codigo: 'A'|'R'|'B'|'V', categoria: string, color: string }} datos
 * @returns {Promise<object>} Turno creado
 */
export async function registrarTurno({ placa, nombre, cedula, codigo, categoria, color }) {
  // 1. Obtener el número de turno del día para esta categoría
  const { data: numero, error: errNumero } = await supabase
    .rpc('generar_numero_turno', { p_codigo: codigo })

  if (errNumero) throw new Error(`Error generando número: ${errNumero.message}`)

  // 2. Insertar el turno
  const { data, error } = await supabase
    .from('turnos')
    .insert({
      codigo,
      numero,
      categoria,
      color,
      placa_vehiculo:  placa,
      nombre_cliente:  nombre,
      cedula_cliente:  cedula,
    })
    .select()
    .single()

  if (error) throw new Error(`Error registrando turno: ${error.message}`)
  return data
}

/**
 * Llama el siguiente turno en espera de la categoría indicada.
 * Marca como 'atendido' el turno actualmente 'llamado' (si existe).
 *
 * @param {'A'|'R'|'B'|'V'} codigo
 * @returns {Promise<object>} Turno llamado
 */
export async function llamarSiguiente(codigo) {
  const { data, error } = await supabase
    .rpc('llamar_siguiente_turno', { p_codigo: codigo })

  if (error) throw new Error(`Error llamando turno: ${error.message}`)
  // rpc con SETOF devuelve array; tomamos el primero
  return Array.isArray(data) ? data[0] : data
}

/**
 * Marca un turno como 'atendido'.
 *
 * @param {string} id UUID del turno
 */
export async function marcarAtendido(id) {
  const { error } = await supabase
    .rpc('marcar_atendido', { p_id: id })

  if (error) throw new Error(`Error marcando atendido: ${error.message}`)
}

/**
 * Devuelve el estado de todas las colas:
 * cantidad en espera y turno actualmente llamado por categoría.
 *
 * @returns {Promise<Array<{
 *   codigo: string,
 *   categoria: string,
 *   color: string,
 *   en_espera: number,
 *   turno_llamado: object|null
 * }>>}
 */
export async function getColaPorCategoria() {
  const { data, error } = await supabase
    .rpc('get_cola_por_categoria')

  if (error) throw new Error(`Error obteniendo cola: ${error.message}`)
  return data
}

/**
 * Devuelve el turno actualmente 'llamado' de una categoría,
 * o null si no hay ninguno.
 *
 * @param {'A'|'R'|'B'|'V'} codigo
 * @returns {Promise<object|null>}
 */
export async function getTurnoLlamado(codigo) {
  const { data, error } = await supabase
    .from('turnos')
    .select('*')
    .eq('codigo', codigo)
    .eq('estado', 'llamado')
    .order('llamado_en', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Error obteniendo turno llamado: ${error.message}`)
  return data
}

/**
 * Suscribe a cambios en tiempo real de la tabla turnos.
 * Llama a callback(payload) en cada INSERT o UPDATE.
 *
 * @param {(payload: object) => void} callback
 * @returns {RealtimeChannel} Canal — llama .unsubscribe() para cancelar
 *
 * @example
 * const canal = suscribirseACambios((payload) => {
 *   console.log('Cambio recibido:', payload)
 *   refrescarUI()
 * })
 * // Al desmontar el componente:
 * canal.unsubscribe()
 */
export function suscribirseACambios(callback) {
  const canal = supabase
    .channel('turnos-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'turnos' },
      callback,
    )
    .subscribe()

  return canal
}
