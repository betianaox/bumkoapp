import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { useAuth } from '../../src/context/auth'
import { useTema } from '../../src/context/tema'
import { useT } from '../../src/i18n'
import { useBar } from '../../src/lib/store'
import { barDoc, usuarioDoc } from '../../src/lib/bar'
import { fechaCorta } from '../../src/lib/formato'
import {
  aceptarSolicitud,
  cambiarCodigo,
  rechazarSolicitud,
  solicitudesDe,
} from '../../src/lib/equipo'
import Guardia from '../../src/components/Guardia'
import Dialogo from '../../src/components/Dialogo'
import Avatar from '../../src/components/Avatar'
import QrDelBar from '../../src/components/QrDelBar'
import { Boton, BotonIcono, Etiqueta, Tarjeta, Titulo, Vacio } from '../../src/components/ui'
import { RefreshIcon, TrashIcon } from '../../src/components/icons'

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
  const [sacar, setSacar] = useState(null)
  const [renovar, setRenovar] = useState(false)
  const [aviso, setAviso] = useState('')

  /* Esta escucha no va al store global: solo sirve en esta pantalla y solo la
     puede leer un admin. Cargarla al entrar a la app le sumaría una consulta a
     todo el mundo, incluido el staff, que no la puede ni ver. */
  useEffect(() => {
    if (!barId) return
    return onSnapshot(
      solicitudesDe(barId),
      (s) => setSolicitudes(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      () => {},
    )
  }, [barId])

  /* Un código nuevo: el QR anterior, y cualquier foto que haya circulado de
     él, deja de servir. Quien ya está en el equipo no se entera: sigue igual. */
  const confirmarRenovar = async () => {
    setRenovar(false)
    setAviso('')
    try {
      await cambiarCodigo({ barId, barNombre: bar?.name, codigoViejo: bar?.codigo })
      setAviso(t('qr.renovado'))
    } catch (e) {
      console.warn('[Bumko] cambiar código', e.message)
      setAviso(t('crearBar.error'))
    }
  }

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
      {/* La única puerta de entrada: el QR que muestra o manda el dueño. Quien
          lo escanea pide entrar, y su pedido aparece acá abajo. */}
      <Tarjeta style={{ marginTop: 4 }}>
        <Etiqueta>{t('qr.titulo')}</Etiqueta>
        <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 20, marginBottom: 14 }}>
          {t('qr.sub')}
        </Text>
        <QrDelBar bar={bar} />
        <Boton tipo="fantasma" icono={RefreshIcon} onPress={() => setRenovar(true)} style={{ marginTop: 10 }}>
          {t('qr.cambiar')}
        </Boton>
      </Tarjeta>

      {aviso ? (
        <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 20, marginBottom: 4 }}>
          {aviso}
        </Text>
      ) : null}

      {/* Quien escaneó el QR y está esperando que lo acepten */}
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

      {renovar && (
        <Dialogo
          titulo={t('qr.cambiarTitulo')}
          sub={t('qr.cambiarSub')}
          confirmar={t('qr.cambiar')}
          onConfirm={confirmarRenovar}
          onClose={() => setRenovar(false)}
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
