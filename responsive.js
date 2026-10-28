(() => {
  const root=document.documentElement,embedded=window.parent!==window;
  const standalone=matchMedia('(max-width:736px)'),listeners=new Set();
  let matches=embedded?false:standalone.matches;
  const apply=value=>{
    const changed=matches!==value;matches=value;
    root.dataset.layout=matches?'mobile':'desktop';
    if(changed)for(const fn of listeners)fn({matches});
  };
  window.afijLayout={get matches(){return matches;},addEventListener(type,fn){if(type==='change')listeners.add(fn);},removeEventListener(type,fn){listeners.delete(fn);}};
  let parentOrigin='';try{parentOrigin=new URL(document.referrer).origin;}catch{}
  if(embedded){
    addEventListener('message',event=>{
      if(event.source!==window.parent||event.origin!==parentOrigin||event.data?.channel!=='afij-mobile-files-v1'||event.data.type!=='ready'||typeof event.data.mobile!=='boolean')return;
      apply(event.data.mobile);
    });
  }else standalone.addEventListener('change',event=>apply(event.matches));
  apply(matches);
})();
