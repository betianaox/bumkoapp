import { Pressable, Text, View } from 'react-native'
import { useTema } from '../context/tema'
import { useAuth } from '../context/auth'
import { useT } from '../i18n'
import { LockIcon } from '../components/icons'

/* Lo que ve alguien que está en el equipo pero todavía no lo habilitaron.
   Entra a la app y la ve entera —las cinco pestañas, la marca, el tema— pero
   nada responde. Se entiende mucho mejor "esto es tuyo y todavía no está
   abierto" que un cartel en la puerta.

   No hace falta un botón de reintentar: el registro propio se escucha, así que
   en cuanto un admin lo habilite esta pantalla se va sola. */
export default function Pendiente() {
  const tema = useTema()
  const t = useT()
  const { user, signOut } = useAuth()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tema.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
      }}
    >
      <LockIcon size={30} color={tema.textFaint} />

      <Text style={{ color: tema.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
        {t('pendiente.titulo')}
      </Text>

      <Text style={{ color: tema.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
        {t('pendiente.sub', { correo: user?.email || '' })}
      </Text>

      <Pressable onPress={signOut} style={{ marginTop: 12 }}>
        <Text style={{ color: tema.textFaint, fontSize: 14, fontWeight: '600' }}>
          {t('login.otraCuenta')}
        </Text>
      </Pressable>
    </View>
  )
}
