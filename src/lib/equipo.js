import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { barCol, barDoc, usuarioDoc } from './bar'

/* Cómo se entra a un bar.

   Hay tres caminos y los tres terminan en el mismo lugar —un documento en
   bares/{barId}/equipo/{email}— pero se llega distinto:

     1. Crear un bar propio. Quien lo crea queda como admin.
     2. Una invitación: un admin eligió a alguien de sus contactos y le dejó
        una carta en la puerta. Entra activo, porque ya lo aprobaron al elegirlo.
     3. Un código: el bar tiene uno corto, tipo BUMK4T. Quien lo tiene pide
        entrar y un admin lo acepta.

   El problema que resuelven las dos colecciones de raíz es el mismo: alguien
   que todavía no pertenece a ningún bar no puede andar buscando dentro de los
   bares ajenos. Entonces la invitación se guarda bajo SU correo, y el código
   se resuelve con una lectura directa. Las dos son búsquedas de un solo
   documento, y las reglas quedan de una línea.

     invitaciones/{correo}/pendientes/{barId}
     codigos/{codigo} -> { barId, barNombre }
     bares/{barId}/solicitudes/{correo} */

// Sin 0/O ni 1/I/L: el código se dicta en voz alta en un lugar ruidoso.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export const generarCodigo = () =>
  Array.from({ length: 6 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join('')

export const invitacionesDe = (email) =>
  collection(db, 'invitaciones', email.toLowerCase(), 'pendientes')

export const invitacionDoc = (email, barId) =>
  doc(db, 'invitaciones', email.toLowerCase(), 'pendientes', barId)

export const codigoDoc = (codigo) => doc(db, 'codigos', codigo.toUpperCase())

export const solicitudDoc = (barId, email) => barDoc(barId, 'solicitudes', email.toLowerCase())

/* Crear un bar: cuatro escrituras en un orden que importa.

   Primero el bar, porque lo demás no sirve sin él. Enseguida el registro
   propio como admin: hasta que ese documento no existe, las reglas no
   reconocen a nadie como dueño de nada, así que el código no se podría
   escribir. Después el código, y al final el índice —que es lo que hace que la
   próxima vez la app sepa directamente a dónde entrar. */
export async function crearBar({ nombre, user }) {
  const email = user.email.toLowerCase()

  // Si el código ya existe se prueba otro. Con 31^6 combinaciones no debería
  // pasar nunca, pero "no debería" no es "no puede".
  let codigo = generarCodigo()
  for (let i = 0; i < 5; i++) {
    const tomado = await getDoc(codigoDoc(codigo))
    if (!tomado.exists()) break
    codigo = generarCodigo()
  }

  const bar = await addDoc(collection(db, 'bares'), {
    name: nombre.trim(),
    codigo,
    ownerEmail: email,
    // La puerta arranca cerrada: se abre a propósito desde Equipo.
    autoJoin: false,
    createdAt: serverTimestamp(),
  })

  await setDoc(barDoc(bar.id, 'equipo', email), {
    email,
    name: user.displayName || email,
    photo: user.photoURL || null,
    role: 'admin',
    active: true,
    createdAt: serverTimestamp(),
  })

  await setDoc(codigoDoc(codigo), { barId: bar.id, barNombre: nombre.trim() })
  await setDoc(usuarioDoc(email), { barId: bar.id })

  return { barId: bar.id, codigo }
}

// La copia del bar, para que un admin pueda ver a quién invitó
export const invitacionDelBar = (barId, email) => barDoc(barId, 'invitaciones', email.toLowerCase())

export const invitacionesDelBar = (barId) => barCol(barId, 'invitaciones')

/* Dejar la invitación, por duplicado y a propósito.

   La copia que importa es la de raíz: es la única que la persona invitada
   puede encontrar, porque todavía no tiene permiso para mirar adentro del bar.
   Pero entonces el admin no vería a quién invitó — para eso tendría que buscar
   entre las bandejas de todos los correos del mundo. Así que queda también una
   copia adentro del bar. Cada lado lee la suya con una regla de una línea. */
export async function invitar({ barId, barNombre, email, invitadoPor, rol = 'staff' }) {
  const destino = email.trim().toLowerCase()

  const carta = {
    barId,
    barNombre: barNombre || '',
    email: destino,
    invitadoPor: invitadoPor?.email?.toLowerCase() || null,
    invitadoPorNombre: invitadoPor?.displayName || null,
    rol,
    createdAt: serverTimestamp(),
  }

  await setDoc(invitacionDoc(destino, barId), carta)
  await setDoc(invitacionDelBar(barId, destino), carta)

  return destino
}

export async function cancelarInvitacion(email, barId) {
  await deleteDoc(invitacionDoc(email, barId)).catch(() => {})
  await deleteDoc(invitacionDelBar(barId, email)).catch(() => {})
}

/* Aceptar. Entra activo a propósito: si un admin lo eligió a mano de su
   agenda, ya lo aprobó — hacerlo esperar de nuevo sería pedirle dos veces lo
   mismo a la misma persona. El aro de habilitar queda para los que llegan por
   código o por la puerta abierta, que son los que nadie miró. */
export async function aceptarInvitacion({ invitacion, user }) {
  const email = user.email.toLowerCase()

  await setDoc(barDoc(invitacion.barId, 'equipo', email), {
    email,
    name: user.displayName || email,
    photo: user.photoURL || null,
    role: invitacion.rol || 'staff',
    active: true,
    createdAt: serverTimestamp(),
  })

  await setDoc(usuarioDoc(email), { barId: invitacion.barId })
  await cancelarInvitacion(email, invitacion.barId)

  return invitacion.barId
}

export const rechazarInvitacion = ({ invitacion, user }) =>
  cancelarInvitacion(user.email, invitacion.barId)

// Buscar un bar por su código. Devuelve null si no existe.
export async function buscarPorCodigo(codigo) {
  const snap = await getDoc(codigoDoc(codigo.trim()))
  return snap.exists() ? { codigo: snap.id, ...snap.data() } : null
}

/* Pedir entrar. Queda anotado adentro del bar, en una colección que solo sirve
   para eso: alguien de afuera puede dejar su pedido, y nada más. */
export async function pedirEntrar({ barId, user }) {
  const email = user.email.toLowerCase()
  await setDoc(solicitudDoc(barId, email), {
    email,
    name: user.displayName || email,
    photo: user.photoURL || null,
    createdAt: serverTimestamp(),
  })
}

export const solicitudesDe = (barId) => barCol(barId, 'solicitudes')

/* Aceptar a quien pidió entrar. Entra habilitado: el pedido llega porque el
   dueño le mostró o le mandó el QR, y aceptarlo ya es mirarlo. Hacerlo pasar
   después por "habilitar" era pedirle dos veces lo mismo a la misma persona. */
export async function aceptarSolicitud({ barId, solicitud }) {
  const email = solicitud.email.toLowerCase()

  await setDoc(barDoc(barId, 'equipo', email), {
    email,
    name: solicitud.name || email,
    photo: solicitud.photo || null,
    role: 'staff',
    active: true,
    createdAt: serverTimestamp(),
  })

  await setDoc(usuarioDoc(email), { barId })
  await deleteDoc(solicitudDoc(barId, email))
}

export const rechazarSolicitud = ({ barId, solicitud }) =>
  deleteDoc(solicitudDoc(barId, solicitud.email))

// Las invitaciones que le dejaron a una persona, con el bar al que pertenecen.
export async function misInvitaciones(email) {
  const snap = await getDocs(invitacionesDe(email))
  return snap.docs.map((d) => ({ id: d.id, barId: d.id, ...d.data() }))
}

/* El QR del bar. Lleva un link y no el código solo: si alguien lo escanea con
   la cámara del teléfono en vez de con la app, el link abre Bumko directamente
   en el pedido de entrada. */
export const linkDeIngreso = (codigo) => `bumko://unirse/${codigo}`

/* Lo que sea que haya leído la cámara o escrito la persona, convertido en un
   código. Acepta el link del QR o el código suelto, con espacios o en
   minúscula, porque se dicta en voz alta y se tipea apurado. */
export function codigoDesde(texto) {
  const limpio = (texto || '').trim()
  const enLink = limpio.match(/unirse\/([A-Za-z0-9]{6})/)
  if (enLink) return enLink[1].toUpperCase()
  const suelto = limpio.replace(/\s+/g, '').toUpperCase()
  return /^[A-Z0-9]{6}$/.test(suelto) ? suelto : null
}

/* Cambiar el QR: un código nuevo y el anterior deja de servir. Es para cuando
   una foto del QR circuló donde no tenía que circular.

   El orden importa: primero se escribe el código nuevo, después se apunta el
   bar a él y recién al final se borra el viejo. Si algo falla a mitad de
   camino, el bar nunca queda sin un código que funcione. */
export async function cambiarCodigo({ barId, barNombre, codigoViejo }) {
  let codigo = generarCodigo()
  for (let i = 0; i < 5; i++) {
    const tomado = await getDoc(codigoDoc(codigo))
    if (!tomado.exists()) break
    codigo = generarCodigo()
  }

  await setDoc(codigoDoc(codigo), { barId, barNombre: barNombre || '' })
  await updateDoc(doc(db, 'bares', barId), { codigo })
  if (codigoViejo && codigoViejo !== codigo) {
    await deleteDoc(codigoDoc(codigoViejo)).catch(() => {})
  }
  return codigo
}
