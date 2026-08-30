/* Los mismos tokens que la web, en objetos en vez de variables CSS. Que los
   dos clientes se vean iguales no es capricho: la misma persona va a usar la
   app en el celular y la web en la compu, la misma noche. */

const compartido = {
  accent: '#ff2d6f',
  cyan: '#00d9c0',
  amber: '#ffb020',
  red: '#ff4d3d',
  alarm: '#e6001e',   // stock por agotarse: no es el rojo de "peligro", es más fuerte
  green: '#1a8f45',

  onColor: '#0b0b10',   // cyan y ámbar son claros: encima siempre texto oscuro
  onStrong: '#ffffff',  // verde y rojo son oscuros: encima siempre texto blanco

  // Tonos de los productos. Sirven en los dos temas.
  tonos: ['#e01055', '#00857a', '#b86a00', '#6a3ff0', '#1f6feb', '#d2450f', '#1a8f45', '#b52490'],

  radio: { lg: 24, md: 16, sm: 12 },
}

export const oscuro = {
  ...compartido,
  modo: 'dark',
  bg: '#0b0b10',
  surface: '#16161f',
  surface2: '#1e1e2a',
  surface3: '#2a2a38',
  line: '#2c2c3a',

  text: '#ffffff',
  textDim: '#c2c2d4',
  textFaint: '#9494ad',

  invertBg: '#ffffff',
  invertInk: '#0b0b10',
  promoBg: 'rgba(255, 255, 255, 0.2)',

  // Colores para escribir, no para rellenar
  greenInk: '#4ade80',
  amberInk: '#ffb020',
  redInk: '#ff6b5c',

  // El bloque de producto: relleno translúcido del tono y texto blanco
  toneFill: 0.22,
  toneInk: null,        // null = usa el color de texto normal

  scrim: 'rgba(5, 5, 8, 0.72)',
}

export const claro = {
  ...compartido,
  modo: 'light',
  bg: '#f4f4f7',
  surface: '#ffffff',
  surface2: '#e6e6ec',
  surface3: '#d3d3dc',
  line: '#d8d8e0',

  text: '#14141c',
  textDim: '#4d4d5f',
  textFaint: '#70708a',

  invertBg: '#14141c',
  invertInk: '#ffffff',
  // Sobre una card clara, un velo blanco no se ve: acá el velo va oscuro.
  promoBg: 'rgba(20, 20, 28, 0.55)',

  greenInk: '#157a3a',
  amberInk: '#8a5a00',
  redInk: '#c62a1c',

  // Sobre fondo claro el texto blanco no se lee en un relleno translúcido:
  // el bloque baja el relleno y escribe con el color del propio tono.
  toneFill: 0.14,
  toneInk: 'tono',      // 'tono' = escribe con el color del producto

  scrim: 'rgba(0, 0, 0, 0.45)',
}

export const temas = { dark: oscuro, light: claro }
