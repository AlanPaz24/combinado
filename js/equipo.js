/* ===== PÁGINA EQUIPO ===== */

const ORDEN_POSICIONES = ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];
let jugadores = [];
let stats = {};
let filtroActual = 'Todos';

function indicePrincipal(j) {
  const i = ORDEN_POSICIONES.indexOf(posicionesDe(j)[0]);
  return i === -1 ? 99 : i;
}

function ordenarJugadores(lista) {
  return [...lista].sort((a, b) =>
    indicePrincipal(a) - indicePrincipal(b) || (a.numero ?? 99) - (b.numero ?? 99));
}

function tarjetaJugador(j) {
  const tieneNum = j.numero !== undefined && j.numero !== null && j.numero !== '';
  return `
    <button class="jugador" data-id="${esc(j.id)}" aria-label="Ver ficha de ${esc(j.nombre)}">
      <img src="${esc(j.foto)}" alt="${esc(j.nombre)}, ${esc(textoPosiciones(j))}" loading="lazy"
           onerror="this.src='img/logo/escudo.png'">
      ${tieneNum ? `<span class="numero">#${esc(j.numero)}</span>` : ''}
      <div class="info"><h4>${esc(j.nombre)}</h4><p>${esc(textoPosiciones(j))}</p></div>
    </button>`;
}

function dibujarFiltros() {
  // Solo muestra las posiciones que existen en tus datos
  const existentes = new Set(jugadores.flatMap(posicionesDe));
  const posiciones = [
    ...ORDEN_POSICIONES.filter(p => existentes.has(p)),
    ...[...existentes].filter(p => !ORDEN_POSICIONES.includes(p))
  ];

  document.getElementById('filtros').innerHTML = ['Todos', ...posiciones].map(p => {
    const cant = p === 'Todos' ? jugadores.length : jugadores.filter(j => posicionesDe(j).includes(p)).length;
    return `<button class="filtro ${p === filtroActual ? 'activo' : ''}" data-filtro="${esc(p)}">
              ${esc(p)}<small>${cant}</small></button>`;
  }).join('');
}

function dibujarPlantel() {
  const lista = filtroActual === 'Todos'
    ? jugadores
    : jugadores.filter(j => posicionesDe(j).includes(filtroActual));
  document.getElementById('plantel').innerHTML =
    lista.map(tarjetaJugador).join('') || '<p class="mensaje-vacio">No hay jugadores en esta posición.</p>';
}

/* ----- Ficha ----- */

function bloqueStat(valor, texto) {
  return `<div><b>${esc(valor)}</b><span>${texto}</span></div>`;
}

function abrirFicha(id) {
  const j = jugadores.find(x => x.id === id);
  if (!j) return;

  const s = stats[j.id];
  const bloque = s && s.pj > 0
    ? `<div class="ficha-stats">
         ${bloqueStat(s.pj, 'Partidos')}${bloqueStat(s.g, 'Goles')}${bloqueStat(s.a, 'Asistencias')}
       </div>`
    : '';

  const tieneNum = j.numero !== undefined && j.numero !== null && j.numero !== '';
  const url = `${location.origin}${location.pathname}?jugador=${encodeURIComponent(j.id)}`;

  const dlg = document.getElementById('ficha');
  dlg.innerHTML = `
    <div class="ficha-grid">
      <div class="ficha-foto">
        <img src="${esc(j.foto)}" alt="${esc(j.nombre)}" onerror="this.src='img/logo/escudo.png'">
      </div>
      <div class="ficha-datos">
        <button class="ficha-cerrar" id="ficha-cerrar" aria-label="Cerrar">✕</button>
        ${tieneNum ? `<div class="ficha-num">#${esc(j.numero)}</div>` : ''}
        <h2>${esc(j.nombre)}</h2>
        <p class="ficha-pos">${esc(textoPosiciones(j))}</p>
        ${j.apodo ? `<p class="ficha-apodo">"${esc(j.apodo)}"</p>` : ''}
        ${bloque}
        ${j.bio ? `<p class="ficha-bio">${esc(j.bio)}</p>` : ''}
        <div class="ficha-compartir">
          <a class="boton secundario" href="estadisticas.html">Ver ranking</a>
          <a class="boton secundario" target="_blank" rel="noopener"
             href="https://wa.me/?text=${encodeURIComponent('Mirá la ficha de ' + j.nombre + ': ' + url)}">
            Compartir
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
    const [lista, partidos] = await Promise.all([
      cargarJSON('data/jugadores.json'),
      cargarJSON('data/partidos.json').catch(() => [])
    ]);
    jugadores = ordenarJugadores(lista);
    stats = estadisticasJugadores(partidos);
  } catch (e) {
    console.error(e);
    document.getElementById('plantel').innerHTML =
      '<p class="mensaje-vacio">No se pudo cargar el plantel. Revisá data/jugadores.json.</p>';
    return;
  }

  dibujarFiltros();
  dibujarPlantel();

  document.getElementById('filtros').addEventListener('click', e => {
    const btn = e.target.closest('.filtro');
    if (!btn) return;
    filtroActual = btn.dataset.filtro;
    dibujarFiltros();
    dibujarPlantel();
  });

  document.getElementById('plantel').addEventListener('click', e => {
    const card = e.target.closest('.jugador');
    if (card) abrirFicha(card.dataset.id);
  });

  const dlg = document.getElementById('ficha');
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => history.replaceState(null, '', location.pathname));

  const pedido = new URLSearchParams(location.search).get('jugador');
  if (pedido) abrirFicha(pedido);
}

document.addEventListener('DOMContentLoaded', iniciarEquipo);