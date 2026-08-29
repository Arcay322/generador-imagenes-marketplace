import { getAdminDb } from "./firebase-admin";

export const FREE_CREDITS = 5;
export const PLANS: Record<string, { credits: number; price: string }> = {
  free: { credits: 5, price: "$0" },
  starter: { credits: 20, price: "$9" },
  pro: { credits: 60, price: "$19" },
  studio: { credits: 150, price: "$39" },
};

export interface UserCredits {
  credits: number;
  plan: string;
  updatedAt: number;
}

export async function getUserCredits(uid: string): Promise<UserCredits> {
  const db = getAdminDb();
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) {
    const init: UserCredits = { credits: FREE_CREDITS, plan: "free", updatedAt: Date.now() };
    await db.doc(`users/${uid}`).set(init);
    return init;
  }
  return snap.data() as UserCredits;
}

export async function consumeCredits(uid: string, amount: number): Promise<UserCredits> {
  const db = getAdminDb();
  const ref = db.doc(`users/${uid}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    let data: UserCredits;
    if (!snap.exists) {
      data = { credits: FREE_CREDITS, plan: "free", updatedAt: Date.now() };
    } else {
      data = snap.data() as UserCredits;
    }
    if (data.credits < amount) throw new Error(`Créditos insuficientes. Tienes ${data.credits}, necesitas ${amount}.`);
    const next = { ...data, credits: data.credits - amount, updatedAt: Date.now() };
    tx.set(ref, next);
    return next;
  });
}

export async function addCredits(uid: string, amount: number, plan?: string) {
  const db = getAdminDb();
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  const cur = snap.exists ? (snap.data() as UserCredits) : { credits: 0, plan: "free", updatedAt: Date.now() };
  const next: UserCredits = { credits: cur.credits + amount, plan: plan || cur.plan, updatedAt: Date.now() };
  await ref.set(next);
  return next;
}

export async function refundCredits(uid: string, amount: number) {
  return addCredits(uid, amount);
}
