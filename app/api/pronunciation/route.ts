import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const wordPattern=/^[A-Za-z-]{2,30}$/;
const responseHeaders={
  "Cache-Control":"public, max-age=31536000, immutable",
  "Content-Type":"audio/mpeg",
};

function normalizedWord(word:string){
  return word.normalize("NFKC").trim().toLowerCase();
}

function responseBody(bytes:Uint8Array){
  return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
}

async function readAudio(filePath:string){
  try{return await fs.readFile(filePath)}catch{return null}
}

async function locallyAvailableWords(directory:string){
  try{
    const entries=await fs.readdir(directory,{withFileTypes:true});
    const words:string[]=[];
    for(const entry of entries){
      if(!entry.isFile()||!entry.name.endsWith(".mp3"))continue;
      const word=entry.name.slice(0,-4);
      if(!wordPattern.test(word))continue;
      try{
        const stat=await fs.stat(path.join(directory,entry.name));
        if(stat.size>=512)words.push(word);
      }catch{}
    }
    return words;
  }catch{return []}
}

async function writeAudio(filePath:string,bytes:Uint8Array){
  await fs.mkdir(path.dirname(filePath),{recursive:true});
  const temporary=filePath+"."+process.pid+".tmp";
  await fs.writeFile(temporary,bytes);
  await fs.rename(temporary,filePath);
}

async function fetchWithRetry(url:string,timeout=6000,attempts=2){
  let lastResponse:Response|null=null;
  let lastError:unknown=null;
  for(let attempt=0;attempt<attempts;attempt+=1){
    try{
      const response=await fetch(url,{
        headers:{"Accept":"application/json,audio/mpeg,audio/*;q=0.9"},
        signal:AbortSignal.timeout(timeout),
      });
      lastResponse=response;
      if(response.ok)return response;
    }catch(error){
      lastError=error;
    }
  }
  if(lastResponse)return lastResponse;
  throw lastError instanceof Error?lastError:new Error("pronunciation request failed");
}

export async function GET(request:Request){
  const url=new URL(request.url);
  const cacheRoot=process.env.PRONUNCIATION_CACHE_DIR
    ||path.join(process.cwd(),".data","pronunciations");
  const bundledRoot=path.join(process.cwd(),"public","audio","pronunciations");

  if(url.searchParams.get("manifest")==="1"){
    const words=Array.from(new Set([
      ...await locallyAvailableWords(bundledRoot),
      ...await locallyAvailableWords(cacheRoot),
    ])).sort();
    return Response.json(
      {words,count:words.length,localOnly:true},
      {headers:{"Cache-Control":"no-store"}},
    );
  }

  const requested=url.searchParams.get("word")||"";
  const word=normalizedWord(requested);
  if(!wordPattern.test(word))return Response.json({error:"invalid word"},{status:400});

  const bundledPath=path.join(bundledRoot,word+".mp3");
  const cachePath=path.join(cacheRoot,word+".mp3");

  const bundled=await readAudio(bundledPath);
  if(bundled)return new Response(responseBody(bundled),{headers:{...responseHeaders,"X-Pronunciation-Source":"bundled"}});

  const cached=await readAudio(cachePath);
  if(cached)return new Response(responseBody(cached),{headers:{...responseHeaders,"X-Pronunciation-Source":"disk-cache"}});

  try{
    const lookup=await fetchWithRetry("https://api.dictionaryapi.dev/api/v2/entries/en/"+encodeURIComponent(word));
    if(!lookup.ok)throw new Error("pronunciation unavailable");
    const entries=await lookup.json() as Array<{phonetics?:Array<{audio?:string}>}>;
    const urls=Array.from(new Set(entries.flatMap(entry=>entry.phonetics||[])
      .map(phonetic=>phonetic.audio||"")
      .filter(Boolean)))
      .sort((left,right)=>Number(/_gb_|-uk\.|\/uk\//i.test(right))-Number(/_gb_|-uk\.|\/uk\//i.test(left)));

    for(const source of urls){
      try{
        const audio=await fetchWithRetry(source.startsWith("//")?"https:"+source:source);
        if(!audio.ok)continue;
        const contentType=audio.headers.get("Content-Type")||"";
        if(!contentType.startsWith("audio/"))continue;
        const bytes=new Uint8Array(await audio.arrayBuffer());
        if(bytes.byteLength<512)continue;
        await writeAudio(cachePath,bytes);
        return new Response(responseBody(bytes),{headers:{...responseHeaders,"Content-Type":contentType,"X-Pronunciation-Source":"remote-cached"}});
      }catch{}
    }
  }catch{}

  return Response.json({error:"pronunciation unavailable"},{status:404,headers:{"Cache-Control":"no-store"}});
}
