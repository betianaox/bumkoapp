import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { addDoc, deleteDoc, increment, serverTimestamp, updateDoc } from 'firebase/firestore'
import { useAuth } from '../../src/context/auth'
import { useTema } from '../../src/context/tema'
import { useT } from '../../src/i18n'
import { useBar } from '../../src/lib/store'
import { barCol, barDoc } from '../../src/lib/bar'
import { colorDe } from '../../src/lib/productTone'
import { money } from '../../src/lib/formato'
import Guardia from '../../src/components/Guardia'
import VarianteModal from '../../src/components/VarianteModal'
import { Vacio } from '../../src/components/ui'
import { BoxIcon, CloseIcon, UndoIcon } from '../../src/components/icons'

const LARGO_MS = 450       // a partir de acá es "quiero una variante", no una venta
const RECIENTES_MAX = 5
const RECIENTE_TTL = 10000 // el chip vive 10s: tiempo de darte cuenta, no de olvidarte
const CONFIRMA_MS = 3000

// Que no vibre no puede romper una venta: si el teléfono no sabe, sigue.
function buzz(tipo = 'ligero') {
  try {
    Haptics.impactAsync(
      tipo === 'medio' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    )
  } catch { /* da igual */ }
}

export default function Vender() {
  return (
    <Guardia>
      <PantallaVenta />
    </Guardia>
  )
}

function PantallaVenta() {
  const tema = useTema()
  const t = useT()
  const { user, barId, isDev } = useAuth()

  const [elegido, setElegido] = useState(null)
  const [recientes, setRecientes] = useState([])
  const [porAnular, setPorAnular] = useState(null)
  const [destellos, setDestellos] = useState([])

  const temporizador = useRef(null)
  const largoDisparado = useRef(false)

  const { items: todos, listo } = useBar((e) => e.productos)
  const eventos = useBar((e) => e.eventos.items)
  const evento = eventos.find((e) => e.status === 'live') || null

  // Los ocultos siguen existiendo, con su stock y su historia, pero esta noche
  // no se venden.
  const productos = todos.filter((p) => p.visible !== false)

  // Los movimientos viejos se caen solos: deshacer algo de hace cinco minutos
  // es peor que no deshacerlo.
  useEffect(() => {
    if (recientes.length === 0) return
    const id = setInterval(() => {
      setRecientes((prev) => prev.filter((r) => Date.now() - r.at < RECIENTE_TTL))
    }, 500)
    return () => clearInterval(id)
  }, [recientes.length])

  // El "¿anular?" se cancela solo si no lo confirmas
  useEffect(() => {
    if (!porAnular) return
    const id = setTimeout(() => setPorAnular(null), CONFIRMA_MS)
    return () => clearTimeout(id)
  }, [porAnular])

  useEffect(() => () => clearTimeout(temporizador.current), [])

  const destellar = (productId, texto) => {
    const id = `${productId}-${Date.now()}`
    setDestellos((prev) => [...prev, { id, productId, texto }])
    setTimeout(() => setDestellos((prev) => prev.filter((d) => d.id !== id)), 750)
  }

  const registrar = async (producto, datos) => {
    // Un 2x1 saca dos del stock; todo lo demás, una
    const cuantas = datos.qty || 1

    destellar(producto.id, datos.mode === 'gift' ? t('venta.regalo') : `−${cuantas}`)

    // El stock primero: es lo que ve el resto del equipo en sus pantallas
    await updateDoc(barDoc(barId, 'products', producto.id), { stock: increment(-cuantas) })

    const venta = await addDoc(barCol(barId, 'sales'), {
      productId: producto.id,
      productName: producto.name,
      mode: datos.mode,
      amount: datos.amount,
      qty: cuantas,
      /* El costo se copia acá y no se busca después en el producto: si mañana
         cambia el precio de compra, las noches ya cerradas tienen que seguir
         diciendo lo que dijeron. Lo mismo vale para un regalo, que cuesta
         igual aunque no se haya cobrado. */
      costPrice: (producto.costPrice || 0) * cuantas,
      reason: datos.reason || null,
      who: datos.who || null,
      eventId: evento ? evento.id : null,
      // Lo que registra un dev es prueba, no venta: queda marcado para que los
      // reportes y los totales del evento no lo cuenten.
      dev: isDev ? true : null,
      userEmail: user?.email || null,
      userName: user?.displayName || null,
      createdAt: serverTimestamp(),
    })

    setRecientes((prev) => [
      {
        saleId: venta.id,
        productId: producto.id,
        productName: producto.name,
        mode: datos.mode,
        qty: cuantas,
        at: Date.now(),
      },
      ...prev,
    ].slice(0, RECIENTES_MAX))
  }

  // Un toque = venta al precio de lista. El 90% de la noche pasa por acá.
  const ventaRapida = (p) => {
    buzz('ligero')
    registrar(p, { mode: 'regular', amount: p.salePrice })
  }

  // El 2x1: dos unidades por el precio de la promo, de un toque
  const ventaPromo = (p) => {
    buzz('medio')
    registrar(p, { mode: 'promo', amount: p.promoPrice, qty: 2 })
  }

  const anular = async (r) => {
    setPorAnular(null)
    setRecientes((prev) => prev.filter((x) => x.saleId !== r.saleId))
    buzz('medio')
    // Devuelve lo mismo que sacó: un 2x1 repone dos
    await updateDoc(barDoc(barId, 'products', r.productId), { stock: increment(r.qty || 1) })
    await deleteDoc(barDoc(barId, 'sales', r.saleId))
  }

  const empezarPulsacion = (p) => {
    largoDisparado.current = false
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => {
      largoDisparado.current = true
      buzz('ligero')
      setElegido(p)
    }, LARGO_MS)
  }

  const soltar = () => clearTimeout(temporizador.current)

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg }}>
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: recientes.length ? 90 : 24 }}>
        {listo && productos.length === 0 ? (
          <Vacio icono={BoxIcon}>
            {`${t('venta.vacioTitulo')}\n${t('venta.vacioSub')}`}
          </Vacio>
        ) : null}

        {productos.length > 0 ? (
          <Text
            style={{
              color: tema.textFaint,
              fontSize: 12,
              fontWeight: '600',
              textAlign: 'center',
              paddingVertical: 8,
            }}
          >
            {t('venta.hint')}
          </Text>
        ) : null}

        {/* Dos columnas siempre. En una pantalla angosta, tres bloques por
            renglón dejan el nombre sin lugar; uno solo por renglón los hace
            enormes y obliga a scrollear toda la carta. */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 13 }}>
          {productos.map((p) => (
            <Bloque
              key={p.id}
              producto={p}
              tema={tema}
              t={t}
              destellos={destellos.filter((d) => d.productId === p.id)}
              onVender={() => ventaRapida(p)}
              onPromo={() => ventaPromo(p)}
              onPulsar={() => empezarPulsacion(p)}
              onSoltar={soltar}
              largoDisparado={largoDisparado}
            />
          ))}
        </View>
      </ScrollView>

      {elegido ? (
        <VarianteModal
          product={elegido}
          onClose={() => setElegido(null)}
          onConfirm={(datos) => {
            const p = elegido
            setElegido(null)
            buzz('ligero')
            registrar(p, datos)
          }}
        />
      ) : null}

      {/* Deshacer, a mano y a la vista: en la pantalla donde se equivoca uno,
          no escondido en un menú de otra pestaña. */}
      {recientes.length > 0 ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: tema.surface,
            borderTopWidth: 1,
            borderTopColor: tema.line,
          }}
        >
          <UndoIcon size={16} color={tema.textFaint} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {recientes.map((r) => {
              const confirmando = porAnular === r.saleId
              return (
                <Pressable
                  key={r.saleId}
                  onPress={() => (confirmando ? anular(r) : setPorAnular(r.saleId))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    borderRadius: 100,
                    backgroundColor: confirmando ? tema.red : tema.surface2,
                  }}
                >
                  {confirmando ? (
                    <>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                        {t('venta.anular')}
                      </Text>
                      <CloseIcon size={13} color="#fff" />
                    </>
                  ) : (
                    <>
                      <Text style={{ color: tema.text, fontSize: 13, fontWeight: '600' }}>
                        {r.productName}
                      </Text>
                      <Text style={{ color: tema.textFaint, fontSize: 12, fontWeight: '700' }}>
                        {r.mode === 'gift'
                          ? t('venta.regalo')
                          : r.mode === 'promo'
                            ? t('venta.promo')
                            : t('venta.unaMenos')}
                      </Text>
                    </>
                  )}
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  )
}

function Bloque({
  producto: p,
  tema,
  t,
  destellos,
  onVender,
  onPromo,
  onPulsar,
  onSoltar,
  largoDisparado,
}) {
  const agotado = p.stock <= 0
  const poco = p.lowStockThreshold != null && p.stock <= p.lowStockThreshold && p.stock > 0
  // Con una sola unidad no se puede hacer un 2x1
  const conPromo = p.promoPrice > 0 && p.stock >= 2

  const tono = colorDe(p, tema)
  const relleno = agotado ? tema.surface2 : matiz(tono, tema.toneFill)
  const tinta = agotado ? tema.textFaint : tema.toneInk === 'tono' ? tono : tema.text

  return (
    <View style={{ width: '48%', aspectRatio: 1 / 1.05 }}>
      <Pressable
        onPressIn={() => !agotado && onPulsar()}
        onPressOut={onSoltar}
        onPress={() => {
          if (largoDisparado.current || agotado) return
          onVender()
        }}
        style={{
          flex: 1,
          borderRadius: 22,
          backgroundColor: relleno,
          paddingTop: 36,
          paddingHorizontal: 12,
          paddingBottom: conPromo ? 46 : 18,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          overflow: 'hidden',
        }}
      >
        {/* Lo que queda, arriba a la derecha. En rojo fuerte cuando está por
            cortarse: es el número que hay que ver sin buscarlo. */}
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: 100,
            backgroundColor: poco ? tema.alarm : 'rgba(0,0,0,0.25)',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{p.stock}</Text>
        </View>

        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          style={{
            color: tinta,
            fontSize: 22,
            fontWeight: '800',
            textAlign: 'center',
            letterSpacing: -0.4,
          }}
        >
          {p.name}
        </Text>
        <Text style={{ color: tinta, fontSize: 15, fontWeight: '700', opacity: 0.85 }}>
          {money(p.salePrice)}
        </Text>

        {agotado ? (
          <Text style={{ color: tema.textFaint, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
            {t('venta.sinStock')}
          </Text>
        ) : null}

        {destellos.map((d) => (
          <View
            key={d.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.35)',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800' }}>{d.texto}</Text>
          </View>
        ))}
      </Pressable>

      {/* El 2x1 va como botón aparte encima del bloque. Mantener apretado abre
          las variantes también acá: el gesto es de la card entera, no de cada
          pedazo. Un toque corto sí hace lo suyo — vender el 2x1. */}
      {conPromo ? (
        <Pressable
          onPressIn={onPulsar}
          onPressOut={onSoltar}
          onPress={() => {
            if (largoDisparado.current) return
            onPromo()
          }}
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 8,
            borderRadius: 10,
            backgroundColor: tema.promoBg,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>2×1</Text>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', opacity: 0.85 }}>
            {money(p.promoPrice)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
}

// El bloque lleva el color del producto en un velo, no en pleno: el nombre
// tiene que leerse encima, y a plena saturación no se lee.
function matiz(hex, alpha) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
