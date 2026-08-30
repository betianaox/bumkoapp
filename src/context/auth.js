import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as fbSignOut,
} from 'firebase/auth'
import { getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { auth, SIN_CONFIG } from '../lib/firebase'
import { barDoc, usuarioDoc } from '../lib/bar'

WebBrowser.maybeCompleteAuthSession()

/* Quién entra, a qué bar, y con qué rol. La resolución es la misma que en la
   web, porque es la misma base:

     usuarios/{email}             -> a qué bar pertenece
     bares/{barId}/equipo/{email} -> su rol y si sigue habilitado

   Dos diferencias con la web. La primera: cómo se llega al token de Google —
   la web abre un popup y acá se abre el navegador del sistema; lo que se le
   entrega a Firebase es la misma credencial. La segunda: no pertenecer a
   ningún bar dejó de ser un error. En la web era "ese correo no está en
   ningún bar"; acá es el estado normal de quien recién instala la app, y lo
   que sigue es la pantalla de bienvenida. */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [barId, setBarId] = useState(null)
  const [role, setRole] = useState(null)
  // Está en el equipo pero todavía no lo habilitaron
  const [pendiente, setPendiente] = useState(false)
  const [loading, setLoading] = useState(!SIN_CONFIG)
  const [error, setError] = useState('')

  // Corta la escucha del registro propio al cambiar de sesión o de bar
  const cortar = useRef(null)
  // Marca que esta sesión ya puso al día su nombre y su foto
  const fichado = useRef(false)

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  })

  /* Google contesta por su lado y no devolviendo el resultado de la llamada:
     por eso la respuesta se recoge acá y no adentro de signIn. */
  useEffect(() => {
    if (!response) return

    if (response.type === 'success') {
      const idToken = response.params?.id_token || response.authentication?.idToken
      if (!idToken) {
        setError('login.error')
        setLoading(false)
        return
      }
      signInWithCredential(auth, GoogleAuthProvider.credential(idToken)).catch((e) => {
        console.warn('[Bumko] login', e.message)
        setError('login.error')
        setLoading(false)
      })
    } else if (response.type === 'error') {
      setError('login.error')
      setLoading(false)
    } else {
      // Cancelado o cerrado: no es un error, pero hay que soltar el "cargando"
      setLoading(false)
    }
  }, [response])

  /* Engancharse al registro propio dentro de un bar. Se escucha y no se lee
     una vez: si un admin suspende a alguien en plena noche, la app se le
     bloquea en el momento, sin que tenga que cerrar sesión. Y si lo vuelve a
     habilitar, se desbloquea igual de rápido. */
  const escucharMiembro = useCallback((bar, fbUser) => {
    const email = fbUser.email.toLowerCase()
    cortar.current?.()

    cortar.current = onSnapshot(
      barDoc(bar, 'equipo', email),
      (miembro) => {
        if (!miembro.exists()) {
          // Lo sacaron del equipo mientras la app estaba abierta.
          setBarId(null)
          setRole(null)
          setPendiente(false)
          setLoading(false)
          return
        }

        const data = miembro.data()

        /* El nombre y la foto los pone Google, no la app. Una sola vez por
           sesión: esto corre adentro del onSnapshot, así que escribir vuelve a
           disparar el callback y sin el freno serían dos escrituras por cada
           entrada. */
        if (!fichado.current) {
          fichado.current = true
          setDoc(
            barDoc(bar, 'equipo', email),
            { name: fbUser.displayName || data.name || email, photo: fbUser.photoURL || null },
            { merge: true },
          ).catch(() => {})
        }

        setUser({ ...fbUser, teamData: data })
        setBarId(bar)
        setRole(data.role || 'staff')
        // Suspendido entra igual: la app se muestra bloqueada por dentro, que
        // se entiende mucho mejor que un cartel en la puerta.
        setPendiente(data.active === false)
        setLoading(false)
      },
      (e) => {
        console.warn('[Bumko] equipo', e.message)
        setLoading(false)
      },
    )
  }, [])

  // Volver a preguntar a qué bar entra. Lo llama la bienvenida después de
  // crear un bar o de aceptar una invitación.
  const resolverBar = useCallback(async (fbUser) => {
    const quien = fbUser || auth?.currentUser
    if (!quien) return null

    const email = quien.email.toLowerCase()
    const indice = await getDoc(usuarioDoc(email))
    const bar = indice.exists() ? indice.data().barId : null

    if (!bar) {
      // Todavía no pertenece a ningún lado: la bienvenida se encarga.
      cortar.current?.()
      cortar.current = null
      setUser(quien)
      setBarId(null)
      setRole(null)
      setPendiente(false)
      setLoading(false)
      return null
    }

    fichado.current = false
    escucharMiembro(bar, quien)
    return bar
  }, [escucharMiembro])

  useEffect(() => {
    if (SIN_CONFIG) return

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setError('')
      cortar.current?.()
      cortar.current = null
      fichado.current = false

      if (!fbUser) {
        setUser(null)
        setBarId(null)
        setRole(null)
        setPendiente(false)
        setLoading(false)
        return
      }

      // Hay sesión pero todavía no sabemos a qué bar entra ni con qué rol.
      // Sin esto, el hueco entre que Google responde y que resolvemos el bar
      // se ve como un parpadeo de la pantalla de login.
      setLoading(true)
      setUser(fbUser)

      try {
        await resolverBar(fbUser)
      } catch (e) {
        console.warn('[Bumko] resolver bar', e.message)
        setBarId(null)
        setRole(null)
        setLoading(false)
      }
      /* Nada de apagar el "cargando" acá: onSnapshot devuelve enseguida pero
         el primer dato llega después, y en ese intervalo la app se creería sin
         sesión y mostraría el botón de Google. Cada rama lo apaga cuando de
         verdad terminó. */
    })

    return () => {
      cortar.current?.()
      unsub()
    }
  }, [resolverBar])

  const signIn = async () => {
    setError('')
    setLoading(true)
    try {
      await promptAsync()
    } catch (e) {
      console.warn('[Bumko] promptAsync', e.message)
      setError('login.error')
      setLoading(false)
    }
  }

  const signOut = () => {
    cortar.current?.()
    cortar.current = null
    return fbSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        barId,
        role,
        pendiente,
        loading,
        error,
        signIn,
        signOut,
        resolverBar,
        // dev puede lo mismo que admin: es un rol de mantenimiento, no de
        // negocio. Suspendido no puede nada, sea cual sea su rol.
        isAdmin: (role === 'admin' || role === 'dev') && !pendiente,
        isDev: role === 'dev' && !pendiente,
        // Sin los IDs de OAuth cargados no hay a dónde ir: el login lo avisa
        // en vez de abrir un navegador que vuelve con las manos vacías.
        listoParaEntrar: !!request,
        sinConfig: SIN_CONFIG,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
