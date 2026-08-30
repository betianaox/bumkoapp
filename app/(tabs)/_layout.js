import { Tabs } from 'expo-router'
import { Pressable, View } from 'react-native'
import { useTema } from '../../src/context/tema'
import { useAuth } from '../../src/context/auth'
import { useT } from '../../src/i18n'
import Cabecera from '../../src/components/Cabecera'
import { BoxIcon, CashIcon, PlayIcon, ChartIcon, PowerIcon } from '../../src/components/icons'

/* Las mismas cinco pestañas que la web y en el mismo orden. Vender es la
   primera porque es donde se pasa la noche entera.

   Al staff las otras cuatro se le muestran apagadas en vez de esconderse: así
   sabe que existen y que no las tiene, en lugar de usar una app que parece
   más chica de lo que es. Y el día que lo asciendan, ya sabe dónde estaban.

   La selección no se marca con color: el icono activo lleva una pastilla clara
   detrás y el texto pasa a blanco — igual que en la web, para que cambiar de
   cliente no se sienta como cambiar de app. */

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

// Una pestaña que se ve y no se toca. Apagada bastante más que una inactiva,
// que ya es gris: la diferencia entre "no estás acá" y "no podés estar acá".
const Trabada = (props) => (
  <View style={{ flex: 1, opacity: 0.28, alignItems: 'center', justifyContent: 'center' }}>
    {props.children}
  </View>
)

export default function TabsLayout() {
  const tema = useTema()
  const t = useT()
  const { isAdmin, pendiente } = useAuth()

  const pestana = (Dibujo) => ({ focused }) => (
    <Icono Dibujo={Dibujo} focused={focused} tema={tema} />
  )

  // Suspendido no puede ni vender; al staff solo se le traban las de administrar.
  const boton = (soloAdmin) =>
    pendiente || (soloAdmin && !isAdmin) ? Trabada : Pressable

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg }}>
      <Cabecera />
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
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.vender'),
            tabBarIcon: pestana(CashIcon),
            tabBarButton: boton(false),
          }}
        />
        <Tabs.Screen
          name="stock"
          options={{
            title: t('tabs.stock'),
            tabBarIcon: pestana(BoxIcon),
            tabBarButton: boton(true),
          }}
        />
        <Tabs.Screen
          name="eventos"
          options={{
            title: t('tabs.eventos'),
            tabBarIcon: pestana(PlayIcon),
            tabBarButton: boton(true),
          }}
        />
        <Tabs.Screen
          name="reportes"
          options={{
            title: t('tabs.reportes'),
            tabBarIcon: pestana(ChartIcon),
            tabBarButton: boton(true),
          }}
        />
        <Tabs.Screen
          name="equipo"
          options={{
            title: t('tabs.equipo'),
            tabBarIcon: pestana(PowerIcon),
            tabBarButton: boton(true),
          }}
        />
      </Tabs>
    </View>
  )
}
