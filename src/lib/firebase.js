import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { isSupported, getAnalytics } from 'firebase/analytics'

// Firebase web config is meant to be public; access is controlled by
// Firestore/Auth rules, not by keeping these values secret.
const firebaseConfig = {
  apiKey: 'AIzaSyAmtTMKZiJ2Ok3mw9R_GEsGDb4eOzGc_yw',
  authDomain: 'sondaggio-87457.firebaseapp.com',
  projectId: 'sondaggio-87457',
  storageBucket: 'sondaggio-87457.firebasestorage.app',
  messagingSenderId: '690851958121',
  appId: '1:690851958121:web:9966859f4fe423affb01f8',
  measurementId: 'G-MLZRM1F7NQ',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

isSupported().then((supported) => {
  if (supported) getAnalytics(app)
})
