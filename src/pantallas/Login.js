import { ActivityIndicator, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useTema } from '../context/tema'
import { useAuth } from '../context/auth'
import { useT } from '../i18n'
import { Boton } from '../components/ui'

/* Mientras se resuelve la sesión no se muestra el botón de Google: se muestra
   la marca y nada más. Sin eso, el hueco entre que Google contesta y que
   sabemos a qué bar entra la persona se ve como un parpadeo de esta misma
   pantalla, justo después de haber entrado. */
export default function Login() {
  const tema = useTema()
  const t = useT()
  const { loading, error, signIn, listoParaEntrar, sinConfig } = useAuth()

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tema.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 18,
      }}
    >
      <Text style={{ color: tema.text, fontSize: 44, fontWeight: '800', letterSpacing: -1.5 }}>
        Bumko
      </Text>

      {loading ? (
        <ActivityIndicator color={tema.textFaint} />
      ) : (
        <>
          <Text
            style={{
              color: tema.textDim,
              fontSize: 15,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 6,
            }}
          >
            {sinConfig ? t('login.sinConfig') : t('login.sub')}
          </Text>

          <Boton
            onPress={signIn}
            disabled={!listoParaEntrar || sinConfig}
            icono={IconoGoogle}
            style={{ alignSelf: 'stretch' }}
          >
            {t('login.boton')}
          </Boton>

          {error ? (
            <Text style={{ color: tema.redInk, fontSize: 14, textAlign: 'center' }}>
              {t(error)}
            </Text>
          ) : null}
        </>
      )}
    </View>
  )
}

// El único icono con colores propios de toda la app: es la marca de Google y
// no se puede repintar.
function IconoGoogle() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.87 2.69-6.62z" />
      <Path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z" />
      <Path fill="#FBBC05" d="M3.95 10.71a5.4 5.4 0 010-3.42V4.96H.96a9 9 0 000 8.08l2.99-2.33z" />
      <Path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z" />
    </Svg>
  )
}
