import { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { temas } from '../lib/theme'

/* Claro u oscuro. Arranca siguiendo al sistema, y si la persona elige a mano
   esa elección manda y se guarda. Misma clave que la web para que la idea sea
   la misma en los dos lados, aunque el almacenamiento sea distinto. */

const CLAVE = 'bumko-theme'
const TemaContext = createContext(null)

export function TemaProvider({ children }) {
  const delSistema = useColorScheme()
  const [elegido, setElegido] = useState(null)   // null = seguir al sistema
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((v) => { if (v === 'dark' || v === 'light') setElegido(v) })
      .finally(() => setCargado(true))
  }, [])

  const modo = elegido || (delSistema === 'light' ? 'light' : 'dark')
  const tema = temas[modo]

  const alternar = () => {
    const nuevo = modo === 'dark' ? 'light' : 'dark'
    setElegido(nuevo)
    AsyncStorage.setItem(CLAVE, nuevo).catch(() => {})
  }

  return (
    <TemaContext.Provider value={{ tema, modo, alternar, cargado }}>
      {children}
    </TemaContext.Provider>
  )
}

// Las pantallas piden solo el tema; el resto es cosa del header.
export const useTema = () => useContext(TemaContext).tema
export const useTemaCompleto = () => useContext(TemaContext)
