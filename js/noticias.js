/* ===== LISTADO DE NOTICIAS ===== */

let noticias = [];
let categoriaActual = 'Todas';
let textoBusqueda = '';

function tarjetaNoticia(n) {
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

function dibujarFiltros() {
  const categorias = [...new Set(noticias.map(n => n.categoria).filter(Boolean))];
  const botones = ['Todas', ...categorias].map(c => {
    const cant = c === 'Todas' ? noticias.length : noticias.filter(n => n.categoria === c).length;
    return `<button class="filtro ${c === categoriaActual ? 'activo' : ''}" data-cat="${esc(c)}">
              ${esc(c)}<small>${cant}</small></button>`;
  });
  document.getElementById('filtros').innerHTML = botones.join('');
}

function dibujarLista() {
  const q = textoBusqueda.trim().toLowerCase();
  const lista = noticias.filter(n => {
    const okCat = categoriaActual === 'Todas' || n.categoria === categoriaActual;
    const okTexto = !q || `${n.titulo} ${n.resumen}`.toLowerCase().includes(q);
    return okCat && okTexto;
  });
  document.getElementById('lista-noticias').innerHTML =
    lista.map(tarjetaNoticia).join('') ||
    '<p class="mensaje-vacio">No encontramos noticias con ese filtro.</p>';
}

async function iniciarNoticias() {
  try {
    noticias = (await cargarJSON('data/noticias.json'))
      .sort((a, b) => parsearFecha(b.fecha) - parsearFecha(a.fecha));
  } catch (e) {
    console.error(e);
    document.getElementById('lista-noticias').innerHTML =
      '<p class="mensaje-vacio">No se pudieron cargar las noticias. Revisá data/noticias.json.</p>';
    return;
  }

  dibujarFiltros();
  dibujarLista();

  document.getElementById('filtros').addEventListener('click', e => {
    const btn = e.target.closest('.filtro');
    if (!btn) return;
    categoriaActual = btn.dataset.cat;
    dibujarFiltros();
    dibujarLista();
  });

  document.getElementById('buscador').addEventListener('input', e => {
    textoBusqueda = e.target.value;
    dibujarLista();
  });
}

document.addEventListener('DOMContentLoaded', iniciarNoticias);