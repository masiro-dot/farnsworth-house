import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Metres. +X east, -Z north. The model's historical scope is documented in README.md.
const D={length:23.546,width:8.738,floor:1.600,clear:2.896,fascia:.381,column:.203,bay:6.706,terraceLength:16.840,terraceWidth:6.909,terraceTop:.864,stone:.0318};
const FLOOR=D.floor, CEILING=FLOOR+D.clear, HALF=D.length/2, W=D.width/2, ENTRY=-HALF+D.bay;
const $=s=>document.querySelector(s);
let seed=1951;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
const scene=new THREE.Scene();scene.background=new THREE.Color('#e1e7dc');scene.fog=new THREE.Fog('#e1e7dc',65,155);
const camera=new THREE.PerspectiveCamera(41,innerWidth/innerHeight,.04,300);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
renderer.outputColorSpace=THREE.SRGBColorSpace;
$('#viewport').appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.065;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=.35;controls.maxDistance=100;controls.autoRotateSpeed=.34;
const model=new THREE.Group();model.name='Farnsworth House — metres — interpretive reconstruction';scene.add(model);
const architecture=new THREE.Group(),roof=new THREE.Group(),glazing=new THREE.Group(),furniture=new THREE.Group(),curtains=new THREE.Group(),landscape=new THREE.Group(),annotations=new THREE.Group();
architecture.name='Structure and travertine';roof.name='Roof assembly';glazing.name='6.35 mm plate glass';furniture.name='Interpretive later-period furniture';curtains.name='Shantung curtains';landscape.name='Illustrative landscape';annotations.name='Dimensions';
model.add(architecture,roof,glazing,furniture,curtains);scene.add(landscape,annotations);annotations.visible=false;
const geomBox=new THREE.BoxGeometry(1,1,1);
function texture(kind,size=512){
 const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const n=rand(),a=y/size,b=x/size;let v,r,g,bl;
  if(kind==='stone'){v=3.5*Math.sin(a*78+Math.sin(b*15)*1.8)+2*Math.sin(a*218+b*8)+(n-.5)*7;const pore=n>.992?22:0;r=204+v-pore;g=191+v-pore;bl=165+v-pore;}
  else if(kind==='wood'){const grain=Math.sin(b*900+Math.sin(a*13+b*7)*2.4)+.45*Math.sin(b*370+Math.sin(a*9)*3);v=grain*3.5+(n-.5)*7+4*Math.sin(b*28+Math.sin(a*3)*.6);r=169+v;g=127+v;bl=82+v*.8;}
  else if(kind==='teak'){v=10*Math.sin(b*420+Math.sin(a*9)*2)+(n-.5)*8;r=126+v;g=82+v;bl=45+v;}
  else if(kind==='fabric'){v=((x%3===0||y%3===0)?-15:0)+(n-.5)*12;r=225+v;g=220+v;bl=203+v;}
  else if(kind==='leather'){v=(n-.5)*15;r=59+v;g=49+v;bl=39+v;}
  else if(kind==='gravel'){v=(n-.5)*48;r=161+v;g=160+v;bl=148+v;}
  else {v=(n-.5)*14;r=147+v;g=155+v;bl=125+v;}
  const i=(y*size+x)*4;im.data[i]=r;im.data[i+1]=g;im.data[i+2]=bl;im.data[i+3]=255;
 }ctx.putImageData(im,0,0);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;
}
const stoneTex=texture('stone'),woodTex=texture('wood'),teakTex=texture('teak'),fabricTex=texture('fabric'),leatherTex=texture('leather'),gravelTex=texture('gravel');
function material(name,args){const m=new THREE.MeshStandardMaterial(args);m.name=name;return m}
const mats={
 steel:material('White painted structural steel',{color:'#f2f1e9',metalness:.16,roughness:.32}),
 plaster:material('White plaster ceiling',{color:'#f4f1e8',roughness:.88}),
 stone:material('Travertine — procedural approximation',{map:stoneTex,bumpMap:stoneTex,bumpScale:.004,roughness:.63}),
 wood:material('Primavera veneer — procedural approximation',{map:woodTex,bumpMap:woodTex,bumpScale:.0015,roughness:.43}),
 teak:material('Teak wardrobe',{map:teakTex,roughness:.42}),
 fabric:material('Ivory woven shantung',{map:fabricTex,bumpMap:fabricTex,bumpScale:.003,roughness:.95,side:THREE.DoubleSide}),
 leather:material('Dark brown leather upholstery',{map:leatherTex,bumpMap:leatherTex,bumpScale:.001,roughness:.49}),
 chrome:material('Polished chromium',{color:'#c7ccce',metalness:1,roughness:.14}),
 steelBrushed:material('Brushed stainless steel',{color:'#bfc3c0',metalness:.86,roughness:.35}),
 dark:material('Shadow reveal',{color:'#282925',roughness:.7}),
 joint:material('Stone grout',{color:'#bfb6a1',roughness:.92}),
 gravel:material('Roof gravel',{map:gravelTex,roughness:.94}),
 ceramic:material('Ivory sanitary ceramic',{color:'#eeece3',roughness:.19}),
 water:material('Water',{color:'#778e8a',metalness:.5,roughness:.15}),
 rug:material('Natural wool rug',{map:fabricTex,color:'#968c76',roughness:1})
};
mats.glass=new THREE.MeshPhysicalMaterial({name:'6.35 mm clear plate glass',color:'#f4fff9',metalness:0,roughness:.045,transmission:.97,thickness:.00635,ior:1.52,transparent:true,opacity:.35,envMapIntensity:.8,depthWrite:false,side:THREE.FrontSide});
const tags={steel:['白色塗装の鉄骨','H形断面をウェブとフランジで構成。外形203mm、柱間隔6.706m。板厚と接合部は近似です。'],stone:['トラバーチン','石厚31.8mm。約838 × 610mmの目地割り、石ごとの色差、細孔と流れ模様を表現。テクスチャは手続き生成です。'],glass:['透明板ガラス','厚さ6.35mm。IOR 1.52のPBRガラス。反射と透過を併用し、室内の見やすさを調整しています。'],wood:['プリマヴェーラの突板','設備コアに木目の縦方向とパネル割りを表現。木目・色・艶は写真や記述を参考にした近似です。']};
const steel=mats.steel,stone=mats.stone;
function tagFromMat(m){return m===mats.stone?'stone':m===mats.wood||m===mats.teak?'wood':m===mats.glass?'glass':m===steel?'steel':null}
function box(parent,name,x,y,z,sx,sy,sz,mat=steel,rounded=0){const mesh=new THREE.Mesh(rounded?new RoundedBoxGeometry(sx,sy,sz,2,rounded):geomBox,mat);if(!rounded)mesh.scale.set(sx,sy,sz);mesh.position.set(x,y,z);mesh.name=name;mesh.castShadow=mat!==mats.glass;mesh.receiveShadow=true;mesh.userData.materialKey=tagFromMat(mat);parent.add(mesh);return mesh}
function cylinder(parent,name,x,y,z,rt,rb,h,mat,segments=20){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat);m.position.set(x,y,z);m.name=name;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function rod(parent,a,b,r,mat=mats.chrome,name='Round tube'){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dir=bv.clone().sub(av);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),8),mat);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());m.castShadow=true;m.name=name;parent.add(m);return m}
function beamH(parent,x,z,y0,y1,size=.203){const g=new THREE.Group();g.name='Wide flange column, 203 mm';g.userData.materialKey='steel';parent.add(g);const t=.014;box(g,'Column web',x,(y0+y1)/2,z,t,y1-y0,size-t*2);for(const zz of [-1,1])box(g,'Column flange',x,(y0+y1)/2,z+zz*(size-t)/2,size,y1-y0,t);box(g,'Concealed base plate',x,-.02,z,size+.12,.025,size+.12);return g}
function perimeter(parent,name,x,z,l,w,top){const g=new THREE.Group();g.name=name;parent.add(g);box(g,'Slab build-up',x,top-D.fascia/2,z,l-.09,D.fascia-.02,w-.09,mats.plaster);for(const zz of [-1,1]){box(g,'Channel vertical web',x,top-D.fascia/2,z+zz*(w-.014)/2,l,D.fascia,.014);for(const yy of [top-.013,top-D.fascia+.013])box(g,'Channel flange',x,yy,z+zz*(w-.10)/2,l,.025,.10)}for(const xx of [-1,1])box(g,'End fascia',x+xx*(l-.014)/2,top-D.fascia/2,z,.014,D.fascia,w);return g}
function paving(parent,x,z,l,w,top,name){
 box(parent,name+' mortar bed',x,top-D.stone-.006,z,l,.012,w,mats.joint);
 const nx=Math.round(l/.8382),nz=Math.round(w/.6096),dx=l/nx,dz=w/nz,n=nx*nz;const m=new THREE.InstancedMesh(geomBox,stone,n);m.name=name+' — individual travertine pavers';m.castShadow=true;m.receiveShadow=true;m.userData.materialKey='stone';const obj=new THREE.Object3D();
 for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){const i=ix*nz+iz;obj.position.set(x-l/2+(ix+.5)*dx,top-D.stone/2,z-w/2+(iz+.5)*dz);obj.scale.set(dx-.0016,D.stone,dz-.0016);obj.rotation.y=rand()>.5?Math.PI:0;obj.updateMatrix();m.setMatrixAt(i,obj.matrix);m.setColorAt(i,new THREE.Color().setScalar(.91+rand()*.12))}parent.add(m);return m;
}
// Main raised floor and the offset lower terrace. No interior structural columns.
perimeter(architecture,'Main floor channels',0,0,D.length,D.width,FLOOR-D.stone);
paving(architecture,0,0,D.length-.04,D.width-.04,FLOOR,'Main floor');
const terraceX=-10.066,terraceZ=W+.305+D.terraceWidth/2;
perimeter(architecture,'Lower terrace channels',terraceX,terraceZ,D.terraceLength,D.terraceWidth,D.terraceTop-D.stone);
paving(architecture,terraceX,terraceZ,D.terraceLength-.04,D.terraceWidth-.04,D.terraceTop,'Lower terrace');
const columnXs=[-10.059,-3.353,3.353,10.059];
for(const x of columnXs)for(const z of [-W-.1015,W+.1015])beamH(architecture,x,z,-.06,CEILING+D.fascia-.025);
for(const x of [-16.765,-10.059,-3.353])for(const z of [W+.407,D.terraceWidth+W+.203]){
 if(z<W+1&&x>-16)continue;beamH(architecture,x,z,-.05,D.terraceTop-.05);
}
// Secondary joists visible beneath each platform.
for(let x=-10.897;x<HALF;x+=1.6765){box(architecture,'Floor joist',x,FLOOR-.31,0,.09,.12,D.width-.10);}
function staircase(count,bottom,top,startZ,tread,centerX){
 const rise=(top-bottom)/(count+1),width=3.658;
 for(let i=0;i<count;i++){
  const z=startZ+(count-i-.5)*tread,y=bottom+rise*(i+1);
  box(architecture,'Open travertine stair tread',centerX,y-.038,z,width,.076,tread+.035,stone);
  for(const xx of [-width*.37,width*.37]){box(architecture,'Stair tread support',centerX+xx,y-.083,z,.055,.03,tread);if(i<count-1)box(architecture,'Recessed stair riser support',centerX+xx,y+rise/2-.07,z-tread/2,.055,rise,.055)}
 }
}
staircase(4,0,D.terraceTop,W+.305+D.terraceWidth,.356,-6.706);
staircase(5,D.terraceTop,FLOOR,W,.356,-6.706);
// Main roof assembly: matching white fascia, plaster soffit, gravel and flashings.
perimeter(roof,'Roof perimeter channels',0,0,D.length,D.width,CEILING+D.fascia);
box(roof,'Smooth plaster soffit',0,CEILING+.008,0,D.length-.045,.024,D.width-.045,mats.plaster);
gravelTex.repeat.set(14,5);
box(roof,'Gravel roof membrane',0,CEILING+D.fascia-.021,0,D.length-.16,.035,D.width-.16,mats.gravel);
for(const z of [-W+.035,W-.035])box(roof,'Roof edge flashing',0,CEILING+D.fascia+.004,z,D.length,.018,.07);
for(const x of [-HALF+.035,HALF-.035])box(roof,'Roof edge flashing',x,CEILING+D.fascia+.004,0,.07,.018,D.width);
box(roof,'Service rooftop enclosure — approximate',4.18,CEILING+D.fascia+.23,-.35,2.1,.47,1.26,mats.steelBrushed);
box(roof,'Service enclosure cap',4.18,CEILING+D.fascia+.48,-.35,2.16,.035,1.32,mats.steelBrushed);
for(let k=0;k<9;k++)box(roof,'Ventilation louvre',4.18,CEILING+D.fascia+.06+k*.04,.291,1.65,.012,.023,mats.dark);
cylinder(architecture,'Underslab utility service cylinder',4.2,.72,-.2,.356,.356,1.1,mats.steelBrushed,32);
// Glass framing uses the HABS pattern: four 11 ft central panes, half-width ends.
const glassXs=[ENTRY, -3.3905,-.0375,3.3155,6.6685,10.0215,HALF];
function mullion(x,z,h=D.clear,y=FLOOR){box(architecture,'Slender glazing mullion',x,y+h/2,z,.037,h,.045)}
function pane(x,z,sx,sz,h=D.clear-.07,y=FLOOR+.035,parent=glazing){return box(parent,'Clear plate glass',x,y+h/2,z,sx,h,sz,mats.glass)}
for(const z of [-W+.052,W-.052]){
 for(let i=0;i<glassXs.length-1;i++)pane((glassXs[i]+glassXs[i+1])/2,z,glassXs[i+1]-glassXs[i]-.035,.00635);
 for(const x of glassXs)mullion(x,z);
 for(const y of [FLOOR+.025,CEILING-.025])box(architecture,'Glass head/sill channel',(ENTRY+HALF)/2,y,z,HALF-ENTRY,.05,.052);
}
// West entrance: asymmetrical double doors and sidelights.
const doorMin=-.77,doorMax=1.47;
for(const [z0,z1] of [[-W,doorMin],[doorMax,W]])pane(ENTRY,(z0+z1)/2,.00635,z1-z0-.04);
for(const z of [-W,doorMin,(doorMin+doorMax)/2,doorMax,W])mullion(ENTRY,z);
for(const y of [FLOOR+.025,CEILING-.025])box(architecture,'West head/sill frame',ENTRY,y,0,.055,.05,D.width);
for(const [a,b] of [[doorMin,(doorMin+doorMax)/2],[(doorMin+doorMax)/2,doorMax]]){
 pane(ENTRY,(a+b)/2,.00635,b-a-.06);
 for(const z of [a+.025,b-.025])box(architecture,'Door stile',ENTRY-.012,FLOOR+D.clear/2,z,.064,D.clear-.04,.036);
 box(architecture,'Door bottom rail',ENTRY-.012,FLOOR+.055,(a+b)/2,.064,.08,b-a);
 const hz=a===doorMin?b-.10:a+.10;rod(architecture,[ENTRY-.10,FLOOR+.91,hz],[ENTRY-.10,FLOOR+1.17,hz],.009);
 for(const y of [FLOOR+.94,FLOOR+1.14])rod(architecture,[ENTRY-.012,y,hz],[ENTRY-.10,y,hz],.008);
}
// East elevation with the two low hopper windows beneath a shared central pane.
const eastZ=[-W,-1.448,1.448,W];
for(const z of eastZ)mullion(HALF-.052,z);
for(const [a,b] of [[-W,-1.448],[1.448,W]])pane(HALF-.052,(a+b)/2,.00635,b-a-.04);
pane(HALF-.052,0,.00635,2.856,D.clear-.80,FLOOR+.775);
box(architecture,'Hopper transom',HALF-.052,FLOOR+.762,0,.048,.035,2.896);
for(const z of [-.724,.724]){
 pane(HALF-.052,z,.00635,1.408,.697,FLOOR+.04);box(architecture,'Hopper pull',HALF-.092,FLOOR+.71,z,.035,.014,.12,mats.chrome);
}mullion(HALF-.052,0,.762);
for(const y of [FLOOR+.025,CEILING-.025])box(architecture,'East head/sill',HALF-.052,y,0,.048,.05,D.width);
// Primavera service core. Overall cabinet envelope is a drawing-based approximation.
const core=new THREE.Group();core.name='Primavera service core';architecture.add(core);
const cx=4.06,cl=7.468,x0=cx-cl/2,x1=cx+cl/2,cz=-.97,cd=3.658,z0=cz-cd/2,z1=cz+cd/2,ch=2.286;
function woodWall(x,z,sx,sz,h=ch){return box(core,'Primavera wall',x,FLOOR+h/2,z,sx,h,sz,mats.wood)}
// South wall split around a real fireplace opening instead of a painted rectangle.
const fireX=4.38,fireWidth=1.68,fireH=.83;
woodWall((x0+fireX-fireWidth/2)/2,z1,fireX-fireWidth/2-x0,.09);
woodWall((fireX+fireWidth/2+x1)/2,z1,x1-fireX-fireWidth/2,.09);
box(core,'Wood panel above fireplace',fireX,FLOOR+fireH+(ch-fireH)/2,z1,fireWidth,ch-fireH,.09,mats.wood);
box(core,'Recessed black fireplace',fireX,FLOOR+fireH/2,z1-.30,fireWidth,fireH,.065,mats.dark);
box(core,'Travertine fireplace hearth',fireX,FLOOR+.045,z1+.15,fireWidth+.25,.09,.86,stone);
for(const x of [fireX-fireWidth/2,fireX+fireWidth/2])box(core,'Fireplace jamb',x,FLOOR+fireH/2,z1-.11,.035,fireH,.42,mats.steelBrushed);
box(core,'Fireplace lintel',fireX,FLOOR+fireH,z1,fireWidth,.035,.15,mats.steelBrushed);
for(let i=0;i<5;i++)rod(core,[fireX-.65,FLOOR+.10,z1-.13+i*.065],[fireX+.65,FLOOR+.10,z1-.13+i*.065],.012,mats.dark,'Fire grate');
// End bathroom doors, with slight reveals and handles.
for(const x of [x0,x1]){
 const doorZ=-.48,doorW=.78;
 woodWall(x,(z0+doorZ-doorW/2)/2,.09,doorZ-doorW/2-z0);
 woodWall(x,(doorZ+doorW/2+z1)/2,.09,z1-doorZ-doorW/2);
 box(core,'Bathroom door with reveal',x,FLOOR+1.02,doorZ,.065,2.035,doorW-.009,mats.wood);
 box(core,'Bathroom door header',x,FLOOR+2.168,doorZ,.09,.235,doorW,mats.wood);
 rod(core,[x+(x===x0?-.055:.055),FLOOR+1.03,doorZ+.22],[x+(x===x0?-.055:.055),FLOOR+1.03,doorZ+.34],.008);
}
// Kitchen is on the north side, away from the river-facing living room.
woodWall(cx,z0+.66,cl,.09);
for(let i=0;i<10;i++){
 const x=x0+(i+.5)*cl/10;
 box(core,'Kitchen lower cabinet',x,FLOOR+.43,z0+.30,cl/10-.012,.81,.59,mats.wood);
 box(core,'Kitchen plinth',x,FLOOR+.065,z0+.32,cl/10-.008,.13,.50,mats.dark);
 box(core,'Cabinet pull',x,FLOOR+.74,z0-.009,.21,.015,.022,mats.chrome);
 box(core,'Upper cabinet',x,FLOOR+1.99,z0+.43,cl/10-.009,.59,.38,mats.wood);
}
box(core,'Stainless worktop',cx,FLOOR+.86,z0+.30,cl,.038,.69,mats.steelBrushed);
box(core,'Stainless backsplash',cx,FLOOR+1.15,z0+.628,cl,.58,.024,mats.steelBrushed);
const sinkX=2.89,sinkZ=z0+.28;
box(core,'Recessed sink shadow',sinkX,FLOOR+.883,sinkZ,.70,.013,.46,mats.dark,.025);
box(core,'Stainless sink basin',sinkX,FLOOR+.889,sinkZ,.63,.014,.39,mats.steelBrushed,.035);
cylinder(core,'Sink drain',sinkX,FLOOR+.899,sinkZ,.034,.034,.004,mats.dark);
const faucet=new THREE.CatmullRomCurve3([new THREE.Vector3(sinkX,FLOOR+.9,z0+.53),new THREE.Vector3(sinkX,FLOOR+1.21,z0+.51),new THREE.Vector3(sinkX,FLOOR+1.25,z0+.34),new THREE.Vector3(sinkX,FLOOR+1.15,z0+.29)]);
const tap=new THREE.Mesh(new THREE.TubeGeometry(faucet,24,.016,8,false),mats.chrome);core.add(tap);
for(const xx of [5.67,5.98])for(const zz of [z0+.16,z0+.43]){cylinder(core,'Electric hob ring',xx,FLOOR+.891,zz,.105,.105,.016,mats.dark,24);cylinder(core,'Hob centre',xx,FLOOR+.901,zz,.073,.073,.008,mats.steelBrushed,20)}
box(core,'Oven front',5.82,FLOOR+.43,z0-.008,.62,.57,.028,mats.steelBrushed);
box(core,'Oven glazing',5.82,FLOOR+.41,z0-.026,.49,.35,.008,mats.dark);
box(core,'Oven handle',5.82,FLOOR+.70,z0-.058,.42,.025,.023,mats.chrome);
// Veneer joints express cabinetry panelization without inventing structural seams.
for(let x=x0+.62;x<x1;x+=.622)for(const z of [z1+.047,z0+.616]){
 if(z>0&&Math.abs(x-fireX)<fireWidth/2)continue;
 box(core,'Veneer panel seam',x,FLOOR+ch/2,z,.0025,ch-.02,.002,mats.dark);
}
for(const x of [x0+2.44,x1-2.44])woodWall(x,(z0+.72+z1)/2,.075,z1-z0-.72);
box(core,'Mechanical shaft',fireX,FLOOR+1.43,cz+.3,1.28,2.86,.90,mats.wood);
// Bathroom fit-out is explicitly approximate, inspectable in roof-off / plan mode.
for(const x of [x0+1.05,x1-1.05]){
 box(core,'Bathroom travertine floor',x,FLOOR+.018,-.74,2.30,.036,2.68,stone);
 box(core,'Vanity base',x,FLOOR+.39,z0+1.06,.80,.75,.50,mats.wood);
 box(core,'Vanity slab',x,FLOOR+.79,z0+1.06,.88,.055,.56,stone);
 const basin=new THREE.Mesh(new THREE.TorusGeometry(.18,.042,12,32),mats.ceramic);basin.rotation.x=-Math.PI/2;basin.scale.y=.70;basin.position.set(x,FLOOR+.827,z0+1.04);core.add(basin);
 rod(core,[x,FLOOR+.82,z0+.9],[x,FLOOR+1.04,z0+.9],.012);
 box(core,'Mirror',x,FLOOR+1.42,z0+.719,.74,.77,.015,mats.chrome);
 cylinder(core,'Toilet pedestal',x+.46,FLOOR+.18,.26,.13,.18,.34,mats.ceramic);
 const seat=new THREE.Mesh(new THREE.TorusGeometry(.175,.046,12,30),mats.ceramic);seat.rotation.x=-Math.PI/2;seat.scale.y=1.25;seat.position.set(x+.46,FLOOR+.37,.24);core.add(seat);
 box(core,'Toilet cistern',x+.46,FLOOR+.61,.56,.36,.45,.18,mats.ceramic,.035);
}
// Independent teak wardrobe separates the sleeping zone.
box(furniture,'Freestanding teak wardrobe',9.30,FLOOR+.914,1.51,.66,1.828,3.658,mats.teak);
box(furniture,'Wardrobe plinth',9.30,FLOOR+.04,1.51,.58,.08,3.50,mats.dark);
for(let i=0;i<6;i++)box(furniture,'Wardrobe door reveal',9.636,FLOOR+.94,-.32+i*.61,.003,1.76,.004,mats.dark);
// Detailed interpretive Barcelona chairs: crossed flat-steel legs and tufted cushions.
function chair(x,z,angle=0){
 const g=new THREE.Group();g.name='Barcelona-type lounge chair — approximate';g.position.set(x,FLOOR,z);g.rotation.y=angle;furniture.add(g);
 for(const side of [-.32,.32]){
  const curves=[[[side,.05,.35],[side,.17,.20],[side,.40,-.17],[side,.74,-.34]],[[side,.05,-.34],[side,.14,-.22],[side,.37,.10],[side,.46,.34]]];
  for(const points of curves){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const pts=path.getPoints(24);for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],d=b.clone().sub(a),m=box(g,'Curved flat chrome frame',...a.clone().add(b).multiplyScalar(.5).toArray(),.028,d.length()+.002,.014,mats.chrome);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())}}
 }
 for(const z of [-.28,.24])rod(g,[-.34,.34,z],[.34,.34,z],.01,mats.chrome);
 box(g,'Seat cushion',0,.42,.015,.75,.135,.66,mats.leather,.038);
 const back=box(g,'Back cushion',0,.71,-.265,.75,.55,.12,mats.leather,.035);back.rotation.x=-.20;
 const buttonMat=mats.leather;
 for(let ix=0;ix<4;ix++)for(let iz=0;iz<4;iz++){
  const bx=-.27+ix*.18,bz=-.23+iz*.16;
  const b=new THREE.Mesh(new THREE.SphereGeometry(.012,6,4),buttonMat);b.scale.y=.25;b.position.set(bx,.489,bz);g.add(b);
  const bb=new THREE.Mesh(new THREE.SphereGeometry(.012,6,4),buttonMat);bb.scale.z=.25;bb.position.set(bx,.52+iz*.13,-.184-(iz*.13)*.20);g.add(bb);
 }
 for(let i=1;i<4;i++){box(g,'Cushion seam',-.375+i*.1875,.489,.015,.002,.002,.61,mats.dark);box(g,'Cushion seam',0,.489,-.315+i*.165,.7,.002,.002,mats.dark)}
 return g;
}
box(furniture,'Living room wool rug',4.65,FLOOR+.010,2.50,5.80,.016,2.67,mats.rug);
chair(2.50,2.30,-.17);chair(3.63,2.37,.08);
// Low glass table and ottoman.
box(furniture,'Coffee table glass',5.18,FLOOR+.43,2.51,1.10,.016,1.10,mats.glass);
for(const z of [2.12,2.90]){rod(furniture,[4.79,FLOOR+.02,z],[5.57,FLOOR+.41,z],.012);rod(furniture,[5.57,FLOOR+.02,z],[4.79,FLOOR+.41,z],.012)}
box(furniture,'Ottoman leather cushion',7.08,FLOOR+.38,2.80,.72,.12,.62,mats.leather,.04);
for(const z of [2.55,3.05]){rod(furniture,[6.78,FLOOR+.04,z],[7.38,FLOOR+.31,z],.012);rod(furniture,[7.38,FLOOR+.04,z],[6.78,FLOOR+.31,z],.012)}
// Daybed, dining table, cantilever dining chairs and desk.
box(furniture,'Daybed timber frame',10.28,FLOOR+.32,-1.18,1.18,.10,2.20,mats.teak);
box(furniture,'Daybed tufted mattress',10.28,FLOOR+.47,-1.18,1.12,.21,2.14,mats.leather,.04);
for(const x of [9.83,10.73])for(const z of [-2.03,-.33])rod(furniture,[x,FLOOR,z],[x,FLOOR+.28,z],.024,mats.chrome);
const pillow=cylinder(furniture,'Daybed bolster',10.28,FLOOR+.66,-1.94,.14,.14,1.06,mats.leather,24);pillow.rotation.z=Math.PI/2;
for(let i=0;i<6;i++)for(let j=0;j<3;j++){const b=new THREE.Mesh(new THREE.SphereGeometry(.014,6,4),mats.leather);b.scale.y=.3;b.position.set(9.9+j*.37,FLOOR+.579,-2.04+i*.34);furniture.add(b)}
cylinder(furniture,'Dining table top',-2.53,FLOOR+.735,-1.92,.69,.69,.036,mats.steelBrushed,64);
for(const s of [-1,1])rod(furniture,[-2.53+s*.46,FLOOR+.035,-2.28],[-2.53-s*.46,FLOOR+.70,-1.56],.015);
function diningChair(x,z,a){const g=new THREE.Group();g.position.set(x,FLOOR,z);g.rotation.y=a;g.name='Cantilever dining chair';furniture.add(g);for(const s of [-.23,.23]){rod(g,[s,.02,-.25],[s,.02,.25],.011);rod(g,[s,.02,.25],[s,.45,.25],.011);rod(g,[s,.45,.25],[s,.45,-.25],.011);rod(g,[s,.45,-.25],[s,.81,-.25],.011)}box(g,'Dining seat',0,.46,0,.48,.05,.48,mats.leather,.015);box(g,'Dining back',0,.68,-.25,.48,.30,.045,mats.leather,.012)}
for(const [x,z,a] of [[-2.53,-2.95,0],[-2.53,-.91,Math.PI],[-3.54,-1.92,Math.PI/2],[-1.51,-1.92,-Math.PI/2]])diningChair(x,z,a);
box(furniture,'Writing desk',-2.6,FLOOR+.72,3.22,1.52,.055,.63,mats.teak);
for(const x of [-3.25,-1.95])for(const z of [2.98,3.47])rod(furniture,[x,FLOOR+.02,z],[x,FLOOR+.695,z],.014);
diningChair(-2.6,2.43,Math.PI);
// A restrained set of small details provides scale without cluttering the open plan.
for(let i=0;i<3;i++)box(furniture,'Book',-2.2,FLOOR+.77+i*.023,3.19,.24,.021,.32,material('Book cloth '+i,{color:['#8a7660','#556354','#cabca0'][i],roughness:.9}));
cylinder(furniture,'Desk lamp base',-3.11,FLOOR+.766,3.29,.12,.12,.035,mats.chrome);
rod(furniture,[-3.11,FLOOR+.78,3.29],[-3.11,FLOOR+1.11,3.29],.012);
const lampShade=new THREE.Mesh(new THREE.SphereGeometry(.20,24,12,0,Math.PI*2,0,Math.PI/2),mats.steelBrushed);lampShade.position.set(-3.11,FLOOR+1.11,3.29);furniture.add(lampShade);
// Ceiling tracks and gathered curtain geometry, each pleat actually modeled.
for(const z of [-W+.21,W-.21])box(architecture,'Continuous curtain track',(ENTRY+HALF)/2,CEILING-.055,z,HALF-ENTRY-.18,.027,.027,mats.chrome);
box(architecture,'East curtain track',HALF-.22,CEILING-.055,0,.027,.027,D.width-.44,mats.chrome);
function curtainPanel(x,z,width,angle=0){const g=new THREE.PlaneGeometry(width,D.clear-.15,Math.ceil(width*45),1);const p=g.attributes.position;for(let i=0;i<p.count;i++){const xx=p.getX(i);p.setZ(i,Math.sin(xx*53)*.040+Math.sin(xx*106)*.009)}g.computeVertexNormals();const m=new THREE.Mesh(g,mats.fabric);m.name='Pleated shantung drapery';m.position.set(x,FLOOR+D.clear/2,z);m.rotation.y=angle;m.castShadow=true;m.receiveShadow=true;curtains.add(m);for(let i=0;i<Math.ceil(width/.12);i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.020,.003,4,8),mats.chrome);ring.position.set(x-width/2+i*.12,CEILING-.07,z);curtains.add(ring)}}
for(const z of [-W+.22,W-.22])for(const x of [ENTRY+.42,HALF-.52])curtainPanel(x,z,.66);
curtainPanel(HALF-.22,-2.9,1.34,Math.PI/2);
// Natural exterior and an inexpensive, physically based reflection environment.
const envScene=new THREE.Scene();envScene.background=new THREE.Color('#cbd7dd');
const envGround=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshBasicMaterial({color:'#717e57'}));envGround.rotation.x=-Math.PI/2;envGround.position.y=-8;envScene.add(envGround);
const envSun=new THREE.Mesh(new THREE.SphereGeometry(8,16,8),new THREE.MeshBasicMaterial({color:new THREE.Color(4.5,4.0,3.0)}));envSun.position.set(-30,45,20);envScene.add(envSun);
for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const m=new THREE.Mesh(new THREE.SphereGeometry(8,12,8),new THREE.MeshBasicMaterial({color:'#7b8b65'}));m.position.set(Math.cos(a)*40,1+rand()*5,Math.sin(a)*40);m.scale.y=1.6;envScene.add(m)}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.025,.1,150).texture;scene.environmentIntensity=.55;
const hemi=new THREE.HemisphereLight('#e9edf0','#c5bfb0',1.5);scene.add(hemi);
const ambient=new THREE.AmbientLight('#e9e5dc',.6);scene.add(ambient);
const sun=new THREE.DirectionalLight('#fff0d4',3.2);sun.position.set(-24,35,23);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-35,right:35,top:30,bottom:-30,near:1,far:110});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;sun.shadow.radius=3;sun.target.position.set(-3,0,1);scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight('#dbe4e6',.55);fill.position.set(15,12,-15);scene.add(fill);
const interiorLights=[];for(const [x,z] of [[-2,0],[4,2],[10,0]]){const l=new THREE.PointLight('#ffd59a',0,11,2);l.position.set(x,CEILING-.25,z);scene.add(l);interiorLights.push(l)}
const groundTex=texture('grass');groundTex.repeat.set(28,28);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(350,350),material('Meadow grass',{map:groundTex,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.09;ground.receiveShadow=true;scene.add(ground);
// Tree trunks branch organically; instanced foliage keeps the scene practical in a browser.
const bark=material('Grey brown bark',{color:'#625f4d',roughness:1}),leafMat=material('Muted woodland leaves',{color:'#88966e',roughness:1});
const leafPositions=[];
function tree(x,z,height,radius){
 const y0=-.1,leanX=(rand()-.5)*1.3,leanZ=(rand()-.5)*1.3;
 rod(landscape,[x,y0,z],[x+leanX,height*.66,z+leanZ],radius,bark,'Tree trunk');
 for(let k=0;k<6;k++){const a=rand()*Math.PI*2,reach=height*(.19+rand()*.16),by=height*(.52+rand()*.20),ex=x+Math.cos(a)*reach,ez=z+Math.sin(a)*reach,ey=height*(.78+rand()*.25);rod(landscape,[x+leanX*.7,by,z+leanZ*.7],[ex,ey,ez],radius*.34,bark,'Tree branch');
  for(let j=0;j<65;j++){const u=rand()*Math.PI*2,v=Math.acos(2*rand()-1),r=rand()*height*.20;leafPositions.push([ex+Math.sin(v)*Math.cos(u)*r,ey+Math.cos(v)*r*.60,ez+Math.sin(v)*Math.sin(u)*r,.40+rand()*.82])}
 }
}
const trees=[[-24,-12,16,.32],[-13,-18,17,.35],[-2,-24,18,.38],[10,-19,15,.30],[23,-12,17,.40],[30,2,15,.34]];
for(const t of trees)tree(...t);for(let i=0;i<26;i++){const a=Math.PI+rand()*Math.PI,r=35+rand()*30;tree(Math.cos(a)*r,Math.sin(a)*r,12+rand()*8,.24+rand()*.18)}
const leafCanvas=document.createElement('canvas');leafCanvas.width=leafCanvas.height=128;const lc=leafCanvas.getContext('2d');
for(let i=0;i<48;i++){const x=20+rand()*88,y=20+rand()*88;lc.save();lc.translate(x,y);lc.rotate(rand()*6.28);lc.fillStyle=['#c5d2ae','#99ad80','#b1c598','#7c936a'][i%4];lc.beginPath();lc.ellipse(0,0,3+rand()*4,6+rand()*7,0,0,Math.PI*2);lc.fill();lc.restore()}
const leafTexture=new THREE.CanvasTexture(leafCanvas);leafTexture.colorSpace=THREE.SRGBColorSpace;leafMat.map=leafTexture;leafMat.alphaTest=.5;leafMat.side=THREE.DoubleSide;
const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(2.8,2.8),leafMat,leafPositions.length);const dummy=new THREE.Object3D();leafPositions.forEach(([x,y,z,s],i)=>{dummy.position.set(x,y,z);dummy.scale.set(s*1.2,s,s);dummy.rotation.set(rand()*3,rand()*3,rand()*3);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.20+rand()*.055,.10+rand()*.08,.55+rand()*.18))});leaves.castShadow=true;leaves.receiveShadow=true;leaves.name='Instanced foliage';landscape.add(leaves);
// Fine foreground grass: individual blades batched into one geometry.
const gp=[],gc=[];for(let i=0;i<13000;i++){const x=(rand()-.5)*100,z=(rand()-.5)*86;if(x>-19&&x<12&&z>-4.6&&z<13.7)continue;const h=.045+rand()*.15,w=.018;gp.push(x-w,-.075,z,x+w,-.075,z,x+(rand()-.5)*.08,h-.075,z+.025);const c=new THREE.Color().setHSL(.20+rand()*.05,.22,.28+rand()*.16);for(let k=0;k<3;k++)gc.push(c.r,c.g,c.b)}
const grassG=new THREE.BufferGeometry();grassG.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));grassG.setAttribute('color',new THREE.Float32BufferAttribute(gc,3));grassG.computeVertexNormals();const grass=new THREE.Mesh(grassG,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:1}));landscape.add(grass);
// Architectural dimension overlay.
const dimMat=new THREE.LineBasicMaterial({color:'#526452',depthTest:false,transparent:true,opacity:.8});
function line(a,b){const m=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]),dimMat);m.renderOrder=10;annotations.add(m)}
function label(text,x,y,z,size=1){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='rgba(248,250,239,.94)';ctx.fillRect(0,0,512,96);ctx.fillStyle='#344b30';ctx.font=(text.length>18?'30':'52')+'px Arial';ctx.textAlign='center';ctx.fillText(text,256,65);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,toneMapped:false}));s.scale.set(5.8*size,1.0875*size,1);s.position.set(x,y,z);s.renderOrder=11;annotations.add(s)}
function dim(a,b,text){line(a,b);for(const p of [a,b])line([p[0]-.14,p[1]-.14,p[2]-.14],[p[0]+.14,p[1]+.14,p[2]+.14]);label(text,(a[0]+b[0])/2,(a[1]+b[1])/2+.25,(a[2]+b[2])/2,.66)}
dim([-HALF,1.7,-6],[HALF,1.7,-6],'23.546 m');dim([13,1.7,-W],[13,1.7,W],'8.738 m');dim([-10.059,.08,5],[-3.353,.08,5],'6.706 m');dim([13.2,FLOOR,4.8],[13.2,CEILING,4.8],'2.896 m');label('PRIMAVERA SERVICE CORE',4,4.2,-.7,.65);label('TRAVERTINE TERRACE',-12.5,1.15,8,.68);
// North arrow visible with dimensions.
line([-17,.13,-4],[-17,.13,-8]);line([-17,.13,-8],[-17.25,.13,-7.4]);line([-17,.13,-8],[-16.75,.13,-7.4]);label('N',-17,.25,-8.6,.18);

const views={exterior:{pos:[-31,11.5,32],target:[-2.9,2.4,2.1],title:'風景のなかに浮かぶ、三つの水平面。',desc:'白い鉄骨、透明なガラス、連続するトラバーチン。'},interior:{pos:[-3.5,3.19,2.95],target:[5.1,2.95,-.1],title:'壁を減らし、空間をつなぐ。',desc:'設備コアを中心に、住まいの機能がゆるやかにつながる。'},plan:{pos:[-1,46,2.34],target:[-1,0,2.31],title:'一室のなかに、暮らしのすべてを。',desc:'屋根を外して、テラスとコアの平面構成を読む。'},detail:{pos:[-14.6,3.5,8.1],target:[-10.059,2.6,4.30],title:'接合部に宿る、静かな精度。',desc:'H形柱、チャンネル、石の端部とガラスの取り合い。'}};
let currentView='exterior',transition=null;
function setView(name,instant=false){currentView=name;const v=views[name];const p=new THREE.Vector3(...v.pos),t=new THREE.Vector3(...v.target);if(innerWidth<800&&name==='exterior')p.multiplyScalar(1.28);
 if(instant){camera.position.copy(p);controls.target.copy(t)}else transition={from:camera.position.clone(),to:p,fromTarget:controls.target.clone(),toTarget:t,start:performance.now()};
 controls.autoRotate=false;$('#rotate').setAttribute('aria-pressed','false');controls.maxPolarAngle=name==='interior'?Math.PI*.94:Math.PI*.49;
 if(name==='plan'){$('#roof').checked=false;roof.visible=false;$('#curtains').checked=false;curtains.visible=false;$('#glass').checked=false;glazing.visible=false;}else if(name==='interior'){$('#roof').checked=true;roof.visible=true;$('#explode').value=0;roof.position.y=0;$('#explodeValue').textContent='0.0 m';}
 document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('#viewTitle').textContent=v.title;$('#viewDesc').textContent=v.desc;$('#viewNumber').textContent=`0${Object.keys(views).indexOf(name)+1} / 04`;controls.update();
}
setView('exterior',true);
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
const groups={roof,glass:glazing,furniture,curtains,dimensions:annotations,landscape};
for(const [id,g] of Object.entries(groups))$('#'+id).addEventListener('change',e=>{g.visible=e.target.checked});
$('#explode').addEventListener('input',e=>{const value=Number(e.target.value);roof.position.y=value;roof.visible=true;$('#roof').checked=true;$('#explodeValue').textContent=value.toFixed(1)+' m'});
$('#home').addEventListener('click',()=>{for(const id of ['roof','glass','furniture','curtains','landscape']){$('#'+id).checked=true;groups[id].visible=true}roof.position.y=0;$('#explode').value=0;$('#explodeValue').textContent='0.0 m';setView('exterior')});
$('#rotate').addEventListener('click',()=>{controls.autoRotate=!controls.autoRotate;$('#rotate').setAttribute('aria-pressed',String(controls.autoRotate))});
function inspect(key){const data=tags[key];if(!data)return;$('#materialInfo').replaceChildren();const title=document.createElement('b'),p=document.createElement('p');title.textContent=data[0];p.textContent=data[1];$('#materialInfo').append(title,p)}
document.querySelectorAll('[data-material]').forEach(b=>b.addEventListener('click',()=>inspect(b.dataset.material)));
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let pointerStart;
renderer.domElement.addEventListener('pointerdown',e=>pointerStart=[e.clientX,e.clientY]);
renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mouse,camera);const hits=ray.intersectObject(model,true);const hit=hits.find(h=>{let o=h.object;while(o){if(!o.visible)return false;o=o.parent}return true});if(hit)inspect(hit.object.userData.materialKey)});
function lighting(mode){const modes={day:{bg:'#e1e7dc',sun:'#fff0d4',power:3.2,hemi:1.5,pos:[-24,35,23],exposure:1.02,inside:0},gold:{bg:'#e7dac3',sun:'#ffbe75',power:3.8,hemi:.95,pos:[-35,12,23],exposure:1.02,inside:10},dusk:{bg:'#697b86',sun:'#b8cfe8',power:.38,hemi:.75,pos:[-25,19,12],exposure:1.10,inside:32}};const m=modes[mode];scene.background.set(m.bg);scene.fog.color.set(m.bg);sun.color.set(m.sun);sun.intensity=m.power;sun.position.set(...m.pos);hemi.intensity=m.hemi;renderer.toneMappingExposure=m.exposure;scene.environmentIntensity=mode==='dusk'?.25:.55;interiorLights.forEach(l=>l.intensity=m.inside);document.body.classList.toggle('dark',mode==='dusk');document.querySelectorAll('[data-light]').forEach(b=>b.classList.toggle('active',b.dataset.light===mode))}
document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>lighting(b.dataset.light)));
$('#panelToggle').addEventListener('click',()=>{const expanded=$('#panelToggle').getAttribute('aria-expanded')==='true';$('#panelToggle').setAttribute('aria-expanded',String(!expanded));$('#panelBody').hidden=expanded;$('#fold').textContent=expanded?'+':'−'});
if(innerWidth<800){$('#panelBody').hidden=true;$('#panelToggle').setAttribute('aria-expanded','false');$('#fold').textContent='+'}
$('#about').addEventListener('click',()=>$('#sources').showModal());$('#closeAbout').addEventListener('click',()=>$('#sources').close());
$('#sources').addEventListener('click',e=>{if(e.target===$('#sources')){const r=$('#sources').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#sources').close()}});
let toastTimer;function toast(text){$('#toast').textContent=text;$('#toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.opacity=0,3800)}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000)}
async function saveArtifact(blob,name,endpoint){try{const r=await fetch(endpoint,{method:'POST',body:blob});if(r.ok){toast(name+' をプロジェクトフォルダに保存しました');return}}catch{}download(blob,name);toast('ブラウザにダウンロードを渡しました')}
$('#shot').addEventListener('click',()=>{renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob)saveArtifact(blob,'farnsworth-house.png','/save-image')})});
$('#export').addEventListener('click',async()=>{
 const b=$('#export');b.disabled=true;b.textContent='書き出しています…';toast('建物と素材をGLBにまとめています…');
 try{
  // Export a clone in the assembled state, independent of the exploration UI.
  const out=model.clone(true);out.children.forEach(g=>{g.visible=true;if(g.name==='Roof assembly')g.position.y=0});out.userData={units:'metres',basis:'HABS IL-1105 and Columbia GSAPP',accuracy:'Interpretive model; furniture, internal details, landscape and materials are approximate'};
  // Bake the two paver instance arrays into ordinary nodes for DCC interoperability.
  const instances=[];out.traverse(o=>{if(o.isInstancedMesh)instances.push(o)});
  for(const inst of instances){const group=new THREE.Group();group.name=inst.name;group.position.copy(inst.position);group.quaternion.copy(inst.quaternion);group.scale.copy(inst.scale);const palette=new Map();
   for(let i=0;i<inst.count;i++){const col=new THREE.Color();inst.getColorAt(i,col);const shade=Math.min(1,Math.round(col.r*64)/64);let mat=palette.get(shade);if(!mat){mat=inst.material.clone();mat.color.multiplyScalar(shade);palette.set(shade,mat)}const m=new THREE.Mesh(inst.geometry,mat);m.name='Travertine paver '+i;inst.getMatrixAt(i,m.matrix);m.matrix.decompose(m.position,m.quaternion,m.scale);group.add(m)}inst.parent.add(group);inst.parent.remove(inst);
  }
  const glb=await new GLTFExporter().parseAsync(out,{binary:true,onlyVisible:true,maxTextureSize:512});await saveArtifact(new Blob([glb],{type:'model/gltf-binary'}),'farnsworth-house.glb','/save-glb');
 }catch(e){console.error(e);toast('書き出しに失敗しました。ブラウザのメモリを確認してください。')}finally{b.disabled=false;b.textContent='↓ GLBを書き出す'}
});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
controls.addEventListener('start',()=>transition=null);
let frames=0;
renderer.setAnimationLoop(()=>{if(transition){const t=Math.min(1,(performance.now()-transition.start)/1100),e=1-Math.pow(1-t,3);camera.position.lerpVectors(transition.from,transition.to,e);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,e);if(t===1)transition=null}controls.update();renderer.render(scene,camera);if(++frames===3){$('#loading').style.opacity=0;setTimeout(()=>$('#loading').remove(),700)}});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();toast('描画が中断されました。ページを再読み込みしてください。')});

