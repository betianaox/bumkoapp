import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useColorScheme } from 'react-native'
import { temas } from '../src/lib/theme'

/* La raíz: solo tema y navegación. Toda la lógica de sesión y de datos va a
   colgar de acá cuando portemos el AuthContext y el store. */
export default function RootLayout() {
  const esquema = useColorScheme()
  const tema = temas[esquema === 'light' ? 'light' : 'dark']

  return (
    <SafeAreaProvider>
      <StatusBar style={tema.modo === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: tema.bg },
        }}
      />
    </SafeAreaProvider>
  )
}
