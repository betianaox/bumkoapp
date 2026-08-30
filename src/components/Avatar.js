import { Image, Text, View } from 'react-native'
import { useTema } from '../context/tema'

/* La foto de Google, y si no hay, la inicial sobre un color sacado del
   correo — el mismo correo cae siempre en el mismo color, así la cara de cada
   uno no cambia de un día para el otro. */
export default function Avatar({ src, name, email, size = 40, borde = false }) {
  const tema = useTema()
  const texto = (name || email || '?').trim()
  const inicial = texto.charAt(0).toUpperCase()

  let h = 0
  for (let i = 0; i < (email || texto).length; i++) {
    h = (h * 31 + (email || texto).charCodeAt(i)) % 9973
  }
  const fondo = tema.tonos[h % tema.tonos.length]

  const marco = borde ? { borderWidth: 2, borderColor: tema.surface3 } : null

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, marco]}
      />
    )
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fondo,
          alignItems: 'center',
          justifyContent: 'center',
        },
        marco,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: size * 0.42, fontWeight: '700' }}>{inicial}</Text>
    </View>
  )
}
