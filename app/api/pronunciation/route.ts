const wordPattern=/^[A-Za-z-]{2,30}$/;
export async function GET(request:Request){
  try{
    const word=new URL(request.url).searchParams.get("word")||"";
    if(!wordPattern.test(word))return Response.json({error:"invalid word"},{status:400});
    const lookup=await fetch("https://api.dictionaryapi.dev/api/v2/entries/en/"+encodeURIComponent(word),{headers:{"Accept":"application/json"}});
    if(!lookup.ok)throw new Error("pronunciation unavailable");
    const entries=await lookup.json() as Array<{phonetics?:Array<{audio?:string}>}>;
    const urls=entries.flatMap(x=>x.phonetics||[]).map(x=>x.audio||"").filter(Boolean);
    const url=urls.find(x=>/_gb_|-uk\.|\/uk\//i.test(x))||urls[0];
    if(!url)throw new Error("pronunciation unavailable");
    const audio=await fetch(url.startsWith("//")?"https:"+url:url);
    if(!audio.ok||!audio.body)throw new Error("pronunciation unavailable");
    return new Response(audio.body,{headers:{"Content-Type":audio.headers.get("Content-Type")||"audio/mpeg","Cache-Control":"public, max-age=604800, s-maxage=2592000"}});
  }catch(e){return Response.json({error:e instanceof Error?e.message:"pronunciation unavailable"},{status:404})}
}
