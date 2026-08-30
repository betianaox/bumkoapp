import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'
import es from './es'
import en from './en'
import pt from './pt'

/* Tres idiomas. Arranca en el del teléfono y, si la persona elige otro a mano,
   esa elección manda y se guarda — igual que el tema claro/oscuro.

   El español es el idioma de referencia: si una clave todavía no está
   traducida, sale en español en vez de aparecer vacía o mostrar el nombre
   interno de la clave. Un texto en otro idioma se entiende; `equipo.sacarSub`
   no se entiende en ninguno. */

export const IDIOMAS = [
  { id: 'es', nombre: 'Español' },
  { id: 'en', nombre: 'English' },
  { id: 'pt', nombre: 'Português' },
]

const DICCIONARIOS = { es, en, pt }
const CLAVE = 'bumko-idioma'

function delTelefono() {
  const etiquetas = Localization.getLocales?.() || []
  for (const l of etiquetas) {
    const code = (l.languageCode || '').toLowerCase()
    if (DICCIONARIOS[code]) return code
  }
  // Cualquier otro idioma cae en inglés, no en español: es la apuesta más
  // segura para alguien que no habla ninguno de los tres.
  return 'en'
}

// 'equipo.sacarTitulo' -> el texto, buscando en el diccionario elegido y
// cayendo al español si ahí no está.
function buscar(dic, ruta) {
  let v = dic
  for (const parte of ruta.split('.')) {
    if (v == null) return undefined
    v = v[parte]
  }
  return v
}

const IdiomaContext = createContext(null)

export function IdiomaProvider({ children }) {
  const [idioma, setIdioma] = useState(delTelefono)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((v) => { if (DICCIONARIOS[v]) setIdioma(v) })
      .finally(() => setCargado(true))
  }, [])

  const elegir = (id) => {
    if (!DICCIONARIOS[id]) return
    setIdioma(id)
    AsyncStorage.setItem(CLAVE, id).catch(() => {})
  }

  const valor = useMemo(() => {
    const dic = DICCIONARIOS[idioma] || es

    /* t('equipo.invitada', { correo }) -> 'Listo, le llegará la invitación a…'
       Los huecos se escriben {asi} en el diccionario. Si falta una variable se
       deja el hueco tal cual: se ve raro, pero se ve — y eso avisa. */
    const t = (ruta, vars) => {
      const texto = buscar(dic, ruta) ?? buscar(es, ruta)
      if (texto == null) return ruta
      if (typeof texto !== 'string' || !vars) return texto
      return texto.replace(/\{(\w+)\}/g, (hueco, k) => (vars[k] ?? hueco))
    }

    return { t, idioma, elegir, cargado }
  }, [idioma, cargado])

  return <IdiomaContext.Provider value={valor}>{children}</IdiomaContext.Provider>
}

// Las pantallas piden solo la función; el selector pide el resto.
export const useT = () => useContext(IdiomaContext).t
export const useIdioma = () => useContext(IdiomaContext)
