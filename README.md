# Bumko

Stock y ventas para tu bar, pensado para la noche: **un toque, una venta**. Varias personas venden a la vez desde sus teléfonos sobre el mismo stock, y el administrador ve la caja y los reportes en tiempo real.

Es la app nativa para Android de Bumko. Comparte el proyecto de Firebase y la base de datos con la [versión web](https://bumko.vercel.app) (Vite + React), así que se puede vender desde el celular mientras otra persona mira los reportes en la computadora.

## Qué hace

- **Vender**: un toque registra la venta al precio de lista. Al mantener presionado aparecen las variantes (otro precio, regalo), y deshacer siempre está a la vista.
- **Stock**: productos con costo, precio, stock y promociones 2x1.
- **Eventos**: cada noche con su caja inicial y su arqueo.
- **Reportes**: ventas, ganancias y quién registró cada venta.
- **Equipo**: roles y entrada solo por el QR del dueño.
- Español, inglés y portugués.

## Stack

| | |
|---|---|
| App | React Native 0.86 + Expo SDK 57 + Expo Router (JavaScript) |
| Estado y animaciones | Zustand, Reanimated |
| Datos | Cloud Firestore en tiempo real |
| Autenticación | Firebase Authentication con Google Sign-In nativo |
| Seguridad | Firestore Security Rules por bar y por rol (viven en el repo de la web) |
| QR | react-native-qrcode-svg, react-native-view-shot, expo-sharing y expo-camera |

## Cómo se entra a un bar

Hay solo dos caminos:

1. **Crear un bar**: quien lo crea queda como dueño y administrador.
2. **El QR del dueño**: en Equipo, el dueño comparte el QR del bar por WhatsApp como imagen. Quien lo escanea, abre el link (`bumko://unirse/CÓDIGO`) o escribe el código pide entrar, y queda dentro cuando un administrador lo acepta. "Cambiar el QR" invalida el anterior.

## Roles

- `admin`: puede todo.
- `staff`: solo vende. Ve las demás pestañas, pero desactivadas.
- `dev`: puede todo, y lo que registra queda fuera de los reportes y de la caja (para probar sin ensuciar los números).

## Eliminar la cuenta

Desde Ajustes, como exige Google Play. Un miembro sale del equipo y sus ventas quedan en el bar. Si es el dueño, se borra el bar completo. Al final se elimina la cuenta de Firebase Authentication, pidiendo volver a iniciar sesión con Google si hace falta.

## Modelo de datos

```
bares/{barId}/products     productos, con costo, precio, stock y 2x1
bares/{barId}/sales        cada venta, con el costo del momento
bares/{barId}/events       cada noche, con caja inicial y arqueo
bares/{barId}/equipo       quién trabaja en el bar, por email
bares/{barId}/solicitudes  pedidos para entrar por QR
bares/{barId}/settings
usuarios/{email}           índice: a qué bar entra cada persona
codigos/{codigo}           el código del QR de cada bar
```

## Estructura

```
app/                 rutas (Expo Router)
  _layout.js         tema y navegación raíz
  (tabs)/            Vender, Stock, Eventos, Reportes y Equipo
  ajustes.js         idioma, cerrar sesión y eliminar la cuenta
src/
  components/        iconos, QR, escáner y piezas compartidas
  context/           sesión y tema
  i18n/              es, en y pt
  lib/               firebase, rutas de datos, equipo, cuenta y tema
  pantallas/         login, bienvenida y espera de aprobación
```

## Cómo correrla

1. Copia `.env.example` a `.env` y completa las credenciales de Firebase y los client ID de Google. `.env` nunca se sube al repo.
2. Instala y corre en un Android físico o en un emulador (Google Sign-In y la cámara necesitan un build nativo, no Expo Go):

```bash
npm install
npx expo run:android
```

Las reglas de Firestore se publican desde el repo de la web (`bumko`), con `node scripts/deploy-rules.mjs`.

## Publicar en Google Play

Los pasos completos y los textos de la ficha están en [`docs/google-play.md`](docs/google-play.md).

Los builds se hacen con EAS (`eas.json`), con la versión de Android que lleva EAS:

```bash
npx eas-cli build -p android --profile preview      # APK para probar en un teléfono
npx eas-cli build -p android --profile production   # .aab para Google Play
```

Las variables `EXPO_PUBLIC_*` del `.env` se cargan en EAS, en el entorno `production`, porque el `.env` no viaja con el build. Para que funcione el inicio de sesión con Google, la huella SHA-1 de la firma de EAS y la de la firma de apps de Google Play tienen que estar registradas en un cliente OAuth de tipo Android, en el mismo proyecto de Firebase.

## Licencia

Ver [LICENSE](LICENSE).
