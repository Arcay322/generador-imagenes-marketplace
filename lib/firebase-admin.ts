import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length) return getApps()[0]!;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  if (projectId) {
    return initializeApp({ projectId });
  }
  throw new Error("Firebase Admin no configurado. Faltan FIREBASE_* env vars.");
}

export function getAdminAuth() {
  return getAuth(initAdmin());
}

export function getAdminDb() {
  return getFirestore(initAdmin());
}

export async function verifyIdToken(token: string) {
  return getAdminAuth().verifyIdToken(token);
}
