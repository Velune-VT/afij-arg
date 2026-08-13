(() => {
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const root = document.documentElement;

  function syncViewportHeight() {
    const height = window.visualViewport?.height || window.innerHeight;
    root.style.setProperty('--app-height', `${Math.round(height)}px`);
  }

  syncViewportHeight();
  window.addEventListener('resize', syncViewportHeight, { passive: true });
  window.addEventListener('orientationchange', syncViewportHeight, { passive: true });
  window.visualViewport?.addEventListener('resize', syncViewportHeight, { passive: true });

  document.querySelectorAll('.drawer').forEach((drawer, index) => {
    drawer.type = 'button';
    drawer.setAttribute('aria-label', drawerData[index][0]);
  });

  document.querySelectorAll('.action-dock button, .close-file').forEach((button) => {
    button.type = 'button';
  });

  const plaque = document.querySelector('.archive-plaque');
  if (plaque && coarsePointer.matches) {
    plaque.innerHTML = '<small>Touch the cabinet to explore</small><span>Archive Records</span>';
  }

  let touchingScene = false;

  function touchTarget(x, y) {
    target(x, y);
    const maxX = Math.min(58, innerWidth * .07);
    const maxY = Math.min(40, innerHeight * .065);
    camera.tx = Math.max(-maxX, Math.min(maxX, camera.tx));
    camera.ty = Math.max(-maxY, Math.min(maxY, camera.ty));
  }

  document.addEventListener('pointerdown', (event) => {
    if (!coarsePointer.matches || !event.target.closest('#game')) return;
    touchingScene = !event.target.closest('button');
    if (touchingScene) touchTarget(event.clientX, event.clientY);
  }, { passive: true });

  document.addEventListener('pointermove', (event) => {
    if (!coarsePointer.matches) return;
    if (touchingScene) touchTarget(event.clientX, event.clientY);
    else touchTarget(innerWidth / 2, game.clientHeight / 2);
  }, { passive: true });

  function settleTouchCamera() {
    if (!coarsePointer.matches) return;
    touchingScene = false;
    window.setTimeout(() => touchTarget(innerWidth / 2, game.clientHeight / 2), 500);
  }

  document.addEventListener('pointerup', settleTouchCamera, { passive: true });
  document.addEventListener('pointercancel', settleTouchCamera, { passive: true });

  document.querySelectorAll('.overlay').forEach((overlay) => {
    overlay.addEventListener('transitionend', () => {
      if (!overlay.classList.contains('show')) overlay.scrollTop = 0;
    });
  });
})();
