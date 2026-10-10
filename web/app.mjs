import {key,parseCommands,exportCommands,setRoad,shortestPath} from "./engine.mjs";
const $=id=>document.getElementById(id), ns="http://www.w3.org/2000/svg";
let network, original, route={path:[]};
const names={Qom:"قم",Yazd:"یزد",Tabriz:"تبریز"};
const number=n=>n.toLocaleString("fa-IR");
$("zoom").addEventListener("click",()=>{
  const enabled=$("zoom").getAttribute("aria-pressed")!=="true";
  $("zoom").setAttribute("aria-pressed",String(enabled));
  $("zoom").textContent=enabled?"نمایش کامل نمودار −":"بزرگ‌نمایی نمودار +";
  document.querySelector(".graph-wrap").classList.toggle("zoomed",enabled);
});
function element(tag,attributes={},text) {
  const node=document.createElementNS(ns,tag);
  for(const [k,v] of Object.entries(attributes)) node.setAttribute(k,v);
  if(text!==undefined) node.textContent=text;
  return node;
}
function populate(){
  for(const id of ["from","to","road-from","road-to"]){
    $(id).replaceChildren(...network.cities.map(c=>{
      const o=document.createElement("option");o.value=key(c);o.textContent=(names[c.province]||c.province)+" · "+c.name+(c.type==="BG"?" / مرزی":""); return o;
    }));
  }
  const keys=network.cities.map(key);
  $("from").value=keys.includes(original.query?.from)?original.query.from:keys[0];
  $("to").value=keys.includes(original.query?.to)?original.query.to:keys.at(-1);
  $("road-from").value=key(network.cities[0]);$("road-to").value=key(network.cities[1]||network.cities[0]);
}
function draw(){
  const svg=$("graph");svg.querySelectorAll(":scope > g").forEach(n=>n.remove());
  const provinces=[...new Set(network.cities.map(c=>c.province))], positions=new Map();
  const layer=element("g"), columns=Math.min(3,provinces.length), rows=Math.ceil(provinces.length/columns), height=rows*500+40;
  svg.setAttribute("viewBox",`0 0 900 ${height}`);
  provinces.forEach((p,i)=>{
    const group=network.cities.filter(c=>c.province===p), w=860/columns, x=20+(i%columns)*w,y=20+Math.floor(i/columns)*500;
    layer.append(element("rect",{x:x+5,y,width:w-16,height:480,rx:20,class:"province-box"}));
    layer.append(element("text",{x:x+24,y:y+34,class:"province-label"},p.toUpperCase()));
    group.forEach((c,j)=>{const angle=-Math.PI/2+j*2*Math.PI/group.length;positions.set(key(c),[x+w/2+Math.cos(angle)*w*.33,y+260+Math.sin(angle)*155]);});
  });
  const selected=new Set(route.path.slice(1).map((p,i)=>[route.path[i],p].sort().join("|")));
  network.roads.forEach(r=>{
    const a=positions.get(r.from),b=positions.get(r.to),active=selected.has([r.from,r.to].sort().join("|"));
    layer.append(element("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],class:"edge"+(active?" selected":"")}));
    layer.append(element("text",{x:(a[0]+b[0])/2+4,y:(a[1]+b[1])/2-6,class:"edge-cost"},String(r.cost)));
  });
  network.cities.forEach(c=>{
    const p=positions.get(key(c)),g=element("g",{class:"city"+(c.type==="BG"?" gateway":"")+(route.path.includes(key(c))?" on-route":"")});
    g.append(element("title",{},key(c)+" · "+c.type),element("circle",{cx:p[0],cy:p[1],r:18}),element("text",{x:p[0],y:p[1]+5,"text-anchor":"middle"},c.name));layer.append(g);
  });
  svg.append(layer);$("counts").textContent=number(network.cities.length)+" شهر / "+number(network.roads.length)+" جاده";
}
function calculate(){
  $("result").replaceChildren();route={path:[]};
  try{
    route=shortestPath(network,$("from").value,$("to").value,$("scope").value==="local");
    if(!route.reachable) $("result").textContent="بین این دو شهر مسیر پیوسته‌ای وجود ندارد. یک جاده اضافه کن یا مقصد دیگری انتخاب کن.";
    else{
      const value=document.createElement("strong");value.className="result-cost";value.textContent=number(route.cost)+" ";
      const unit=document.createElement("small");unit.textContent="واحد هزینه";value.append(unit);
      const path=document.createElement("p");path.className="route-list";path.textContent=route.path.join(" → ");
      const hops=document.createElement("p");hops.className="note";hops.textContent=number(route.path.length-1)+" جاده · کم‌هزینه‌ترین مسیر";
      $("result").append(value,path,hops);
    }
  }catch(error){$("result").textContent=error.message;}
  draw();
}
function roads(){
  $("roads").replaceChildren(...network.roads.map((r,i)=>{
    const item=document.createElement("span");item.className="road-item";
    const label=document.createElement("span");label.textContent=r.from+" ↔ "+r.to+" / "+r.cost;
    const button=document.createElement("button");button.type="button";button.textContent="×";button.setAttribute("aria-label","حذف جاده "+r.from+" به "+r.to);
    button.addEventListener("click",()=>{network.roads.splice(i,1);roads();calculate();$("edit-status").textContent="جاده حذف شد.";});
    item.append(label,button);return item;
  }));
}
$("route-form").addEventListener("submit",event=>{event.preventDefault();calculate();});
$("road-form").addEventListener("submit",event=>{
  event.preventDefault();try{network=setRoad(network,$("road-from").value,$("road-to").value,Number($("cost").value));roads();calculate();$("edit-status").textContent="جاده ثبت شد؛ مسیر دوباره محاسبه شد.";}catch(error){$("edit-status").textContent=error.message;}
});
$("reset").addEventListener("click",()=>{network=structuredClone(original.network);populate();$("scope").value="all";roads();calculate();$("edit-status").textContent="نمونهٔ اصلی مخزن بازیابی شد.";});
$("export").addEventListener("click",()=>{$("commands").value=exportCommands(network,{from:$("from").value,to:$("to").value,local:$("scope").value==="local"});$("import-status").textContent="دستورات آماده‌اند؛ می‌توانی در CLI اجرا کنی.";});
$("import").addEventListener("click",()=>{
  try{
    const parsed=parseCommands($("commands").value);network=parsed.network;populate();
    if(parsed.query){$("from").value=parsed.query.from;$("to").value=parsed.query.to;$("scope").value=parsed.query.local?"local":"all";}
    roads();calculate();$("import-status").textContent="شبکه بارگذاری شد.";
  }catch(error){$("import-status").textContent=error.message;}
});
try{
  const response=await fetch("./sample.txt");if(!response.ok) throw Error("نمونهٔ شبکه بارگذاری نشد.");
  const text=await response.text();original=parseCommands(text);network=structuredClone(original.network);
  populate();$("commands").value=text;roads();calculate();
}catch(error){$("result").textContent=error.message;document.querySelectorAll("form button").forEach(b=>b.disabled=true);}
