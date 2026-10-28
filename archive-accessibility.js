(() => {
  let opener;
  const game=document.getElementById('archiveCanvas');
  const credits=document.getElementById('creditsButton');
  const overlays=[...document.querySelectorAll('.overlay')];
  overlays.forEach(overlay => {
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label',overlay.id==='fileModal'?'Archive case file':'Archive action');
    overlay.setAttribute('aria-hidden','true');
    new MutationObserver(() => {
      const opened=overlay.classList.contains('show');
      overlay.setAttribute('aria-hidden',String(!opened));
      if(opened){opener=document.activeElement;game.inert=true;credits.inert=true;overlay.querySelector('[data-close]').focus({preventScroll:true});overlay.querySelector('.panel').scrollTop=0;overlay.querySelector('#fileBody').scrollTop=0;}
      else{game.inert=false;credits.inert=false;if(opener?.isConnected)opener.focus();}
    }).observe(overlay,{attributes:true,attributeFilter:['class']});
  });
  document.addEventListener('keydown',event => {
    const open=overlays.find(overlay=>overlay.classList.contains('show'));
    if(open&&event.key==='Tab'){
      const controls=[...open.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      else if(!open.contains(document.activeElement)){event.preventDefault();first.focus();}
    }
  });
})();
