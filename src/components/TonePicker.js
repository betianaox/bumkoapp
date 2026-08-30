import { Pressable, View } from 'react-native'
import { useTema } from '../context/tema'
import { nombreTono } from '../lib/productTone'

/* Los ocho colores, en fila. Se guarda como 'tone-3', igual que la web, para
   que un producto elegido acá se vea igual del otro lado.

   Sin elección, el color sale del nombre — por eso también hay una opción
   vacía: es "el que le toque", no "ninguno". */
export default function TonePicker({ value, onChange }) {
  const tema = useTema()

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {tema.tonos.map((color, i) => {
        const nombre = nombreTono(i)
        const elegido = value === nombre
        return (
          <Pressable
            key={nombre}
            onPress={() => onChange(elegido ? null : nombre)}
            accessibilityRole="button"
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: color,
              borderWidth: elegido ? 3 : 0,
              borderColor: tema.text,
            }}
          />
        )
      })}
    </View>
  )
}
