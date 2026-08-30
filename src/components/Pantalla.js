import { View, Text, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { temas } from '../lib/theme'

/* Andamio provisorio: cada pestaña dice qué va a ser y qué falta. Se borra a
   medida que las pantallas de verdad ocupen su lugar. */
export default function Pantalla({ titulo, nota }) {
  const esquema = useColorScheme()
  const tema = temas[esquema === 'light' ? 'light' : 'dark']
  const inset = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg, paddingTop: inset.top + 24, paddingHorizontal: 16 }}>
      <Text style={{ color: tema.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.5 }}>
        {titulo}
      </Text>
      <Text style={{ color: tema.textDim, fontSize: 15, marginTop: 8, lineHeight: 22 }}>
        {nota}
      </Text>
    </View>
  )
}
