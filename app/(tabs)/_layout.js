import { Tabs } from 'expo-router'
import { View, useColorScheme } from 'react-native'
import { temas } from '../../src/lib/theme'
import { BoxIcon, CashIcon, PlayIcon, ChartIcon, PowerIcon } from '../../src/components/icons'

/* Las mismas cinco pestañas que la web y en el mismo orden. Vender es la
   primera porque es donde se pasa la noche entera.

   La selección no se marca con color: el icono activo lleva una pastilla
   clara detrás y el texto pasa a blanco — igual que en la web, para que
   cambiar de cliente no se sienta como cambiar de app. */
function Icono({ Dibujo, focused, tema }) {
  return (
    <View
      style={{
        paddingVertical: 4,
        paddingHorizontal: 13,
        borderRadius: 100,
        backgroundColor: focused ? tema.surface3 : 'transparent',
        opacity: focused ? 1 : 0.7,
      }}
    >
      <Dibujo size={20} color={focused ? tema.text : tema.textFaint} />
    </View>
  )
}

export default function TabsLayout() {
  const esquema = useColorScheme()
  const tema = temas[esquema === 'light' ? 'light' : 'dark']

  const pestana = (Dibujo) => ({ focused }) => (
    <Icono Dibujo={Dibujo} focused={focused} tema={tema} />
  )

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: tema.text,
        tabBarInactiveTintColor: tema.textFaint,
        tabBarStyle: {
          backgroundColor: tema.bg,
          borderTopColor: tema.line,
          height: 76,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: tema.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Vender', tabBarIcon: pestana(CashIcon) }} />
      <Tabs.Screen name="stock" options={{ title: 'Stock', tabBarIcon: pestana(BoxIcon) }} />
      <Tabs.Screen name="eventos" options={{ title: 'Eventos', tabBarIcon: pestana(PlayIcon) }} />
      <Tabs.Screen name="reportes" options={{ title: 'Reportes', tabBarIcon: pestana(ChartIcon) }} />
      <Tabs.Screen name="equipo" options={{ title: 'Equipo', tabBarIcon: pestana(PowerIcon) }} />
    </Tabs>
  )
}
