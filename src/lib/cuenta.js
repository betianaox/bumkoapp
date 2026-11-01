import { deleteDoc, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { barCol, barDoc, usuarioDoc } from './bar'
import { codigoDoc, invitacionDoc } from './equipo'

/* Eliminar la cuenta. Google Play lo exige a toda app que cree cuentas, y la
   política del sitio promete exactamente esto:

     - Si es parte del personal (o un admin que no es el dueño): sale del
       equipo y se borra su índice. Las ventas que registró quedan en el bar,
       porque son parte de su contabilidad.
     - Si es el dueño: se borra el bar completo, con todo lo que tiene adentro.

   La cuenta de Firebase Authentication la borra quien llama a esto, al final,
   porque puede pedir volver a iniciar sesión. */

// Lo que cuelga de un bar. Firestore no borra subcolecciones solo, hay que
// recorrerlas una por una.
const SUBCOLECCIONES = ['sales', 'products', 'events', 'settings', 'solicitudes', 'invitaciones']

// De a 400 por lote: el límite de Firestore es 500 escrituras por lote.
async function vaciar(barId, sub) {
  const snap = await getDocs(barCol(barId, sub))
  for (let i = 0; i < snap.docs.length; i += 400) {
    const lote = writeBatch(db)
    snap.docs.slice(i, i + 400).forEach((d) => lote.delete(d.ref))
    await lote.commit()
  }
  return snap.docs
}

export async function esDuenoDelBar(barId, email) {
  if (!barId) return false
  const bar = await getDoc(doc(db, 'bares', barId))
  return bar.exists() && (bar.data().ownerEmail || '').toLowerCase() === email.toLowerCase()
}

/* Borra los datos de Firestore de la persona. Devuelve si además se borró un
   bar entero, para poder decirlo en pantalla. */
export async function borrarDatosDeCuenta({ barId, email }) {
  const yo = email.toLowerCase()
  const dueno = await esDuenoDelBar(barId, yo)

  if (barId && dueno) {
    // Las invitaciones del bar tienen una copia en la bandeja de cada correo:
    // se borran las dos antes de vaciar la colección.
    const invitaciones = await getDocs(barCol(barId, 'invitaciones')).catch(() => ({ docs: [] }))
    await Promise.all(
      invitaciones.docs.map((d) => deleteDoc(invitacionDoc(d.id, barId)).catch(() => {})),
    )

    for (const sub of SUBCOLECCIONES) {
      await vaciar(barId, sub).catch((e) => console.warn('[Bumko] borrar', sub, e.message))
    }

    // El resto del equipo: su índice y su registro. Uno mismo va al final,
    // porque las reglas necesitan que siga siendo admin para borrar lo demás.
    const equipo = await getDocs(barCol(barId, 'equipo'))
    for (const m of equipo.docs) {
      if (m.id === yo) continue
      await deleteDoc(usuarioDoc(m.id)).catch(() => {})
      await deleteDoc(m.ref).catch(() => {})
    }

    const bar = await getDoc(doc(db, 'bares', barId))
    const codigo = bar.exists() ? bar.data().codigo : null
    if (codigo) await deleteDoc(codigoDoc(codigo)).catch(() => {})
    await deleteDoc(doc(db, 'bares', barId))
  }

  if (barId) await deleteDoc(barDoc(barId, 'equipo', yo)).catch(() => {})
  await deleteDoc(usuarioDoc(yo)).catch(() => {})

  return { borroBar: !!(barId && dueno) }
}
