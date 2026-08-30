import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native'
import { useTema } from '../context/tema'
import { useT } from '../i18n'
import { Boton, Campo } from './ui'

/* Una tarjeta centrada, no una pantalla entera: se sigue viendo abajo lo que
   estabas por tocar, y cerrarla no se siente como retroceder.

   Acepta un campo suelto (`input`) para el caso más común —un número, un
   nombre— o hijos propios cuando hace falta un formulario. */
export default function Dialogo({
  visible = true,
  titulo,
  sub,
  input,                    // { keyboardType, initial, placeholder }
  children,
  confirmar,
  cancelar,
  peligro = false,
  onConfirm,
  onClose,
}) {
  const tema = useTema()
  const t = useT()
  const [valor, setValor] = useState(input?.initial ?? '')

  const enviar = () => onConfirm(input ? valor : undefined)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            backgroundColor: tema.scrim,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          {/* El toque adentro de la tarjeta no la cierra */}
          <Pressable
            onPress={() => {}}
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: tema.surface,
              borderRadius: tema.radio.md,
              padding: 20,
            }}
          >
            <Text style={{ color: tema.text, fontSize: 19, fontWeight: '700' }}>{titulo}</Text>

            {sub ? (
              <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 20, marginTop: 8 }}>
                {sub}
              </Text>
            ) : null}

            {input ? (
              <Campo
                autoFocus
                selectTextOnFocus
                value={valor}
                onChangeText={setValor}
                style={{ marginTop: 14 }}
                {...input}
                initial={undefined}
              />
            ) : null}

            {children ? <View style={{ marginTop: 14, gap: 12 }}>{children}</View> : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <Boton tipo="fantasma" onPress={onClose} style={{ flex: 1 }}>
                {cancelar || t('comun.cancelar')}
              </Boton>
              <Boton
                tipo={peligro ? 'peligro' : 'primario'}
                onPress={enviar}
                style={{ flex: 1 }}
              >
                {confirmar || t('comun.confirmar')}
              </Boton>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}
