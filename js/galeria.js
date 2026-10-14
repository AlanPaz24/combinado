/* ===== GALERÍA ===== */

let fotos = [];
let albumActual = 'Todas';
let visibles = [];   // fotos del álbum elegido (el visor navega sobre esta lista)
let indice = 0;

function dibujarFiltros() {
  const albumes = [...new Set(fotos.map(f => f.album).filter(Boolean))];
  const filtros = document.getElementById('filtros');

  // Si no hay álbumes cargados, no se muestran filtros
  if (!albumes.length) { filtros.innerHTML = ''; return; }

  filtros.innerHTML = ['Todas', ...albumes].map(a => {
    const cant = a === 'Todas' ? fotos.length : fotos.filter(f => f.album === a).length;
    return `<button class="filtro ${a === albumActual ? 'activo' : ''}" data-album="${esc(a)}">
              ${esc(a)}<small>${cant}</small></button>`;
  }).join('');
}

function dibujarGrilla() {
  visibles = albumActual === 'Todas' ? fotos : fotos.filter(f => f.album === albumActual);

  document.getElementById('grid-galeria').innerHTML = visibles.length
    ? visibles.map((f, i) => `
        <button class="foto-item" data-i="${i}" aria-label="Ver foto ${i + 1}${f.descripcion ? ': ' + esc(f.descripcion) : ''}">
          <img src="${esc(f.imagen)}" alt="${esc(f.descripcion || 'Foto de Combinado FC')}" loading="lazy"
               onerror="this.closest('.foto-item').remove()">
          ${f.descripcion ? `<span class="leyenda">${esc(f.descripcion)}</span>` : ''}
        </button>`).join('')
    : '<p class="mensaje-vacio">Todavía no hay fotos en este álbum.</p>';
}

/* ----- Visor ----- */

function mostrarFoto() {
  const f = visibles[indice];
  if (!f) return;
  const visor = document.getElementById('visor');

  visor.innerHTML = `
    <div class="visor-contenido">
      <button class="visor-btn visor-cerrar" id="v-cerrar" aria-label="Cerrar">✕</button>
      <button class="visor-btn visor-ant" id="v-ant" aria-label="Foto anterior">‹</button>
      <img class="visor-img" id="v-img" src="${esc(f.imagen)}" alt="${esc(f.descripcion || 'Foto de Combinado FC')}">
      <button class="visor-btn visor-sig" id="v-sig" aria-label="Foto siguiente">›</button>
      <div class="visor-pie">
        ${f.descripcion ? `<p>${esc(f.descripcion)}</p>` : ''}
        <small>${indice + 1} / ${visibles.length}${f.album ? ' · ' + esc(f.album) : ''}</small>
      </div>
    </div>`;

  document.getElementById('v-cerrar').onclick = () => visor.close();
  document.getElementById('v-ant').onclick = () => moverFoto(-1);
  document.getElementById('v-sig').onclick = () => moverFoto(1);

  // Pre-carga las fotos vecinas para que el cambio sea instantáneo
  [indice - 1, indice + 1].forEach(i => {
    const v = visibles[(i + visibles.length) % visibles.length];
    if (v) new Image().src = v.imagen;
  });
}

function abrirVisor(i) {
  indice = i;
  const visor = document.getElementById('visor');
  mostrarFoto();
  if (!visor.open) visor.showModal();
}

function moverFoto(paso) {
  indice = (indice + paso + visibles.length) % visibles.length;
  mostrarFoto();
}

async function iniciarGaleria() {
  try {
    fotos = await cargarJSON('data/galeria.json');
  } catch (e) {
    console.error(e);
    document.getElementById('grid-galeria').innerHTML =
      '<p class="mensaje-vacio">No se pudo cargar la galería. Revisá data/galeria.json.</p>';
    return;
  }

  dibujarFiltros();
  dibujarGrilla();

  document.getElementById('filtros').addEventListener('click', e => {
    const btn = e.target.closest('.filtro');
    if (!btn) return;
    albumActual = btn.dataset.album;
    dibujarFiltros();
    dibujarGrilla();
  });

  document.getElementById('grid-galeria').addEventListener('click', e => {
    const item = e.target.closest('.foto-item');
    if (item) abrirVisor(Number(item.dataset.i));
  });

  const visor = document.getElementById('visor');

  // Teclado: flechas para moverse (Esc cierra solo)
  document.addEventListener('keydown', e => {
    if (!visor.open) return;
    if (e.key === 'ArrowLeft') moverFoto(-1);
    if (e.key === 'ArrowRight') moverFoto(1);
  });

  // Tocar el fondo negro cierra el visor
  visor.addEventListener('click', e => {
    if (e.target === visor || e.target.classList.contains('visor-contenido')) visor.close();
  });

  // Deslizar con el dedo en el celular
  let inicioX = 0;
  visor.addEventListener('touchstart', e => { inicioX = e.changedTouches[0].clientX; }, { passive: true });
  visor.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 50) moverFoto(dx < 0 ? 1 : -1);
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', iniciarGaleria);