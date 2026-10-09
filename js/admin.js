let listaJugadores = [];
let listaEquipos = [];
let listaPartidos = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [resJ, resP, resE] = await Promise.all([
      fetch('data/jugadores.json'),
      fetch('data/partidos.json'),
      fetch('data/equipos.json')
    ]);

    listaJugadores = await resJ.json();
    listaPartidos = await resP.json();
    listaEquipos = await resE.json();

    cargarSelectEquipos();
    renderizarTablaJugadores();
  } catch (err) {
    console.error("Error al cargar datos:", err);
  }
});

function cargarSelectEquipos() {
  const select = document.getElementById('partido-rival');
  select.innerHTML = listaEquipos
    .filter(eq => !eq.esMiEquipo)
    .map(eq => `<option value="${eq.nombre}">${eq.nombre}</option>`)
    .join('');
}

function renderizarTablaJugadores() {
  const tbody = document.getElementById('tbody-admin-jugadores');
  tbody.innerHTML = listaJugadores.map(j => `
    <tr>
      <td style="text-align:left; font-weight:700;">${j.nombre} (#${j.numero})</td>
      <td><input type="number" id="pj-${j.id}" value="${j.partidos || 0}"></td>
      <td><input type="number" id="gol-${j.id}" value="${j.goles || 0}"></td>
      <td><input type="number" id="ast-${j.id}" value="${j.asistencias || 0}"></td>
      <td><input type="number" id="ama-${j.id}" value="${j.amarillas || 0}"></td>
      <td><input type="number" id="roj-${j.id}" value="${j.rojas || 0}"></td>
    </tr>
  `).join('');
}

function agregarPartido() {
  const rival = document.getElementById('partido-rival').value;
  const fecha = document.getElementById('partido-fecha').value;
  const hora = document.getElementById('partido-hora').value;
  const estado = document.getElementById('partido-estado').value;
  const gf = parseInt(document.getElementById('goles-favor').value) || 0;
  const gr = parseInt(document.getElementById('goles-rival').value) || 0;
  const golStr = document.getElementById('partido-goleadores').value;

  const goleadoresArray = golStr ? golStr.split(',').map(s => s.trim()) : [];

  const nuevoPartido = {
    id: listaPartidos.length + 1,
    rival: rival,
    fecha: fecha,
    hora: hora,
    condicion: "Local",
    estado: estado,
    golesFavor: estado === 'finalizado' ? gf : null,
    golesRival: estado === 'finalizado' ? gr : null,
    goleadores: goleadoresArray
  };

  listaPartidos.push(nuevoPartido);
  alert(`Partido contra ${rival} agregado con éxito a la lista.`);
}

function generarJSONs() {
  // Actualizar listaJugadores desde la tabla de admin
  listaJugadores.forEach(j => {
    j.partidos = parseInt(document.getElementById(`pj-${j.id}`).value) || 0;
    j.goles = parseInt(document.getElementById(`gol-${j.id}`).value) || 0;
    j.asistencias = parseInt(document.getElementById(`ast-${j.id}`).value) || 0;
    j.amarillas = parseInt(document.getElementById(`ama-${j.id}`).value) || 0;
    j.rojas = parseInt(document.getElementById(`roj-${j.id}`).value) || 0;
  });

  document.getElementById('json-partidos-out').value = JSON.stringify(listaPartidos, null, 2);
  document.getElementById('json-jugadores-out').value = JSON.stringify(listaJugadores, null, 2);

  document.getElementById('seccion-resultados').style.display = 'block';
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}