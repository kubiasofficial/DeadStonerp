import { FieldValue } from "firebase-admin/firestore";
import { db } from "../config/firebase.js";
import { writeAudit } from "./content-service.js";

const collections = { locations:"atlasLocations", regions:"atlasRegions" };
const cleanId = value => String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,80);
const text = (value,max=5000) => String(value??"").trim().slice(0,max);
const serialize = doc => { const data=doc.data(); return {id:doc.id,...data,createdAt:data.createdAt?.toDate?.().toISOString()??null,updatedAt:data.updatedAt?.toDate?.().toISOString()??null}; };
function collectionFor(kind){if(!collections[kind])throw Object.assign(new Error("Neplatná část atlasu."),{status:400});return collections[kind]}
function payload(kind,input){
  if(kind==="regions")return {name:text(input.name,100),slug:cleanId(input.slug||input.name),description:text(input.description),imageUrl:text(input.imageUrl,1200),order:Number(input.order)||0,isPublished:Boolean(input.isPublished),focus:{x:Number(input.focus?.x)||50,y:Number(input.focus?.y)||50,zoom:Number(input.focus?.zoom)||1.7}};
  const mapX=Number(input.mapX),mapY=Number(input.mapY);
  if(!Number.isFinite(mapX)||mapX<0||mapX>100||!Number.isFinite(mapY)||mapY<0||mapY>100)throw Object.assign(new Error("Souřadnice mapy musí být v rozsahu 0 až 100."),{status:400});
  return {name:text(input.name,100),slug:cleanId(input.slug||input.name),originalName:text(input.originalName,100),type:text(input.type,80),category:text(input.category,40),region:text(input.region,100),shortDescription:text(input.shortDescription,300),description:text(input.description),history:text(input.history),notablePlaces:Array.isArray(input.notablePlaces)?input.notablePlaces.map(item=>text(item,150)).filter(Boolean).slice(0,20):[],imageUrl:text(input.imageUrl,1200),mapX,mapY,isPublished:Boolean(input.isPublished),order:Number(input.order)||0};
}
export async function getAtlas(publishedOnly=true){
  const [locationSnapshot,regionSnapshot]=await Promise.all([db.collection(collections.locations).limit(250).get(),db.collection(collections.regions).limit(50).get()]);
  const filter=items=>items.map(serialize).filter(item=>!publishedOnly||item.isPublished).sort((a,b)=>(a.order||0)-(b.order||0));
  return {locations:filter(locationSnapshot.docs),regions:filter(regionSnapshot.docs)};
}
export async function createAtlasEntry(kind,input,admin){const collection=collectionFor(kind),data=payload(kind,input);if(!data.name)throw Object.assign(new Error("Název je povinný."),{status:400});const id=cleanId(input.id||data.slug)||db.collection(collection).doc().id,ref=db.collection(collection).doc(id);if((await ref.get()).exists)throw Object.assign(new Error("Záznam s tímto názvem už existuje."),{status:409});await ref.set({...data,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});await writeAudit(`discord:${admin.id}`,`atlas.${kind}.create`,`${collection}/${id}`,data);return serialize(await ref.get())}
export async function updateAtlasEntry(kind,id,input,admin){const collection=collectionFor(kind),ref=db.collection(collection).doc(cleanId(id));if(!(await ref.get()).exists)throw Object.assign(new Error("Záznam nebyl nalezen."),{status:404});const data=payload(kind,input);await ref.set({...data,updatedAt:FieldValue.serverTimestamp()},{merge:true});await writeAudit(`discord:${admin.id}`,`atlas.${kind}.update`,`${collection}/${id}`,data);return serialize(await ref.get())}
export async function deleteAtlasEntry(kind,id,admin){const collection=collectionFor(kind),ref=db.collection(collection).doc(cleanId(id));if(!(await ref.get()).exists)throw Object.assign(new Error("Záznam nebyl nalezen."),{status:404});await ref.delete();await writeAudit(`discord:${admin.id}`,`atlas.${kind}.delete`,`${collection}/${id}`);return {id,deleted:true}}
