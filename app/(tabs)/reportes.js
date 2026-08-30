import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useTema } from '../../src/context/tema'
import { useT } from '../../src/i18n'
import { useBar } from '../../src/lib/store'
import { money } from '../../src/lib/formato'
import Guardia from '../../src/components/Guardia'
import { Cifras, Etiqueta, Tarjeta, Titulo, Vacio } from '../../src/components/ui'
import { ChartIcon, ListIcon } from '../../src/components/icons'

/* Qué se vendió, cuánto costó y qué quedó.

   "Por evento" no es una agrupación aparte sino un filtro más: elegido un
   evento, se lo puede seguir mirando por día o por mes. Y lo que no cae en
   ningún evento no se descarta — va a su propio grupo, porque una venta suelta
   sigue siendo plata. */

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export default function Reportes() {
  return (
    <Guardia soloAdmin>
      <PantallaReportes />
    </Guardia>
  )
}

function PantallaReportes() {
  const tema = useTema()
  const t = useT()

  const { items: ventas, listo } = useBar((e) => e.ventas)
  const { items: eventos } = useBar((e) => e.eventos)

  const [modo, setModo] = useState('dia')        // dia | mes | evento
  const [eventoId, setEventoId] = useState('')   // '' = no filtra
  const [vista, setVista] = useState('listado')  // listado | graficos

  const porId = useMemo(
    () => Object.fromEntries(eventos.map((e) => [e.id, e])),
    [eventos],
  )

  /* Lo que registra un dev es prueba, no venta: nunca entra a los reportes.
     Es el sentido entero del rol. */
  const filtradas = useMemo(
    () => ventas.filter((s) => !s.dev && (!eventoId || s.eventId === eventoId)),
    [ventas, eventoId],
  )

  const { grupos, resumen } = useMemo(() => agrupar(filtradas, modo, porId, t), [filtradas, modo, porId, t])

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
        {/* Las dos decisiones gruesas, arriba y en una línea cada una */}
        <Etiqueta style={{ marginTop: 4 }}>{t('reportes.filtrarEvento')}</Etiqueta>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pastilla activo={!eventoId} onPress={() => setEventoId('')}>
            {t('reportes.sinEvento')}
          </Pastilla>
          {eventos.map((e) => (
            <Pastilla key={e.id} activo={eventoId === e.id} onPress={() => setEventoId(e.id)}>
              {e.name}
            </Pastilla>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {[
            { id: 'dia', txt: t('reportes.porDia') },
            { id: 'mes', txt: t('reportes.porMes') },
            { id: 'evento', txt: t('reportes.porEvento') },
          ].map((o) => (
            <Pastilla key={o.id} activo={modo === o.id} onPress={() => setModo(o.id)} ancho>
              {o.txt}
            </Pastilla>
          ))}
        </View>

        <Cifras
          datos={[
            { val: money(resumen.total), lbl: t('reportes.vendido') },
            { val: money(resumen.costo), lbl: t('reportes.costo') },
            {
              val: money(resumen.total - resumen.costo),
              lbl: t('reportes.resultado'),
              color: resumen.total - resumen.costo < 0 ? tema.redInk : tema.greenInk,
            },
          ]}
        />

        <Text style={{ color: tema.textDim, fontSize: 13, marginTop: 10, lineHeight: 19 }}>
          {t('reportes.desglose', {
            regulares: resumen.regulares,
            promos: resumen.promos,
            especiales: resumen.especiales,
            regalos: resumen.regalos,
          })}
        </Text>

        {vista === 'listado' ? (
          <>
            {grupos.map((g) => (
              <Tarjeta key={g.key} style={{ marginTop: 12 }}>
                <Text style={{ color: tema.text, fontSize: 17, fontWeight: '700' }}>{g.label}</Text>
                {g.sub ? (
                  <Text style={{ color: tema.textFaint, fontSize: 13, marginTop: 2 }}>{g.sub}</Text>
                ) : null}

                <Cifras
                  datos={[
                    { val: money(g.total), lbl: t('reportes.vendido') },
                    { val: money(g.costo), lbl: t('reportes.costo') },
                    {
                      val: money(g.total - g.costo),
                      lbl: t('reportes.resultado'),
                      color: g.total - g.costo < 0 ? tema.redInk : tema.greenInk,
                    },
                  ]}
                />

                <Text style={{ color: tema.textFaint, fontSize: 13, marginTop: 10 }}>
                  {g.unidades} · {t('reportes.entregados')}: {g.regalos}
                </Text>

                {/* Qué se vendió adentro de este grupo, de mayor a menor */}
                <View style={{ marginTop: 12, gap: 6 }}>
                  {top(g.products, 5).map(([nombre, n]) => (
                    <View key={nombre} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text numberOfLines={1} style={{ color: tema.textDim, fontSize: 14, flex: 1 }}>
                        {nombre}
                      </Text>
                      <Text style={{ color: tema.text, fontSize: 14, fontWeight: '700' }}>{n}</Text>
                    </View>
                  ))}
                </View>
              </Tarjeta>
            ))}
          </>
        ) : (
          <>
            <Titulo>{t('reportes.masVendidos')}</Titulo>
            <Barras datos={top(resumen.products, 8)} tema={tema} />

            <Titulo>{t('reportes.quienRegistro')}</Titulo>
            <Barras datos={top(resumen.users, 8)} tema={tema} />
          </>
        )}

        {listo && filtradas.length === 0 ? (
          <Vacio icono={ChartIcon}>
            {ventas.length === 0 ? t('reportes.sinVentas') : t('reportes.sinResultados')}
          </Vacio>
        ) : null}
      </ScrollView>

      {/* Los dos modos de mirar, flotando abajo a la derecha: los filtros de
          arriba ya son bastante, y esto se toca una vez cada tanto. */}
      <View
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          flexDirection: 'row',
          gap: 8,
          backgroundColor: tema.surface,
          borderRadius: 100,
          padding: 5,
        }}
      >
        {[
          { id: 'listado', Icono: ListIcon },
          { id: 'graficos', Icono: ChartIcon },
        ].map(({ id, Icono }) => (
          <Pressable
            key={id}
            onPress={() => setVista(id)}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: vista === id ? tema.surface3 : 'transparent',
            }}
          >
            <Icono size={19} color={vista === id ? tema.text : tema.textFaint} />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function Pastilla({ children, activo, onPress, ancho }) {
  const tema = useTema()
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: ancho ? 1 : undefined,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 100,
        alignItems: 'center',
        backgroundColor: activo ? tema.surface3 : tema.surface,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ color: activo ? tema.text : tema.textFaint, fontSize: 13, fontWeight: '700' }}
      >
        {children}
      </Text>
    </Pressable>
  )
}

/* Barras horizontales dibujadas con Views. Una librería de gráficos, para
   ocho barras y un número al lado, pesaría más que toda la pantalla.

   La primera va en el color de acento y el resto en gris: lo que se lee de un
   vistazo es cuál ganó, no la escala exacta. */
function Barras({ datos, tema }) {
  if (datos.length === 0) return null
  const max = Math.max(...datos.map(([, n]) => n))

  return (
    <View style={{ gap: 10 }}>
      {datos.map(([nombre, n], i) => (
        <View key={nombre} style={{ gap: 5 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <Text numberOfLines={1} style={{ color: tema.textDim, fontSize: 14, flex: 1 }}>
              {nombre}
            </Text>
            <Text style={{ color: tema.text, fontSize: 14, fontWeight: '700' }}>{n}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: tema.surface }}>
            <View
              style={{
                width: `${Math.max(4, (n / max) * 100)}%`,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === 0 ? tema.accent : tema.surface3,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  )
}

const top = (mapa, n) => Object.entries(mapa || {}).sort((a, b) => b[1] - a[1]).slice(0, n)

// A qué grupo cae cada venta. Lo que no tiene fecha o evento no se descarta:
// va a su propio grupo, al final.
function claveDe(venta, modo, porId, t) {
  if (modo === 'evento') {
    const ev = venta.eventId ? porId[venta.eventId] : null
    if (!ev) return { key: '__sin', label: t('reportes.sinEvento'), orden: '', sub: t('reportes.ventasSueltas') }
    return { key: venta.eventId, label: ev.name, orden: ev.startedAt?.seconds || 0 }
  }

  const d = venta.createdAt?.toDate ? venta.createdAt.toDate() : null
  if (!d) return { key: '__sin', label: '—', orden: '' }

  if (modo === 'mes') {
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: `${MESES[d.getMonth()]} ${d.getFullYear()}`,
      orden: d.getFullYear() * 12 + d.getMonth(),
    }
  }

  return {
    key: d.toDateString(),
    label: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    orden: d.getTime(),
  }
}

function agrupar(ventas, modo, porId, t) {
  const mapa = new Map()
  const resumen = {
    total: 0, costo: 0, unidades: 0,
    regalos: 0, especiales: 0, promos: 0, regulares: 0,
    products: {}, users: {},
  }

  for (const s of ventas) {
    // Un 2x1 son dos unidades en un solo registro
    const cuantas = s.qty || 1
    const { key, label, orden, sub } = claveDe(s, modo, porId, t)

    if (!mapa.has(key)) {
      mapa.set(key, {
        key, label, orden, sub,
        total: 0, costo: 0, unidades: 0, regalos: 0, products: {},
      })
    }
    const g = mapa.get(key)

    g.total += s.amount || 0
    g.costo += s.costPrice || 0
    g.unidades += cuantas
    g.products[s.productName] = (g.products[s.productName] || 0) + cuantas

    resumen.total += s.amount || 0
    resumen.costo += s.costPrice || 0
    resumen.unidades += cuantas
    resumen.products[s.productName] = (resumen.products[s.productName] || 0) + cuantas

    const quien = s.userName || s.userEmail || '—'
    resumen.users[quien] = (resumen.users[quien] || 0) + cuantas

    if (s.mode === 'gift') { g.regalos += cuantas; resumen.regalos += cuantas }
    else if (s.mode === 'promo') resumen.promos += cuantas
    else if (s.mode === 'custom') resumen.especiales += cuantas
  }

  resumen.regulares =
    resumen.unidades - resumen.regalos - resumen.especiales - resumen.promos

  // Más reciente arriba; el grupo sin fecha o sin evento va al fondo.
  const grupos = [...mapa.values()].sort((a, b) => {
    if (a.orden === '') return 1
    if (b.orden === '') return -1
    return b.orden - a.orden
  })

  return { grupos, resumen }
}
