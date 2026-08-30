/* Color de cada producto: 8 tonos planos. En la oscuridad el color es lo que
   te deja encontrar el botón sin llegar a leer la etiqueta. Si el producto no
   tiene color elegido a mano, se le asigna uno a partir del nombre — el mismo
   nombre cae siempre en el mismo tono.

   La web guarda el tono como 'tone-3'. Acá hace falta el color de verdad, así
   que se traduce a un índice de `tema.tonos`. El formato guardado no cambia:
   los dos clientes leen y escriben el mismo dato. */

const CANTIDAD = 8

export function toneFor(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 9973
  return h % CANTIDAD
}

// Devuelve el índice 0..7. El color elegido a mano gana; si no hay, sale del nombre.
export function toneOf(product) {
  const guardado = product?.tone
  if (typeof guardado === 'string') {
    const n = parseInt(guardado.replace('tone-', ''), 10)
    if (n >= 1 && n <= CANTIDAD) return n - 1
  }
  return toneFor(product?.name || '')
}

// Cómo lo guarda la web, para no romper el otro cliente al elegir un color
export const nombreTono = (i) => `tone-${i + 1}`

export const colorDe = (product, tema) => tema.tonos[toneOf(product)]
