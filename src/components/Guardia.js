import { Text, View } from 'react-native'
import { useAuth } from '../context/auth'
import { useTema } from '../context/tema'
import { useT } from '../i18n'
import { LockIcon } from './icons'
import Pendiente from '../pantallas/Pendiente'

/* El tercer cerrojo. Los otros dos son la pestaña apagada y las reglas de
   Firestore; este es el del medio, para el caso en que alguien llegue igual a
   la pantalla — porque quedó abierta cuando le cambiaron el rol, por ejemplo.
   Ninguno de los tres alcanza solo: la pestaña es cortesía, esto es prolijidad
   y las reglas son lo único que de verdad impide algo. */
export default function Guardia({ soloAdmin = false, children }) {
  const { pendiente, isAdmin } = useAuth()
  const tema = useTema()
  const t = useT()

  if (pendiente) return <Pendiente />

  if (soloAdmin && !isAdmin) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tema.bg,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          gap: 14,
        }}
      >
        <LockIcon size={26} color={tema.textFaint} />
        <Text style={{ color: tema.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
          {t('equipo.soloAdmin')}
        </Text>
      </View>
    )
  }

  return children
}
