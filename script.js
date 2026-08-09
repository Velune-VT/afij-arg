
/* ============================================================
   EXPANSIVE POINT-AND-CLICK CAMERA
   The pointer acts like the player's gaze. The room is larger
   than the renderer, so moving toward an edge reveals more of it.
   ============================================================ */
const camera = {
  targetX: 0, targetY: 0,
  currentX: 0, currentY: 0,
  pointerX: .5, pointerY: .5,
  running: true
};

function cameraLimits(){
  const w = window.innerWidth;
  const h = Math.max(1, document.getElementById('game').clientHeight);
  const mobile = w < 760;
  return {
    x: mobile ? Math.min(42,w*.055) : Math.min(150,w*.115),
    y: mobile ? Math.min(28,h*.05) : Math.min(86,h*.105)
  };
}

function updateCameraTarget(clientX, clientY){
  const game = document.getElementById('game');
  const rect = game.getBoundingClientRect();
  if(!rect.width || !rect.height) return;

  const nx = Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
  const ny = Math.max(0,Math.min(1,(clientY-rect.top)/rect.height));
  camera.pointerX = nx;
  camera.pointerY = ny;

  const lim = cameraLimits();

  // Cursor right => the "camera" looks right => room canvas moves left.
  // The gentle eased curve leaves the center calmer and makes edges more exploratory.
  const dx = (nx-.5)*2;
  const dy = (ny-.5)*2;
  const easedX = Math.sign(dx)*Math.pow(Math.abs(dx),1.25);
  const easedY = Math.sign(dy)*Math.pow(Math.abs(dy),1.35);

  camera.targetX = -easedX*lim.x;
  camera.targetY = -easedY*lim.y;
}

document.addEventListener('pointermove',e=>updateCameraTarget(e.clientX,e.clientY),{passive:true});

document.addEventListener('pointerleave',()=>{
  camera.targetX *= .35;
  camera.targetY *= .35;
});

function animateCamera(){
  const active = document.querySelector('.scene.active .world');
  camera.currentX += (camera.targetX-camera.currentX)*.075;
  camera.currentY += (camera.targetY-camera.currentY)*.075;

  if(active){
    active.style.setProperty('--cam-x',camera.currentX.toFixed(2)+'px');
    active.style.setProperty('--cam-y',camera.currentY.toFixed(2)+'px');
  }
  requestAnimationFrame(animateCamera);
}
requestAnimationFrame(animateCamera);

window.addEventListener('resize',()=>{
  updateCameraTarget(
    window.innerWidth*camera.pointerX,
    document.getElementById('game').clientHeight*camera.pointerY
  );
});

const order=['office','observatory','balcony','library','cabinet'];
function go(id){
 if(!order.includes(id)) return;
 document.querySelectorAll('.scene').forEach(s=>s.classList.remove('active'));
 document.getElementById(id).classList.add('active');
 camera.currentX *= .35;
 camera.currentY *= .35;
 camera.targetX *= .6;
 camera.targetY *= .6;
}

/* dust */
document.querySelectorAll('[data-dust]').forEach(box=>{
 const n=+box.dataset.dust;
 for(let i=0;i<n;i++){
  const d=document.createElement('i');d.style.left=(Math.random()*100)+'%';d.style.top=(35+Math.random()*60)+'%';d.style.animationDelay=(-Math.random()*10)+'s';d.style.animationDuration=(8+Math.random()*8)+'s';box.appendChild(d);
 }
});
/* city */
const city=document.getElementById('city');
const cityFar=document.getElementById('cityFar');
[42,57,32,68,48,77,54,37,70,44,82,60,51,73,39,64,86,55,46,71,49,66,41,78,58,52,69,45,74].forEach((h,i)=>{
 const d=document.createElement('div');d.className='bld';d.style.height=h+'%';if(i%5===0)d.style.flex='1.4';city.appendChild(d)
});
[35,50,42,62,47,54,39,67,45,58,71,38,52,64,43,57,49,69,41,55,63,46].forEach((h,i)=>{
 const d=document.createElement('div');d.className='bld';d.style.height=h+'%';if(i%4===0)d.style.flex='1.3';cityFar.appendChild(d)
});

/* modal */
function openModal(t,body,k='Archive entry'){document.getElementById('mt').textContent=t;document.getElementById('mk').textContent=k;document.getElementById('mb').innerHTML='<p>'+body+'</p>';document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeZoom()}})

/* library */
const interactive=new Set([1,3,6,8,11,14,16,19,22,24,27,29,31,34,36,39,42,44,47,49,52,54,57,59,62,64,67,69,72,74,77,79,82,84,87,89,92,94,97,99]);
const titles=['Monochrome: A City of Six Layers','Northshire Railway Almanac','On Spirit Contracts','Brassheart: Early Case Notes','The Ascension and Its Witnesses','Flower Language of the Eastern Counties','Railway Superstitions','Ribbon Traditions of Mourning','Eclipse Customs','A Field Guide to Local Spirits','Liliana: Lantern Hymns','Asteria and the Blue Flame','Cyrus Before the Fall','The Detective Guild Charter','Monochrome City Guard Manual','Iron Weasels: Redacted History','Iron Court Proceedings','Veridia Harvest Records','Atlas of Cliffside Districts','Anonymous Diary, X742','The Book of Empty Stations','Clockwork Illnesses','Witnesses of the Third Bell','Constellation Records','Spirit Folklore: Vol. II','A Treatise on Memory','Masks of the Capital','Case Files: Disappearances','The Brass Orchard','Northshire Burial Customs','Letters from Monochrome','The Vanishing Platform','Collected Trial Testimony','The Lantern Keeper','City Maps, Revised Edition','A Study of Blue Fire','Eclipse Year Census','Unclaimed Property Ledger','The Phoenix Motif','Restricted Observatory Notes'];
const texts=['A penciled route marks a district that no longer appears on modern maps.','A margin note warns readers not to board a train after the third bell.','The contract section describing “shared memory” has been carefully removed.','One physician recorded brass-like impressions appearing without visible injury.','The witness list ends abruptly halfway down the page.','Pressed flowers identify grief, devotion, suspicion, and return.','Passengers once believed empty carriages could remember the dead.','Ribbons tied with the knot facing inward were meant for secrets.','The city dimmed its lamps during eclipse nights to avoid attracting spirits.','A sketch depicts an animal whose eyes are crossed out in every copy.','The hymn refers to a lantern that burns even beneath water.','Asteria is described as “the star that chose to fall.”','Three pages have been replaced with blank paper.','An amendment authorizes investigators to seal supernatural evidence.','A disciplinary report mentions a case number matching the office board.','The group’s symbol resembles a mark found beneath the balcony railing.','A sealed testimony repeatedly uses the phrase “the wrong prison.”','A rural birth registry contains one impossible duplicate name.','A transit line ends at a station labeled only with a circle.','The diary’s final page says: “He knew my name before I gave it.”','Every station listed exists except one.','A mechanical physician proposes slowing symptoms rather than curing them.','Three witnesses heard the same bell at different times.','One star is missing from the official plate.','The spirit taxonomy includes a crossed-out category.','Memory is described as reconstructive, contagious, and politically dangerous.','A chapter on disguise has thumbprints in blue ink.','Disappearances cluster around rail corridors and old observatory routes.','A botanical illustration hides a cipher in its petal count.','Mourning bells were rung in patterns of three.','One letter was never sent; the seal remains intact.','The platform appears only on maps printed before X700.','A witness changed their statement four times without changing handwriting.','The protagonist of this folktale always carries an unlit lantern.','A handwritten alley route leads toward the Iron Court district.','Blue fire is described as cold to the touch.','Population counts dip sharply in every eclipse year.','The ledger lists a blue feather as recovered evidence.','The phoenix symbol is associated with false deaths and second identities.','An observatory assistant recorded a star blinking out at 3:17.'];
let num=0,idx=0;
['leftShelf','rightShelf'].forEach(id=>{
 const shelf=document.getElementById(id);
 for(let r=0;r<5;r++){const row=document.createElement('div');row.className='shelfrow';
  for(let j=0;j<10;j++){num++;const b=document.createElement('button');b.className='book';b.style.height=(58+((num*13)%31))+'%';b.setAttribute('aria-label','Book '+num);
   if(interactive.has(num)){let bi=idx++;b.classList.add('interactive');b.onclick=()=>openModal(titles[bi],'Volume '+num+'. '+texts[bi],'Library archive')}
   row.appendChild(b)
  } shelf.appendChild(row)
 }
});

/* cabinet + ARG */
let argState=JSON.parse(localStorage.getItem('afijStoryARG')||'{"clues":[false,false,false],"solved":false}');
const drawerData=[
['Case I — The First Departure','Four introductory profiles are clipped together: two sibling detectives, an informant with too many names, and a detective whose official record contains several contradictions.'],
['Case II — The City','A case summary describes a nationwide disappearance pattern centered on Monochrome. Several incidents coincide with railway closures.'],
['Case III — Persons of Interest','Twenty-four profile cards are divided into six sets. Someone has rearranged the order by hand.'],
['Case IV — Brassheart','Medical photographs show metallic-looking impressions beneath the skin. The treatment notes only say: “delay progression.”'],
['Case V — The Setting','Maps of Northshire, Veridia, Monochrome, and the coastal rail lines are bundled with eclipse calendars.'],
['Drawer VI — Sealed','This drawer has no keyhole. Inside the label slot, someone wrote: “The sky provides the password.”']
];
function drawer(i){if(i===6&&argState.solved)openModal('Drawer VI — Unsealed','The drawer slides toward you. Inside: a photograph of the observatory dome, a railway ticket stamped 3:17, and a note reading “When the star disappears, follow the blue flame.”','Unlocked ARG reward');else openModal(drawerData[i-1][0],drawerData[i-1][1],i===6?'Sealed file':'Filing cabinet')}
function openCork(){document.getElementById('zoom').classList.add('show');updateARG()}
function closeZoom(){document.getElementById('zoom').classList.remove('show')}
function inspect(i){argState.clues[i]=true;localStorage.setItem('afijStoryARG',JSON.stringify(argState));document.getElementById('argstatus').textContent=['Blue Feather — three tiny notches are carved into the shaft.','Broken Clock — the hands stopped at exactly 3:17.','Missing Star — it appears in an older chart, but not in the official one.'][i]}
function checkARG(){const v=(document.getElementById('argAnswer').value||'').trim().toUpperCase();if(!argState.clues.every(Boolean)){document.getElementById('argstatus').textContent='Inspect all three primary evidence cards first.';return}if(v==='ECLIPSE'){argState.solved=true;localStorage.setItem('afijStoryARG',JSON.stringify(argState));document.getElementById('argstatus').textContent='Case unlocked. Drawer VI will now open.'}else document.getElementById('argstatus').textContent='The keyword does not match the evidence.'}
function updateARG(){document.getElementById('argstatus').textContent=argState.solved?'Case unlocked. Drawer VI recognizes the answer.':'Inspect the three primary evidence cards. Progress is saved.'}

document.querySelectorAll('.action-dock button').forEach(button=>{
 button.addEventListener('click',()=>{
  const current=document.querySelector('.scene.active');
  if(!current)return;
  current.dispatchEvent(new CustomEvent('roomaction',{detail:{action:button.dataset.action}}));
 });
});
