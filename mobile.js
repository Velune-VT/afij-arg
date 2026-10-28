(() => {
  const mobileQuery=matchMedia('(max-width:760px),(pointer:coarse) and (max-width:980px)');
  const canvasWidth=1100,canvasHeight=700;
  const canvas=document.createElement('div');
  canvas.id='archiveCanvas';
  const game=document.getElementById('game');
  document.body.insertBefore(canvas,game);
  canvas.append(game);
  function fitArchive(){
    const root=document.documentElement;
    if(!mobileQuery.matches){
      ['--archive-scale','--archive-left','--archive-top'].forEach(name=>root.style.removeProperty(name));
      return;
    }
    const width=window.visualViewport?.width||innerWidth;
    const height=window.visualViewport?.height||innerHeight;
    const scale=Math.min(width/canvasWidth,height/canvasHeight);
    root.style.setProperty('--archive-scale',String(scale));
    root.style.setProperty('--archive-left',`${Math.max(0,(width-canvasWidth*scale)/2)}px`);
    root.style.setProperty('--archive-top',`${Math.max(0,(height-canvasHeight*scale)/2)}px`);
  }
  fitArchive();
  addEventListener('resize',fitArchive,{passive:true});
  addEventListener('orientationchange',fitArchive,{passive:true});
  window.visualViewport?.addEventListener('resize',fitArchive,{passive:true});
})();
