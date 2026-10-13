/* ===== PÁGINA DE INICIO ===== */

function tarjetaProximo(p) {
  if (!p) {
    return `
      <article class="partido-card">
        <span class="etiqueta">Próximo partido</span>
        <h3>A confirmar</h3>
        <p class="meta">Todavía no hay un partido programado. ¡Seguinos en redes!</p>
      </article>`;
  }
  const partes = [`📅 ${fechaLarga(p.fecha)}`];
  if (p.hora) partes.push(`🕖 ${esc(p.hora)} hs`);
  if (p.lugar) partes.push(`📍 ${esc(p.lugar)}`);
  return `
    <article class="partido-card">
      <span class="etiqueta">Próximo partido</span>
      <h3>Combinado FC <span class="vs">vs</span> ${esc(p.rival)}</h3>
      <p class="meta">${partes.join(' &nbsp;·&nbsp; ')}</p>
      <p class="torneo">${esc(p.torneo)}</p>
    </article>`;
}

function tarjetaUltimo(p) {
  if (!p) {
    return `
      <article class="partido-card">
        <span class="etiqueta">Último resultado</span>
        <h3>Sin partidos jugados</h3>
      </article>`;
  }
  const pen = p.penales ? `<small>Penales: ${esc(p.penales)}</small>` : '';
  return `
    <article class="partido-card">
      <span class="etiqueta">Último resultado</span>
      <h3>Combinado FC <span class="vs">vs</span> ${esc(p.rival)}</h3>
      <div class="marcador">${p.golesFavor} - ${p.golesContra}
        <span class="badge ${resultadoDe(p)}">${resultadoDe(p)}</span>${pen}
      </div>
      <p class="meta">${fechaLarga(p.fecha)}</p>
      <p class="torneo">${esc(p.torneo)}</p>
    </article>`;
}

function htmlStats(s) {
  const items = [
    [s.pj, 'Jugados'], [s.pg, 'Ganados'], [s.pe, 'Empatados'],
    [s.pp, 'Perdidos'], [s.gf, 'Goles a favor'], [s.gc, 'Goles en contra']
  ];
  return items.map(([n, t]) => `<div class="stat"><b>${n}</b><span>${t}</span></div>`).join('');
}

function htmlJugador(j) {
  return `
    <article class="jugador">
      <img src="${esc(j.foto)}" alt="${esc(j.nombre)}, ${esc(j.posicion)} de Combinado FC" loading="lazy"
           onerror="this.src='img/logo/escudo.png'">
      <span class="numero">#${esc(j.numero)}</span>
      <div class="info"><h4>${esc(j.nombre)}</h4><p>${esc(j.posicion)}</p></div>
    </article>`;
}

function htmlNoticia(n) {
  return `
    <a class="noticia" href="noticia.html?id=${encodeURIComponent(n.id)}">
      <img src="${esc(n.imagen)}" alt="${esc(n.titulo)}" loading="lazy"
           onerror="this.src='img/logo/escudo.png'">
      <div class="cuerpo">
        <span class="cat">${esc(n.categoria)}</span>
        <h3>${esc(n.titulo)}</h3>
        <p>${esc(n.resumen)}</p>
        <span class="fecha">${fechaCorta(n.fecha)}</span>
      </div>
    </a>`;
}

async function iniciarInicio() {
  try {
    const [partidos, jugadores, noticias] = await Promise.all([
      cargarJSON('data/partidos.json'),
      cargarJSON('data/jugadores.json'),
      cargarJSON('data/noticias.json')
    ]);

    // Próximo partido: el más cercano que todavía no pasó
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const proximo = partidos
      .filter(p => p.estado === 'proximo' && parsearFecha(p.fecha) >= hoy)
      .sort((a, b) => parsearFecha(a.fecha) - parsearFecha(b.fecha))[0];

    // Último resultado: el jugado más reciente
    const ultimo = partidos
      .filter(p => p.estado === 'jugado')
      .sort((a, b) => parsearFecha(b.fecha) - parsearFecha(a.fecha))[0];

    document.getElementById('partidos-destacados').innerHTML =
      tarjetaProximo(proximo) + tarjetaUltimo(ultimo);

    document.getElementById('stats').innerHTML = htmlStats(calcularStats(partidos));

    document.getElementById('plantel').innerHTML =
      jugadores.slice(0, 4).map(htmlJugador).join('');

    const ultimas = [...noticias]
      .sort((a, b) => parsearFecha(b.fecha) - parsearFecha(a.fecha))
      .slice(0, 3);
    document.getElementById('noticias').innerHTML = ultimas.map(htmlNoticia).join('');

  } catch (e) {
    console.error(e);
    document.getElementById('partidos-destacados').innerHTML =
      '<p class="mensaje-vacio">No se pudieron cargar los datos. Revisá los archivos de la carpeta data.</p>';
  }
}

document.addEventListener('DOMContentLoaded', iniciarInicio);