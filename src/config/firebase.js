import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { env } from "./env.js";

function credential() {
  if (env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey) {
    return cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey
    });
  }
  return applicationDefault();
}

const firebaseApp = getApps()[0] || initializeApp({
  credential: credential(),
  projectId: env.firebaseProjectId || undefined,
  storageBucket: env.firebaseStorageBucket || undefined
});

export const db = getFirestore(firebaseApp);
export const storageBucket = getStorage(firebaseApp).bucket();
db.settings({ ignoreUndefinedProperties: true });
