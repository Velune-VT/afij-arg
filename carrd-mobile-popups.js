(() => {
  const script=document.currentScript;
  const frame=script.previousElementSibling?.matches('.afij-room-frame')?script.previousElementSibling.querySelector('iframe'):document.querySelector('.afij-room-frame iframe');
  if(!frame||frame.dataset.afijPopupBound)return;frame.dataset.afijPopupBound='true';
  const origin=new URL(frame.src,location.href).origin,base=new URL('./',frame.src).href;
  const container=frame.closest('.container-component.columns,.container.columns');
  const inner=container?.querySelector(':scope > .wrapper > .inner');
  const fallback=matchMedia('(max-width:980px)'),layoutListeners=new Set();
  const isStacked=()=>inner?getComputedStyle(inner).flexDirection.startsWith('column'):fallback.matches;
  let stacked=isStacked();
  const mobile={get matches(){return stacked;},addEventListener(type,fn){if(type==='change')layoutListeners.add(fn);}};
  function updateLayout(){const next=isStacked(),changed=next!==stacked;stacked=next;frame.closest('.afij-room-frame').classList.toggle('afij-stacked',stacked);if(changed)for(const fn of layoutListeners)fn();}
  const channel='afij-mobile-files-v1';
  let active=null;
  const post=data=>frame.contentWindow?.postMessage({channel,...data},origin);
  function ready(){post({type:'ready',mobile:mobile.matches});}
  function safeContent(html){
    const doc=new DOMParser().parseFromString(html,'text/html');
    const allowed=new Set(['P','STRONG','EM','HR','BR','IMG','DIV','SPAN','H3','DL','DT','DD','SECTION','A']);
    for(const el of [...doc.body.querySelectorAll('*')]){
      if(!allowed.has(el.tagName)){el.remove();continue;}
      for(const attr of [...el.attributes])if(!['class','src','href','alt','title','width','height'].includes(attr.name))el.removeAttribute(attr.name);
      if(el.hasAttribute('src')){
        try{const url=new URL(el.getAttribute('src'),base);if(url.origin!==origin||!url.pathname.startsWith(new URL('Assets/',base).pathname))throw Error();el.setAttribute('src',url.href);}catch{el.removeAttribute('src');}
      }
      if(el.hasAttribute('href')){
        try{const url=new URL(el.getAttribute('href'),base);if(url.protocol!=='https:'&&url.origin!==origin)throw Error();el.setAttribute('href',url.href);el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer');}catch{el.removeAttribute('href');}
      }
    }
    const fragment=document.createDocumentFragment();fragment.append(...doc.body.childNodes);return fragment;
  }
  function close(notify=true){
    if(!active)return;const previous=active;active=null;previous.host.remove();
    for(const [el,inert]of previous.background)if(el.isConnected)el.inert=inert;
    for(const [key,value]of Object.entries(previous.bodyStyle))document.body.style[key]=value;
    scrollTo(previous.scrollX,previous.scrollY);
    if(notify)post({type:'closed',id:previous.id});
    frame.focus({preventScroll:true});
  }
  function open(data){
    if(!mobile.matches||!Number.isSafeInteger(data.id)||!['text','profile','credits'].includes(data.kind)||typeof data.html!=='string'||data.html.length>100000)return;
    if(active?.id===data.id){post({type:'opened',id:data.id});return;}
    if(active)close(false);
    if(!document.getElementById('afij-reader-fonts')){
      const fonts=document.createElement('style');fonts.id='afij-reader-fonts';
      fonts.textContent=[['normal',400],['normal',600],['italic',400]].map(([style,weight])=>`@font-face{font-family:AFIJFraunces;font-style:${style};font-weight:${weight};font-display:swap;src:url('${new URL(`Assets/fonts/Fraunces-${style}-${weight}.ttf`,base).href}') format('truetype')}`).join('');document.head.append(fonts);
    }
    const host=document.createElement('div');host.id='afij-mobile-reader';
    const shadow=host.attachShadow({mode:'open'}),style=document.createElement('style');style.textContent=POPUP_CSS;
    const veil=document.createElement('div');veil.className='veil';
    const reader=document.createElement('article');reader.className=`reader ${data.kind}`;reader.setAttribute('role','dialog');reader.setAttribute('aria-modal','true');reader.setAttribute('aria-labelledby','afij-reader-title');
    const kick=document.createElement('div');kick.className='kick';kick.textContent=String(data.kick||'').slice(0,200);
    const title=document.createElement('h2');title.id='afij-reader-title';title.textContent=String(data.title||'Archive file').slice(0,300);
    const content=document.createElement('div');content.className='content';content.tabIndex=0;content.setAttribute('role','region');content.setAttribute('aria-label',data.kind==='credits'?'Credits content':'File contents');content.append(safeContent(data.html));
    const footer=document.createElement('div');footer.className='footer';
    if(data.kind==='profile'){
      const zoom=document.createElement('button');zoom.type='button';zoom.className='zoom';zoom.textContent='Enlarge';zoom.setAttribute('aria-pressed','false');
      zoom.addEventListener('click',()=>{const enlarged=reader.classList.toggle('enlarged');zoom.textContent=enlarged?'Fit':'Enlarge';zoom.setAttribute('aria-pressed',String(enlarged));content.scrollTop=0;content.scrollLeft=0;});footer.append(zoom);
    }
    const button=document.createElement('button');button.type='button';button.className='close';button.textContent='Close File';button.setAttribute('aria-label','Close File');button.addEventListener('click',()=>close());footer.append(button);
    host.style.setProperty('--close-art',`url('${new URL('Assets/Close File.png',base).href}')`);
    reader.append(kick,title,content,footer);veil.append(reader);shadow.append(style,veil);
    const background=[...document.body.children].map(el=>[el,el.inert]);const bodyStyle={};for(const key of ['position','top','left','width','overflow'])bodyStyle[key]=document.body.style[key];
    const scrollX=window.scrollX,scrollY=window.scrollY;
    active={id:data.id,host,shadow,background,bodyStyle,scrollX,scrollY};
    document.body.append(host);for(const [el]of background)el.inert=true;
    Object.assign(document.body.style,{position:'fixed',top:`${-scrollY}px`,left:`${-scrollX}px`,width:'100%',overflow:'hidden'});
    function size(){if(!active||active.host!==host)return;host.style.height=`${window.visualViewport?.height??innerHeight}px`;host.style.top=`${window.visualViewport?.offsetTop??0}px`;}
    size();active.size=size;button.focus({preventScroll:true});
    veil.addEventListener('click',event=>{if(event.target===veil)close();});
    shadow.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();close();return;}
      if(event.key!=='Tab')return;
      const controls=[...shadow.querySelectorAll('button,a[href],[tabindex="0"]')],first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&shadow.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&shadow.activeElement===last){event.preventDefault();first.focus();}
    });
    post({type:'opened',id:data.id});
  }
  addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||event.origin!==origin||!event.data||event.data.channel!==channel)return;
    const data=event.data;
    if(data.type==='hello')ready();else if(data.type==='open')open(data);else if(data.type==='close'&&active?.id===data.id)close(false);
  });
  frame.addEventListener('load',ready);
  mobile.addEventListener('change',()=>{if(!mobile.matches)close();ready();});
  addEventListener('resize',()=>{updateLayout();active?.size();});window.visualViewport?.addEventListener('resize',()=>active?.size());
  addEventListener('pagehide',()=>close(false));
  new ResizeObserver(updateLayout).observe(inner||frame.parentElement);updateLayout();ready();
})();
