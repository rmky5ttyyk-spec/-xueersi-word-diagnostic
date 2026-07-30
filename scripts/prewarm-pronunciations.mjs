import { promises as fs } from "node:fs";
import path from "node:path";

const root=process.cwd();
const baseUrl=(process.env.PRONUNCIATION_BASE_URL||"http://127.0.0.1:3000").replace(/\/$/,"");
const concurrency=Math.max(1,Math.min(8,Number(process.env.PRONUNCIATION_PREWARM_CONCURRENCY)||4));

function headword(entry){
  return entry.replace(/\s*\*\s*$/,"").replace(/\s*\([^)]*\).*$/,"").split(" / ")[0].trim();
}

function quotedWords(source){
  return Array.from(source.matchAll(/"([^"]+)"/g),match=>match[1]);
}

async function vocabularyWords(){
  const courseSource=await fs.readFile(path.join(root,"app","data","courseVocabulary.ts"),"utf8");
  const rawMatch=courseSource.match(/const raw = `([\s\S]*?)`;/);
  if(!rawMatch)throw new Error("Cannot locate the course vocabulary source.");
  const course=rawMatch[1].split("|").map(headword);

  const pepSource=await fs.readFile(path.join(root,"app","data","pepExtensions.ts"),"utf8");
  const arrayMatch=pepSource.match(/export const pepExtensionWords[^=]*=\s*\[([\s\S]*?)\];/);
  if(!arrayMatch)throw new Error("Cannot locate the PEP extension vocabulary source.");
  const pep=quotedWords(arrayMatch[1]);

  return Array.from(new Set([...course,...pep]
    .map(word=>word.normalize("NFKC").trim().toLowerCase())
    .filter(word=>/^[a-z]+(?:-[a-z]+)?$/.test(word))));
}

const allWords=await vocabularyWords();
const requestedLimit=Number(process.env.PRONUNCIATION_PREWARM_LIMIT)||0;
const words=requestedLimit>0?allWords.slice(0,requestedLimit):allWords;
const missing=[];
let cursor=0;
let completed=0;

async function worker(){
  while(cursor<words.length){
    const index=cursor;
    cursor+=1;
    const word=words[index];
    try{
      const response=await fetch(baseUrl+"/api/pronunciation?word="+encodeURIComponent(word),{
        signal:AbortSignal.timeout(16000),
      });
      if(!response.ok)missing.push(word);
      else await response.arrayBuffer();
    }catch{
      missing.push(word);
    }
    completed+=1;
    if(completed%50===0||completed===words.length){
      process.stdout.write(`Cached ${completed}/${words.length}; missing ${missing.length}\n`);
    }
  }
}

await Promise.all(Array.from({length:concurrency},()=>worker()));
const manifestResponse=await fetch(baseUrl+"/api/pronunciation?manifest=1",{signal:AbortSignal.timeout(16000)});
if(!manifestResponse.ok)throw new Error("Cannot read the local pronunciation manifest.");
const manifest=await manifestResponse.json();
await fs.writeFile(
  path.join(root,"pronunciation-missing.txt"),
  Array.from(new Set(missing)).sort().join("\n")+(missing.length?"\n":""),
  "utf8",
);

process.stdout.write(`Prewarm complete: ${words.length-missing.length} cached, ${missing.length} unavailable; ${manifest.count} local files verified.\n`);
if(manifest.count<60){
  throw new Error(`Only ${manifest.count} local pronunciations are available. At least 60 are required.`);
}
