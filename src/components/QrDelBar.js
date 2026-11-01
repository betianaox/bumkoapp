import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { captureRef } from 'react-native-view-shot'
import * as Sharing from 'expo-sharing'
import { useTema } from '../context/tema'
import { useT } from '../i18n'
import { linkDeIngreso } from '../lib/equipo'
import { Boton } from './ui'
import { ShareIcon } from './icons'

/* El QR del bar, en una tarjeta blanca que se puede compartir como imagen.

   La imagen lleva el QR, el nombre del bar y el código escrito abajo: quien la
   recibe por WhatsApp está mirando la foto en el mismo teléfono con el que
   tendría que escanearla, así que el código escrito es lo que le permite
   entrar igual, tipeándolo.

   La tarjeta es blanca en los dos temas a propósito: un QR se lee mejor oscuro
   sobre claro, y la foto compartida no sabe en qué tema la van a mirar. */
export default function QrDelBar({ bar, style }) {
  const tema = useTema()
  const t = useT()
  const tarjeta = useRef(null)
  const [compartiendo, setCompartiendo] = useState(false)

  if (!bar?.codigo) return null

  const compartir = async () => {
    setCompartiendo(true)
    try {
      const uri = await captureRef(tarjeta, { format: 'png', quality: 1 })
      // Abre la hoja de compartir del teléfono: WhatsApp aparece ahí, junto
      // con cualquier otra app que la persona prefiera usar.
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('qr.compartirTitulo', { bar: bar.name || 'Bumko' }),
      })
    } catch (e) {
      console.warn('[Bumko] compartir QR', e.message)
    }
    setCompartiendo(false)
  }

  return (
    <View style={style}>
      <View
        ref={tarjeta}
        collapsable={false}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: tema.radio.md,
          padding: 22,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#14141c', fontSize: 19, fontWeight: '800', marginBottom: 14 }}>
          {bar.name || 'Bumko'}
        </Text>
        <QRCode value={linkDeIngreso(bar.codigo)} size={210} color="#0b0b10" backgroundColor="#ffffff" />
        <Text style={{ color: '#5c5c6e', fontSize: 13, marginTop: 14 }}>{t('qr.escaneaCon')}</Text>
        <Text style={{ color: '#14141c', fontSize: 24, fontWeight: '800', letterSpacing: 4, marginTop: 4 }}>
          {bar.codigo}
        </Text>
      </View>

      <Boton icono={ShareIcon} onPress={compartir} disabled={compartiendo} style={{ marginTop: 14 }}>
        {t('qr.compartir')}
      </Boton>
    </View>
  )
}
