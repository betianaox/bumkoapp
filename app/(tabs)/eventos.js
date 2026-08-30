import { useEffect, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { addDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useAuth } from '../../src/context/auth'
import { useTema } from '../../src/context/tema'
import { useT } from '../../src/i18n'
import { useBar } from '../../src/lib/store'
import { barCol, barDoc } from '../../src/lib/bar'
import { fechaCorta, money, nombreSugerido } from '../../src/lib/formato'
import Guardia from '../../src/components/Guardia'
import Dialogo from '../../src/components/Dialogo'
import { Boton, BotonIcono, Campo, Cifras, Etiqueta, Tarjeta, Titulo, Vacio } from '../../src/components/ui'
import { PlayIcon, StopIcon, TrashIcon } from '../../src/components/icons'

const CAJA_SUGERIDA = 0   // arranca en cero: el número lo pone quien cuenta la caja

export default function Eventos() {
  return (
    <Guardia soloAdmin>
      <PantallaEventos />
    </Guardia>
  )
}

function PantallaEventos() {
  const tema = useTema()
  const t = useT()
  const { barId, isAdmin } = useAuth()

  const [nombre, setNombre] = useState(nombreSugerido)
  const [caja, setCaja] = useState(String(CAJA_SUGERIDA))
  const [editandoCaja, setEditandoCaja] = useState(null)
  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const [borrar, setBorrar] = useState(null)

  const { items: eventos } = useBar((e) => e.eventos)
  const { items: ventas } = useBar((e) => e.ventas)
  const guardada = useBar((e) => e.caja)

  const activo = eventos.find((e) => e.status === 'live') || null

  // Lo de esta noche. Las pruebas de un dev no cuentan para la caja.
  const deHoy = activo ? ventas.filter((s) => s.eventId === activo.id && !s.dev) : []

  useEffect(() => {
    if (!guardada) return
    setCaja((actual) => (actual === String(CAJA_SUGERIDA) ? String(guardada) : actual))
  }, [guardada])

  const recaudado = deHoy.reduce((sum, s) => sum + (s.amount || 0), 0)
  const costoTotal = deHoy.reduce((sum, s) => sum + (s.costPrice || 0), 0)

  // Un 2x1 son dos unidades en un solo registro: lo que se cuenta son unidades
  const cuantas = (s) => s.qty || 1
  const unidades = deHoy.reduce((sum, s) => sum + cuantas(s), 0)
  const regalados = deHoy.filter((s) => s.mode === 'gift').reduce((sum, s) => sum + cuantas(s), 0)

  const inicial = activo?.openingCash || 0
  const esperado = inicial + recaudado

  const iniciar = async () => {
    await addDoc(barCol(barId, 'events'), {
      name: nombre.trim() || nombreSugerido(),
      status: 'live',
      // Lo que hay en la caja antes de vender nada: sin esto, al cerrar la
      // noche no se sabe si la plata que hay es la que tiene que haber.
      openingCash: caja === '' ? (guardada || 0) : Number(caja),
      startedAt: serverTimestamp(),
      endedAt: null,
    })
    setNombre(nombreSugerido())
    setCaja(String(guardada || CAJA_SUGERIDA))
  }

  /* El arqueo: al cerrar se cuenta la caja y se guarda lo contado junto a lo
     esperado. Sin esto, la app dice cuánto debería haber pero nadie se entera
     nunca de cuánto había — que es la mitad que importa.

     Los totales quedan congelados en el evento, no se recalculan después: si
     mañana alguien corrige un precio, la noche cerrada no cambia. */
  const cerrar = async (contado) => {
    if (!activo) return
    setConfirmarCierre(false)
    const n = contado === '' || contado == null ? null : Number(contado)

    await updateDoc(barDoc(barId, 'events', activo.id), {
      status: 'closed',
      endedAt: serverTimestamp(),
      expectedCash: esperado,
      countedCash: n,
      cashDiff: n == null ? null : n - esperado,
      resumen: {
        vendido: recaudado,
        costo: costoTotal,
        resultado: recaudado - costoTotal,
        unidades,
        regalados,
      },
    })
  }

  const guardarCaja = async () => {
    await updateDoc(barDoc(barId, 'events', activo.id), {
      openingCash: editandoCaja === '' ? 0 : Number(editandoCaja),
    })
    setEditandoCaja(null)
  }

  /* Borrar un evento cerrado no borra sus ventas: son plata que entró y
     mercadería que salió, y el reporte del mes tiene que seguir cerrando
     igual. Lo que se limpia es la referencia — quedan como ventas sueltas —
     para no dejar apuntando a un documento que ya no existe. */
  const borrarEvento = async () => {
    const ev = borrar
    setBorrar(null)
    const suyas = ventas.filter((s) => s.eventId === ev.id)
    await Promise.all(
      suyas.map((s) => updateDoc(barDoc(barId, 'sales', s.id), { eventId: null })),
    )
    await deleteDoc(barDoc(barId, 'events', ev.id))
  }

  const textoBorrar = (n) =>
    n === 0 ? t('eventos.borrarSin') : n === 1 ? t('eventos.borrarUna') : t('eventos.borrarVarias', { n })

  const cerrados = eventos.filter((e) => e.status === 'closed')

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {activo ? (
        <Tarjeta
          style={{
            backgroundColor: `rgba(26, 143, 69, 0.20)`,
            marginTop: 4,
          }}
        >
          <Text style={{ color: tema.greenInk, fontSize: 20, fontWeight: '700' }}>
            {activo.name}
          </Text>
          <Text style={{ color: tema.textDim, fontSize: 14, marginTop: 2 }}>
            {t('eventos.enCurso')}
          </Text>

          <Cifras
            datos={[
              { val: money(inicial), lbl: t('eventos.cajaInicial'), fondo: 'rgba(26, 143, 69, 0.15)' },
              { val: money(recaudado), lbl: t('eventos.vendido'), fondo: 'rgba(26, 143, 69, 0.15)' },
              { val: money(esperado), lbl: t('eventos.total'), fondo: 'rgba(26, 143, 69, 0.15)' },
            ]}
          />

          <Text style={{ color: tema.textDim, fontSize: 14, marginTop: 10 }}>
            {t('eventos.resumen', { unidades, regalados })}
          </Text>

          {editandoCaja === null ? (
            <Boton
              tipo="fantasma"
              onPress={() => setEditandoCaja(String(inicial))}
              style={{ marginTop: 14, backgroundColor: 'rgba(26, 143, 69, 0.15)' }}
            >
              {t('eventos.ajustarCaja')}
            </Boton>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Campo
                style={{ flex: 1, backgroundColor: 'rgba(26, 143, 69, 0.15)' }}
                autoFocus
                keyboardType="numeric"
                value={editandoCaja}
                onChangeText={setEditandoCaja}
              />
              <Boton tipo="fantasma" onPress={guardarCaja}>{t('comun.guardar')}</Boton>
            </View>
          )}

          <Boton
            tipo="peligro"
            icono={StopIcon}
            onPress={() => setConfirmarCierre(true)}
            style={{ marginTop: 10 }}
          >
            {t('eventos.cerrar')}
          </Boton>
        </Tarjeta>
      ) : (
        <Tarjeta style={{ marginTop: 4 }}>
          <Text style={{ color: tema.text, fontSize: 17, fontWeight: '700', marginBottom: 14 }}>
            {t('eventos.iniciar')}
          </Text>

          {/* Los dos campos vienen completos: el nombre con el día de hoy y la
              caja con lo último que se guardó. Así arrancar la noche es tocar
              un botón, y cambiar algo es opcional. */}
          <Etiqueta>{t('eventos.nombre')}</Etiqueta>
          <Campo value={nombre} onChangeText={setNombre} selectTextOnFocus />

          <Etiqueta style={{ marginTop: 14 }}>{t('eventos.cajaInicial')}</Etiqueta>
          <Campo value={caja} onChangeText={setCaja} keyboardType="numeric" selectTextOnFocus />

          <Boton icono={PlayIcon} onPress={iniciar} style={{ marginTop: 18 }}>
            {t('eventos.iniciarBoton')}
          </Boton>
        </Tarjeta>
      )}

      <Titulo>{t('eventos.anteriores')}</Titulo>

      {cerrados.map((e) => {
        // La diferencia solo existe si alguien contó la caja al cerrar
        const dif = typeof e.cashDiff === 'number' ? e.cashDiff : null

        return (
          <Tarjeta key={e.id}>
            <Text style={{ color: tema.text, fontSize: 20, fontWeight: '700' }}>{e.name}</Text>
            <Text style={{ color: tema.textDim, fontSize: 14, marginTop: 2 }}>
              {fechaCorta(e.startedAt)}
              {e.openingCash ? t('eventos.arrancoCon', { monto: money(e.openingCash) }) : ''}
            </Text>

            {e.resumen ? (
              <>
                <Cifras
                  datos={[
                    { val: money(e.resumen.vendido), lbl: t('eventos.vendido') },
                    { val: money(e.resumen.costo), lbl: t('eventos.costo') },
                    {
                      val: money(e.resumen.resultado),
                      lbl: t('eventos.resultado'),
                      color: e.resumen.resultado < 0 ? tema.redInk : tema.greenInk,
                    },
                  ]}
                />
                <Text style={{ color: tema.textDim, fontSize: 14, marginTop: 10 }}>
                  {t('eventos.resumen', {
                    unidades: e.resumen.unidades,
                    regalados: e.resumen.regalados,
                  })}
                </Text>
              </>
            ) : null}

            {/* El arqueo (qué había contra qué tenía que haber) y el borrar
                comparten renglón: el pie de la tarjeta es la zona de cierre. */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                marginTop: 12,
              }}
            >
              {dif !== null ? (
                <View
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: tema.radio.sm,
                    backgroundColor:
                      dif === 0
                        ? 'rgba(26, 143, 69, 0.16)'
                        : dif > 0
                          ? 'rgba(255, 176, 32, 0.16)'
                          : 'rgba(255, 77, 61, 0.14)',
                  }}
                >
                  <Text
                    style={{
                      color: dif === 0 ? tema.greenInk : dif > 0 ? tema.amberInk : tema.redInk,
                      fontSize: 13,
                      fontWeight: '600',
                      lineHeight: 18,
                    }}
                  >
                    {dif === 0
                      ? t('eventos.cajaTotal', { monto: money(e.countedCash) })
                      : dif > 0
                        ? t('eventos.sobraron', {
                            dif: money(dif),
                            contado: money(e.countedCash),
                            esperado: money(e.expectedCash),
                          })
                        : t('eventos.faltaron', {
                            dif: money(-dif),
                            contado: money(e.countedCash),
                            esperado: money(e.expectedCash),
                          })}
                  </Text>
                </View>
              ) : null}

              {isAdmin ? (
                <BotonIcono
                  icono={TrashIcon}
                  color={tema.red}
                  etiqueta={t('eventos.borrarTitulo', { nombre: e.name })}
                  onPress={() => setBorrar(e)}
                />
              ) : null}
            </View>
          </Tarjeta>
        )
      })}

      {cerrados.length === 0 ? <Vacio>{t('eventos.vacio')}</Vacio> : null}

      {confirmarCierre && activo && (
        <Dialogo
          titulo={t('eventos.cerrarTitulo')}
          sub={t('eventos.cerrarSub', { esperado: money(esperado) })}
          input={{ keyboardType: 'numeric', initial: String(esperado) }}
          confirmar={t('eventos.cerrar')}
          peligro
          onConfirm={cerrar}
          onClose={() => setConfirmarCierre(false)}
        />
      )}

      {borrar && (
        <Dialogo
          titulo={t('eventos.borrarTitulo', { nombre: borrar.name })}
          sub={textoBorrar(ventas.filter((s) => s.eventId === borrar.id).length)}
          confirmar={t('eventos.borrarBoton')}
          peligro
          onConfirm={borrarEvento}
          onClose={() => setBorrar(null)}
        />
      )}
    </ScrollView>
  )
}
