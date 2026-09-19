const BASE="https://site.api.espn.com";
function reply(statusCode,body){
 return {statusCode,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, max-age=0","Access-Control-Allow-Origin":"*"},body:typeof body==="string"?body:JSON.stringify(body)};
}
exports.handler=async(event)=>{
 if(event.httpMethod==="OPTIONS")return reply(204,"");
 if(event.httpMethod!=="GET")return reply(405,{error:"GET only"});
 const q=event.queryStringParameters||{};
 const feed=String(q.feed||"").toLowerCase();
 const dates=String(q.dates||"").replace(/[^0-9-]/g,"");
 if(feed==="health")return reply(200,{ok:true,service:"cozy-game-day-sports",time:new Date().toISOString()});
 let path="";
 if(feed==="nfl")path=`/apis/site/v2/sports/football/nfl/scoreboard?dates=${encodeURIComponent(dates)}&limit=200`;
 else if(feed==="cfb")path=`/apis/site/v2/sports/football/college-football/scoreboard?dates=${encodeURIComponent(dates)}&groups=80&limit=600`;
 else if(feed==="atp")path=`/apis/site/v2/sports/tennis/atp/scoreboard?dates=${encodeURIComponent(dates)}&limit=1200`;
 else if(feed==="wta")path=`/apis/site/v2/sports/tennis/wta/scoreboard?dates=${encodeURIComponent(dates)}&limit=1200`;
 else if(feed==="standings")path="/apis/v2/sports/football/nfl/standings";
 else return reply(400,{error:"Unknown feed",feed});
 const ctl=new AbortController();
 const timer=setTimeout(()=>ctl.abort(),15000);
 try{
  const r=await fetch(BASE+path,{headers:{"Accept":"application/json,text/plain,*/*","User-Agent":"Mozilla/5.0 CozyGameDay/2.0","Referer":"https://www.espn.com/"},signal:ctl.signal});
  const body=await r.text();
  return {statusCode:r.status,headers:{"Content-Type":r.headers.get("content-type")||"application/json; charset=utf-8","Cache-Control":"no-store, max-age=0","Access-Control-Allow-Origin":"*"},body};
 }catch(e){
  return reply(e?.name==="AbortError"?504:502,{error:e?.name==="AbortError"?"ESPN timed out":"ESPN fetch failed",detail:String(e?.message||e)});
 }finally{clearTimeout(timer)}
};