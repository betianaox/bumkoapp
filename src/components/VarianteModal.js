import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useTema } from '../context/tema'
import { useT } from '../i18n'
import { money } from '../lib/formato'
import { Boton, Campo, Etiqueta } from './ui'

/* Lo que se abre al mantener presionado un producto. Tres caminos y nada más:
   el precio de lista (por si abriste sin querer), otro precio, o un regalo con
   su motivo.

   Los regalos piden motivo porque un regalo sin motivo, a fin de mes, es
   mercadería que faltó y nadie sabe por qué. */
export default function VarianteModal({ product, onConfirm, onClose }) {
  const tema = useTema()
  const t = useT()
  const [modo, setModo] = useState('regular')
  const [precio, setPrecio] = useState('')
  const [motivo, setMotivo] = useState('')
  const [quien, setQuien] = useState('')

  const motivos = t('variante.motivos')

  const puede =
    modo === 'regular' ||
    (modo === 'custom' && precio !== '' && Number(precio) >= 0) ||
    (modo === 'gift' && motivo)

  const enviar = () => {
    if (!puede) return
    if (modo === 'regular') onConfirm({ mode: 'regular', amount: product.salePrice })
    else if (modo === 'custom') onConfirm({ mode: 'custom', amount: Number(precio) })
    else onConfirm({ mode: 'gift', amount: 0, reason: motivo, who: quien.trim() || null })
  }

  const opciones = [
    { id: 'regular', txt: t('variante.precioLista'), color: tema.cyan },
    { id: 'custom', txt: t('variante.otroPrecio'), color: tema.amber },
    { id: 'gift', txt: t('variante.regalar'), color: tema.accent },
  ]

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: tema.scrim }} />

        <View
          style={{
            backgroundColor: tema.surface,
            borderTopLeftRadius: tema.radio.lg,
            borderTopRightRadius: tema.radio.lg,
            padding: 20,
            paddingBottom: 34,
            maxHeight: '80%',
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={{ color: tema.text, fontSize: 22, fontWeight: '700' }}>
              {product.name}
            </Text>
            <Text style={{ color: tema.textFaint, fontSize: 14, marginTop: 2, marginBottom: 18 }}>
              {money(product.salePrice)}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {opciones.map((o) => {
                const elegido = modo === o.id
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => setModo(o.id)}
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      borderRadius: tema.radio.sm,
                      alignItems: 'center',
                      backgroundColor: elegido ? o.color : tema.surface2,
                    }}
                  >
                    <Text
                      style={{
                        color: elegido ? tema.onColor : tema.textDim,
                        fontSize: 13,
                        fontWeight: '700',
                        textAlign: 'center',
                      }}
                    >
                      {o.txt}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {modo === 'custom' ? (
              <View style={{ marginTop: 18 }}>
                <Etiqueta>{t('variante.precioCobrado')}</Etiqueta>
                <Campo
                  autoFocus
                  keyboardType="numeric"
                  value={precio}
                  onChangeText={setPrecio}
                  placeholder={String(product.salePrice)}
                />
              </View>
            ) : null}

            {modo === 'gift' ? (
              <View style={{ marginTop: 18 }}>
                <Etiqueta>{t('variante.motivo')}</Etiqueta>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {motivos.map((m) => (
                    <Pressable
                      key={m}
                      onPress={() => setMotivo(m)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 100,
                        backgroundColor: motivo === m ? tema.accent : tema.surface2,
                      }}
                    >
                      <Text
                        style={{
                          color: motivo === m ? '#fff' : tema.textDim,
                          fontSize: 13,
                          fontWeight: '600',
                        }}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Campo
                  value={quien}
                  onChangeText={setQuien}
                  placeholder={t('variante.aQuien')}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : null}

            <Boton onPress={enviar} disabled={!puede} style={{ marginTop: 22 }}>
              {modo === 'gift'
                ? t('variante.registrarRegalo')
                : `${t('comun.confirmar')} ${money(modo === 'regular' ? product.salePrice : Number(precio) || 0)}`}
            </Boton>

            <Boton tipo="fantasma" onPress={onClose} style={{ marginTop: 10 }}>
              {t('comun.cancelar')}
            </Boton>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
