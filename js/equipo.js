/* ===== PÁGINA EQUIPO ===== */

const ORDEN_POSICIONES = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];
let jugadores = [];
let filtroActual = 'Todos';

function ordenarJugadores(lista) {
  return [...lista].sort((a, b) => {
    const pa = ORDEN_POSICIONES.indexOf(a.posicion);
    const pb = ORDEN_POSICIONES.indexOf(b.posicion);
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || a.numero - b.numero;
  });
}

function tarjetaJugador(j) {
  return `
    <button class="jugador" data-id="${esc(j.id)}" aria-label="Ver ficha de ${esc(j.nombre)}">
      <img src="${esc(j.foto)}" alt="${esc(j.nombre)}, ${esc(j.posicion)}" loading="lazy"
           onerror="this.src='img/logo/escudo.png'">
      <span class="numero">#${esc(j.numero)}</span>
      <div class="info"><h4>${esc(j.nombre)}</h4><p>${esc(j.posicion)}</p></div>
    </button>`;
}

function dibujarFiltros() {
  // Solo muestra las posiciones que realmente existen en tus datos
  const posiciones = ORDEN_POSICIONES.filter(p => jugadores.some(j => j.posicion === p));
  jugadores.forEach(j => {
    if (!posiciones.includes(j.posicion)) posiciones.push(j.posicion);
  });

  const botones = ['Todos', ...posiciones].map(p => {
    const cant = p === 'Todos' ? jugadores.length : jugadores.filter(j => j.posicion === p).length;
    return `<button class="filtro ${p === filtroActual ? 'activo' : ''}" data-filtro="${esc(p)}">
              ${esc(p)}<small>${cant}</small></button>`;
  });
  document.getElementById('filtros').innerHTML = botones.join('');
}

function dibujarPlantel() {
  const lista = filtroActual === 'Todos'
    ? jugadores
    : jugadores.filter(j => j.posicion === filtroActual);
  document.getElementById('plantel').innerHTML =
    lista.map(tarjetaJugador).join('') || '<p class="mensaje-vacio">No hay jugadores en esta posición.</p>';
}

/* ----- Ficha ----- */

function bloqueStat(valor, texto) {
  // Solo se muestra si cargaste el dato
  return valor === undefined || valor === null
    ? ''
    : `<div><b>${esc(valor)}</b><span>${texto}</span></div>`;
}

function abrirFicha(id) {
  const j = jugadores.find(x => x.id === id);
  if (!j) return;

  const stats = [
    bloqueStat(j.partidos, 'Partidos'),
    bloqueStat(j.goles, 'Goles'),
    bloqueStat(j.asistencias, 'Asistencias')
  ].join('');

  const url = `${location.origin}${location.pathname}?jugador=${encodeURIComponent(j.id)}`;

  const dlg = document.getElementById('ficha');
  dlg.innerHTML = `
    <div class="ficha-grid">
      <div class="ficha-foto">
        <img src="${esc(j.foto)}" alt="${esc(j.nombre)}" onerror="this.src='img/logo/escudo.png'">
      </div>
      <div class="ficha-datos">
        <button class="ficha-cerrar" id="ficha-cerrar" aria-label="Cerrar">✕</button>
        <div class="ficha-num">#${esc(j.numero)}</div>
        <h2>${esc(j.nombre)}</h2>
        <p class="ficha-pos">${esc(j.posicion)}</p>
        ${j.apodo ? `<p class="ficha-apodo">"${esc(j.apodo)}"</p>` : ''}
        ${stats ? `<div class="ficha-stats">${stats}</div>` : ''}
        ${j.bio ? `<p class="ficha-bio">${esc(j.bio)}</p>` : ''}
        <div class="ficha-compartir">
          <a class="boton secundario" target="_blank" rel="noopener"
             href="https://wa.me/?text=${encodeURIComponent('Mirá la ficha de ' + j.nombre + ': ' + url)}">
            Compartir por WhatsApp
          </a>
        </div>
      </div>
    </div>`;

  document.getElementById('ficha-cerrar').addEventListener('click', () => dlg.close());
  if (!dlg.open) dlg.showModal();
  history.replaceState(null, '', `?jugador=${encodeURIComponent(j.id)}`);
}

async function iniciarEquipo() {
  try {
    jugadores = ordenarJugadores(await cargarJSON('data/jugadores.json'));
  } catch (e) {
    console.error(e);
    document.getElementById('plantel').innerHTML =
      '<p class="mensaje-vacio">No se pudo cargar el plantel. Revisá data/jugadores.json.</p>';
    return;
  }

  dibujarFiltros();
  dibujarPlantel();

  // Clic en un filtro
  document.getElementById('filtros').addEventListener('click', e => {
    const btn = e.target.closest('.filtro');
    if (!btn) return;
    filtroActual = btn.dataset.filtro;
    dibujarFiltros();
    dibujarPlantel();
  });

  // Clic en un jugador
  document.getElementById('plantel').addEventListener('click', e => {
    const card = e.target.closest('.jugador');
    if (card) abrirFicha(card.dataset.id);
  });

  const dlg = document.getElementById('ficha');
  // Cerrar tocando afuera de la ficha
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  // Al cerrar, se limpia el link
  dlg.addEventListener('close', () => history.replaceState(null, '', location.pathname));

  // Si entraron con ?jugador=alan, se abre la ficha directamente
  const pedido = new URLSearchParams(location.search).get('jugador');
  if (pedido) abrirFicha(pedido);
}

document.addEventListener('DOMContentLoaded', iniciarEquipo);