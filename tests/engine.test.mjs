import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import {key,parseCommands,exportCommands,setRoad,shortestPath,validate} from "../web/engine.mjs";
const text=await readFile(new URL("../input/input.txt",import.meta.url),"utf8");
const {network}=parseCommands(text);
test("original graph finds the full path through the cheapest gateway",()=>{
  assert.equal(network.cities.length,15);assert.equal(network.roads.length,15);
  assert.deepEqual(shortestPath(network,"Qom.C","Tabriz.N"),{reachable:true,cost:42,path:["Qom.C","Qom.A","Qom.B","Tabriz.N"]});
});
test("unreachable, same city, local query and immutable roads",()=>{
  const before=structuredClone(network);
  assert.equal(shortestPath(network,"Qom.A","Yazd.G").reachable,false);
  assert.deepEqual(shortestPath(network,"Qom.A","Qom.A").path,["Qom.A"]);
  assert.equal(shortestPath(network,"Qom.C","Qom.E",true).cost,40);
  assert.throws(()=>shortestPath(network,"Qom.A","Tabriz.N",true));
  assert.deepEqual(network,before);
});
test("road updates, zero-cost edges and boundary validation",()=>{
  let updated=setRoad(network,"Qom.C","Qom.A",0);
  assert.equal(shortestPath(updated,"Qom.C","Tabriz.N").cost,32);
  assert.equal(updated.roads.length,15);
  for(const cost of [-1,NaN,Infinity,1.5,1e10]) assert.throws(()=>setRoad(network,"Qom.C","Qom.A",cost));
  assert.throws(()=>setRoad(network,"Qom.C","Tabriz.N",2));
  assert.throws(()=>setRoad(network,"Qom.C","missing",2));
});
test("commands roundtrip, duplicate identity and malformed commands",()=>{
  const parsed=parseCommands(exportCommands(network,{from:"Qom.C",to:"Tabriz.N",local:false}));
  assert.deepEqual(parsed.network,network);assert.equal(parsed.query.from,"Qom.C");
  assert.throws(()=>parseCommands("CREATE nonsense"));
  assert.throws(()=>parseCommands(text+"\n"+text));
  assert.throws(()=>validate({cities:[{id:1,type:"BG"}],roads:[]}));
  assert.throws(()=>parseCommands("CREATE (A: Node, {id: '2147483648', Type: 'BG'}, P: province)"));
});
test("seeded networks agree with independent Floyd-Warshall and the native CLI",()=>{
  let seed=73; const random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);
  const sample={cities:Array.from({length:18},(_,i)=>({name:"N"+i,id:i+1,province:"P"+Math.floor(i/6),type:"BG"})),roads:[]};
  for(let i=0;i<18;i++) for(let j=i+1;j<18;j++) if(random()<.18) sample.roads.push({from:key(sample.cities[i]),to:key(sample.cities[j]),cost:Math.floor(random()*20)});
  const distance=Array.from({length:18},(_,i)=>Array.from({length:18},(_,j)=>i===j?0:Infinity));
  for(const road of sample.roads){const a=sample.cities.findIndex(c=>key(c)===road.from),b=sample.cities.findIndex(c=>key(c)===road.to);distance[a][b]=distance[b][a]=road.cost;}
  for(let k=0;k<18;k++) for(let i=0;i<18;i++) for(let j=0;j<18;j++) distance[i][j]=Math.min(distance[i][j],distance[i][k]+distance[k][j]);
  const exe=["../build/app.exe","../build/app","../app"].map(path=>new URL(path,import.meta.url)).find(path=>existsSync(path));
  assert(exe,"Build the native CLI first");
  const queries=sample.cities.flatMap(a=>sample.cities.map(b=>[key(a),key(b)]));
  const native=spawnSync(exe.pathname.replace(/^\/([A-Z]:)/,"$1"),[],{input:exportCommands(sample)+"\n"+queries.map(([a,b])=>"FIND "+a+"->"+b).join("\n"),encoding:"utf8"});
  assert.equal(native.status,0,native.stderr);
  const lines=native.stdout.trim().split(/\r?\n/);let line=0;
  for(let i=0;i<18;i++) for(let j=0;j<18;j++){
    const result=shortestPath(sample,key(sample.cities[i]),key(sample.cities[j]));
    assert.equal(result.cost,distance[i][j]===Infinity?null:distance[i][j]);
    if(result.reachable){assert.equal(lines[line++],"Cost: "+result.cost);line++;}
    else assert.match(lines[line++],/^No route /);
  }
  assert.equal(line,lines.length);
});
test("all original city-pair costs match the C++ CLI",()=>{
  const exe=["../build/app.exe","../build/app","../app"].map(path=>new URL(path,import.meta.url)).find(path=>existsSync(path));
  if(!exe) throw Error("Build the C++ CLI before running the parity suite.");
  const cities=network.cities.map(key),queries=cities.flatMap(a=>cities.map(b=>[a,b]));
  const input=exportCommands(network)+"\n"+queries.map(([a,b])=>"FIND "+a+"->"+b).join("\n");
  const result=spawnSync(exe.pathname.replace(/^\/([A-Z]:)/,"$1"),[],{input,encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  const lines=result.stdout.trim().split(/\r?\n/); let i=0;
  for(const [a,b] of queries){
    const route=shortestPath(network,a,b);
    if(route.reachable){assert.equal(lines[i++],"Cost: "+route.cost,a+" to "+b);assert.match(lines[i++],/^Path: /);}
    else assert.equal(lines[i++],"No route from "+a+" to "+b);
  }
  assert.equal(i,lines.length);
});
