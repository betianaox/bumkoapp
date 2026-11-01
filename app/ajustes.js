import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTema, useTemaCompleto } from '../src/context/tema'
import { useAuth } from '../src/context/auth'
import { IDIOMAS, useIdioma, useT } from '../src/i18n'
import { useBar } from '../src/lib/store'
import Avatar from '../src/components/Avatar'
import Dialogo from '../src/components/Dialogo'
import { Boton, Etiqueta, Tarjeta } from '../src/components/ui'
import { CloseIcon, MoonIcon, PowerIcon, SunIcon, TrashIcon } from '../src/components/icons'

/* Los ajustes y la ayuda en la misma pantalla, como en casi cualquier app: son
   las dos cosas que se buscan una vez y no se vuelven a mirar, y separarlas en
   dos lugares obliga a acordarse de en cuál estaba cada una.

   Se llega tocando la propia cara, arriba a la derecha, que es donde todo el
   mundo la busca. */
export default function Ajustes() {
  const tema = useTema()
  const t = useT()
  const { modo, alternar } = useTemaCompleto()
  const { idioma, elegir } = useIdioma()
  const { user, role, signOut, eliminarCuenta } = useAuth()
  const bar = useBar((e) => e.bar)
  const inset = useSafeAreaInsets()

  const version = Constants.expoConfig?.version || '1.0.0'

  const [borrar, setBorrar] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState('')

  // El dueño se lleva el bar entero; cualquier otro, solo su cuenta
  const esDueno =
    !!bar?.ownerEmail && bar.ownerEmail.toLowerCase() === (user?.email || '').toLowerCase()

  /* Al terminar, la sesión desaparece sola y la app vuelve al login: no hay
     que navegar a ningún lado. */
  const confirmarBorrado = async () => {
    setBorrar(false)
    setError('')
    setBorrando(true)
    try {
      await eliminarCuenta()
    } catch (e) {
      console.warn('[Bumko] eliminar cuenta', e.code || '', e.message)
      setError(t('ajustes.eliminarError'))
      setBorrando(false)
    }
  }

  if (borrando) {
    return (
      <View style={{ flex: 1, backgroundColor: tema.bg, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <ActivityIndicator color={tema.textFaint} />
        <Text style={{ color: tema.textDim, fontSize: 15 }}>{t('ajustes.eliminando')}</Text>
      </View>
    )
  }

  const temas = [
    { id: 'light', txt: t('ajustes.temaClaro'), Icono: SunIcon },
    { id: 'dark', txt: t('ajustes.temaOscuro'), Icono: MoonIcon },
  ]

  const temasAyuda = ['vender', 'variantes', 'promo', 'deshacer', 'stock', 'eventos', 'roles', 'invitar']

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: tema.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: inset.top + 8, paddingBottom: 48 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: tema.text, fontSize: 24, fontWeight: '800', flex: 1 }}>
          {t('ajustes.titulo')}
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tema.surface2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <CloseIcon size={18} color={tema.textDim} />
        </Pressable>
      </View>

      {/* Quién soy y con qué rol: es lo primero que se viene a mirar cuando
          algo no se deja tocar. */}
      <Etiqueta>{t('ajustes.tuCuenta')}</Etiqueta>
      <Tarjeta>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar src={user?.photoURL} name={user?.displayName} email={user?.email} size={48} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ color: tema.text, fontSize: 17, fontWeight: '700' }}>
              {user?.displayName || user?.email}
            </Text>
            <Text numberOfLines={1} style={{ color: tema.textFaint, fontSize: 13 }}>
              {user?.email}
            </Text>
            <Text style={{ color: tema.accent, fontSize: 12, fontWeight: '700', marginTop: 3 }}>
              {t(`ajustes.roles.${role || 'staff'}`)}
            </Text>
          </View>
        </View>
      </Tarjeta>

      {bar ? (
        <>
          <Etiqueta style={{ marginTop: 14 }}>{t('ajustes.elBar')}</Etiqueta>
          <Tarjeta>
            <Text style={{ color: tema.text, fontSize: 19, fontWeight: '700' }}>
              {bar.name || 'Bumko'}
            </Text>
          </Tarjeta>
        </>
      ) : null}

      <Etiqueta style={{ marginTop: 14 }}>{t('ajustes.idioma')}</Etiqueta>
      <Tarjeta style={{ padding: 6 }}>
        {IDIOMAS.map((l) => (
          <Fila key={l.id} activo={idioma === l.id} onPress={() => elegir(l.id)}>
            {l.nombre}
          </Fila>
        ))}
      </Tarjeta>

      <Etiqueta style={{ marginTop: 14 }}>{t('ajustes.tema')}</Etiqueta>
      <Tarjeta style={{ padding: 6 }}>
        {temas.map(({ id, txt, Icono }) => (
          <Fila
            key={id}
            activo={modo === id}
            onPress={() => { if (modo !== id) alternar() }}
            Icono={Icono}
          >
            {txt}
          </Fila>
        ))}
      </Tarjeta>

      {/* La ayuda: qué hace cada gesto, sin tener que descubrirlo vendiendo */}
      <Etiqueta style={{ marginTop: 22 }}>{t('ayuda.titulo')}</Etiqueta>
      {temasAyuda.map((k) => (
        <View key={k} style={{ marginBottom: 18 }}>
          <Text style={{ color: tema.text, fontSize: 16, fontWeight: '700' }}>
            {t(`ayuda.${k}.t`)}
          </Text>
          <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 21, marginTop: 4 }}>
            {t(`ayuda.${k}.d`)}
          </Text>
        </View>
      ))}

      <Boton tipo="peligro" icono={PowerIcon} onPress={signOut} style={{ marginTop: 10 }}>
        {t('ajustes.cerrarSesion')}
      </Boton>

      {/* Lo exige Google Play: quien creó una cuenta tiene que poder borrarla
          desde la app. Queda al final y en texto, lejos de lo que se toca
          seguido, para que nadie la apriete sin querer. */}
      <Pressable onPress={() => setBorrar(true)} hitSlop={8} style={{ marginTop: 22, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TrashIcon size={15} color={tema.red} />
          <Text style={{ color: tema.red, fontSize: 14, fontWeight: '600' }}>{t('ajustes.eliminarCuenta')}</Text>
        </View>
      </Pressable>
      {error ? (
        <Text style={{ color: tema.redInk, fontSize: 13, textAlign: 'center', marginTop: 10 }}>{error}</Text>
      ) : null}

      <Text
        style={{ color: tema.textFaint, fontSize: 12, textAlign: 'center', marginTop: 20 }}
      >
        {t('ajustes.version', { v: version })}
      </Text>

      {borrar && (
        <Dialogo
          titulo={t('ajustes.eliminarTitulo')}
          sub={esDueno ? t('ajustes.eliminarSubDueno', { bar: bar?.name || 'Bumko' }) : t('ajustes.eliminarSub')}
          confirmar={t('ajustes.eliminarBoton')}
          peligro
          onConfirm={confirmarBorrado}
          onClose={() => setBorrar(false)}
        />
      )}
    </ScrollView>
  )
}

function Fila({ children, activo, onPress, Icono }) {
  const tema = useTema()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderRadius: tema.radio.sm,
        backgroundColor: activo ? tema.surface2 : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {Icono ? <Icono size={18} color={activo ? tema.text : tema.textFaint} /> : null}
      <Text
        style={{
          flex: 1,
          color: activo ? tema.text : tema.textDim,
          fontSize: 15,
          fontWeight: activo ? '700' : '500',
        }}
      >
        {children}
      </Text>
      {activo ? (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tema.accent }} />
      ) : null}
    </Pressable>
  )
}
