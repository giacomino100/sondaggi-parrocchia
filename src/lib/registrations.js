import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const registrationsRef = collection(db, 'registrations')

export function watchRegistrations(callback) {
  const q = query(registrationsRef, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function watchRegistration(registrationId, callback) {
  return onSnapshot(doc(db, 'registrations', registrationId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function createRegistration({ title, description, uid }) {
  return addDoc(registrationsRef, {
    title,
    description,
    status: 'open',
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
}

export async function setRegistrationStatus(registrationId, status) {
  return updateDoc(doc(db, 'registrations', registrationId), { status })
}

export async function deleteRegistration(registrationId) {
  return deleteDoc(doc(db, 'registrations', registrationId))
}

export function watchEntries(registrationId, callback) {
  const q = query(
    collection(db, 'registrations', registrationId, 'entries'),
    orderBy('submittedAt', 'asc'),
  )
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function submitEntry(registrationId, data) {
  return addDoc(collection(db, 'registrations', registrationId, 'entries'), {
    ...data,
    submittedAt: serverTimestamp(),
  })
}

export async function deleteEntry(registrationId, entryId) {
  return deleteDoc(doc(db, 'registrations', registrationId, 'entries', entryId))
}
