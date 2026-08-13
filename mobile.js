(() => {
  const mobileQuery = matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 980px)');
  const canvasWidth = 1100;
  const canvasHeight = 776;

  /* Keep dialogs outside this wrapper so only the room is miniaturized. */
  const canvas = document.createElement('div');
  canvas.id = 'archiveCanvas';
  const gameElement = document.querySelector('#game');
  const plaque = document.querySelector('.archive-plaque');
  const dock = document.querySelector('.action-dock');
  document.body.insertBefore(canvas,gameElement);
  canvas.append(gameElement,plaque,dock);

  function viewportSize() {
    return { width:window.visualViewport?.width||innerWidth, height:window.visualViewport?.height||innerHeight };
  }

  function fitDesktopArchive() {
    const root=document.documentElement;
    if (!mobileQuery.matches) {
      root.style.removeProperty('--archive-scale');
      root.style.removeProperty('--archive-left');
      root.style.removeProperty('--archive-top');
      return;
    }
    const viewport=viewportSize();
    const scale=Math.min(viewport.width/canvasWidth,viewport.height/canvasHeight);
    root.style.setProperty('--archive-scale',scale.toFixed(5));
    root.style.setProperty('--archive-left',`${Math.max(0,(viewport.width-canvasWidth*scale)/2).toFixed(2)}px`);
    root.style.setProperty('--archive-top',`${Math.max(0,(viewport.height-canvasHeight*scale)/2).toFixed(2)}px`);
  }

  fitDesktopArchive();
  addEventListener('resize',fitDesktopArchive,{passive:true});
  addEventListener('orientationchange',fitDesktopArchive,{passive:true});
  window.visualViewport?.addEventListener('resize',fitDesktopArchive,{passive:true});

  if (!plaque.textContent.trim()) plaque.innerHTML='<small>A Flight in June</small><span>Archive Records</span>';

  document.querySelectorAll('.drawer').forEach((drawer,index) => {
    drawer.type='button';
    drawer.setAttribute('aria-label',drawerData[index][0]);
  });
  document.querySelectorAll('.action-dock button,.close-file').forEach(button => button.type='button');

  let touchingScene=false;
  function touchTarget(event) {
    const scale=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--archive-scale'))||1;
    const rect=canvas.getBoundingClientRect();
    target((event.clientX-rect.left)/scale,(event.clientY-rect.top)/scale);
  }
  document.addEventListener('pointerdown',event => {
    if (!mobileQuery.matches||!event.target.closest('#game')) return;
    touchingScene=!event.target.closest('button');
    if (touchingScene) touchTarget(event);
  },{passive:true});
  document.addEventListener('pointermove',event => {
    if (mobileQuery.matches&&touchingScene) touchTarget(event);
  },{passive:true});
  function settleCamera() {
    if (!mobileQuery.matches) return;
    touchingScene=false;
    setTimeout(() => target(canvasWidth/2,350),400);
  }
  document.addEventListener('pointerup',settleCamera,{passive:true});
  document.addEventListener('pointercancel',settleCamera,{passive:true});
})();
