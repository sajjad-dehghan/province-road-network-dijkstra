export const MAX_COST = 1_000_000_000;
const name = /^[A-Za-z_][A-Za-z0-9_-]*$/;
export const key = city => city.province + "." + city.name;
export function validate(network) {
  if (!network || !Array.isArray(network.cities) || !Array.isArray(network.roads)) throw Error("ساختار شبکه نامعتبر است.");
  if (network.cities.length > 500 || network.roads.length > 10000) throw Error("شبکه بیش از حد بزرگ است.");
  const keys = new Set(), ids = new Set();
  for (const city of network.cities) {
    if (!city || typeof city.name!=="string" || typeof city.province!=="string" || !name.test(city.name) || !name.test(city.province) || !Number.isSafeInteger(city.id) || city.id < 1 || city.id>2147483647 || !["BG","NON_BG"].includes(city.type)) throw Error("مشخصات شهر نامعتبر است.");
    if (keys.has(key(city)) || ids.has(city.province + "." + city.id)) throw Error("شهر یا شناسهٔ تکراری.");
    keys.add(key(city)); ids.add(city.province + "." + city.id);
  }
  const pairs = new Set();
  for (const road of network.roads) {
    const a = network.cities.find(city=>key(city)===road.from), b = network.cities.find(city=>key(city)===road.to);
    if (!a || !b || a===b) throw Error("دو شهر معتبر و متفاوت انتخاب کن.");
    if (!Number.isSafeInteger(road.cost) || road.cost<0 || road.cost>MAX_COST) throw Error("هزینه باید عدد صحیح بین صفر و یک میلیارد باشد.");
    if (a.province!==b.province && (a.type!=="BG" || b.type!=="BG")) throw Error("جادهٔ بین استانی باید دو شهر مرزی BG را وصل کند.");
    const pair=[road.from,road.to].sort().join("|");
    if (pairs.has(pair)) throw Error("جادهٔ تکراری."); pairs.add(pair);
  }
  return network;
}
export function setRoad(network, from, to, cost) {
  const candidate = structuredClone(network);
  const road=candidate.roads.find(r=>(r.from===from&&r.to===to)||(r.from===to&&r.to===from));
  if(road) road.cost=cost; else candidate.roads.push({from,to,cost});
  return validate(candidate);
}
export function shortestPath(network, from, to, local=false) {
  validate(network);
  const cities=network.cities.map(key), start=cities.indexOf(from), end=cities.indexOf(to);
  if(start<0||end<0) throw Error("شهر مبدأ یا مقصد پیدا نشد.");
  if(local&&network.cities[start].province!==network.cities[end].province) throw Error("برای مسیر داخلی، هر دو شهر باید در یک استان باشند.");
  const graph=cities.map(()=>[]);
  for(const r of network.roads){
    const a=cities.indexOf(r.from), b=cities.indexOf(r.to);
    if(local&&(network.cities[a].province!==network.cities[start].province||network.cities[b].province!==network.cities[start].province)) continue;
    graph[a].push([b,r.cost]); graph[b].push([a,r.cost]);
  }
  const distance=cities.map(()=>Infinity), previous=cities.map(()=>-1), visited=new Set();
  distance[start]=0;
  for(let count=0;count<cities.length;count++){
    let current=-1;
    for(let i=0;i<cities.length;i++) if(!visited.has(i)&&(current<0||distance[i]<distance[current])) current=i;
    if(current<0||distance[current]===Infinity) break;
    visited.add(current); if(current===end) break;
    for(const [next,cost] of graph[current]) if(distance[current]+cost<distance[next]){
      distance[next]=distance[current]+cost; previous[next]=current;
    }
  }
  if(distance[end]===Infinity) return {reachable:false,cost:null,path:[]};
  const path=[]; for(let n=end;n!==-1;n=previous[n]) path.unshift(cities[n]);
  return {reachable:true,cost:distance[end],path};
}
export function parseCommands(text) {
  if (text.length>250000) throw Error("ورودی بیش از حد بزرگ است.");
  let network={cities:[],roads:[]}; let query=null;
  const city=/^CREATE\s*\(([\w-]+):\s*Node,\s*\{id:\s*'(\d+)',\s*Type:\s*'(BG|NON_BG)'\},\s*([\w-]+):\s*province\)$/;
  const road=/^CREATE\s*\(([\w-]+)\.([\w-]+)\)\s*[-–]\s*\[:ROAD\s*\{cost:(\d+)\}\]\s*[-–]>\s*\(([\w-]+)\.([\w-]+)\)$/;
  const find=/^(FIND|LOCAL)\s+([\w-]+\.[\w-]+)\s*->\s*([\w-]+\.[\w-]+)$/;
  for(const [i,raw] of text.split(/\r?\n/).entries()){
    const line=raw.trim(); if(!line||line.startsWith("//")||line==="-1") continue;
    try {
      let m;
      if((m=line.match(city))) {network.cities.push({name:m[1],id:Number(m[2]),type:m[3],province:m[4]}); validate(network);}
      else if((m=line.match(road))) network=setRoad(network,m[2]+"."+m[1],m[5]+"."+m[4],Number(m[3]));
      else if((m=line.match(find))) {query={from:m[2],to:m[3],local:m[1]==="LOCAL"};shortestPath(network,query.from,query.to,query.local);}
      else throw Error("دستور نامعتبر.");
    } catch(error) {throw Error("خط "+(i+1)+": "+error.message);}
  }
  if(!network.cities.length) throw Error("حداقل یک شهر لازم است.");
  return {network:validate(network),query};
}
export function exportCommands(network,query) {
  validate(network);
  const lines=network.cities.map(c=>`CREATE (${c.name}: Node, {id: '${c.id}', Type: '${c.type}'}, ${c.province}: province)`);
  lines.push(...network.roads.map(r=>`CREATE (${r.from.split(".").reverse().join(".")}) - [:ROAD {cost:${r.cost}}] -> (${r.to.split(".").reverse().join(".")})`));
  if(query) lines.push(`${query.local?"LOCAL":"FIND"} ${query.from}->${query.to}`);
  return lines.join("\n");
}
