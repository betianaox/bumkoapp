import { Pressable, Text, TextInput, View } from 'react-native'
import { useTema } from '../context/tema'

/* Las piezas chicas que se repiten en todas las pantallas. Nada acá sabe de
   ventas ni de productos: son botones, campos y recuadros que toman su color
   del tema y nada más. */

export function Boton({ children, onPress, tipo = 'primario', disabled, style, icono: Icono }) {
  const tema = useTema()

  const fondo = {
    primario: tema.accent,
    fantasma: tema.surface2,
    peligro: 'transparent',
    verde: tema.green,
  }[tipo]

  const tinta = {
    primario: '#fff',
    fantasma: tema.text,
    peligro: tema.red,
    verde: '#fff',
  }[tipo]

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          minHeight: 54,
          paddingHorizontal: 20,
          borderRadius: tema.radio.sm,
          backgroundColor: fondo,
          opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
          borderWidth: tipo === 'peligro' ? 1 : 0,
          borderColor: tipo === 'peligro' ? tema.red : 'transparent',
        },
        style,
      ]}
    >
      {Icono ? <Icono size={18} color={tinta} /> : null}
      <Text style={{ color: tinta, fontSize: 16, fontWeight: '700' }}>{children}</Text>
    </Pressable>
  )
}

// Un botón que es solo un icono. El área que responde al dedo es más grande
// que el dibujo: 44 puntos es el mínimo con el que se acierta sin mirar.
export function BotonIcono({ icono: Icono, onPress, color, disabled, etiqueta, fondo = true }) {
  const tema = useTema()
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={etiqueta}
      accessibilityRole="button"
      hitSlop={8}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: tema.radio.sm,
        backgroundColor: fondo ? tema.surface2 : 'transparent',
        opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
      })}
    >
      <Icono size={20} color={color || tema.textDim} />
    </Pressable>
  )
}

export function Etiqueta({ children, style }) {
  const tema = useTema()
  return (
    <Text
      style={[
        {
          color: tema.textFaint,
          fontSize: 12,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 6,
        },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

export function Campo({ style, ...props }) {
  const tema = useTema()
  return (
    <TextInput
      placeholderTextColor={tema.textFaint}
      style={[
        {
          backgroundColor: tema.surface2,
          color: tema.text,
          borderRadius: tema.radio.sm,
          paddingHorizontal: 14,
          minHeight: 52,
          fontSize: 16,
        },
        style,
      ]}
      {...props}
    />
  )
}

export function Tarjeta({ children, style }) {
  const tema = useTema()
  return (
    <View
      style={[
        {
          backgroundColor: tema.surface,
          borderRadius: tema.radio.md,
          padding: 18,
          marginBottom: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export function Titulo({ children, style }) {
  const tema = useTema()
  return (
    <Text
      style={[
        { color: tema.text, fontSize: 15, fontWeight: '700', marginTop: 18, marginBottom: 10 },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

// Lo que se muestra cuando no hay nada. Solo aparece cuando de verdad ya
// sabemos que no hay nada — antes del primer dato no dice nada, porque decir
// "está vacío" mientras todavía carga es decir algo falso.
export function Vacio({ children, icono: Icono }) {
  const tema = useTema()
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 12 }}>
      {Icono ? <Icono size={32} color={tema.textFaint} /> : null}
      <Text style={{ color: tema.textDim, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
        {children}
      </Text>
    </View>
  )
}

export function Aviso({ children }) {
  const tema = useTema()
  return (
    <View
      style={{
        backgroundColor: tema.surface,
        borderLeftWidth: 3,
        borderLeftColor: tema.cyan,
        borderRadius: tema.radio.sm,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <Text style={{ color: tema.textDim, fontSize: 14, lineHeight: 20 }}>{children}</Text>
    </View>
  )
}

// Los tres recuadros de números que llevan el evento y los reportes.
export function Cifras({ datos }) {
  const tema = useTema()
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
      {datos.map((d) => (
        <View
          key={d.lbl}
          style={{
            flex: 1,
            backgroundColor: d.fondo || tema.surface2,
            borderRadius: tema.radio.sm,
            paddingVertical: 12,
            paddingHorizontal: 8,
            alignItems: 'center',
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ color: d.color || tema.text, fontSize: 18, fontWeight: '700' }}
          >
            {d.val}
          </Text>
          <Text style={{ color: tema.textFaint, fontSize: 11, fontWeight: '600', marginTop: 3 }}>
            {d.lbl}
          </Text>
        </View>
      ))}
    </View>
  )
}
