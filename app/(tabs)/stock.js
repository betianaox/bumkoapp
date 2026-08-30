import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { addDoc, deleteDoc, increment, updateDoc } from 'firebase/firestore'
import { useAuth } from '../../src/context/auth'
import { useTema } from '../../src/context/tema'
import { useT } from '../../src/i18n'
import { useBar } from '../../src/lib/store'
import { barCol, barDoc } from '../../src/lib/bar'
import { colorDe } from '../../src/lib/productTone'
import { money } from '../../src/lib/formato'
import Guardia from '../../src/components/Guardia'
import Dialogo from '../../src/components/Dialogo'
import TonePicker from '../../src/components/TonePicker'
import { Boton, BotonIcono, Campo, Etiqueta, Tarjeta, Titulo, Vacio } from '../../src/components/ui'
import {
  BoxIcon,
  EyeIcon,
  EyeOffIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '../../src/components/icons'

export default function Stock() {
  return (
    <Guardia soloAdmin>
      <PantallaStock />
    </Guardia>
  )
}

function PantallaStock() {
  const tema = useTema()
  const t = useT()
  const { barId } = useAuth()

  const [nombre, setNombre] = useState('')
  const [costo, setCosto] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [alerta, setAlerta] = useState('')
  const [promo, setPromo] = useState('')
  const [tono, setTono] = useState(null)

  const [dialogo, setDialogo] = useState(null)     // { tipo, producto }
  const [edicion, setEdicion] = useState(null)

  const { items: productos, listo } = useBar((e) => e.productos)

  const puedeAgregar = nombre.trim() && precio !== '' && stock !== ''

  const agregar = async () => {
    if (!puedeAgregar) return
    await addDoc(barCol(barId, 'products'), {
      name: nombre.trim(),
      costPrice: costo === '' ? 0 : Number(costo),
      salePrice: Number(precio),
      stock: Number(stock),
      lowStockThreshold: alerta === '' ? 5 : Number(alerta),
      // Sin precio no hay 2x1: el botón de la pantalla de venta aparece solo
      // si este número existe.
      promoPrice: promo === '' ? null : Number(promo),
      tone: tono,
      visible: true,
    })
    setNombre(''); setCosto(''); setPrecio(''); setStock(''); setAlerta(''); setPromo(''); setTono(null)
  }

  // increment y no stock + n: si otro está vendiendo al mismo tiempo, sumar
  // sobre el número que leímos hace un rato le pisaría las ventas.
  const reponer = async (valor) => {
    const p = dialogo.producto
    const n = Number(valor)
    setDialogo(null)
    if (valor === '' || Number.isNaN(n)) return
    await updateDoc(barDoc(barId, 'products', p.id), { stock: increment(n) })
  }

  /* La promo es el precio: sin precio no hay 2x1, así que vaciar el campo la
     apaga y no hace falta un interruptor aparte. */
  const guardarPromo = async (valor) => {
    const p = dialogo.producto
    const n = valor === '' ? null : Number(valor)
    setDialogo(null)
    if (n !== null && Number.isNaN(n)) return
    await updateDoc(barDoc(barId, 'products', p.id), { promoPrice: n })
  }

  const borrar = async () => {
    const p = dialogo.producto
    setDialogo(null)
    await deleteDoc(barDoc(barId, 'products', p.id))
  }

  const abrirEdicion = (p) => setEdicion({
    id: p.id,
    name: p.name,
    cost: String(p.costPrice ?? ''),
    price: String(p.salePrice ?? ''),
    threshold: String(p.lowStockThreshold ?? ''),
    promo: p.promoPrice ? String(p.promoPrice) : '',
    tone: p.tone || null,
  })

  const guardarEdicion = async () => {
    const e = edicion
    setEdicion(null)
    if (!e.name.trim() || e.price === '') return
    await updateDoc(barDoc(barId, 'products', e.id), {
      name: e.name.trim(),
      costPrice: e.cost === '' ? 0 : Number(e.cost),
      salePrice: Number(e.price),
      lowStockThreshold: e.threshold === '' ? 5 : Number(e.threshold),
      promoPrice: e.promo === '' ? null : Number(e.promo),
      tone: e.tone,
    })
  }

  // El stock no se edita en el formulario: se suma con el + o baja vendiendo.
  // Escribirlo a mano pisaría lo que otro vendió mientras tanto.
  const campo = (k) => (v) => setEdicion((e) => ({ ...e, [k]: v }))

  const alternarVisible = (p) =>
    updateDoc(barDoc(barId, 'products', p.id), { visible: p.visible === false })

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Titulo style={{ marginTop: 4 }}>{t('stock.nuevoProducto')}</Titulo>

      <Tarjeta>
        <Campo placeholder={t('stock.nombre')} value={nombre} onChangeText={setNombre} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Campo
            style={{ flex: 1 }}
            placeholder={t('stock.costo')}
            keyboardType="numeric"
            value={costo}
            onChangeText={setCosto}
          />
          <Campo
            style={{ flex: 1 }}
            placeholder={t('stock.venta')}
            keyboardType="numeric"
            value={precio}
            onChangeText={setPrecio}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Campo
            style={{ flex: 1 }}
            placeholder={t('stock.stockInicial')}
            keyboardType="numeric"
            value={stock}
            onChangeText={setStock}
          />
          <Campo
            style={{ flex: 1 }}
            placeholder={t('stock.alerta')}
            keyboardType="numeric"
            value={alerta}
            onChangeText={setAlerta}
          />
        </View>
        <Campo
          style={{ marginTop: 10 }}
          placeholder={t('stock.promo')}
          keyboardType="numeric"
          value={promo}
          onChangeText={setPromo}
        />

        <Etiqueta style={{ marginTop: 18 }}>{t('stock.color')}</Etiqueta>
        <TonePicker value={tono} onChange={setTono} />

        <Boton
          onPress={agregar}
          disabled={!puedeAgregar}
          icono={PlusIcon}
          style={{ marginTop: 18 }}
        >
          {t('stock.agregar')}
        </Boton>
      </Tarjeta>

      <Titulo>{t('stock.cargados', { n: productos.length })}</Titulo>

      {productos.map((p) => {
        const oculto = p.visible === false
        return (
          <View
            key={p.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: tema.surface,
              borderRadius: tema.radio.md,
              padding: 14,
              marginBottom: 10,
              opacity: oculto ? 0.5 : 1,
            }}
          >
            <View
              style={{
                width: 12,
                alignSelf: 'stretch',
                minHeight: 44,
                borderRadius: 6,
                backgroundColor: colorDe(p, tema),
              }}
            />

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: tema.text, fontSize: 16, fontWeight: '700', flexShrink: 1 }}
                >
                  {p.name}
                </Text>
                {/* El ojo saca el producto de la pantalla de venta sin borrarlo:
                    lo que no hay esta noche, o lo que todavía no salió a la
                    venta. El stock y las ventas viejas quedan intactos. */}
                <BotonIcono
                  fondo={false}
                  icono={oculto ? EyeOffIcon : EyeIcon}
                  etiqueta={oculto ? t('stock.oculto') : t('stock.aLaVenta')}
                  onPress={() => alternarVisible(p)}
                />
              </View>
              <Text numberOfLines={1} style={{ color: tema.textFaint, fontSize: 13 }}>
                {oculto
                  ? t('stock.oculto')
                  : t('stock.detalle', {
                      stock: p.stock,
                      precio: money(p.salePrice),
                      costo: money(p.costPrice),
                    })}
              </Text>
            </View>

            {/* Dos y dos: cuatro botones en fila dejan cada uno demasiado
                chico para el dedo. */}
            <View style={{ width: 92, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              <PromoTag
                activo={!!p.promoPrice}
                onPress={() => setDialogo({ tipo: 'promo', producto: p })}
              />
              <BotonIcono
                icono={PlusIcon}
                etiqueta={t('stock.sumarA', { nombre: p.name })}
                onPress={() => setDialogo({ tipo: 'reponer', producto: p })}
              />
              <BotonIcono
                icono={PencilIcon}
                etiqueta={t('stock.editar')}
                onPress={() => abrirEdicion(p)}
              />
              <BotonIcono
                icono={TrashIcon}
                color={tema.red}
                etiqueta={t('stock.borrarTitulo', { nombre: p.name })}
                onPress={() => setDialogo({ tipo: 'borrar', producto: p })}
              />
            </View>
          </View>
        )
      })}

      {listo && productos.length === 0 ? <Vacio icono={BoxIcon}>{t('stock.vacio')}</Vacio> : null}

      {dialogo?.tipo === 'reponer' && (
        <Dialogo
          titulo={t('stock.sumarA', { nombre: dialogo.producto.name })}
          sub={t('stock.sumarSub', { stock: dialogo.producto.stock })}
          input={{ keyboardType: 'numeric', initial: '10' }}
          confirmar={t('stock.sumar')}
          onConfirm={reponer}
          onClose={() => setDialogo(null)}
        />
      )}

      {dialogo?.tipo === 'promo' && (
        <Dialogo
          titulo={t('stock.promoTitulo', { nombre: dialogo.producto.name })}
          sub={t('stock.promoSub', { precio: money(dialogo.producto.salePrice) })}
          input={{
            keyboardType: 'numeric',
            initial: dialogo.producto.promoPrice ? String(dialogo.producto.promoPrice) : '',
          }}
          confirmar={t('comun.guardar')}
          onConfirm={guardarPromo}
          onClose={() => setDialogo(null)}
        />
      )}

      {dialogo?.tipo === 'borrar' && (
        <Dialogo
          titulo={t('stock.borrarTitulo', { nombre: dialogo.producto.name })}
          sub={t('stock.borrarSub')}
          confirmar={t('comun.borrar')}
          peligro
          onConfirm={borrar}
          onClose={() => setDialogo(null)}
        />
      )}

      {edicion && (
        <Dialogo
          titulo={t('stock.editar')}
          confirmar={t('comun.guardar')}
          onConfirm={guardarEdicion}
          onClose={() => setEdicion(null)}
        >
          <Campo value={edicion.name} onChangeText={campo('name')} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Campo
              style={{ flex: 1 }}
              placeholder={t('stock.costo')}
              keyboardType="numeric"
              value={edicion.cost}
              onChangeText={campo('cost')}
            />
            <Campo
              style={{ flex: 1 }}
              placeholder={t('stock.venta')}
              keyboardType="numeric"
              value={edicion.price}
              onChangeText={campo('price')}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Campo
              style={{ flex: 1 }}
              placeholder={t('stock.alerta')}
              keyboardType="numeric"
              value={edicion.threshold}
              onChangeText={campo('threshold')}
            />
            <Campo
              style={{ flex: 1 }}
              placeholder={t('stock.sinPromo')}
              keyboardType="numeric"
              value={edicion.promo}
              onChangeText={campo('promo')}
            />
          </View>
          <TonePicker value={edicion.tone} onChange={campo('tone')} />
        </Dialogo>
      )}
    </ScrollView>
  )
}

// El 2x1 se prende y se apaga durante la noche, así que se edita desde la fila
// y no hay que volver a abrir el producto entero. Prendido se ve de lejos: es
// la diferencia entre "este producto tiene promo" y "este no".
function PromoTag({ activo, onPress }) {
  const tema = useTema()
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="2x1"
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: tema.radio.sm,
        backgroundColor: activo ? tema.accent : tema.surface2,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Text style={{ color: activo ? '#fff' : tema.textFaint, fontSize: 12, fontWeight: '800' }}>
        2×1
      </Text>
    </Pressable>
  )
}
