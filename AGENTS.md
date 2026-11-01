# Bumko — app nativa

Expo SDK 57 · React Native 0.86 · expo-router. Es el cliente nativo de
**Bumko**, la app de control de stock y ventas de un bar durante una fiesta.

## Lo primero

Expo cambió mucho: leé la documentación de la versión exacta en
https://docs.expo.dev/versions/v57.0.0/ antes de escribir código.

## De dónde viene esto

Existe ya una versión web en `../bumko` (Vite + React, desplegada en
bumko.vercel.app). **Las dos apuntan al mismo proyecto de Firebase y a la
misma base**, y están pensadas para convivir: la misma persona puede vender
desde el celular mientras otra mira los reportes en la compu.

Por eso, antes de inventar algo acá, mirá cómo está resuelto en la web. Las
rutas de datos, los roles y las reglas de Firestore ya están decididos y no
se tocan desde este lado sin pensar en el otro.

## Modelo de datos

    bares/{barId}/products     productos, con costo, precio, stock y 2x1
    bares/{barId}/sales        cada venta, con el costo copiado del momento
    bares/{barId}/events       cada noche, con caja inicial y arqueo
    bares/{barId}/equipo       quién trabaja en el bar, por email
    bares/{barId}/settings
    usuarios/{email}           índice suelto: a qué bar entra cada persona

Las pantallas no arman rutas a mano: piden `barCol` / `barDoc` de
`src/lib/bar.js`.

## Roles

- `dev` — puede todo, y lo que registra queda **afuera** de reportes y caja.
- `admin` — puede todo.
- `staff` — solo la pestaña Vender. Ve las demás, apagadas.

## Cómo se entra a un bar

Hay dos caminos, y ninguno más en la app:

- **Crear un bar**: quien lo crea queda como dueño (`ownerEmail`) y `admin`.
- **El QR del dueño**: en Equipo se muestra el QR (lleva `bumko://unirse/CODIGO`)
  y se comparte como imagen por WhatsApp. Quien lo escanea —o tipea el código
  escrito en la imagen— deja un pedido en `solicitudes`, y entra como `staff`
  **habilitado** cuando un admin lo acepta. "Cambiar el QR" genera un código
  nuevo y el anterior deja de servir.

La web conserva además las invitaciones por correo y la entrada libre; la app
nativa ya no las ofrece, pero las reglas y los datos son los mismos.

## Eliminar la cuenta

Está en Ajustes (Google Play lo exige). Un miembro sale del equipo y se borra
su índice; sus ventas quedan en el bar. El dueño borra el bar completo. Al final
se borra la cuenta de Firebase Authentication, volviendo a pedir Google si el
inicio de sesión no es reciente. Las reglas que lo permiten viven en
`../bumko/firestore.rules`.

## Criterios de la interfaz

Se usa de noche, apurado y con una mano. De ahí sale casi todo lo demás:

- Un toque = una venta al precio de lista. Sin confirmar, sin pantallas de por
  medio. Mantener presionado abre las variantes (otro precio, regalo).
- Botones grandes, mucho contraste, colores planos, nada de emoji: los iconos
  son de línea y de un solo color (`src/components/icons.js`).
- Deshacer visible en la pantalla de venta, no un menú escondido.
- Los colores salen de `src/lib/theme.js`, que son los mismos tokens de la
  web. Si cambia uno, cambia en los dos lados.
- Todo el texto en español neutro, sin voseo.

## Estructura

    app/                 rutas (expo-router)
      _layout.js         tema y navegación raíz
      (tabs)/            las cinco pestañas: Vender, Stock, Eventos, Reportes, Equipo
    src/lib/             firebase, rutas de datos, tema
    src/components/      iconos y piezas compartidas

## Configuración

Copiá `.env.example` a `.env` y completá las credenciales. `.env` no se sube
al repo, y tampoco `service-account.json`.
