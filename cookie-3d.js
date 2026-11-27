/* Cookie: articulated 3D mesh renderer, no external dependencies. */
(()=>{"use strict";
const pi=Math.PI,clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t,ease=x=>{x=clamp(x);return x*x*(3-2*x)},v=(x=0,y=0,z=0)=>[x,y,z],add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>mul(a,1/(Math.hypot(...a)||1)),rot=(p,a)=>[Math.cos(a)*p[0]+Math.sin(a)*p[2],p[1],-Math.sin(a)*p[0]+Math.cos(a)*p[2]];
function mesh(n=16,m=10){let p=[],f=[];for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){let b=pi*j/m,a=2*pi*i/n;p.push([Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)])}for(let j=0;j<m;j++)for(let i=0;i<n;i++){let a=j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;f.push([a,b,c],[b,d,c])}return{p,f}}
const sphere=mesh(16,10),small=mesh(10,7);
const colors={fur:[.79,.52,.31],ear:[.48,.23,.16],cream:[1,.85,.65],dark:[.055,.033,.075],nose:[.10,.055,.09],pink:[.87,.24,.45],collar:[.39,.13,.74],gold:[.95,.65,.22],metal:[.49,.43,.67],rubber:[.13,.10,.20],white:[1,.96,.92]};
function render(ctx,a,opt={}){
const {w,h,s,dogX,dogY,t}=a,assistant=!!opt.assistant,phase=a.phase||"idle",talking=!!opt.talking;
const polys=[],cam=9;let origin=[dogX,dogY,0],yaw=assistant?Math.sin(t*.65)*.16:(a.yaw||0);
function project(p){const q=cam/(cam-p[2]/s);return [w/2+(p[0]-w/2)*q,h/2+(p[1]-h/2)*q,p[2]]}
function part(center,scale,color,angle=0,axis=null,world=false,detail=true){const obj=detail?sphere:small,basis=axis?(()=>{let y=norm(axis),x=norm(cross(Math.abs(y[2])>.9?[1,0,0]:[0,0,1],y)),z=norm(cross(x,y));return[x,y,z]})():null;
const transform=(p,normal=false)=>{let q=p.map((x,i)=>x*(normal?1/scale[i]:scale[i]));if(basis)q=add(add(mul(basis[0],q[0]),mul(basis[1],q[1])),mul(basis[2],q[2]));else if(angle)q=[q[0]*Math.cos(angle)-q[1]*Math.sin(angle),q[0]*Math.sin(angle)+q[1]*Math.cos(angle),q[2]];if(!normal)q=add(q,center);if(!world)q=rot(q,yaw);return normal?norm(q):world?q:add(origin,mul(q,s))};
const pp=obj.p.map(p=>project(transform(p))),nn=obj.p.map(p=>transform(p,true));
for(const f of obj.f){const A=pp[f[0]],B=pp[f[1]],C=pp[f[2]];if((B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0])<=.03)continue;let n=norm(add(add(nn[f[0]],nn[f[1]]),nn[f[2]]));if(n[2]<-.15)continue;const light=Math.max(0,dot(n,[-.45,-.65,.61])),rim=Math.pow(1-Math.max(0,n[2]),2),spec=Math.pow(Math.max(0,dot(n,[-.25,-.37,.895])),22);const rgb=color.map((c,i)=>Math.round(255*Math.min(1,Math.pow(c*(.32+.72*light)+rim*[.23,.10,.35][i]+spec*.38,.83))));polys.push({A,B,C,z:(A[2]+B[2]+C[2])/3,c:"rgb("+rgb.join(",")+")"})}}
function ball(p,sc,c,ang=0,d=true){part(p,sc,colors[c]||c,ang,null,false,d)}
function limb(a,b,c,r=.09,world=false){let d=sub(b,a),l=Math.hypot(...d);if(l<.001)return;part(mul(add(a,b),.5),[r,l*.58,r],colors[c]||c,0,d,world,false)}
const local=p=>mul(rot(mul(sub(p,origin),1/s),-yaw),1);const world=p=>add(origin,mul(rot(p,yaw),s));
if(!assistant){const shadow=ctx.createRadialGradient(dogX,a.floor,0,dogX,a.floor,s*.72);shadow.addColorStop(0,"#08041088");shadow.addColorStop(1,"#08041000");ctx.save();ctx.translate(dogX,a.floor);ctx.scale(1,.17);ctx.translate(-dogX,-a.floor);ctx.fillStyle=shadow;ctx.fillRect(dogX-s,a.floor-s,s*2,s*2);ctx.restore();
if(a.ladderVisible){const L=a.ladder, rail=a.rail, H=a.floor-a.top;const lp=(x,y,z)=>[L.x+x*Math.cos(L.angle)-y*Math.sin(L.angle),L.y+x*Math.sin(L.angle)+y*Math.cos(L.angle),z];for(const x of [-rail,rail]){limb(lp(x,-H,0),lp(x,0,0),"metal",s*.044,true);part(lp(x,-s*.025,0),[s*.061,s*.047,s*.055],colors.rubber,0,null,true,false)}for(let j=0;j<a.n;j++){const yy=-a.gap*(j+.75);limb(lp(-rail,yy,0),lp(rail,yy,0),"gold",s*.027,true)}}
if(a.ropeY>2){let last=[a.x,a.pull,0];for(let j=1;j<=12;j++){const u=j/12,p=[mix(a.x,a.ropeX,u)+Math.sin(pi*u)*s*.035,a.pull+(a.ropeY-a.pull-s*.09)*u,0];limb(last,p,"gold",s*.022,true);last=p}for(let j=0;j<16;j++){let b=j*pi/8,c=(j+1)*pi/8;limb([a.ropeX+Math.cos(b)*s*.10,a.ropeY+Math.sin(b)*s*.10,0],[a.ropeX+Math.cos(c)*s*.10,a.ropeY+Math.sin(c)*s*.10,0],"gold",s*.022,true)}}}
const gait=Math.sin((a.walk||0)*2*pi),moving=phase==="walk"||phase==="carry",breathe=assistant?Math.sin(t*2)*.012:0;
let feet=[[-.18,.32,.07],[.18,.32,.07]],hands=[[-.37,-.08,.11],[.37,-.08,.11]];
if(moving){feet[0]=[-.18,.32-Math.max(0,gait)*.12,gait*.15];feet[1]=[.18,.32-Math.max(0,-gait)*.12,-gait*.15];hands[0][2]=-.12*gait;hands[1][2]=.12*gait}
if(a.handTargets)for(let i=0;i<2;i++)if(a.handTargets[i])hands[i]=local(a.handTargets[i]);
if(a.footTargets)for(let i=0;i<2;i++)if(a.footTargets[i])feet[i]=local(a.footTargets[i]);
const tailW=Math.sin(t*5)*.19;
limb([.12,.07,-.23],[.28+tailW,.02,-.43],"fur",.085);ball([.29+tailW,-.07,-.45],[.087,.16,.09],"fur",-.25,false);
ball([0,-.02,0],[.31,.35+breathe,.25],"fur");ball([0,.015,.19],[.205,.23,.10],"cream");
for(let i=0;i<2;i++){let sign=i?1:-1;const hip=[sign*.15,.17,0],shoulder=[sign*.24,-.18,.015];const knee=mixPoint(hip,feet[i],.52,[0,.005,.035]);const elbow=mixPoint(shoulder,hands[i],.53,[sign*.035,.035,.035]);limb(hip,knee,"fur",.105);limb(knee,feet[i],"fur",.085);ball(feet[i],[.112,.075,.14],"cream",0,false);limb(shoulder,elbow,"fur",.09);limb(elbow,hands[i],"fur",.075);ball(hands[i],[.091,.091,.09],"cream",0,false)}
let headY=-.49+breathe,tilt=Math.sin(t*2.1)*.025+(moving?gait*.035:0);
ball([0,headY,0],[.39,.355,.30],"fur",tilt);for(const sign of [-1,1]){let earAng=sign*(.22+Math.sin(t*2.7)*.045);ball([sign*.345,headY+.035,-.025],[.145,.29,.13],"ear",earAng);ball([sign*.36,headY+.08,.065],[.075,.19,.04],[.67,.35,.30],earAng,false)}
ball([0,headY+.12,.245],[.245,.17,.13],"cream");
let blink=assistant||phase==="idle"?Math.max(.09,Math.min(1,Math.abs((t%4.8)-4.55)*9)):1;
for(const sign of [-1,1]){ball([sign*.137,headY-.055,.265],[.077,.090*blink,.044],"dark",0,false);if(blink>.3){ball([sign*.137-.022,headY-.081,.302],[.021,.023,.013],"white",0,false);ball([sign*.137+.024,headY-.023,.299],[.011,.012,.008],[.65,.43,1],0,false)}}
ball([0,headY+.075,.368],[.084,.056,.042],"nose",0,false);ball([-.025,headY+.058,.403],[.025,.010,.007],[.68,.56,.72],0,false);
ball([0,headY+.198,.338],[.068,talking?.023+.027*Math.abs(Math.sin(t*15)):.023,.018],"dark",0,false);if(talking)ball([0,headY+.208,.354],[.043,.014,.012],"pink",0,false);
ball([0,-.285,0],[.25,.052,.22],"collar");ball([0,-.25,.231],[.055,.065,.024],"gold",0,false);
polys.sort((a,b)=>a.z-b.z);for(const p of polys){ctx.beginPath();ctx.moveTo(p.A[0],p.A[1]);ctx.lineTo(p.B[0],p.B[1]);ctx.lineTo(p.C[0],p.C[1]);ctx.closePath();ctx.fillStyle=ctx.strokeStyle=p.c;ctx.lineWidth=.48;ctx.fill();ctx.stroke()}
}
function mixPoint(a,b,t,d=[0,0,0]){return a.map((x,i)=>mix(x,b[i],t)+d[i])}
const duration=16.8;
function pose(w,h,t){t=Math.max(0,Math.min(duration,t));const s=Math.min(152,Math.max(45,Math.min(w*.23,h*.18))),floor=h-Math.max(25,s*.26),x=w*.58,top=Math.max(38,h*.17),rail=s*.28,n=Math.max(5,Math.min(10,Math.round((floor-top)/(s*.41)))),H=floor-top,gap=H/(n+.4),ringY=top+s*.12;
let dogX=w-s*.85,dogY=floor-s*.39,phase="idle",yaw=-.25,walk=0,ladderVisible=false,ladder={x:w+s,y:floor,angle:pi*.44},ropeY=ringY*ease(t/.9),ropeX=x,pull=0,handTargets=null,footTargets=null;
const carryStart=2.8,carryEnd=6.5,placeEnd=8.25,approachEnd=9.15,climbEnd=13.05,hangEnd=14.05;
if(t>=1&&t<carryStart){let u=ease((t-1)/1.8);phase="walk";dogX=mix(w-s*.85,w+s*1.75,u);yaw=mix(-.25,pi*.5,ease((t-1)/.35));walk=(t-1)*1.65}
if(t>=carryStart&&t<carryEnd){let u=ease((t-carryStart)/(carryEnd-carryStart));phase="carry";dogX=mix(w+H*.63+s*1.75,x+s*.53,u);yaw=-pi*.40;walk=(t-carryStart)*1.25;ladderVisible=true;ladder.angle=pi*.44+Math.sin(walk*2*pi)*.012;ladder.x=dogX-H*.48;ladder.y=dogY+Math.cos(ladder.angle)*H*.48; /* midpoint of rail under arm */ ladder.x=dogX-Math.sin(ladder.angle)*H*.48;handTargets=[[dogX-s*.13,dogY-s*.06,s*.12],null]}
if(t>=carryEnd&&t<placeEnd){let u=ease((t-carryEnd)/(placeEnd-carryEnd));phase="place";dogX=x+s*.53;dogY=floor-s*.39;ladderVisible=true;yaw=mix(-pi*.40,-.40,u);let a=mix(pi*.44,0,u),mid=[mix(dogX,x,u),mix(dogY+s*.02,floor-H*.48,u)];ladder={angle:a,x:mid[0]-Math.sin(a)*H*.48,y:mid[1]+Math.cos(a)*H*.48};handTargets=[[mix(dogX-s*.13,ladder.x+rail,dot([u],[1])),mix(dogY-s*.06,floor-s*.65,u),s*.09],null]}
if(t>=placeEnd){ladderVisible=true;ladder={x,y:floor,angle:0}}
if(t>=placeEnd&&t<approachEnd){let u=ease((t-placeEnd)/(approachEnd-placeEnd));phase="walk";dogX=mix(x+s*.53,x,u);yaw=mix(-.4,pi,u);walk=(t-placeEnd)*1.5}
if(t>=approachEnd&&t<climbEnd){phase="climb";yaw=pi;dogX=x;let p=clamp((t-approachEnd)/(climbEnd-approachEnd))*n,k=Math.floor(p),f=p-k,step=k+ease(f);dogY=mix(floor-s*.39,ringY+s*.86,step/n);const snap=(yy)=>floor-gap*(Math.max(0,Math.min(n-1,Math.round((floor-yy)/gap-.75)))+.75);handTargets=[0,1].map(i=>[x+(i? -1:1)*rail,snap(dogY-s*.54)-Math.sin(pi*f)*gap*.5*((k+i)%2),-s*.03]);footTargets=[0,1].map(i=>[x+(i?-1:1)*rail*.58,snap(dogY+s*.28)-Math.sin(pi*f)*gap*.45*((k+i+1)%2),-s*.03])}
if(t>=climbEnd){let u=ease((t-climbEnd)/(hangEnd-climbEnd));phase="hang";yaw=mix(pi,0,u);dogX=x;dogY=ringY+s*.86+s*.05*u;handTargets=[0,1].map(i=>[mix(x+(i?-1:1)*rail,x+(i?1:-1)*s*.065,u),mix(top+gap*.3,ringY,u),0]);if(t>=hangEnd){let p=ease((t-hangEnd)/(duration-hangEnd));pull=h*p;ropeY=ringY+pull;ropeX=x+Math.sin(p*2*pi)*s*.07*(1-p);dogX=ropeX;dogY=ropeY+s*.91;handTargets=[[ropeX-s*.065,ropeY,0],[ropeX+s*.065,ropeY,0]];yaw=Math.sin(p*2*pi)*.12}}
return {w,h,t,s,floor,x,top,rail,n,gap,ringY,ropeY,ropeX,pull,dogX,dogY,phase,walk,ladderVisible,ladder,yaw,handTargets,footTargets}}
window.Cookie3D={render,pose,duration};
})();