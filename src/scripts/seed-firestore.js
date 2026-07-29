import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";

const batch = db.batch();
batch.set(db.collection("settings").doc("public"), {
  status: "online",
  playersOnline: 47,
  playersMax: 128,
  version: "1.0.3",
  lastRestart: "Dnes v 04:00",
  connectUrl: "",
  foundedYear: 2026,
  updatedAt: FieldValue.serverTimestamp()
}, { merge: true });

const news = [
  ["nova-verze-webu-2-0", "Nová verze webu 2.0", "Spouštíme novou verzi webu s mnoha vylepšeními."],
  ["aktualizace-pravidel", "Aktualizace pravidel", "Pravidla byla přepracována do přehledného dokumentu."],
  ["nove-mesto-silver-ridge", "Nové město – Silver Ridge", "Do světa přichází nové město plné příležitostí."]
];
for (const [id, title, text] of news) {
  batch.set(db.collection("news").doc(id), {
    title, text, slug: id, published: true,
    publishedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

const towns = [
  ["deadstone", "Deadstone", "Hlavní město státu Deadstone."],
  ["silver-ridge", "Silver Ridge", "Horské město s bohatou historií."],
  ["redwater", "Redwater", "Průmyslové město na řece."],
  ["fort-echo", "Fort Echo", "Vojenská pevnost na hranicích."]
];
for (const [id, name, text] of towns) {
  batch.set(db.collection("towns").doc(id), {
    name, text, slug: id, published: true,
    publishedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

await batch.commit();
console.log("Výchozí Firestore data byla vytvořena.");
