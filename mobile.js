(() => {
  const mobile=matchMedia('(max-width:760px),(max-width:980px) and (pointer:coarse),(max-width:980px) and (max-height:540px)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const root=document.documentElement,game=document.getElementById('game');
  const scene=document.querySelector('.archive-scene'),drawers=document.getElementById('drawers');
  const modal=document.getElementById('fileModal'),body=document.getElementById('fileBody');
  const canvas=document.createElement('div');canvas.id='archiveCanvas';document.body.insertBefore(canvas,game);canvas.append(game);
  // The desktop and mobile controllers share artwork, with separate camera poses.
  const camera=document.createElement('div');camera.className='archive-camera';camera.append(scene.querySelector('.archive-background'),drawers);scene.append(camera);
  const zoom=document.createElement('button');zoom.type='button';zoom.className='mobile-profile-zoom';
  function resetProfile(){zoom.textContent='Enlarge';zoom.setAttribute('aria-label','Enlarge profile inside the viewer');zoom.setAttribute('aria-pressed','false');}
  resetProfile();modal.querySelector('.file-footer').prepend(zoom);
  zoom.addEventListener('click',()=>{
    const enlarged=modal.classList.toggle('profile-zoomed');zoom.textContent=enlarged?'Fit':'Enlarge';
    zoom.setAttribute('aria-label',enlarged?'Fit profile inside the viewer':'Enlarge profile inside the viewer');zoom.setAttribute('aria-pressed',String(enlarged));body.scrollTop=0;body.scrollLeft=0;
  });
  const controls=document.createElement('div');controls.className='tilt-controls';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='tilt-toggle';
  const center=document.createElement('button');center.type='button';center.className='tilt-center';center.textContent='Center';
  const status=document.createElement('div');status.className='tilt-status';status.setAttribute('role','status');status.hidden=true;
  controls.append(toggle,center,status);document.body.append(controls);
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const fileTap=46;
  const motion={x:0,y:0,z:1,tx:0,ty:0,tz:1,frame:0,last:0};
  let width=0,height=0,artWidth=0,artHeight=0,base={x:0,y:0,z:1},focusZoom=1;
  let focused=null,saved=null,transitioning=false,pending=0,gesture=null,blockClickUntil=0;
  let enabled=false,awaitingPermission=false,userDisabled=false,autoAttempted=false,requesting=false,sensorTimer=0;
  let baseline=null,tiltAnchor=null,wasPaused=false;
  const announce=message=>{status.textContent=message;status.hidden=!message;};
  const pose=()=>({x:motion.x,y:motion.y,z:motion.z});
  const blocked=()=>document.hidden||modal.classList.contains('show');
  const paused=()=>blocked()||Boolean(focused)||transitioning||Boolean(gesture);
  function stop(){cancelAnimationFrame(motion.frame);motion.frame=0;motion.last=0;}
  function paint(){
    if(!mobile.matches)return;
    camera.style.setProperty('--camera-x',motion.x.toFixed(2)+'px');camera.style.setProperty('--camera-y',motion.y.toFixed(2)+'px');camera.style.setProperty('--camera-zoom',motion.z.toFixed(5));
  }
  function finish(){
    motion.x=motion.tx;motion.y=motion.ty;motion.z=motion.tz;motion.last=0;transitioning=false;camera.classList.remove('camera-transition');camera.dataset.view=focused?'drawer':'browse';paint();
  }
  function animate(time){
    motion.frame=0;if(!mobile.matches||blocked()){motion.last=0;return;}
    const dt=motion.last?Math.min(40,time-motion.last):16;motion.last=time;
    const amount=1-Math.exp(-dt/(transitioning?100:90));
    motion.x+=(motion.tx-motion.x)*amount;motion.y+=(motion.ty-motion.y)*amount;motion.z+=(motion.tz-motion.z)*amount;
    if(Math.abs(motion.x-motion.tx)<.1&&Math.abs(motion.y-motion.ty)<.1&&Math.abs(motion.z-motion.tz)<.0005){finish();return;}
    paint();motion.frame=requestAnimationFrame(animate);
  }
  function target(p,transition=false){
    motion.tx=p.x;motion.ty=p.y;motion.tz=p.z??motion.z;
    if(transition){transitioning=true;camera.classList.add('camera-transition');}
    if(reduced.matches){stop();finish();return;}
    if(!motion.frame&&!blocked())motion.frame=requestAnimationFrame(animate);
  }
  function panLimits(){return{x:Math.max(0,(artWidth*base.z-width)/2),y:Math.max(0,(artHeight*base.z-height)/2)};}
  function bound(p){const limits=panLimits();return{x:clamp(p.x,-limits.x,limits.x),y:clamp(p.y,-limits.y,limits.y),z:base.z};}
  function focusPose(group){
    const bounds=scene.getBoundingClientRect(),r=group.getBoundingClientRect(),step=fileTap/focusZoom;
    const screenX=r.left-bounds.left+r.width*.5;
    const screenY=r.top-bounds.top+(group.offsetHeight*.0909+(step*3+group.offsetHeight*.6257)/2)*motion.z;
    const x=width/2+(screenX-width/2-motion.x)/motion.z,y=height/2+(screenY-height/2-motion.y)/motion.z;
    return{x:(width/2-x)*focusZoom,y:height*.46-height/2+(height/2-y)*focusZoom,z:focusZoom};
  }
  function sync(){
    const groups=[...drawers.querySelectorAll('.drawer')],expanded=mobile.matches?groups.find(g=>g.classList.contains('expanded')):null;
    root.classList.toggle('mobile-drawer-open',Boolean(expanded));groups.forEach(g=>{g.inert=Boolean(expanded&&g!==expanded);});
    if(!mobile.matches)return;
    if(expanded!==focused&&width){
      gesture=null;
      if(expanded){if(!focused&&!saved)saved=pose();focused=expanded;camera.dataset.view='zooming-in';target(focusPose(expanded),true);}
      else{focused=null;if(saved){const previous=saved;saved=null;camera.dataset.view='returning';target(previous,true);}}
    }
    controls.inert=modal.classList.contains('show');camera.dataset.paused=String(paused());
    const isPaused=paused();if(isPaused!==wasPaused){baseline=null;tiltAnchor=pose();wasPaused=isPaused;}
    if(blocked())stop();else if(transitioning&&!motion.frame)motion.frame=requestAnimationFrame(animate);
    if(!modal.classList.contains('show')||!modal.classList.contains('profile-view')){if(modal.classList.contains('profile-zoomed'))modal.classList.remove('profile-zoomed');resetProfile();}
  }
  function layout(){
    pending=0;
    if(document.readyState==='loading')return;
    if(!mobile.matches){stop();detach();enabled=false;awaitingPermission=false;showTilt();autoAttempted=false;focused=null;saved=null;gesture=null;sync();return;}
    const r=scene.getBoundingClientRect();if(!r.width||!r.height)return;
    width=r.width;height=r.height;artWidth=Math.max(width,height*1419/750);artHeight=artWidth*750/1419;
    scene.style.setProperty('--mobile-art-width',artWidth+'px');scene.style.setProperty('--mobile-art-height',artHeight+'px');
    const group=drawers.querySelector('.drawer');
    focusZoom=Math.min(width*.94/(group.offsetWidth*.7965),Math.max(88,height-112-fileTap*3)/(group.offsetHeight*.6257));
    const browseZoom=Math.min(1.9,Math.max(1.08,width*1.5/(artWidth*.46934)),focusZoom/1.3);
    base={x:-artWidth*.00467*browseZoom,y:artHeight*.022*browseZoom,z:browseZoom};base=bound(base);
    scene.style.setProperty('--mobile-file-step',fileTap/focusZoom+'px');scene.style.setProperty('--mobile-file-label-size',16/focusZoom+'px');scene.style.setProperty('--mobile-file-label-line',24/focusZoom+'px');scene.style.setProperty('--mobile-file-label-pad',10/focusZoom+'px');
    stop();focused=null;saved=null;gesture=null;transitioning=false;camera.classList.remove('camera-transition');
    Object.assign(motion,{x:base.x,y:base.y,z:base.z,tx:base.x,ty:base.y,tz:base.z});camera.dataset.view='browse';baseline=null;tiltAnchor=pose();paint();sync();autoTilt();
  }
  const schedule=()=>{if(!pending)pending=requestAnimationFrame(layout);};
  new ResizeObserver(schedule).observe(scene);
  document.addEventListener('DOMContentLoaded',schedule,{once:true});
  new MutationObserver(sync).observe(drawers,{subtree:true,attributes:true,attributeFilter:['class']});new MutationObserver(sync).observe(modal,{attributes:true,attributeFilter:['class']});
  scene.addEventListener('pointerdown',event=>{
    if(!mobile.matches||blocked()||focused||transitioning||gesture||event.isPrimary===false)return;
    stop();motion.tx=motion.x;motion.ty=motion.y;gesture={id:event.pointerId,x:event.clientX,y:event.clientY,origin:pose(),moved:false};baseline=null;
  },{passive:true});
  scene.addEventListener('pointermove',event=>{
    if(!gesture||event.pointerId!==gesture.id)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;if(!gesture.moved&&Math.hypot(dx,dy)<8)return;
    gesture.moved=true;if(!scene.hasPointerCapture(event.pointerId))scene.setPointerCapture(event.pointerId);target(bound({x:gesture.origin.x+dx,y:gesture.origin.y+dy}));
  },{passive:true});
  function release(event){if(!gesture||event.pointerId!==gesture.id)return;if(gesture.moved)blockClickUntil=performance.now()+450;gesture=null;baseline=null;tiltAnchor=pose();sync();}
  addEventListener('pointerup',release,{passive:true});addEventListener('pointercancel',release,{passive:true});
  scene.addEventListener('click',event=>{if(mobile.matches&&performance.now()<blockClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
  function detach(){removeEventListener('deviceorientation',orientation);clearTimeout(sensorTimer);sensorTimer=0;}
  function showTilt(){toggle.textContent=enabled?'Tilt: On':'Enable tilt';toggle.setAttribute('aria-pressed',String(enabled));center.hidden=!enabled;root.classList.toggle('tilt-active',enabled);}
  function disableTilt(message=''){detach();enabled=false;awaitingPermission=false;baseline=null;showTilt();announce(message);}
  function connect(){detach();baseline=null;tiltAnchor=pose();addEventListener('deviceorientation',orientation,{passive:true});sensorTimer=setTimeout(()=>disableTilt(awaitingPermission?'Tap Enable tilt to allow motion, or drag to look around.':'No motion data here. Drag across the cabinet to look around.'),4500);}
  function availability(){
    const policy=document.permissionsPolicy||document.featurePolicy;
    if(!window.isSecureContext||!window.DeviceOrientationEvent)return 'Tilt is unavailable here. Drag to look around.';
    if(policy?.allowsFeature&&['accelerometer','gyroscope'].some(f=>!policy.allowsFeature(f)))return 'Motion is blocked in this embed. Drag to look around.';
    return '';
  }
  function startTilt(){enabled=true;awaitingPermission=false;baseline=null;showTilt();announce('Tilt your phone or drag to look around.');connect();}
  function autoTilt(){
    showTilt();if(enabled||userDisabled||autoAttempted||reduced.matches||!mobile.matches)return;
    autoAttempted=true;const unavailable=availability();if(unavailable){announce(unavailable);return;}
    if(typeof window.DeviceOrientationEvent.requestPermission==='function'){awaitingPermission=true;connect();announce('Tap Enable tilt to allow motion, or drag to look around.');return;}startTilt();
  }
  toggle.addEventListener('click',async()=>{
    if(requesting)return;if(enabled){userDisabled=true;disableTilt('Tilt is off. Drag to look around.');return;}
    const unavailable=availability();if(unavailable){announce(unavailable);return;}requesting=true;toggle.disabled=true;userDisabled=false;
    try{const Orientation=window.DeviceOrientationEvent;if(typeof Orientation.requestPermission==='function'&&await Orientation.requestPermission()!=='granted'){disableTilt('Motion permission was not granted. Drag to look around.');return;}if(mobile.matches)startTilt();}
    catch{disableTilt('Tilt could not start. Drag to look around.');}finally{requesting=false;toggle.disabled=false;}
  });
  function orientation(event){
    if((!enabled&&!awaitingPermission)||!mobile.matches||document.hidden||![event.beta,event.gamma].every(Number.isFinite))return;
    if(awaitingPermission){enabled=true;awaitingPermission=false;showTilt();announce('Tilt your phone or drag to look around.');}
    clearTimeout(sensorTimer);sensorTimer=0;if(paused())return;
    const angle=(screen.orientation?.angle??window.orientation??0)*Math.PI/180;
    const point={x:event.gamma*Math.cos(angle)+event.beta*Math.sin(angle),y:event.beta*Math.cos(angle)-event.gamma*Math.sin(angle)};
    if(!baseline){baseline=point;tiltAnchor=pose();return;}
    const response=value=>{const v=((value+180)%360+360)%360-180;return Math.sign(v)*clamp((Math.abs(v)-1.2)/16.8,0,1);};
    const limits=panLimits();target(bound({x:tiltAnchor.x-response(point.x-baseline.x)*Math.min(width*.65,limits.x),y:tiltAnchor.y-response(point.y-baseline.y)*Math.min(height*.22,limits.y)}));
  }
  center.addEventListener('click',()=>{baseline=null;if(!focused&&!transitioning)target(base);announce('Hold comfortably to center the camera.');});
  mobile.addEventListener('change',schedule);reduced.addEventListener('change',()=>{if(reduced.matches)disableTilt('Motion is reduced. Drag to look around.');schedule();});
  addEventListener('resize',schedule,{passive:true});screen.orientation?.addEventListener('change',schedule);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){detach();stop();}else{if(enabled||awaitingPermission)connect();sync();}});
  addEventListener('pagehide',()=>{detach();stop();});addEventListener('pageshow',event=>{if(event.persisted){schedule();if(enabled||awaitingPermission)connect();}});
  showTilt();sync();schedule();
})();
