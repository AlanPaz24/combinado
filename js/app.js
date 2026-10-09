let listaJugadores = [];

document.addEventListener('DOMContentLoaded', () => {
  cargarTodo();
  configurarFiltros();
  configurarModal();
});

async function cargarTodo() {
  try {
    const [resJugadores, resPartidos, resEquipos] = await Promise.all([
      fetch('data/jugadores.json'),
      fetch('data/partidos.json'),
      fetch('data/equipos.json')
    ]);

    listaJugadores = await resJugadores.json();
    const partidos = await resPartidos.json();
    const equipos = await resEquipos.json();

    renderizarJugadores(listaJugadores);
    renderizarLideres(listaJugadores);
    renderizarPartidos(partidos);
    calcularYRenderizarTabla(partidos, equipos);
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
}

// 1. Calcula la Tabla de Posiciones General del Torneo
function calcularYRenderizarTabla(partidos, equipos) {
  const tablaMap = {};

  // Inicializar todos los equipos de la copa
  equipos.forEach(eq => {
    tablaMap[eq.nombre] = {
      nombre: eq.nombre,
      esMiEquipo: eq.esMiEquipo || false,
      pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0
    };
  });

  partidos.filter(p => p.estado === 'finalizado').forEach(p => {
    let eqLocal, eqVisitante, gfLocal, gfVisitante;

    // Detectar si el partido es formato "Combinado vs Rival" o "Local vs Visitante"
    if (p.equipoLocal && p.equipoVisitante) {
      eqLocal = p.equipoLocal;
      eqVisitante = p.equipoVisitante;
      gfLocal = p.golesLocal || 0;
      gfVisitante = p.golesVisitante || 0;
    } else {
      eqLocal = "Combinado";
      eqVisitante = p.rival;
      gfLocal = p.golesFavor || 0;
      gfVisitante = p.golesRival || 0;
    }

    // Asegurar que existan en la tabla si no estuvieran creados
    if (!tablaMap[eqLocal]) tablaMap[eqLocal] = { nombre: eqLocal, esMiEquipo: false, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0 };
    if (!tablaMap[eqVisitante]) tablaMap[eqVisitante] = { nombre: eqVisitante, esMiEquipo: false, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0 };

    // Partidos Jugados y Goles
    tablaMap[eqLocal].pj++;
    tablaMap[eqLocal].gf += gfLocal;
    tablaMap[eqLocal].gc += gfVisitante;

    tablaMap[eqVisitante].pj++;
    tablaMap[eqVisitante].gf += gfVisitante;
    tablaMap[eqVisitante].gc += gfLocal;

    // Puntos y Resultados
    if (gfLocal > gfVisitante) {
      tablaMap[eqLocal].pts += 3; tablaMap[eqLocal].pg++;
      tablaMap[eqVisitante].pp++;
    } else if (gfLocal < gfVisitante) {
      tablaMap[eqVisitante].pts += 3; tablaMap[eqVisitante].pg++;
      tablaMap[eqLocal].pp++;
    } else {
      tablaMap[eqLocal].pts += 1; tablaMap[eqLocal].pe++;
      tablaMap[eqVisitante].pts += 1; tablaMap[eqVisitante].pe++;
    }
  });

  const tablaArray = Object.values(tablaMap).map(eq => {
    eq.dif = eq.gf - eq.gc;
    return eq;
  });

  // Ordenar por Puntos > Diferencia de Gol > Goles a Favor
  tablaArray.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);

  const tbody = document.getElementById('tabla-posiciones-body');
  if (!tbody) return;

  tbody.innerHTML = tablaArray.map((eq, i) => `
    <tr class="${eq.esMiEquipo ? 'highlight-row' : ''}">
      <td><strong>${i + 1}</strong></td>
      <td>${eq.nombre} ${eq.esMiEquipo ? '⭐' : ''}</td>
      <td><strong>${eq.pts}</strong></td>
      <td>${eq.pj}</td>
      <td>${eq.pg}</td>
      <td>${eq.pe}</td>
      <td>${eq.pp}</td>
      <td>${eq.gf}</td>
      <td>${eq.gc}</td>
      <td>${eq.dif > 0 ? '+' + eq.dif : eq.dif}</td>
    </tr>
  `).join('');
}

// 2. Renderizar Jugadores en Cartas
function renderizarJugadores(jugadores) {
  const contenedor = document.getElementById('contenedor-jugadores');
  if (!contenedor) return;

  contenedor.innerHTML = jugadores.map(j => `
    <div class="card-jugador" onclick="abrirModal(${j.id})">
      <div class="badge-jugador">
        <span class="dorsal">#${j.numero}</span>
        <span class="posicion-badge">${j.posicion}</span>
      </div>
      <div class="foto-contenedor-grande">
        <img src="${j.foto || 'assets/jugadores/default.jpg'}" alt="${j.nombre}" class="foto-jugador-grande" onerror="this.src='https://via.placeholder.com/300x350/0b532c/fbc02d?text=${encodeURIComponent(j.nombre)}'">
      </div>
      <h3>${j.nombre}</h3>
      <div class="stats-grid-fiba">
        <div class="stat-box-fiba"><span class="val">${j.partidos || 0}</span><span class="lbl">PJ</span></div>
        <div class="stat-box-fiba"><span class="val">${j.goles || 0}</span><span class="lbl">GOL</span></div>
        <div class="stat-box-fiba"><span class="val">${j.asistencias || 0}</span><span class="lbl">AST</span></div>
        <div class="stat-box-fiba"><span class="val">🟨${j.amarillas || 0}</span><span class="lbl">TAR</span></div>
      </div>
    </div>
  `).join('');
}

// 3. Tablas de Líderes
function renderizarLideres(jugadores) {
  const bodyGoles = document.getElementById('tabla-goleadores-body');
  const bodyAsist = document.getElementById('tabla-asistidores-body');

  const topGoles = [...jugadores].sort((a, b) => (b.goles || 0) - (a.goles || 0));
  const topAsist = [...jugadores].sort((a, b) => (b.asistencias || 0) - (a.asistencias || 0));

  if (bodyGoles) {
    bodyGoles.innerHTML = topGoles.map((j, i) => `
      <tr>
        <td><strong>${i + 1}</strong></td>
        <td>${j.nombre} (#${j.numero})</td>
        <td>${j.partidos || 0}</td>
        <td><strong>${j.goles || 0}</strong></td>
      </tr>
    `).join('');
  }

  if (bodyAsist) {
    bodyAsist.innerHTML = topAsist.map((j, i) => `
      <tr>
        <td><strong>${i + 1}</strong></td>
        <td>${j.nombre} (#${j.numero})</td>
        <td>${j.partidos || 0}</td>
        <td><strong>${j.asistencias || 0}</strong></td>
      </tr>
    `).join('');
  }
}

// 4. Renderizar Partidos en la Sección del Equipo
function renderizarPartidos(partidos) {
  const contenedor = document.getElementById('contenedor-partidos');
  if (!contenedor) return;

  // Filtrar solo los partidos donde juegue Combinado para el fixture propio
  const partidosCombinado = partidos.filter(p => 
    (!p.equipoLocal && !p.equipoVisitante) || 
    p.equipoLocal === "Combinado" || 
    p.equipoVisitante === "Combinado"
  );

  contenedor.innerHTML = partidosCombinado.map(p => {
    const esLocal = p.equipoLocal ? (p.equipoLocal === "Combinado") : true;
    const rival = p.equipoLocal ? (esLocal ? p.equipoVisitante : p.equipoLocal) : p.rival;
    const gf = p.equipoLocal ? (esLocal ? p.golesLocal : p.golesVisitante) : p.golesFavor;
    const gr = p.equipoLocal ? (esLocal ? p.golesVisitante : p.golesLocal) : p.golesRival;

    return `
      <div class="card-partido">
        <div class="partido-info">
          <span>📅 ${p.fecha} ${p.hora ? `- ${p.hora} hs` : ''}</span>
          <span>📍 ${p.condicion || (esLocal ? 'Local' : 'Visitante')}</span>
        </div>
        <div class="partido-resultado">
          <div class="equipo">Combinado</div>
          <div class="score">${p.estado === 'finalizado' ? `${gf} -${gr}` : 'VS'}</div>
          <div class="equipo rival">${rival}</div>
        </div>
        ${p.goleadores && p.goleadores.length > 0 ? `
          <div class="partido-goleadores">⚽ Goles: ${p.goleadores.join(', ')}</div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// 5. Filtros y Modal
function configurarFiltros() {
  const botones = document.querySelectorAll('.btn-filtro');
  botones.forEach(btn => {
    btn.addEventListener('click', (e) => {
      botones.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const pos = e.target.getAttribute('data-posicion');
      if (pos === 'Todos') {
        renderizarJugadores(listaJugadores);
      } else {
        const filtrados = listaJugadores.filter(j => 
          j.posicion.toLowerCase().includes(pos.toLowerCase()) || 
          (pos === 'Mediocampista' && j.posicion.toLowerCase().includes('medio'))
        );
        renderizarJugadores(filtrados);
      }
    });
  });
}

function abrirModal(id) {
  const j = listaJugadores.find(item => item.id === id);
  if (!j) return;
  const modal = document.getElementById('modal-jugador');
  const body = document.getElementById('modal-detalle-body');

  body.innerHTML = `
    <div style="text-align:center;">
      <h2 style="border:none; padding:0; margin-bottom:5px;">${j.nombre}</h2>
      <span class="posicion-badge" style="display:inline-block; margin-bottom:15px;">${j.posicion} - #${j.numero}</span>
      <div class="stats-grid-fiba" style="margin-top:15px;">
        <div class="stat-box-fiba"><span class="val">${j.partidos || 0}</span><span class="lbl">Partidos</span></div>
        <div class="stat-box-fiba"><span class="val">${j.goles || 0}</span><span class="lbl">Goles</span></div>
        <div class="stat-box-fiba"><span class="val">${j.asistencias || 0}</span><span class="lbl">Asistencias</span></div>
        <div class="stat-box-fiba"><span class="val">🟨${j.amarillas || 0} / 🟥${j.rojas || 0}</span><span class="lbl">Tarjetas</span></div>
      </div>
    </div>
  `;
  modal.style.display = 'flex';
}

function configurarModal() {
  const modal = document.getElementById('modal-jugador');
  const cerrar = document.querySelector('.cerrar-modal');
  if (cerrar) cerrar.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}