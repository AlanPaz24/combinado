/* ===== FUNCIONES COMPARTIDAS ===== */

async function cargarJSON(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error('No se pudo cargar ' + ruta);
  return r.json();
}

// Evita que un texto con símbolos raros rompa la página
function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// "2025-10-06" -> objeto Date (sin problemas de zona horaria)
function parsearFecha(iso) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

function fechaLarga(iso) {
  const t = parsearFecha(iso).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function fechaCorta(iso) {
  return parsearFecha(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function precio(n) {
  return '$' + Number(n).toLocaleString('es-AR');
}

// Devuelve 'V', 'E' o 'D' para un partido jugado
function resultadoDe(p) {
  if (p.golesFavor > p.golesContra) return 'V';
  if (p.golesFavor < p.golesContra) return 'D';
  return 'E'; // empate (aunque se haya definido por penales)
}

function calcularStats(partidos) {
  const jugados = partidos.filter(p => p.estado === 'jugado');
  const s = { pj: jugados.length, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0 };
  jugados.forEach(p => {
    s.gf += p.golesFavor;
    s.gc += p.golesContra;
    const r = resultadoDe(p);
    if (r === 'V') s.pg++; else if (r === 'D') s.pp++; else s.pe++;
  });
  return s;
}

/* ===== CABECERA Y PIE ===== */

const PAGINAS = [
  { id: 'inicio',   texto: 'Inicio',   url: 'index.html' },
  { id: 'equipo',   texto: 'Equipo',   url: 'equipo.html' },
  { id: 'partidos', texto: 'Partidos', url: 'partidos.html' },
  { id: 'estadisticas', texto: 'Estadísticas', url: 'estadisticas.html' },
  { id: 'noticias', texto: 'Noticias', url: 'noticias.html' },
  { id: 'galeria',  texto: 'Galería',  url: 'galeria.html' },
  { id: 'tienda',   texto: 'Tienda',   url: 'tienda.html' },
  { id: 'contacto', texto: 'Contacto', url: 'contacto.html' }
];

function construirCabecera(cfg) {
  const actual = document.body.dataset.pagina;
  const links = PAGINAS.map(p =>
    `<a href="${p.url}" class="${p.id === actual ? 'activo' : ''}">${p.texto}</a>`
  ).join('');

  document.getElementById('cabecera').innerHTML = `
    <div class="contenedor">
      <a href="index.html" class="marca">
        <img src="${esc(cfg.escudo)}" alt="Escudo ${esc(cfg.nombre)}">
        <span>${esc(cfg.nombre)}</span>
      </a>
      <nav class="nav" id="nav">${links}</nav>
      <button class="menu-btn" id="menu-btn" aria-label="Abrir menú">☰</button>
    </div>`;

  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('nav').classList.toggle('abierto');
  });
}

function construirPie(cfg) {
  const links = PAGINAS.map(p => `<li><a href="${p.url}">${p.texto}</a></li>`).join('');
  document.getElementById('pie').innerHTML = `
    <div class="contenedor">
      <div class="pie-grid">
        <div>
          <a href="index.html" class="marca">
            <img src="${esc(cfg.escudo)}" alt="Escudo ${esc(cfg.nombre)}">
            <span>${esc(cfg.nombre)}</span>
          </a>
          <p class="desc">${esc(cfg.descripcion)}</p>
        </div>
        <div><h5>Navegación</h5><ul>${links}</ul></div>
        <div>
          <h5>Seguinos</h5>
          <ul>
            <li><a href="${esc(cfg.redes.instagram)}" target="_blank" rel="noopener">Instagram</a></li>
            <li><a href="${esc(cfg.redes.youtube)}" target="_blank" rel="noopener">YouTube</a></li>
            <li><a href="https://wa.me/${esc(cfg.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></li>
          </ul>
        </div>
      </div>
      <p class="pie-copy">© ${new Date().getFullYear()} ${esc(cfg.nombre)} — Todos los derechos reservados</p>
    </div>`;
}

// Se ejecuta en todas las páginas
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const cfg = await cargarJSON('data/config.json');
    construirCabecera(cfg);
    construirPie(cfg);
  } catch (e) {
    console.error(e);
  }
});

/* ===== POSICIONES Y ESTADÍSTICAS DE JUGADORES ===== */

// Acepta "posiciones": ["Arquero","Defensor"] o el viejo "posicion": "Defensor"
function posicionesDe(j) {
  const lista = Array.isArray(j.posiciones) ? j.posiciones : (j.posicion ? [j.posicion] : []);
  return lista.filter(Boolean);
}

function textoPosiciones(j) {
  return posicionesDe(j).join(' / ') || 'Jugador';
}

// Suma las estadísticas de cada jugador a partir de los partidos jugados
function estadisticasJugadores(partidos) {
  const m = {};
  const get = id => m[id] || (m[id] = { pj: 0, g: 0, a: 0, am: 0, ro: 0, fig: 0, arq: 0, gc: 0, vi: 0 });

  partidos.filter(p => p.estado === 'jugado').forEach(p => {
    const goles = p.goles || {};
    const asist = p.asistencias || {};

    // Cuenta como "jugó" quien figura en cualquiera de estos campos
    const presentes = new Set([
      ...(p.jugaron || []), ...Object.keys(goles), ...Object.keys(asist),
      ...(p.amarillas || []), ...(p.rojas || [])
    ]);
    if (p.arquero) presentes.add(p.arquero);
    if (p.figura) presentes.add(p.figura);

    presentes.forEach(id => { get(id).pj++; });
    Object.entries(goles).forEach(([id, n]) => { get(id).g += Number(n) || 0; });
    Object.entries(asist).forEach(([id, n]) => { get(id).a += Number(n) || 0; });
    (p.amarillas || []).forEach(id => { get(id).am++; });
    (p.rojas || []).forEach(id => { get(id).ro++; });
    if (p.figura) get(p.figura).fig++;

    if (p.arquero) {
      const s = get(p.arquero);
      s.arq++;
      s.gc += Number(p.golesContra) || 0;
      if ((Number(p.golesContra) || 0) === 0) s.vi++;
    }
  });
  return m;
}