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

// 1. Calcula la Tabla de Posiciones Automáticamente
function calcularYRenderizarTabla(partidos, equipos) {
  const tablaMap = {};

  equipos.forEach(eq => {
    tablaMap[eq.nombre] = {
      nombre: eq.nombre,
      esMiEquipo: eq.esMiEquipo || false,
      pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0
    };
  });

  partidos.filter(p => p.estado === 'finalizado').forEach(p => {
    const miEq = "Combinado FC";
    const rival = p.rival;

    if (!tablaMap[rival]) {
      tablaMap[rival] = { nombre: rival, esMiEquipo: false, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dif: 0 };
    }

    const gfMi = p.golesFavor;
    const gfRival = p.golesRival;

    tablaMap[miEq].pj++;
    tablaMap[miEq].gf += gfMi;
    tablaMap[miEq].gc += gfRival;

    tablaMap[rival].pj++;
    tablaMap[rival].gf += gfRival;
    tablaMap[rival].gc += gfMi;

    if (gfMi > gfRival) {
      tablaMap[miEq].pts += 3; tablaMap[miEq].pg++;
      tablaMap[rival].pp++;
    } else if (gfMi < gfRival) {
      tablaMap[rival].pts += 3; tablaMap[rival].pg++;
      tablaMap[miEq].pp++;
    } else {
      tablaMap[miEq].pts += 1; tablaMap[miEq].pe++;
      tablaMap[rival].pts += 1; tablaMap[rival].pe++;
    }
  });

  const tablaArray = Object.values(tablaMap).map(eq => {
    eq.dif = eq.gf - eq.gc;
    return eq;
  });

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

// 2. Renderizar Jugadores
function renderizarJugadores(jugadores) {
  const contenedor = document.getElementById('contenedor-jugadores');
  if (!contenedor) return;

  contenedor.innerHTML = jugadores.map(j => `
    <div class="card-jugador" onclick="abrirModal(${j.id})">
      <div class="dorsal">#${j.numero}</div>
      <div class="foto-contenedor">
        <img src="${j.foto}" alt="${j.nombre}" class="foto-jugador" onerror="this.src='https://via.placeholder.com/150'">
      </div>
      <h3>${j.nombre}</h3>
      <span class="posicion">${j.posicion}</span>
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-valor">${j.partidos || 0}</span><span class="stat-label">PJ</span></div>
        <div class="stat-item"><span class="stat-valor">${j.goles || 0}</span><span class="stat-label">Goles</span></div>
        <div class="stat-item"><span class="stat-valor">${j.asistencias || 0}</span><span class="stat-label">Asist.</span></div>
        <div class="stat-item"><span class="stat-valor">🟨 ${j.amarillas || 0}</span><span class="stat-label">Tarjetas</span></div>
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

// 4. Renderizar Partidos
function renderizarPartidos(partidos) {
  const contenedor = document.getElementById('contenedor-partidos');
  if (!contenedor) return;

  contenedor.innerHTML = partidos.map(p => `
    <div class="card-partido">
      <div class="partido-info">
        <span>📅 ${p.fecha} - ${p.hora} hs</span>
        <span>📍 ${p.condicion}</span>
      </div>
      <div class="partido-resultado">
        <div class="equipo">Combinado FC</div>
        <div class="score">${p.estado === 'finalizado' ? `${p.golesFavor} -${p.golesRival}` : 'VS'}</div>
        <div class="equipo rival">${p.rival}</div>
      </div>
      ${p.goleadores && p.goleadores.length > 0 ? `
        <div class="partido-goleadores">⚽ Goles: ${p.goleadores.join(', ')}</div>
      ` : ''}
    </div>
  `).join('');
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
          (pos === 'Mediocampista' && j.posicion === 'Medio Campista')
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
      <span class="posicion">${j.posicion} - #${j.numero}</span>
      <div class="stats-grid" style="margin-top:20px;">
        <div class="stat-item"><span class="stat-valor">${j.partidos || 0}</span><span class="stat-label">Partidos</span></div>
        <div class="stat-item"><span class="stat-valor">${j.goles || 0}</span><span class="stat-label">Goles</span></div>
        <div class="stat-item"><span class="stat-valor">${j.asistencias || 0}</span><span class="stat-label">Asistencias</span></div>
        <div class="stat-item"><span class="stat-valor">🟨 ${j.amarillas || 0} / 🟥 ${j.rojas || 0}</span><span class="stat-label">Tarjetas</span></div>
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