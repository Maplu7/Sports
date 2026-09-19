const HOSTS=[
  "https://site.web.api.espn.com",
  "https://site.api.espn.com"
];

function reply(statusCode,body,extra={}){
  return {
    statusCode,
    headers:{
      "Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"no-store, max-age=0",
      "Access-Control-Allow-Origin":"*",
      ...extra
    },
    body:typeof body==="string"?body:JSON.stringify(body)
  };
}

function pathFor(feed,dates){
  const d=encodeURIComponent(dates||"");
  if(feed==="nfl") return `/apis/site/v2/sports/football/nfl/scoreboard?dates=${d}&limit=200`;
  if(feed==="cfb") return `/apis/site/v2/sports/football/college-football/scoreboard?dates=${d}&groups=80&limit=600`;
  if(feed==="atp") return `/apis/site/v2/sports/tennis/atp/scoreboard?dates=${d}&limit=1200`;
  if(feed==="wta") return `/apis/site/v2/sports/tennis/wta/scoreboard?dates=${d}&limit=1200`;
  if(feed==="standings") return "/apis/v2/sports/football/nfl/standings";
  return "";
}

async function upstreamFetch(host,path){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(host+path,{
      method:"GET",
      headers:{
        "Accept":"application/json,text/plain,*/*",
        "User-Agent":"CozyGameDay/7.0",
        "Accept-Language":"en-US,en;q=0.9"
      },
      signal:controller.signal,
      redirect:"follow"
    });
    const body=await r.text();
    const ct=r.headers.get("content-type")||"";
    const looksDenied=/access denied|permission to access|errors\.edgesuite/i.test(body);
    const looksJson=ct.includes("json") || /^[\s]*[\[{]/.test(body);
    return {ok:r.ok && !looksDenied && looksJson,status:r.status,body,ct,looksDenied};
  }catch(e){
    return {ok:false,status:e?.name==="AbortError"?504:502,body:String(e?.message||e),ct:"",looksDenied:false};
  }finally{
    clearTimeout(timer);
  }
}

exports.handler=async(event)=>{
  if(event.httpMethod==="OPTIONS") return reply(204,"");
  if(event.httpMethod!=="GET") return reply(405,{error:"GET only"});

  const q=event.queryStringParameters||{};
  const feed=String(q.feed||"").toLowerCase();
  const dates=String(q.dates||"").replace(/[^0-9-]/g,"");

  if(feed==="health"){
    return reply(200,{
      ok:true,
      service:"cozy-game-day-sports-v7",
      primary:"site.web.api.espn.com",
      fallback:"site.api.espn.com",
      time:new Date().toISOString()
    });
  }

  const path=pathFor(feed,dates);
  if(!path) return reply(400,{error:"Unknown feed",feed});

  const attempts=[];
  for(const host of HOSTS){
    const result=await upstreamFetch(host,path);
    attempts.push({host,status:result.status,denied:result.looksDenied});
    if(result.ok){
      return {
        statusCode:200,
        headers:{
          "Content-Type":"application/json; charset=utf-8",
          "Cache-Control":"no-store, max-age=0",
          "Access-Control-Allow-Origin":"*",
          "X-Cozy-Source":host
        },
        body:result.body
      };
    }
  }

  return reply(502,{
    error:"Sports provider unavailable",
    message:"Both ESPN feed hosts rejected or failed the request.",
    attempts
  });
};