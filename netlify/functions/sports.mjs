const HOSTS = [
  "https://site.web.api.espn.com",
  "https://site.api.espn.com"
];

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Content-Type": "application/json; charset=utf-8"
};

function json(data, status=200, extra={}) {
  return new Response(JSON.stringify(data), {status, headers:{...cors,...extra}});
}

function oneDate(value) {
  const s=String(value||"").replace(/\D/g,"");
  return /^\d{8}$/.test(s) ? s : "";
}

function endpoint(feed,date) {
  const d=date ? `dates=${date}&` : "";
  if(feed==="nfl") return `/apis/site/v2/sports/football/nfl/scoreboard?${d}limit=200`;
  if(feed==="cfb") return `/apis/site/v2/sports/football/college-football/scoreboard?${d}groups=80&limit=600`;
  if(feed==="atp") return `/apis/site/v2/sports/tennis/atp/scoreboard?${d}limit=1200`;
  if(feed==="wta") return `/apis/site/v2/sports/tennis/wta/scoreboard?${d}limit=1200`;
  if(feed==="standings") return `/apis/v2/sports/football/nfl/standings`;
  return null;
}

async function provider(host,path) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try {
    const r=await fetch(host+path,{
      method:"GET",
      headers:{
        "Accept":"application/json,text/plain,*/*",
        "User-Agent":"CozyGameDay/9.0"
      },
      redirect:"follow",
      signal:controller.signal
    });
    const body=await r.text();
    let parsed=null;
    try { parsed=JSON.parse(body); } catch {}
    const denied=/access denied|permission to access|errors\.edgesuite/i.test(body);
    return {ok:r.ok && !!parsed && !denied,status:r.status,body,parsed,denied};
  } catch(e) {
    return {ok:false,status:e?.name==="AbortError"?504:502,body:String(e?.message||e),parsed:null,denied:false};
  } finally { clearTimeout(timer); }
}

export default async (request) => {
  if(request.method==="OPTIONS") return new Response("",{status:204,headers:cors});
  if(request.method!=="GET") return json({error:"GET only"},405);

  const url=new URL(request.url);
  const feed=(url.searchParams.get("feed")||"").toLowerCase();
  const date=oneDate(url.searchParams.get("date")||url.searchParams.get("dates"));

  if(feed==="health") return json({
    ok:true,
    service:"cozy-game-day-clean-v9",
    architecture:"direct-netlify-function-path",
    time:new Date().toISOString()
  });

  const path=endpoint(feed,date);
  if(!path) return json({error:"Unknown feed",feed},400);

  const attempts=[];
  for(const host of HOSTS){
    const x=await provider(host,path);
    attempts.push({host,status:x.status,denied:x.denied});
    if(x.ok) return new Response(x.body,{status:200,headers:{...cors,"X-Cozy-Source":host}});
  }
  return json({error:"Sports provider unavailable",attempts},502);
};

export const config = { path: "/api/sports" };
