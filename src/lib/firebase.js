import { initializeApp } from 'firebase/app'
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

/* Mismo proyecto de Firebase que la web: la app nativa y bumko.vercel.app
   leen y escriben la misma base. Por eso las rutas y las reglas no cambian —
   lo único distinto es cómo se guarda la sesión.

   Las credenciales viven en .env (no se sube al repo). En Expo, las variables
   que empiezan con EXPO_PUBLIC_ quedan disponibles en el bundle. */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
}

// Sin .env no hay Firebase posible: en vez de reventar al arrancar
// (auth/invalid-api-key) avisamos y dejamos la app en pie.
export const SIN_CONFIG = !firebaseConfig.apiKey || !firebaseConfig.projectId

export const app = SIN_CONFIG ? null : initializeApp(firebaseConfig)

/* En la web el navegador guarda la sesión solo. Acá hay que decirle dónde:
   sin esto, cerrar la app te deslogea, y a nadie le sirve volver a pasar por
   Google en medio de una noche. */
export const auth = SIN_CONFIG
  ? null
  : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })

export const db = SIN_CONFIG ? null : getFirestore(app)
export const googleProvider = SIN_CONFIG ? null : new GoogleAuthProvider()

if (SIN_CONFIG) {
  console.warn(
    '[Bumko] Falta el archivo .env con las credenciales de Firebase. ' +
    'Copiá .env.example a .env y completá los valores.',
  )
}
