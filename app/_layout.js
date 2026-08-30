import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TemaProvider, useTema, useTemaCompleto } from '../src/context/tema'
import { IdiomaProvider, useIdioma } from '../src/i18n'
import { AuthProvider, useAuth } from '../src/context/auth'
import { useBar } from '../src/lib/store'
import Login from '../src/pantallas/Login'
import Bienvenida from '../src/pantallas/Bienvenida'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TemaProvider>
        <IdiomaProvider>
          <AuthProvider>
            <Puerta />
          </AuthProvider>
        </IdiomaProvider>
      </TemaProvider>
    </SafeAreaProvider>
  )
}

/* Quién ve qué. Las cuatro situaciones se resuelven acá arriba, antes de que
   exista cualquier pestaña:

     todavía no sabemos     -> la marca y nada más
     sin sesión             -> Google
     sin bar                -> la bienvenida: invitaciones, crear, código
     con bar                -> la app

   El equipo suspendido no aparece en esta lista: esa pantalla se muestra
   adentro, con las pestañas a la vista y apagadas, porque se entiende mucho
   mejor que un cartel en la puerta. */
function Puerta() {
  const { tema, modo, cargado: temaListo } = useTemaCompleto()
  const { cargado: idiomaListo } = useIdioma()
  const { user, barId, loading } = useAuth()

  const conectar = useBar((e) => e.conectar)
  const desconectar = useBar((e) => e.desconectar)

  useEffect(() => {
    if (barId) conectar(barId)
    else desconectar()
  }, [barId, conectar, desconectar])

  const listo = temaListo && idiomaListo && !loading

  return (
    <>
      <StatusBar style={modo === 'dark' ? 'light' : 'dark'} />
      {!listo ? (
        <Espera />
      ) : !user ? (
        <Login />
      ) : !barId ? (
        <Bienvenida />
      ) : (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: tema.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="ajustes" options={{ presentation: 'modal' }} />
        </Stack>
      )}
    </>
  )
}

function Espera() {
  const tema = useTema()
  return (
    <View
      style={{ flex: 1, backgroundColor: tema.bg, alignItems: 'center', justifyContent: 'center' }}
    >
      <ActivityIndicator color={tema.textFaint} />
    </View>
  )
}
