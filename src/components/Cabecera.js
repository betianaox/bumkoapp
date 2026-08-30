import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useTema, useTemaCompleto } from '../context/tema'
import { useAuth } from '../context/auth'
import { useBar } from '../lib/store'
import { SunIcon, MoonIcon } from './icons'
import Avatar from './Avatar'

/* Arriba de todo, en las cinco pestañas: la marca, en qué evento estamos, y
   los dos botones redondos.

   El evento va en un segundo renglón y no al lado del nombre: en un teléfono
   angosto, "Bumko · Sábado 23/08" se corta justo donde importa. */
export default function Cabecera() {
  const tema = useTema()
  const { modo, alternar } = useTemaCompleto()
  const { user } = useAuth()
  const inset = useSafeAreaInsets()

  const eventos = useBar((e) => e.eventos.items)
  const bar = useBar((e) => e.bar)
  const activo = eventos.find((e) => e.status === 'live') || null

  const Tema = modo === 'dark' ? SunIcon : MoonIcon

  return (
    <View
      style={{
        paddingTop: inset.top + 10,
        paddingBottom: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: tema.line,
        backgroundColor: tema.bg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            numberOfLines={1}
            style={{ color: tema.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}
          >
            {bar?.name || 'Bumko'}
          </Text>
        </View>

        <Pressable
          onPress={alternar}
          hitSlop={6}
          accessibilityRole="button"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tema.surface2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Tema size={18} color={tema.textDim} />
        </Pressable>

        {/* La cara propia abre los ajustes: es donde todo el mundo la busca */}
        <Pressable
          onPress={() => router.push('/ajustes')}
          hitSlop={6}
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Avatar
            src={user?.photoURL}
            name={user?.displayName}
            email={user?.email}
            size={40}
            borde
          />
        </Pressable>
      </View>

      {/* En qué noche estamos. Si no hay evento abierto también se dice: no
          saberlo es lo que hace que después las ventas aparezcan sueltas. */}
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 100,
            backgroundColor: activo ? `rgba(26, 143, 69, 0.20)` : tema.surface2,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              color: activo ? tema.greenInk : tema.textFaint,
              fontSize: 12,
              fontWeight: '700',
            }}
          >
            {activo ? activo.name : '—'}
          </Text>
        </View>
      </View>
    </View>
  )
}
