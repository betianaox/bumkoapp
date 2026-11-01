import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native'
import * as Linking from 'expo-linking'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getDoc } from 'firebase/firestore'
import { useTema } from '../context/tema'
import { useAuth } from '../context/auth'
import { useT } from '../i18n'
import { buscarPorCodigo, codigoDesde, crearBar, pedirEntrar, solicitudDoc } from '../lib/equipo'
import Dialogo from '../components/Dialogo'
import Escaner from '../components/Escaner'
import { ArrowRightIcon, PlusIcon, QrIcon } from '../components/icons'

/* La primera pantalla de quien instala la app y todavía no pertenece a ningún
   bar. Dos caminos:

     1. Crear su propio bar: queda como dueño y administrador.
     2. Escanear el QR que le muestra el dueño de un bar: queda pedido el
        ingreso, y entra cuando el dueño lo acepta.

   No hay otra forma de entrar a un bar ajeno. Para quien recibió el QR por
   WhatsApp —y no puede escanear una foto que está en su propio teléfono— la
   imagen trae el código escrito, y acá abajo hay un link discreto para
   tipearlo. Es la misma puerta: el código sigue necesitando que el dueño
   acepte. */
export default function Bienvenida() {
  const tema = useTema()
  const t = useT()
  const { user, signOut, resolverBar } = useAuth()
  const inset = useSafeAreaInsets()

  const [dialogo, setDialogo] = useState(null)             // 'crear' | 'codigo'
  const [escaneando, setEscaneando] = useState(false)
  const [trabajando, setTrabajando] = useState(false)
  const [aviso, setAviso] = useState('')

  const handleCrear = async (nombre) => {
    setDialogo(null)
    if (!nombre?.trim()) return
    setTrabajando(true)
    try {
      await crearBar({ nombre, user })
      await resolverBar(user)
    } catch (e) {
      console.warn('[Bumko] crear bar', e.message)
      setAviso(t('crearBar.error'))
      setTrabajando(false)
    }
  }

  /* Con el código no se entra: se pide entrar. Del otro lado hay un dueño que
     mira quién es antes de dejarlo pasar. */
  const pedirConCodigo = async (codigo) => {
    if (!codigo) {
      setAviso(t('codigo.noExiste'))
      return
    }
    setTrabajando(true)
    try {
      const bar = await buscarPorCodigo(codigo)
      if (!bar) {
        setAviso(t('codigo.noExiste'))
        setTrabajando(false)
        return
      }

      const yaPidio = await getDoc(solicitudDoc(bar.barId, user.email))
      if (yaPidio.exists()) {
        setAviso(t('bienvenida.solicitudPendiente', { bar: bar.barNombre }))
        setTrabajando(false)
        return
      }

      await pedirEntrar({ barId: bar.barId, user })
      setAviso(t('bienvenida.solicitudEnviada', { bar: bar.barNombre }))
    } catch (e) {
      console.warn('[Bumko] código', e.message)
      setAviso(t('codigo.noExiste'))
    }
    setTrabajando(false)
  }

  /* Si el QR se escaneó con la cámara del teléfono, el link bumko://unirse/…
     abre la app directamente acá. Se atiende una sola vez por link. */
  const url = Linking.useURL()
  const atendido = useRef(null)
  useEffect(() => {
    if (!url || atendido.current === url || !user) return
    const codigo = codigoDesde(url)
    if (!codigo) return
    atendido.current = url
    pedirConCodigo(codigo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, user])

  const alEscanear = (codigo) => {
    setEscaneando(false)
    pedirConCodigo(codigo)
  }

  if (trabajando) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={tema.textFaint} />
      </View>
    )
  }

  const nombre = (user?.displayName || user?.email || '').split(' ')[0]

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: inset.top + 32, paddingBottom: inset.bottom + 32 }}
    >
      <Text style={{ color: tema.text, fontSize: 36, fontWeight: '800', letterSpacing: -1.2 }}>
        Bumko
      </Text>
      <Text style={{ color: tema.textDim, fontSize: 16, marginTop: 6, marginBottom: 26 }}>
        {t('bienvenida.hola', { nombre })}
      </Text>

      <Opcion
        icono={PlusIcon}
        titulo={t('bienvenida.crearBar')}
        sub={t('bienvenida.crearBarSub')}
        onPress={() => setDialogo('crear')}
      />

      <Opcion
        icono={QrIcon}
        titulo={t('bienvenida.escanear')}
        sub={t('bienvenida.escanearSub')}
        onPress={() => { setAviso(''); setEscaneando(true) }}
      />

      {aviso ? (
        <Text style={{ color: tema.textDim, fontSize: 15, lineHeight: 22, marginTop: 14 }}>
          {aviso}
        </Text>
      ) : null}

      <Pressable onPress={() => setDialogo('codigo')} hitSlop={8} style={{ marginTop: 22 }}>
        <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 20 }}>
          {t('bienvenida.porWhatsapp')}{' '}
          <Text style={{ color: tema.accent, fontWeight: '700' }}>{t('bienvenida.ingresarCodigo')}</Text>
        </Text>
      </Pressable>

      <Pressable onPress={signOut} style={{ marginTop: 34, alignSelf: 'center' }}>
        <Text style={{ color: tema.textFaint, fontSize: 14, fontWeight: '600' }}>
          {t('bienvenida.cerrarSesion')}
        </Text>
      </Pressable>

      {dialogo === 'crear' && (
        <Dialogo
          titulo={t('crearBar.titulo')}
          sub={t('crearBar.sub')}
          input={{ placeholder: t('crearBar.campo') }}
          confirmar={t('crearBar.crear')}
          onConfirm={handleCrear}
          onClose={() => setDialogo(null)}
        />
      )}

      {dialogo === 'codigo' && (
        <Dialogo
          titulo={t('codigo.titulo')}
          sub={t('codigo.sub')}
          input={{ placeholder: t('codigo.campo'), autoCapitalize: 'characters' }}
          confirmar={t('codigo.solicitar')}
          onConfirm={(texto) => {
            setDialogo(null)
            if (texto?.trim()) pedirConCodigo(codigoDesde(texto))
          }}
          onClose={() => setDialogo(null)}
        />
      )}

      <Modal visible={escaneando} animationType="slide" onRequestClose={() => setEscaneando(false)}>
        <Escaner onCodigo={alEscanear} onClose={() => setEscaneando(false)} />
      </Modal>
    </ScrollView>
  )
}

function Opcion({ icono: Icono, titulo, sub, onPress }) {
  const tema = useTema()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: tema.surface,
        borderRadius: tema.radio.md,
        padding: 18,
        marginBottom: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: tema.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icono size={20} color={tema.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: tema.text, fontSize: 17, fontWeight: '700' }}>{titulo}</Text>
        <Text style={{ color: tema.textFaint, fontSize: 13, marginTop: 2 }}>{sub}</Text>
      </View>
      <ArrowRightIcon size={18} color={tema.textFaint} />
    </Pressable>
  )
}
