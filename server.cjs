const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.glb':'model/gltf-binary'};
const server=http.createServer((req,res)=>{
  if(req.method==='POST'&&(req.url==='/save-glb'||req.url==='/save-image')){
    if(req.headers.origin!=='http://'+req.headers.host){res.writeHead(403);return res.end('Same-origin requests only')}
    const chunks=[];let size=0;
    req.on('data',chunk=>{size+=chunk.length;if(size>32*1024*1024){req.destroy();return}chunks.push(chunk)});
    req.on('end',()=>{const data=Buffer.concat(chunks),glb=req.url==='/save-glb';
      if(glb?data.subarray(0,4).toString()!=='glTF':data.subarray(1,4).toString()!=='PNG'){res.writeHead(400);return res.end('Invalid file')}
      const name=glb?'farnsworth-house.glb':'farnsworth-house.png';
      fs.writeFile(path.join(root,name),data,err=>{res.writeHead(err?500:200,{'Content-Type':'application/json'});res.end(JSON.stringify({saved:!err,file:name}))});
    });return;
  }
  let rel;try{rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);return res.end()}
  const file=path.resolve(root,'.'+(rel==='/'?'/index.html':rel));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data)});
});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Farnsworth House: http://127.0.0.1:'+server.address().port));
