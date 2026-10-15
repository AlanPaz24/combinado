/* ===== ESTADÍSTICAS ===== */

let todos = [];
let porId = {};
let torneoActual = 'todos';
let orden = 'g';

const $ = id => document.getElementById(id);
const clave = t => String(t || 'Sin torneo').trim().toLowerCase();
const nombreTorneo = p => String(p.torneo || 'Sin torneo').trim();

// [campo, título corto, descripción]
const COLUMNAS = [
  ['pj', 'PJ', 'Partidos jugados'],
  ['g', 'G', 'Goles'],
  ['a', 'A', 'Asistencias'],
  ['ga', 'G+A', 'Goles + asistencias'],
  ['prom', 'Prom', 'Goles por partido'],
  ['fig', '⭐', 'Figura del partido'],
  ['am', '🟨', 'Tarjetas amarillas'],
  ['ro', '🟥', 'Tarjetas rojas']
];

function listarTorneos(partidos) {
  const mapa = new Map();
  partidos.forEach(p => {
    const k = clave(p.torneo);
    const f = parsearFecha(p.fecha);
    if (!mapa.has(k)) mapa.set(k, { clave: k, nombre: nombreTorneo(p), ultima: f });
    else if (f > mapa.get(k).ultima) mapa.get(k).ultima = f;
  });
  return [...mapa.values()].sort((a, b) => b.ultima - a.ultima);
}

function partidosFiltrados() {
  return torneoActual === 'todos' ? todos : todos.filter(p => clave(p.torneo) === torneoActual);
}

function avatar(f) {
  return `<img src="${esc(f.foto || 'img/logo/escudo.png')}" alt="" loading="lazy" onerror="this.src='img/logo/escudo.png'">`;
}

function armarFilas(lista) {
  return Object.entries(estadisticasJugadores(lista)).map(([id, s]) => {
    const j = porId[id];
    if (!j) console.warn(`⚠️ El id "${id}" no existe en jugadores.json (revisá cómo está escrito)`);
    return {
      id, nombre: j ? j.nombre : id, foto: j ? j.foto : '', pos: j ? textoPosiciones(j) : '',
      ...s, ga: s.g + s.a, prom: s.pj ? s.g / s.pj : 0
    };
  });
}

function ordenar(filas, key) {
  return [...filas].sort((x, y) =>
    y[key] - x[key] || y.ga - x.ga || y.g - x.g || x.nombre.localeCompare(y.nombre));
}

function tarjetaLider(filas, key, titulo, unidad) {
  const top = ordenar(filas, key)[0];
  if (!top || top[key] <= 0) return '';
  const empates = filas.filter(f => f[key] === top[key]).length - 1;
  return `
    <div class="lider">
      ${avatar(top)}
      <div>
        <small>${titulo}</small>
        <b class="nombre">${esc(top.nombre)}</b>
        <span class="valor">${top[key]}</span><span class="unidad">${unidad}</span>
        ${empates ? `<small>y ${empates} más empatado${empates > 1 ? 's' : ''}</small>` : ''}
      </div>
    </div>`;
}

function dibujarTabla(filas) {
  $('cabeza-tabla').innerHTML =
    '<th>#</th><th class="izq">Jugador</th>' +
    COLUMNAS.map(([k, etq, desc]) =>
      `<th class="ord ${k === orden ? 'activo' : ''}" data-orden="${k}" title="${desc}">${etq}</th>`).join('');

  let rank = 0, previo = null;
  $('cuerpo-tabla').innerHTML = ordenar(filas, orden).map((f, i) => {
    if (f[orden] !== previo) { rank = i + 1; previo = f[orden]; }
    const celdas = COLUMNAS.map(([k]) =>
      `<td class="${k === orden ? 'pts' : ''}">${k === 'prom' ? f.prom.toFixed(2) : f[k]}</td>`).join('');
    return `
      <tr>
        <td>${rank}</td>
        <td class="izq"><div class="jug-cel">${avatar(f)}
          <div><b>${esc(f.nombre)}</b>${f.pos ? `<small>${esc(f.pos)}</small>` : ''}</div></div></td>
        ${celdas}
      </tr>`;
  }).join('');
}

function dibujarArqueros(filas) {
  const arqueros = filas.filter(f => f.arq > 0)
    .map(f => ({ ...f, promGc: f.gc / f.arq }))
    .sort((a, b) => a.promGc - b.promGc || b.vi - a.vi);

  $('bloque-arqueros').hidden = arqueros.length === 0;
  let rank = 0, previo = null;
  $('cuerpo-arqueros').innerHTML = arqueros.map((f, i) => {
    if (f.promGc !== previo) { rank = i + 1; previo = f.promGc; }
    return `
      <tr>
        <td>${rank}</td>
        <td class="izq"><div class="jug-cel">${avatar(f)}<div><b>${esc(f.nombre)}</b></div></div></td>
        <td>${f.arq}</td><td>${f.gc}</td><td class="pts">${f.promGc.toFixed(2)}</td><td>${f.vi}</td>
      </tr>`;
  }).join('');
}

function dibujar() {
  const lista = partidosFiltrados();
  const jugados = lista.filter(p => p.estado === 'jugado');
  const conDatos = jugados.filter(p => p.jugaron || p.goles || p.asistencias).length;
  const filas = armarFilas(lista);

  $('nota-datos').textContent = jugados.length
    ? `Datos de ${conDatos} de ${jugados.length} partidos jugados` : '';

  const hay = filas.length > 0;
  $('vacio').hidden = hay;
  $('bloque-ranking').hidden = !hay;
  if (!hay) { $('bloque-arqueros').hidden = true; return; }

  $('lideres').innerHTML =
    tarjetaLider(filas, 'g', 'Goleador', 'goles') +
    tarjetaLider(filas, 'a', 'Asistidor', 'asist.') +
    tarjetaLider(filas, 'pj', 'Más partidos', 'PJ') +
    tarjetaLider(filas, 'fig', 'Más veces figura', '⭐');

  dibujarTabla(filas);
  dibujarArqueros(filas);
}

async function iniciarEstadisticas() {
  let lista;
  try {
    [todos, lista] = await Promise.all([
      cargarJSON('data/partidos.json'),
      cargarJSON('data/jugadores.json')
    ]);
  } catch (e) {
    console.error(e);
    $('vacio').textContent = 'No se pudieron cargar los datos. Revisá la carpeta data.';
    $('vacio').hidden = false;
    return;
  }
  lista.forEach(j => { porId[j.id] = j; });

  // Aviso solo para vos (F12): los goles cargados no coinciden con el marcador
  todos.filter(p => p.estado === 'jugado' && p.goles).forEach(p => {
    const suma = Object.values(p.goles).reduce((s, n) => s + (Number(n) || 0), 0);
    if (suma !== p.golesFavor) {
      console.warn(`⚠️ ${p.fecha} vs ${p.rival}: el marcador dice ${p.golesFavor} goles pero en "goles" sumás ${suma}`);
    }
  });

  const torneos = listarTorneos(todos);
  const selector = $('selector-torneo');
  selector.innerHTML =
    torneos.map(t => `<option value="${esc(t.clave)}">${esc(t.nombre)}</option>`).join('') +
    `<option value="todos">Histórico (todos los torneos)</option>`;

  const pedido = new URLSearchParams(location.search).get('torneo');
  const existe = v => v === 'todos' || torneos.some(t => t.clave === v);
  torneoActual = pedido && existe(clave(pedido)) ? clave(pedido) : (torneos[0] ? torneos[0].clave : 'todos');
  selector.value = torneoActual;

  selector.addEventListener('change', () => {
    torneoActual = selector.value;
    history.replaceState(null, '', `?torneo=${encodeURIComponent(torneoActual)}`);
    dibujar();
  });

  // Ordenar por columna
  $('cabeza-tabla').addEventListener('click', e => {
    const th = e.target.closest('.ord');
    if (!th) return;
    orden = th.dataset.orden;
    dibujar();
  });

  dibujar();
}

document.addEventListener('DOMContentLoaded', iniciarEstadisticas);