import {pointerPan,scenePoint,poseAtPoint} from './camera-math.js?v=19';

const mobile=window.afijLayout;
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const scene=document.querySelector('.archive-scene');
const drawers=document.getElementById('drawers');
const modal=document.getElementById('fileModal');
const camera=scene.querySelector('.archive-camera')||document.createElement('div');
if(!camera.parentElement){camera.className='archive-camera';camera.append(scene.querySelector('.archive-background'),drawers);scene.append(camera);}

const motion={x:0,y:0,z:1.9,tx:0,ty:0,tz:1.9,frame:0,last:0};
let touching=false;
let focusedDrawer=null,returnPose=null,transitioning=false;
const stopFrame=()=>{cancelAnimationFrame(motion.frame);motion.frame=0;motion.last=0;};
function isPaused(){
  const focused=document.activeElement;
  const keyboardFocus=!mobile.matches&&scene.contains(focused)&&focused.matches('button:focus-visible,a:focus-visible');
  return document.hidden||touching||modal.classList.contains('show')||Boolean(drawers.querySelector('.drawer.expanded'))||keyboardFocus;
}
function paint(){
  if(mobile.matches)return;
  camera.style.setProperty('--camera-x',`${motion.x.toFixed(2)}px`);
  camera.style.setProperty('--camera-y',`${motion.y.toFixed(2)}px`);
  camera.style.setProperty('--camera-zoom',motion.z.toFixed(5));
}
function settled(){
  motion.x=motion.tx;motion.y=motion.ty;motion.z=motion.tz;motion.last=0;
  transitioning=false;camera.classList.remove('camera-transition');
  camera.dataset.view=focusedDrawer?'drawer':'browse';paint();
}
function animate(time){
  motion.frame=0;
  if(mobile.matches)return;
  if(document.hidden||touching||modal.classList.contains('show')){motion.last=0;return;}
  if(isPaused()&&!transitioning){motion.tx=motion.x;motion.ty=motion.y;motion.last=0;return;}
  const dt=motion.last?Math.min(40,time-motion.last):16;
  motion.last=time;
  const amount=1-Math.exp(-dt/(transitioning?85:100));
  motion.x+=(motion.tx-motion.x)*amount;
  motion.y+=(motion.ty-motion.y)*amount;
  motion.z+=(motion.tz-motion.z)*amount;
  if(Math.abs(motion.x-motion.tx)<.12&&Math.abs(motion.y-motion.ty)<.12&&Math.abs(motion.z-motion.tz)<.0005){settled();return;}
  paint();motion.frame=requestAnimationFrame(animate);
}
function target(point,transition=false){
  motion.tx=point.x;motion.ty=point.y;motion.tz=point.z??motion.z;
  if(transition){transitioning=true;camera.classList.add('camera-transition');}
  if(reduced.matches&&transition){stopFrame();settled();return;}
  if(!motion.frame)motion.frame=requestAnimationFrame(animate);
}
function focusPose(drawer){
  const bounds=scene.getBoundingClientRect();
  const rect=drawer.getBoundingClientRect();
  const point=scenePoint(rect.left-bounds.left+rect.width*.5,rect.top-bounds.top+rect.height*.55,bounds.width,bounds.height,motion);
  return poseAtPoint(point,bounds.width,bounds.height,2.65);
}
function syncDrawerFocus(){
  const expanded=mobile.matches?null:drawers.querySelector('.drawer.expanded');
  if(expanded===focusedDrawer)return;
  if(expanded){
    if(!focusedDrawer&&!returnPose)returnPose={x:motion.x,y:motion.y,z:motion.z};
    focusedDrawer=expanded;camera.dataset.view='zooming-in';target(focusPose(expanded),true);
  }else{
    focusedDrawer=null;
    if(returnPose){const saved=returnPose;returnPose=null;camera.dataset.view='returning';target(saved,true);}
  }
}
function pauseChanged(){
  if(mobile.matches)return;
  syncDrawerFocus();
  const paused=isPaused();
  camera.dataset.paused=String(paused);
  if(paused&&!transitioning){stopFrame();motion.tx=motion.x;motion.ty=motion.y;}
  if(transitioning&&!document.hidden&&!touching&&!modal.classList.contains('show')&&!motion.frame)motion.frame=requestAnimationFrame(animate);
}
scene.addEventListener('pointermove',event=>{
  if(mobile.matches||event.pointerType==='touch'||reduced.matches||transitioning)return;
  pauseChanged();if(isPaused())return;
  const rect=scene.getBoundingClientRect();
  target(pointerPan(event.clientX-rect.left,event.clientY-rect.top,rect.width,rect.height,rect.width*.19,rect.height*.28));
},{passive:true});
scene.addEventListener('pointerleave',()=>{
  pauseChanged();if(!mobile.matches&&!isPaused()&&!transitioning)target({x:0,y:0});
},{passive:true});
scene.addEventListener('pointerdown',event=>{
  if(mobile.matches)return;
  touching=false;
  if(!transitioning){stopFrame();motion.tx=motion.x;motion.ty=motion.y;}
  pauseChanged();
},{passive:true});
const release=()=>{touching=false;pauseChanged();};
addEventListener('pointerup',release,{passive:true});addEventListener('pointercancel',release,{passive:true});
scene.addEventListener('focusin',pauseChanged);scene.addEventListener('focusout',()=>queueMicrotask(pauseChanged));
new MutationObserver(pauseChanged).observe(drawers,{subtree:true,attributes:true,attributeFilter:['class']});
new MutationObserver(pauseChanged).observe(modal,{attributes:true,attributeFilter:['class']});

function resetView(){
  touching=false;stopFrame();focusedDrawer=null;returnPose=null;transitioning=false;
  if(mobile.matches)return;
  camera.classList.remove('camera-transition');camera.dataset.view='browse';
  motion.x=0;motion.y=0;motion.tx=0;motion.ty=0;motion.z=1.9;motion.tz=1.9;paint();pauseChanged();
}
mobile.addEventListener('change',resetView);reduced.addEventListener('change',resetView);addEventListener('resize',resetView,{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopFrame();else pauseChanged();});
addEventListener('pagehide',stopFrame);addEventListener('pageshow',event=>{if(event.persisted)resetView();});
resetView();
