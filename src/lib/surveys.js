import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const surveysRef = collection(db, 'surveys')

export function watchSurveys(callback) {
  const q = query(surveysRef, orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function getSurvey(surveyId) {
  const snap = await getDoc(doc(db, 'surveys', surveyId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export function watchSurvey(surveyId, callback) {
  return onSnapshot(doc(db, 'surveys', surveyId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function createSurvey({ title, description, questions, uid }) {
  return addDoc(surveysRef, {
    title,
    description,
    questions,
    status: 'open',
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
}

export async function createRsvpSurvey({ title, description, uid }) {
  return addDoc(surveysRef, {
    title,
    description,
    surveyType: 'rsvp',
    status: 'open',
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
}

export async function updateSurvey(surveyId, data) {
  return updateDoc(doc(db, 'surveys', surveyId), data)
}

export async function setSurveyStatus(surveyId, status) {
  return updateDoc(doc(db, 'surveys', surveyId), { status })
}

export async function deleteSurvey(surveyId) {
  return deleteDoc(doc(db, 'surveys', surveyId))
}

export function watchResponses(surveyId, callback) {
  const q = query(collection(db, 'surveys', surveyId, 'responses'), orderBy('submittedAt', 'asc'))
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export async function submitResponse(surveyId, answers) {
  return addDoc(collection(db, 'surveys', surveyId, 'responses'), {
    answers,
    submittedAt: serverTimestamp(),
  })
}

export async function submitRsvpResponse(surveyId, data) {
  return addDoc(collection(db, 'surveys', surveyId, 'responses'), {
    ...data,
    submittedAt: serverTimestamp(),
  })
}

export async function updateResponse(surveyId, responseId, data) {
  return updateDoc(doc(db, 'surveys', surveyId, 'responses', responseId), data)
}

export async function deleteResponse(surveyId, responseId) {
  return deleteDoc(doc(db, 'surveys', surveyId, 'responses', responseId))
}

export function makeQuestionId() {
  return Math.random().toString(36).slice(2, 10)
}
