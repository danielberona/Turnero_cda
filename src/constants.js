export const CATS = {
  A: {
    color:  '#F59E0B',
    name:   'Revisión Tecnomecánica',
    short:  'Motos y autos',
    label:  'Revisión tecnomecánica motos y automóviles',
  },
  R: {
    color:  '#EF4444',
    name:   'Segunda visita',
    short:  'Reingreso',
    label:  'Vehículos que vienen por segunda vez',
  },
  B: {
    color:  '#3B82F6',
    name:   'Tecnomecánica pesados',
    short:  'Carga pesada',
    label:  'Tecnomecánica vehículos pesados',
  },
  V: {
    color:  '#22C55E',
    name:   'Vehículos de enseñanza',
    short:  'Enseñanza',
    label:  'Vehículos de enseñanza',
  },
}

export const AVISOS = [
  'Tenga a la mano tarjeta de propiedad, SOAT y licencia de conducción vigentes.',
  'El certificado de revisión técnico-mecánica se entrega el mismo día.',
  'Por su seguridad, permanezca en la sala de espera hasta ser llamado.',
  'Agende su próxima revisión con anticipación y evite las filas.',
]

export function padNum(n) {
  return String(n).padStart(3, '0')
}

export function codigoDisplay(turno) {
  return `${turno.codigo}-${padNum(turno.numero)}`
}
