# Bumko en Google Play

Todo lo que pide Play Console, listo para copiar y pegar, y los pasos en orden.

## 1. Antes de subir nada

1. `npm install` en esta carpeta (hay dependencias nuevas: cámara, QR, compartir, splash).
2. `npx eas-cli init`: vincula la app con la cuenta `imagostack` de Expo y agrega el `projectId` en `app.json`. Commitear ese cambio.
3. **Reglas de Firestore**: en `../bumko`, `node scripts/deploy-rules.mjs`. Sin las reglas nuevas, eliminar la cuenta falla.
4. **Variables en EAS**: cargar las `EXPO_PUBLIC_*` del `.env` en el entorno `production` (y en `preview` para el APK de prueba):
   `npx eas-cli env:create --environment production --name EXPO_PUBLIC_FIREBASE_API_KEY --value ... --visibility plaintext`
   (una por variable, o desde expo.dev → proyecto → Environment variables).
5. **APK de prueba**: `npx eas-cli build -p android --profile preview` y probar en un teléfono:
   - crear un bar;
   - compartir el QR por WhatsApp;
   - escanearlo desde otra cuenta y aceptar el pedido;
   - cambiar el QR y comprobar que el anterior ya no sirve;
   - eliminar la cuenta (como miembro y como dueño).

## 2. Login con Google (cliente OAuth de Android)

En Google Cloud Console, dentro del proyecto de Firebase de Bumko → APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth → Android:

- Nombre del paquete: `com.imagostack.bumko`
- Huella SHA-1: crear **un cliente por huella**:
  - la de EAS: `npx eas-cli credentials` → Android → production → Keystore;
  - la de Google Play: Play Console → Bumko → Configuración → Integridad de la app → Firma de apps → "Certificado de la clave de firma de apps" (aparece después de subir el primer `.aab`).

Sin esto el selector de cuentas abre y falla con `DEVELOPER_ERROR`.

## 3. Ficha de Play Store

**Nombre de la app** (máx. 30): `Bumko: stock para tu bar`

**Categoría**: Empresa · **Correo de contacto**: support@imagostack.com · **Sitio web**: https://imagostack.com/apps/bumko

**Gráficos**: icono 512×512 y gráfico de funciones 1024×500 → los de `imagostack/public/apps/bumko/` (`icon.png`, `feature.png`). Capturas: mínimo 2 de teléfono (recomendado 4 a 8): Vender, Stock, Reportes, Equipo con el QR.

### Español (es-419)

**Descripción breve** (máx. 80):
Stock y ventas para tu bar, pensado para la noche: un toque, una venta.

**Descripción completa**:

Bumko lleva el stock y las ventas de un bar durante una fiesta. Cada producto es un botón grande: un toque registra la venta al precio de lista y descuenta una unidad del stock. Sin menús ni confirmaciones, porque se usa de noche, apurado y con una mano.

LO QUE NO ES UNA VENTA COMÚN TAMBIÉN ENTRA RÁPIDO
• Mantén presionado un producto para cobrar otro precio o registrar un regalo con su motivo.
• Los productos con 2x1 tienen su propio botón.
• Cada venta queda unos segundos a la vista para deshacerla si hubo un error.

CADA NOCHE ES UN EVENTO
• Se abre con la caja inicial y se cierra contando la plata: Bumko muestra cuánto tendría que haber, cuánto sobró o cuánto faltó.
• Reportes de lo vendido, el costo y el resultado por día, por mes o por evento, los productos más vendidos y quién registró cada venta.

HECHO PARA UN EQUIPO
• Quien crea el bar es el administrador y suma a su gente con un QR que se comparte por WhatsApp.
• El personal solo vende; el administrador carga productos, maneja el stock, abre y cierra eventos y ve los reportes.
• Todos trabajan sobre los mismos datos al mismo tiempo, cada uno desde su teléfono.

Tus datos son tuyos: cada bar es una cuenta cerrada y puedes eliminar tu cuenta desde la app cuando quieras.

### English (en-US)

**Short description**:
Stock and sales for your bar, built for the night: one tap, one sale.

**Full description**:

Bumko keeps track of a bar's stock and sales during a party. Every product is a big button: one tap records the sale at list price and takes one unit off the stock. No menus, no confirmations, because it's used at night, in a hurry and with one hand.

WHAT ISN'T A REGULAR SALE IS QUICK TOO
• Press and hold a product to charge a different price or record a giveaway with its reason.
• Products with a 2-for-1 deal get their own button.
• Every sale stays on screen for a few seconds so you can undo it.

EVERY NIGHT IS AN EVENT
• Open it with the starting cash and close it by counting the money: Bumko shows how much there should be, and how much was over or short.
• Reports of sales, cost and result by day, month or event, the best-selling products and who recorded each sale.

BUILT FOR A TEAM
• Whoever creates the bar is its administrator and adds their people with a QR code shared on WhatsApp.
• Staff only sell; the administrator loads products, manages stock, opens and closes events and sees the reports.
• Everyone works on the same data at the same time, from their own phone.

Your data is yours: each bar is a closed account, and you can delete your account from the app at any time.

### Português (pt-BR)

**Descrição breve**:
Estoque e vendas para o seu bar, pensado para a noite: um toque, uma venda.

**Descrição completa**:

Bumko controla o estoque e as vendas de um bar durante uma festa. Cada produto é um botão grande: um toque registra a venda pelo preço de tabela e desconta uma unidade do estoque. Sem menus nem confirmações, porque é usado à noite, com pressa e com uma mão.

O QUE NÃO É UMA VENDA COMUM TAMBÉM ENTRA RÁPIDO
• Segure um produto pressionado para cobrar outro preço ou registrar uma cortesia com o motivo.
• Os produtos com 2x1 têm o seu próprio botão.
• Cada venda fica alguns segundos na tela para você desfazê-la se houver um erro.

CADA NOITE É UM EVENTO
• Abre com o caixa inicial e fecha contando o dinheiro: o Bumko mostra quanto deveria haver, quanto sobrou ou quanto faltou.
• Relatórios do vendido, do custo e do resultado por dia, por mês ou por evento, os produtos mais vendidos e quem registrou cada venda.

FEITO PARA UMA EQUIPE
• Quem cria o bar é o administrador e adiciona a sua gente com um QR compartilhado pelo WhatsApp.
• A equipe só vende; o administrador cadastra produtos, cuida do estoque, abre e fecha eventos e vê os relatórios.
• Todos trabalham sobre os mesmos dados ao mesmo tempo, cada um no seu telefone.

Os seus dados são seus: cada bar é uma conta fechada e você pode excluir a sua conta pelo app quando quiser.

## 4. Contenido de la app (Play Console → Política → Contenido de la app)

### Política de privacidad
`https://imagostack.com/apps/bumko/privacidad`

### Acceso a la app
"Todas o algunas funciones están restringidas" → agregar instrucciones:

- **Usuario**: una cuenta de Google creada solo para la revisión (por ejemplo `bumko.review@gmail.com`), con su contraseña y **sin verificación en dos pasos**.
- **Instrucciones** (en inglés):
  > Tap "Sign in with Google" and choose the test account. The account already owns a demo bar called "Demo Bar" with products, so you land on the Sell tab. Tap a product to record a sale; press and hold for other prices or giveaways. The Team tab shows the bar's QR code used to invite staff. Tapping your profile picture at the top opens "Settings and help", where "Delete my account" is.

  Antes de mandar a revisión: entrar una vez con esa cuenta, crear "Demo Bar" y cargar 4 o 5 productos.

### Anuncios
No contiene anuncios.

### Clasificación de contenido
Categoría: **Utilidad, productividad, comunicación u otra**. Respuestas: violencia, sexo, lenguaje, drogas, apuestas: **No**. Interacción entre usuarios: **No** (no hay chat ni contenido público; el equipo solo comparte datos del bar). Compras digitales: **No**.

> Alcohol: la app no muestra ni promociona alcohol; los productos los carga cada bar. Si el cuestionario pregunta por referencias a alcohol, responder según ese criterio (no es contenido de la app).

### Público objetivo
**18 años o más**. No está dirigida a niños.

### Seguridad de los datos

- ¿Recopila o comparte datos? **Sí, recopila.** No comparte con terceros (Firebase actúa como proveedor de servicios).
- ¿Los datos se encriptan en tránsito? **Sí.**
- ¿Se puede pedir la eliminación? **Sí**: desde la app (tocando la foto de perfil arriba → Ajustes y ayuda → Eliminar mi cuenta) y desde `https://imagostack.com/eliminar-datos`.

| Tipo de dato (Play) | Recopilado | Obligatorio | Para qué |
|---|---|---|---|
| Información personal → Nombre | Sí | Sí | Funcionalidad de la app, administración de la cuenta |
| Información personal → Dirección de correo electrónico | Sí | Sí | Funcionalidad de la app, administración de la cuenta |
| Información personal → ID de usuario | Sí | Sí | Funcionalidad de la app, administración de la cuenta |
| Fotos y videos → Fotos (foto de perfil de Google) | Sí | Sí | Funcionalidad de la app (identificar a cada persona del equipo) |
| Actividad en la app → Otro contenido generado por el usuario (productos, ventas, eventos) | Sí | Sí | Funcionalidad de la app |

Nada se usa para publicidad, analíticas ni personalización.

### Eliminación de la cuenta
URL: `https://imagostack.com/eliminar-datos`. En la app: foto de perfil arriba → Ajustes y ayuda → Eliminar mi cuenta.

### Funciones financieras
Ninguna (no es billetera, préstamos ni exchange).

### Otras declaraciones
App gubernamental: No · Noticias: No · Salud: No · VPN: No.

## 5. Pruebas cerradas y producción

1. `npx eas-cli build -p android --profile production` → subir el `.aab` a **Pruebas cerradas**.
2. Registrar las huellas de Play en el cliente OAuth (sección 2) y probar el login con el build de la tienda.
3. Las cuentas personales necesitan **12 testers durante 14 días seguidos** antes de pedir producción, como con las otras apps.
4. Pedir acceso a producción. Cuando esté publicada, pasar el link a la ficha del sitio:
   `https://play.google.com/store/apps/details?id=com.imagostack.bumko`
