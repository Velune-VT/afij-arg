(() => {
  const drawers=document.getElementById('drawers');
  const modal=document.getElementById('fileModal');
  const title=document.getElementById('fileTitle');
  const body=document.getElementById('fileBody');
  const kick=document.getElementById('fileKick');
  const groups=[];
  const scene=document.querySelector('.archive-scene');
  const creditsButton=document.getElementById('creditsButton');
  function syncFileBounds(){
    const rect=scene.getBoundingClientRect();
    modal.style.setProperty('--file-stage-x',`${rect.left}px`);
    modal.style.setProperty('--file-stage-y',`${rect.top}px`);
    modal.style.setProperty('--file-stage-width',`${rect.width}px`);
    modal.style.setProperty('--file-stage-height',`${rect.height}px`);
    creditsButton.style.setProperty('--credits-x',`${rect.left+rect.width*.797}px`);
    creditsButton.style.setProperty('--credits-y',`${rect.top+rect.height*.86}px`);
    creditsButton.style.setProperty('--credits-width',`${rect.width*.115}px`);
    creditsButton.style.setProperty('--credits-height',`${rect.height*.095}px`);
  }
  const queueBounds=()=>requestAnimationFrame(syncFileBounds);
  new ResizeObserver(queueBounds).observe(scene);
  addEventListener('resize',queueBounds,{passive:true});
  addEventListener('orientationchange',queueBounds,{passive:true});
  window.visualViewport?.addEventListener('resize',queueBounds,{passive:true});
  window.visualViewport?.addEventListener('scroll',queueBounds,{passive:true});

  function setExpanded(group,expanded){
    group.classList.toggle('expanded',expanded);
    group.querySelector('.drawer-toggle').setAttribute('aria-expanded',String(expanded));
    group.querySelectorAll('.drawer-file').forEach(file => {
      file.disabled=!expanded;
      file.tabIndex=expanded?0:-1;
    });
  }
  function openFile(drawerIndex,hasRecord){
    syncFileBounds();
    body.removeAttribute('tabindex');
    body.removeAttribute('role');
    body.removeAttribute('aria-label');
    modal.classList.remove('credits-view');
    modal.classList.toggle('profile-view',hasRecord&&drawerIndex===2);
    title.textContent=hasRecord?drawerData[drawerIndex][0]:'EMPTY FILE';
    body.innerHTML=hasRecord?drawerData[drawerIndex][1]:'<p>No record has been filed here.</p>';
    kick.textContent=hasRecord&&drawerIndex===5?'Classified File':'Filing Cabinet';
    modal.classList.add('show');
  }
  document.getElementById('creditsButton').addEventListener('click',()=>{
    syncFileBounds();
    modal.classList.remove('profile-view');
    modal.classList.add('credits-view');
    title.textContent='Credits';
    kick.textContent='A Flight in June';
    body.replaceChildren(document.getElementById('creditsContent').content.cloneNode(true));
    body.tabIndex=0;
    body.setAttribute('role','region');
    body.setAttribute('aria-label','Credits content');
    modal.classList.add('show');
  });
  drawerData.forEach((record,index) => {
    // Pick once per drawer so its record stays put throughout this visit.
    const recordSlot=Math.floor(Math.random()*3)+1;
    const group=document.createElement('div');
    group.className='drawer';
    group.setAttribute('role','group');
    group.setAttribute('aria-label',record[0]);
    group.dataset.recordSlot=String(recordSlot);
    group.id=`drawer-files-${index}`;
    const backing=document.createElement('img');
    backing.className='drawer-backing';
    backing.src='Assets/drawer-backing.png';
    backing.alt='';
    backing.draggable=false;
    group.appendChild(backing);
    // Paint order: drawer-backing, file-3, file-2, file-1, Drawer.
    [3,2,1].forEach(slot => {
      const file=document.createElement('button');
      file.type='button';
      file.className=`drawer-file file-${slot}`;
      file.dataset.slot=String(slot);
      file.setAttribute('aria-label',`File ${slot} in ${record[0]}`);
      file.setAttribute('aria-haspopup','dialog');
      const art=document.createElement('img');
      art.src=`Assets/file-${slot}.png`;
      art.alt='';
      art.draggable=false;
      file.appendChild(art);
      file.addEventListener('click',() => openFile(index,slot===recordSlot));
      group.appendChild(file);
    });
    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='drawer-toggle';
    toggle.setAttribute('aria-label',record[0]);
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls',group.id);
    const face=document.createElement('img');
    face.className='drawer-face';
    face.src='Assets/Drawer.png';
    face.alt='';
    face.draggable=false;
    toggle.appendChild(face);
    toggle.addEventListener('click',() => {
      const expanded=!group.classList.contains('expanded');
      groups.forEach(other => {if(other!==group)setExpanded(other,false);});
      setExpanded(group,expanded);
    });
    group.appendChild(toggle);
    setExpanded(group,false);
    group.addEventListener('keydown',event => {
      if(!group.classList.contains('expanded'))return;
      const files=[...group.querySelectorAll('.drawer-file')].reverse();
      const current=files.indexOf(document.activeElement);
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
        event.preventDefault();
        const direction=['ArrowRight','ArrowDown'].includes(event.key)?1:-1;
        files[current<0?0:(current+direction+3)%3].focus();
      }
    });
    drawers.appendChild(group);
    groups.push(group);
  });
  document.querySelectorAll('[data-close]').forEach(button => {
    button.type='button';
    button.addEventListener('click',()=>modal.classList.remove('show'));
  });
  modal.addEventListener('click',event => {
    if(event.target===modal)modal.classList.remove('show');
  });
  document.addEventListener('keydown',event => {
    if(event.key!=='Escape')return;
    if(modal.classList.contains('show'))modal.classList.remove('show');
    else{
      const expanded=groups.find(group=>group.classList.contains('expanded'));
      if(expanded){setExpanded(expanded,false);expanded.querySelector('.drawer-toggle').focus();}
    }
  });
  const dust=document.getElementById('dust');
  for(let i=0;i<10;i++){
    const mote=document.createElement('i');
    mote.style.left=Math.random()*100+'%';
    mote.style.top=35+Math.random()*60+'%';
    mote.style.animationDelay=-Math.random()*10+'s';
    mote.style.animationDuration=8+Math.random()*8+'s';
    dust.appendChild(mote);
  }
})();
