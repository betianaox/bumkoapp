import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Share, Switch, Text, View } from 'react-native'
import * as Contacts from 'expo-contacts'
import { deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../src/lib/firebase'
import { useAuth } from '../../src/context/auth'
import { useTema } from '../../src/context/tema'
import { useT } from '../../src/i18n'
import { useBar } from '../../src/lib/store'
import { barDoc, usuarioDoc } from '../../src/lib/bar'
import { fechaCorta } from '../../src/lib/formato'
import {
  aceptarSolicitud,
  cancelarInvitacion,
  invitacionesDelBar,
  invitar,
  rechazarSolicitud,
  solicitudesDe,
} from '../../src/lib/equipo'
import Guardia from '../../src/components/Guardia'
import Dialogo from '../../src/components/Dialogo'
import Avatar from '../../src/components/Avatar'
import { Boton, BotonIcono, Etiqueta, Tarjeta, Titulo, Vacio } from '../../src/components/ui'
import { PlusIcon, TagIcon, TrashIcon } from '../../src/components/icons'

/* dev es un rol de mantenimiento: puede lo mismo que un admin, pero lo que
   registra queda afuera de los reportes y de la caja de la noche. Solo un dev
   puede nombrar a otro dev, así un admin no puede ascenderse a sí mismo. */
const ROLES = ['dev', 'admin', 'staff']

export default function Equipo() {
  return (
    <Guardia soloAdmin>
      <PantallaEquipo />
    </Guardia>
  )
}

function PantallaEquipo() {
  const tema = useTema()
  const t = useT()
  const { user, barId, isAdmin, isDev } = useAuth()

  const { items: equipo } = useBar((e) => e.equipo)
  const bar = useBar((e) => e.bar)

  const [solicitudes, setSolicitudes] = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [sacar, setSacar] = useState(null)
  const [invitando, setInvitando] = useState(null)   // { nombre, correo }
  const [aviso, setAviso] = useState('')

  /* Estas dos escuchas no van al store global: solo sirven en esta pantalla y
     solo las puede leer un admin. Cargarlas al entrar a la app le sumaría dos
     consultas a todo el mundo, incluido el staff, que no las puede ni ver. */
  useEffect(() => {
    if (!barId) return
    const a = onSnapshot(
      solicitudesDe(barId),
      (s) => setSolicitudes(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {},
    )
    const b = onSnapshot(
      invitacionesDelBar(barId),
      (s) => setInvitaciones(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {},
    )
    return () => { a(); b() }
  }, [barId])

  /* Invitar desde la agenda. Se abre el selector del sistema y no la lista
     entera: así vuelve un solo contacto —el que la persona eligió— y en iOS ni
     siquiera hace falta pedir permiso para leer los contactos. No se sube
     nada: de todo el contacto nos quedamos con el correo, y ni eso sin que lo
     confirmen en el paso siguiente. */
  const elegirContacto = async () => {
    setAviso('')
    try {
      const contacto = await Contacts.presentContactPickerAsync()
      if (!contacto) return

      const correo = contacto.emails?.[0]?.email
      if (!correo) {
        setAviso(t('equipo.sinCorreo'))
        return
      }
      setInvitando({ nombre: contacto.name || correo, correo })
    } catch (e) {
      console.warn('[Bumko] contactos', e.message)
      setAviso(t('equipo.permisoContactos'))
    }
  }

  /* El correo guardado en la agenda puede no ser el de su cuenta de Google, y
     una invitación al correo equivocado no falla: simplemente no llega nunca.
     Por eso el último paso es editable. */
  const confirmarInvitacion = async (correo) => {
    const destino = (correo || '').trim().toLowerCase()
    setInvitando(null)
    if (!destino) return

    if (equipo.some((m) => m.id === destino)) {
      setAviso(t('equipo.yaEsta', { nombre: destino }))
      return
    }
    if (invitaciones.some((i) => i.id === destino)) {
      setAviso(t('equipo.yaInvitado'))
      return
    }

    try {
      await invitar({ barId, barNombre: bar?.name, email: destino, invitadoPor: user })
      setAviso(t('equipo.invitada', { correo: destino }))
    } catch (e) {
      console.warn('[Bumko] invitar', e.message)
      setAviso(t('crearBar.error'))
    }
  }

  const compartirCodigo = () => {
    if (!bar?.codigo) return
    Share.share({
      message: `${bar.name || 'Bumko'} — ${t('equipo.codigoDelBar')}: ${bar.codigo}`,
    }).catch(() => {})
  }

  const alternarPuerta = () => updateDoc(doc(db, 'bares', barId), { autoJoin: !bar?.autoJoin })

  const cambiarRol = (m, rol) => {
    if (m.role === rol) return
    updateDoc(barDoc(barId, 'equipo', m.id), { role: rol })
  }

  const alternarActivo = (m) =>
    updateDoc(barDoc(barId, 'equipo', m.id), { active: m.active === false })

  const quitar = async () => {
    const m = sacar
    setSacar(null)
    await deleteDoc(barDoc(barId, 'equipo', m.id))
    // También del índice, si no queda apuntando a un bar donde ya no está
    await deleteDoc(usuarioDoc(m.id)).catch(() => {})
  }

  const soyYo = (m) => m.id === (user?.email || '').toLowerCase()
  const manda = (m) => m.role === 'admin' || m.role === 'dev'

  // No dejamos que el último que puede administrar se degrade o se borre:
  // quedaría un equipo sin nadie a cargo, y eso solo se arregla desde la
  // consola de Firebase.
  const conMando = equipo.filter(manda).length
  const ultimoAdmin = (m) => manda(m) && conMando <= 1

  // Nombrar o destituir devs es cosa de devs.
  const puedeTocarRol = (m, rol) => {
    if (!isAdmin) return false
    if (rol === 'dev' || m.role === 'dev') return isDev
    return !ultimoAdmin(m) || manda({ role: rol })
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* El código y la puerta: las dos formas de que llegue gente nueva sin
          que un admin la elija de a una. */}
      <Tarjeta style={{ marginTop: 4 }}>
        <Etiqueta>{t('equipo.codigoDelBar')}</Etiqueta>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text
            style={{ color: tema.text, fontSize: 26, fontWeight: '800', letterSpacing: 3, flex: 1 }}
          >
            {bar?.codigo || '——————'}
          </Text>
          <BotonIcono icono={TagIcon} etiqueta={t('equipo.compartir')} onPress={compartirCodigo} />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            marginTop: 18,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: tema.line,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: tema.text, fontSize: 15, fontWeight: '700' }}>
              {t('equipo.entradaLibre')}
            </Text>
            <Text style={{ color: tema.textFaint, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
              {bar?.autoJoin ? t('equipo.entradaLibreOn') : t('equipo.entradaLibreOff')}
            </Text>
          </View>
          <Switch
            value={!!bar?.autoJoin}
            onValueChange={alternarPuerta}
            trackColor={{ true: tema.green, false: tema.surface3 }}
          />
        </View>

        <Boton icono={PlusIcon} onPress={elegirContacto} style={{ marginTop: 18 }}>
          {t('equipo.invitar')}
        </Boton>
        <Text style={{ color: tema.textFaint, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          {t('equipo.invitarSub')}
        </Text>
      </Tarjeta>

      {aviso ? (
        <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 20, marginBottom: 4 }}>
          {aviso}
        </Text>
      ) : null}

      {/* Quien llegó por el código y está esperando que lo miren */}
      {solicitudes.length > 0 ? (
        <>
          <Titulo>{t('equipo.solicitudes', { n: solicitudes.length })}</Titulo>
          {solicitudes.map((s) => (
            <Tarjeta key={s.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar src={s.photo} name={s.name} email={s.email} size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: tema.text, fontSize: 15, fontWeight: '700' }}
                  >
                    {s.name || s.email}
                  </Text>
                  <Text numberOfLines={1} style={{ color: tema.textFaint, fontSize: 13 }}>
                    {s.email}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Boton
                  tipo="fantasma"
                  style={{ flex: 1 }}
                  onPress={() => rechazarSolicitud({ barId, solicitud: s })}
                >
                  {t('equipo.rechazar')}
                </Boton>
                <Boton style={{ flex: 1 }} onPress={() => aceptarSolicitud({ barId, solicitud: s })}>
                  {t('equipo.aprobar')}
                </Boton>
              </View>
            </Tarjeta>
          ))}
        </>
      ) : null}

      {/* A quién se invitó y todavía no entró */}
      {invitaciones.length > 0 ? (
        <>
          <Titulo>{t('equipo.pendientes', { n: invitaciones.length })}</Titulo>
          {invitaciones.map((i) => (
            <View
              key={i.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                backgroundColor: tema.surface,
                borderRadius: tema.radio.md,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <Avatar name={i.email} email={i.email} size={34} />
              <Text numberOfLines={1} style={{ color: tema.textDim, fontSize: 14, flex: 1 }}>
                {i.email}
              </Text>
              <BotonIcono
                icono={TrashIcon}
                color={tema.red}
                etiqueta={t('equipo.cancelarInvitacion')}
                onPress={() => cancelarInvitacion(i.id, barId)}
              />
            </View>
          ))}
        </>
      ) : null}

      <Titulo>{t('equipo.titulo', { n: equipo.length })}</Titulo>

      {equipo.map((m) => {
        const inactivo = m.active === false
        const trabado = !isAdmin || ultimoAdmin(m) || (m.role === 'dev' && !isDev)

        return (
          <Tarjeta key={m.id} style={{ opacity: inactivo ? 0.6 : 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar src={m.photo} name={m.name} email={m.email || m.id} size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: tema.text, fontSize: 16, fontWeight: '700', flexShrink: 1 }}
                  >
                    {m.name || m.email}
                  </Text>
                  {soyYo(m) ? (
                    <View
                      style={{
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 100,
                        backgroundColor: tema.surface3,
                      }}
                    >
                      <Text style={{ color: tema.textDim, fontSize: 11, fontWeight: '700' }}>
                        {t('equipo.tu')}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={{ color: tema.textFaint, fontSize: 13 }}>
                  {m.email || m.id}
                </Text>
                {m.createdAt ? (
                  <Text style={{ color: tema.textFaint, fontSize: 12, marginTop: 2 }}>
                    {t('equipo.entro', { fecha: fechaCorta(m.createdAt) })}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <View style={{ flexDirection: 'row', flex: 1, gap: 4 }}>
                {ROLES.map((r) => {
                  const elegido = (m.role || 'staff') === r
                  const puede = puedeTocarRol(m, r)
                  return (
                    <Pressable
                      key={r}
                      disabled={!puede}
                      onPress={() => cambiarRol(m, r)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: tema.radio.sm,
                        alignItems: 'center',
                        backgroundColor: elegido ? tema.surface3 : 'transparent',
                        opacity: puede || elegido ? 1 : 0.35,
                      }}
                    >
                      <Text
                        style={{
                          color: elegido ? tema.text : tema.textFaint,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {t(`ajustes.roles.${r}`)}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              <Switch
                value={!inactivo}
                disabled={trabado}
                onValueChange={() => alternarActivo(m)}
                trackColor={{ true: tema.green, false: tema.surface3 }}
              />

              <BotonIcono
                icono={TrashIcon}
                color={tema.red}
                disabled={trabado}
                etiqueta={t('equipo.sacar')}
                onPress={() => setSacar(m)}
              />
            </View>
          </Tarjeta>
        )
      })}

      {equipo.length === 0 ? <Vacio>{t('equipo.vacio')}</Vacio> : null}

      {invitando && (
        <Dialogo
          titulo={t('equipo.invitarTitulo', { nombre: invitando.nombre })}
          sub={t('equipo.invitarSubCorreo')}
          input={{
            initial: invitando.correo,
            keyboardType: 'email-address',
            autoCapitalize: 'none',
          }}
          confirmar={t('equipo.invitarBoton')}
          onConfirm={confirmarInvitacion}
          onClose={() => setInvitando(null)}
        />
      )}

      {sacar && (
        <Dialogo
          titulo={t('equipo.sacarTitulo', { nombre: sacar.name || sacar.email })}
          sub={t('equipo.sacarSub')}
          confirmar={t('equipo.sacar')}
          peligro
          onConfirm={quitar}
          onClose={() => setSacar(null)}
        />
      )}
    </ScrollView>
  )
}
