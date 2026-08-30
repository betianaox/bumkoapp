import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTema } from '../context/tema'
import { useAuth } from '../context/auth'
import { useT } from '../i18n'
import {
  aceptarInvitacion,
  buscarPorCodigo,
  crearBar,
  misInvitaciones,
  pedirEntrar,
  rechazarInvitacion,
  solicitudDoc,
} from '../lib/equipo'
import { getDoc } from 'firebase/firestore'
import { Boton, Campo, Etiqueta, Tarjeta } from '../components/ui'
import Dialogo from '../components/Dialogo'
import { ArrowRightIcon, PlusIcon, TagIcon } from '../components/icons'

/* La primera pantalla de quien instala la app y todavía no pertenece a ningún
   bar. Tres caminos, y el orden importa:

     1. Si le dejaron una invitación, es lo primero que ve. Es el caso más
        frecuente —alguien la sumó a su equipo— y el que menos pasos tiene.
     2. Crear su propio bar.
     3. Entrar con un código a un bar que ya existe.

   La invitación se busca acá y no en el contexto de sesión: es una lectura de
   una sola vez, para una sola pantalla, y cargarla en el arranque de la app
   le sumaría una espera a todos los que ya tienen bar — que son casi todos. */
export default function Bienvenida() {
  const tema = useTema()
  const t = useT()
  const { user, signOut, resolverBar } = useAuth()
  const inset = useSafeAreaInsets()

  const [invitaciones, setInvitaciones] = useState(null)   // null = todavía buscando
  const [dialogo, setDialogo] = useState(null)             // 'crear' | 'codigo'
  const [trabajando, setTrabajando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [aviso, setAviso] = useState('')

  const buscarInvitaciones = useCallback(async () => {
    if (!user?.email) return
    try {
      setInvitaciones(await misInvitaciones(user.email))
    } catch (e) {
      console.warn('[Bumko] invitaciones', e.message)
      setInvitaciones([])
    }
  }, [user?.email])

  useEffect(() => { buscarInvitaciones() }, [buscarInvitaciones])

  const aceptar = async (inv) => {
    setTrabajando(true)
    try {
      await aceptarInvitacion({ invitacion: inv, user })
      await resolverBar(user)
    } catch (e) {
      console.warn('[Bumko] aceptar', e.message)
      setAviso(t('crearBar.error'))
      setTrabajando(false)
    }
  }

  const rechazar = async (inv) => {
    await rechazarInvitacion({ invitacion: inv, user }).catch(() => {})
    buscarInvitaciones()
  }

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

  /* Con el código no se entra: se pide entrar. El código puede haber circulado
     por cualquier lado, así que del otro lado hay un admin que mira quién es
     antes de dejarlo pasar. */
  const handleCodigo = async (codigo) => {
    setDialogo(null)
    if (!codigo?.trim()) return
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

  const copiarCorreo = async () => {
    await Clipboard.setStringAsync(user?.email || '')
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
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

      {invitaciones === null ? (
        <ActivityIndicator color={tema.textFaint} />
      ) : invitaciones.length > 0 ? (
        <>
          <Etiqueta>{t('bienvenida.tienesInvitaciones')}</Etiqueta>
          {invitaciones.map((inv) => (
            <Tarjeta key={inv.barId}>
              <Text style={{ color: tema.text, fontSize: 21, fontWeight: '700' }}>
                {inv.barNombre}
              </Text>
              {inv.invitadoPorNombre ? (
                <Text style={{ color: tema.textDim, fontSize: 14, marginTop: 3 }}>
                  {t('bienvenida.invitadoPor', { quien: inv.invitadoPorNombre })}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <Boton tipo="fantasma" onPress={() => rechazar(inv)} style={{ flex: 1 }}>
                  {t('bienvenida.rechazar')}
                </Boton>
                <Boton onPress={() => aceptar(inv)} style={{ flex: 1.4 }} icono={ArrowRightIcon}>
                  {t('bienvenida.aceptar')}
                </Boton>
              </View>
            </Tarjeta>
          ))}
          <View style={{ height: 18 }} />
        </>
      ) : null}

      <Opcion
        icono={PlusIcon}
        titulo={t('bienvenida.crearBar')}
        sub={t('bienvenida.crearBarSub')}
        onPress={() => setDialogo('crear')}
      />

      <Opcion
        icono={TagIcon}
        titulo={t('bienvenida.tengoCodigo')}
        sub={t('bienvenida.tengoCodigoSub')}
        onPress={() => setDialogo('codigo')}
      />

      {/* Para quien no tiene invitación ni código: el correo con el que entró,
          que es exactamente el dato que le van a pedir del otro lado. */}
      {invitaciones !== null && invitaciones.length === 0 ? (
        <View style={{ marginTop: 26 }}>
          <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 21 }}>
            {t('bienvenida.pideQueTeInviten')}
          </Text>
          <Pressable
            onPress={copiarCorreo}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              backgroundColor: tema.surface2,
              borderRadius: tema.radio.sm,
              padding: 14,
              marginTop: 12,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text numberOfLines={1} style={{ color: tema.text, fontSize: 15, flex: 1 }}>
              {user?.email}
            </Text>
            <Text style={{ color: tema.accent, fontSize: 13, fontWeight: '700' }}>
              {copiado ? t('bienvenida.copiado') : t('bienvenida.copiar')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {aviso ? (
        <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 21, marginTop: 22 }}>
          {aviso}
        </Text>
      ) : null}

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
          onConfirm={handleCodigo}
          onClose={() => setDialogo(null)}
        />
      )}
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
