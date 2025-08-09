// --- Datos por defecto (respaldo si no se carga el JSON) ---
const defaultIdols = [
  { nombre:"Chanelle", grupo:"FIFTY FIFTY", genero:"F", imagen:"https://picsum.photos/seed/chanelle/400/400" },
  { nombre:"Moka", grupo:"ILLIT", genero:"F", imagen:"https://picsum.photos/seed/moka/400/400" },
  { nombre:"Lisa", grupo:"BLACKPINK", genero:"F", imagen:"https://picsum.photos/seed/lisa/400/400" },
  { nombre:"Jungkook", grupo:"BTS", genero:"M", imagen:"https://picsum.photos/seed/jk/400/400" }
];

// --- Estado ---
let idols = [];
let state = new Map();
let history = [];

const elGrid = document.getElementById('grid');
// const elEmpty = document.getElementById('empty');
const q = document.getElementById('q');

// --- Utilidades ---
const uid = () => Math.random().toString(36).slice(2,9);
const pushHistory = () => history.push(JSON.stringify([...state]));
const restoreHistory = () => {
  const prev = history.pop();
  if(!prev) return;
  state = new Map(JSON.parse(prev));
  render();
};

// --- Botón de inicio ---
document.getElementById('btnStart').addEventListener('click', () => {
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameContent').style.display = 'block';
});

function setData(list){
  idols = list.map(x=>({ id: uid(), ...x }));
  state = new Map(idols.map(x=>[x.id,{discard:false,fav:false}]));
  history = [];
  render();
}

function render(){
  const term = q.value.trim().toLowerCase();
  const filtered = idols.filter(p => !term || `${p.nombre} ${p.grupo}`.toLowerCase().includes(term));
  elGrid.innerHTML = '';
  // elEmpty.hidden = filtered.length > 0;
  for(const p of filtered){
    const st = state.get(p.id) || {discard:false,fav:false};
    const card = document.createElement('article');
    card.className = 'card' + (st.discard ? ' discard' : '') + (st.fav ? ' fav' : '');
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="ph">
        <img alt="${p.nombre}" src="${p.imagen}" onerror="this.src='https://picsum.photos/seed/'+encodeURIComponent('${p.nombre}')+'/400/400'"/>
        ${st.fav?'<span class="fav-icon">⭐</span>':''}
      </div>
      <div class="meta">
        <div class="name">${p.nombre}</div>
        <div class="sub">${p.grupo}</div>
      </div>`;
    card.addEventListener('click', (e)=>{
      if(e.altKey){ toggleFav(p.id); return; }
      toggleDiscard(p.id);
    });
    card.addEventListener('contextmenu', (e)=>{ e.preventDefault(); toggleFav(p.id); });
    elGrid.appendChild(card);
  }
}

function toggleDiscard(id){
  pushHistory();
  const st = state.get(id);
  st.discard = !st.discard;
  state.set(id, st);
  render();
}

function toggleFav(id){
  pushHistory();
  const st = state.get(id);
  st.fav = !st.fav;
  state.set(id, st);
  render();
}

function reset(){
  pushHistory();
  for(const [id,st] of state){
    st.discard=false;
    st.fav=false;
    state.set(id,st);
  }
  render();
}

function shuffle(){
  idols.sort(()=>Math.random()-0.5);
  render();
}

// --- Controles ---
document.getElementById('btnReset').onclick = reset;
document.getElementById('btnShuffle').onclick = shuffle;
document.getElementById('btnExport').onclick = ()=>{
  const payload = idols.map(p=>({
    nombre:p.nombre, grupo:p.grupo, genero:p.genero||'', imagen:p.imagen,
    _estado: state.get(p.id)
  }));
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tablero_kpop.json';
  a.click();
  URL.revokeObjectURL(a.href);
};

q.addEventListener('input', render);

// Cargar JSON custom desde el botón
// document.getElementById('fileInput').addEventListener('change', async (e)=>{
//   const file = e.target.files?.[0];
//   if(!file) return;
//   const text = await file.text();
//   try{
//     const list = JSON.parse(text);
//     if(!Array.isArray(list)) throw new Error('El JSON debe ser un array de idols');
//     setData(list);
//   }catch(err){ alert('Error leyendo el JSON: '+err.message); }
// });

// Atajos
window.addEventListener('keydown', (e)=>{
  if(e.key==='r' || e.key==='R'){ e.preventDefault(); reset(); }
  if(e.key==='s' || e.key==='S'){ e.preventDefault(); shuffle(); }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); restoreHistory(); }
});

// --- Cargar automáticamente data/idols.json ---
fetch('idols.json')
  .then(res => {
    if (!res.ok) throw new Error('No se pudo cargar data/idols.json');
    return res.json();
  })
  .then(json => {
    if(Array.isArray(json) && json.length){
      setData(json);
    } else {
      throw new Error('Formato de idols.json inválido');
    }
  })
  .catch(err => {
    console.warn(err.message);
    setData(defaultIdols); // respaldo
  });
