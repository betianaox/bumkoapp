// Un solo lugar donde se decide cómo se escribe la plata.
export const money = (n) => '$' + (n || 0).toLocaleString('es-AR')

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// "Sábado 23/08". Alcanza para distinguir una noche de otra.
export function nombreSugerido(d = new Date()) {
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${DIAS[d.getDay()]} ${dia}/${mes}`
}

export const fechaCorta = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null
  return d ? d.toLocaleDateString('es-AR') : ''
}
