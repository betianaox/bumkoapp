import { collection, doc } from 'firebase/firestore'
import { db } from './firebase'

/* Las mismas rutas que la web, a propósito: los dos clientes conviven sobre
   la misma base.

     bares/{barId}/products
     bares/{barId}/sales
     bares/{barId}/events
     bares/{barId}/settings
     bares/{barId}/equipo

   y un índice suelto para saber a qué bar entra cada persona:

     usuarios/{email} -> { barId }

   Las pantallas no escriben rutas a mano: piden barCol / barDoc. */

export const barCol = (barId, sub) => collection(db, 'bares', barId, sub)
export const barDoc = (barId, sub, id) => doc(db, 'bares', barId, sub, id)

// El índice de personas es global, no de un bar: por eso va aparte.
export const usuarioDoc = (email) => doc(db, 'usuarios', email.toLowerCase())
