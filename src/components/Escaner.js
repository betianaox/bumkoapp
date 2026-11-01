import { useRef, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTema } from '../context/tema'
import { useT } from '../i18n'
import { codigoDesde } from '../lib/equipo'
import { Boton } from './ui'
import { CloseIcon } from './icons'

/* La cámara a pantalla completa, para leer el QR que muestra el dueño del bar.

   Se cierra sola en cuanto lee un código válido. Lo que no es un QR de Bumko
   se ignora en silencio: en una barra hay carteles, botellas y menús con
   códigos de todo tipo, y avisar de cada uno sería ruido. */
export default function Escaner({ onCodigo, onClose }) {
  const tema = useTema()
  const t = useT()
  const inset = useSafeAreaInsets()
  const [permiso, pedirPermiso] = useCameraPermissions()
  // La cámara puede leer el mismo código varias veces por segundo
  const leido = useRef(false)
  const [visto, setVisto] = useState(false)

  const alLeer = ({ data }) => {
    if (leido.current) return
    const codigo = codigoDesde(data)
    if (!codigo) return
    leido.current = true
    setVisto(true)
    onCodigo(codigo)
  }

  const cerrar = (
    <Pressable
      onPress={onClose}
      hitSlop={10}
      accessibilityLabel={t('comun.cancelar')}
      style={{
        position: 'absolute',
        top: inset.top + 12,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
      }}
    >
      <CloseIcon size={20} color="#fff" />
    </Pressable>
  )

  // Todavía no sabemos si hay permiso
  if (!permiso) return <View style={{ flex: 1, backgroundColor: '#000' }} />

  if (!permiso.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tema.bg,
          justifyContent: 'center',
          padding: 24,
          paddingTop: inset.top + 24,
        }}
      >
        <Text style={{ color: tema.text, fontSize: 22, fontWeight: '800' }}>{t('escaner.permisoTitulo')}</Text>
        <Text style={{ color: tema.textDim, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 22 }}>
          {t('escaner.permisoSub')}
        </Text>
        {permiso.canAskAgain ? (
          <Boton onPress={pedirPermiso}>{t('escaner.permitir')}</Boton>
        ) : (
          <Boton onPress={() => Linking.openSettings()}>{t('escaner.abrirAjustes')}</Boton>
        )}
        <Boton tipo="fantasma" onPress={onClose} style={{ marginTop: 10 }}>
          {t('comun.cancelar')}
        </Boton>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={visto ? undefined : alLeer}
      />

      {/* El recuadro donde apuntar */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={{ width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: '#fff' }} />
        <Text
          style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: '700',
            marginTop: 22,
            textAlign: 'center',
            paddingHorizontal: 32,
          }}
        >
          {t('escaner.apunta')}
        </Text>
      </View>

      {cerrar}
    </View>
  )
}
