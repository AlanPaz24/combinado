/* ===== GALERÍA CON ÁLBUMES ===== */

const SIN_ALBUM = 'Otras fotos';
const TODAS = '__todas__';

let fotos = [];
let albumes = [];     // [{ nombre, fotos: [...], portada }]
let vista = null;     // null = lista de álbumes | nombre de álbum | TODAS
let visibles = [];    // fotos que se están viendo (el visor navega sobre esta lista)
let indice = 0;

const $ = id => document.getElementById(id);
const albumDe = f => (f.album && String(f.album).trim()) || SIN_ALBUM;
const textoFotos = n => `${n} ${n === 1 ? 'foto' : 'fotos'}`;

function armarAlbumes() {
  const mapa = new Map();
  fotos.forEach(f => {
    const nombre = albumDe(f);
    if (!mapa.has(nombre)) mapa.set(nombre, { nombre, fotos: [], portada: null });
    const a = mapa.get(nombre);
    a.fotos.push(f);
    if (f.portada) a.portada = f;
  });
  albumes = [...mapa.values()];
  albumes.forEach(a => { if (!a.portada) a.portada = a.fotos[0]; });
}

/* ----- Pantalla principal ----- */

function dibujar() {
  const unico = albumes.length <= 1;
  const barra = $('barra-album');
  const gridAlbumes = $('grid-albumes');
  const gridFotos = $('grid-galeria');
  const todas = $('ver-todas');

  if (!fotos.length) {
    gridFotos.innerHTML = '<p class="mensaje-vacio">Todavía no hay fotos cargadas.</p>';
    return;
  }

  // 1) Lista de álbumes
  if (vista === null && !unico) {
    barra.hidden = true;
    gridFotos.innerHTML = '';
    visibles = [];
    gridAlbumes.innerHTML = albumes.map((a, i) => `
      <button class="album" data-i="${i}" aria-label="Abrir álbum ${esc(a.nombre)}">
        <img src="${esc(a.portada.miniatura || a.portada.imagen)}" alt="Portada del álbum ${esc(a.nombre)}"
             loading="lazy" onerror="this.src='img/logo/escudo.png'">
        <span class="album-info"><b>${esc(a.nombre)}</b><small>${textoFotos(a.fotos.length)}</small></span>
      </button>`).join('');
    todas.innerHTML = `<button class="boton secundario" data-album="${TODAS}">Ver todas las fotos (${fotos.length})</button>`;
    todas.hidden = false;
    return;
  }

  // 2) Fotos de un álbum (o todas)
  gridAlbumes.innerHTML = '';
  todas.hidden = true;

  let titulo;
  if (unico || vista === TODAS) {
    visibles = fotos;
    titulo = unico ? '' : 'Todas las fotos';
  } else {
    const a = albumes.find(x => x.nombre === vista);
    visibles = a ? a.fotos : [];
    titulo = vista;
  }

  if (!unico) {
    barra.innerHTML = `
      <button class="boton secundario" id="btn-volver">← Todos los álbumes</button>
      <h2>${esc(titulo)} <small>${textoFotos(visibles.length)}</small></h2>`;
    barra.hidden = false;
  } else {
    barra.hidden = true;
  }

  gridFotos.innerHTML = visibles.map((f, i) => `
    <button class="foto-item" data-i="${i}" aria-label="Ver foto ${i + 1}${f.descripcion ? ': ' + esc(f.descripcion) : ''}">
      <img src="${esc(f.miniatura || f.imagen)}" alt="${esc(f.descripcion || 'Foto de Combinado FC')}" loading="lazy"
           onerror="this.closest('.foto-item').remove()">
      ${f.descripcion ? `<span class="leyenda">${esc(f.descripcion)}</span>` : ''}
    </button>`).join('');
}

function irA(nuevaVista, guardarHistorial = true) {
  vista = nuevaVista;
  if (guardarHistorial) {
    const url = vista === null ? location.pathname : `?album=${encodeURIComponent(vista)}`;
    history.pushState(null, '', url);
  }
  dibujar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function vistaDesdeURL() {
  const pedido = new URLSearchParams(location.search).get('album');
  if (pedido === TODAS) return TODAS;
  return albumes.some(a => a.nombre === pedido) ? pedido : null;
}

/* ----- Visor ----- */

function construirVisor() {
  const miniaturas = visibles.length > 1
    ? `<div class="visor-miniaturas" id="v-mini">${visibles.map((f, i) => `
        <button class="mini" data-i="${i}" aria-label="Ir a la foto ${i + 1}">
          <img src="${esc(f.miniatura || f.imagen)}" alt="" loading="lazy">
        </button>`).join('')}</div>`
    : '';

  const visor = $('visor');
  visor.innerHTML = `
    <div class="visor-contenido">
      <button class="visor-btn visor-cerrar" id="v-cerrar" aria-label="Cerrar">✕</button>
      <button class="visor-btn visor-ant" id="v-ant" aria-label="Foto anterior">‹</button>
      <img class="visor-img" id="v-img" alt="">
      <button class="visor-btn visor-sig" id="v-sig" aria-label="Foto siguiente">›</button>
      <div class="visor-pie"><p id="v-desc"></p><small id="v-cont"></small></div>
      ${miniaturas}
    </div>`;

  $('v-cerrar').onclick = () => visor.close();
  $('v-ant').onclick = () => moverFoto(-1);
  $('v-sig').onclick = () => moverFoto(1);
}

function mostrarFoto() {
  const f = visibles[indice];
  if (!f) return;

  const img = $('v-img');
  img.src = f.imagen;
  img.alt = f.descripcion || 'Foto de Combinado FC';
  $('v-desc').textContent = f.descripcion || '';
  $('v-cont').textContent = `${indice + 1} / ${visibles.length}${f.album ? ' · ' + f.album : ''}`;

  // Resalta la miniatura actual y la centra en la tira
  document.querySelectorAll('#v-mini .mini').forEach((m, i) => {
    m.classList.toggle('activo', i === indice);
    if (i === indice) m.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  });

  // Pre-carga las fotos vecinas para que el cambio sea instantáneo
  [indice - 1, indice + 1].forEach(i => {
    const v = visibles[(i + visibles.length) % visibles.length];
    if (v) new Image().src = v.imagen;
  });
}

function abrirVisor(i) {
  indice = i;
  construirVisor();
  const visor = $('visor');
  if (!visor.open) visor.showModal();
  mostrarFoto();
}

function moverFoto(paso) {
  indice = (indice + paso + visibles.length) % visibles.length;
  mostrarFoto();
}

/* ----- Inicio ----- */

async function iniciarGaleria() {
  try {
    fotos = await cargarJSON('data/galeria.json');
  } catch (e) {
    console.error(e);
    $('grid-galeria').innerHTML =
      '<p class="mensaje-vacio">No se pudo cargar la galería. Revisá data/galeria.json.</p>';
    return;
  }

  armarAlbumes();
  vista = vistaDesdeURL();
  dibujar();

  // Botón "atrás" del navegador
  window.addEventListener('popstate', () => { vista = vistaDesdeURL(); dibujar(); });

  // Clic en un álbum
  $('grid-albumes').addEventListener('click', e => {
    const a = e.target.closest('.album');
    if (a) irA(albumes[Number(a.dataset.i)].nombre);
  });

  // "Ver todas las fotos"
  $('ver-todas').addEventListener('click', e => {
    const b = e.target.closest('[data-album]');
    if (b) irA(b.dataset.album);
  });

  // "Volver a todos los álbumes"
  $('barra-album').addEventListener('click', e => {
    if (e.target.closest('#btn-volver')) irA(null);
  });

  // Clic en una foto de la grilla
  $('grid-galeria').addEventListener('click', e => {
    const item = e.target.closest('.foto-item');
    if (item) abrirVisor(Number(item.dataset.i));
  });

  const visor = $('visor');

  // Clic en una miniatura, o en el fondo negro para cerrar
  visor.addEventListener('click', e => {
    const mini = e.target.closest('.mini');
    if (mini) { indice = Number(mini.dataset.i); mostrarFoto(); return; }
    if (e.target === visor || e.target.classList.contains('visor-contenido')) visor.close();
  });

  // Teclado: flechas para moverse (Esc cierra solo)
  document.addEventListener('keydown', e => {
    if (!visor.open) return;
    if (e.key === 'ArrowLeft') moverFoto(-1);
    if (e.key === 'ArrowRight') moverFoto(1);
  });

  // Deslizar con el dedo (se ignora si el dedo está sobre la tira de miniaturas)
  let inicioX = 0, sobreTira = false;
  visor.addEventListener('touchstart', e => {
    sobreTira = !!e.target.closest('.visor-miniaturas');
    inicioX = e.changedTouches[0].clientX;
  }, { passive: true });
  visor.addEventListener('touchend', e => {
    if (sobreTira) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 50) moverFoto(dx < 0 ? 1 : -1);
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', iniciarGaleria);