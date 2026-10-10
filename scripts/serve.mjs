// Dependency-free local static server; never invokes shell commands or a remote API.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
const root=resolve(import.meta.dirname,"../web"),port=Number(process.env.PORT||4322);
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".txt":"text/plain; charset=utf-8",".woff2":"font/woff2"};
createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,"http://localhost");
    const path=resolve(root,"."+decodeURIComponent(url.pathname)+(url.pathname.endsWith("/")?"index.html":""));
    if(!path.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
    const body=await readFile(path);res.writeHead(200,{"Content-Type":mime[extname(path)]||"application/octet-stream","Cache-Control":"no-store"});res.end(body);
  } catch {res.writeHead(404);res.end("Not found");}
}).listen(port,"127.0.0.1",()=>console.log("http://localhost:"+port+"/"));
