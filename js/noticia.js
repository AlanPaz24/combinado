/* ===== PÁGINA DE UNA NOTICIA ===== */

function tarjetaRelacionada(n) {
  return `
    <a class="noticia" href="noticia.html?id=${encodeURIComponent(n.id)}">
      <img src="${esc(n.imagen)}" alt="${esc(n.titulo)}" loading="lazy"
           onerror="this.src='img/logo/escudo.png'">
      <div class="cuerpo">
        <span class="cat">${esc(n.categoria)}</span>
        <h3>${esc(n.titulo)}</h3>
        <span class="fecha">${fechaCorta(n.fecha)}</span>
      </div>
    </a>`;
}

function copiarLink(boton) {
  const url = location.href;
  const listo = () => { boton.textContent = '¡Link copiado!'; setTimeout(() => boton.textContent = 'Copiar link', 2000); };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(listo).catch(() => prompt('Copiá este link:', url));
  } else {
    prompt('Copiá este link:', url);
  }
}

async function iniciarNoticia() {
  const cont = document.getElementById('articulo');
  const id = new URLSearchParams(location.search).get('id');

  let lista;
  try {
    lista = await cargarJSON('data/noticias.json');
  } catch (e) {
    console.error(e);
    cont.innerHTML = '<p class="mensaje-vacio">No se pudo cargar la noticia.</p>';
    return;
  }

  const n = lista.find(x => x.id === id);
  if (!n) {
    cont.innerHTML = `
      <p class="mensaje-vacio">No encontramos esta noticia.</p>
      <div class="centro"><a href="noticias.html" class="boton secundario">Ver todas las noticias</a></div>`;
    return;
  }

  // Título de la pestaña y descripción
  document.title = `${n.titulo} — Combinado FC`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', n.resumen || n.titulo);

  const parrafos = (Array.isArray(n.contenido) ? n.contenido : [n.contenido])
    .filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('');

  const fotos = (n.fotos || []).map(f =>
    `<img src="${esc(f)}" alt="Foto de la noticia: ${esc(n.titulo)}" loading="lazy" onerror="this.remove()">`
  ).join('');

  const textoWsp = encodeURIComponent(`${n.titulo} — Combinado FC\n${location.href}`);

  cont.innerHTML = `
    <a href="noticias.html" class="volver">← Todas las noticias</a>
    <span class="cat">${esc(n.categoria)}</span>
    <h1>${esc(n.titulo)}</h1>
    <p class="articulo-meta">${fechaLarga(n.fecha)}${n.autor ? ' · Por ' + esc(n.autor) : ''}</p>
    <img class="articulo-img" src="${esc(n.imagen)}" alt="${esc(n.titulo)}" onerror="this.src='img/logo/escudo.png'">
    ${n.pie ? `<p class="articulo-pie">${esc(n.pie)}</p>` : ''}
    <div class="articulo-texto">${parrafos}</div>
    ${fotos ? `<div class="fotos-extra">${fotos}</div>` : ''}
    <div class="compartir">
      <span>Compartir</span>
      <a class="boton" target="_blank" rel="noopener" href="https://wa.me/?text=${textoWsp}">WhatsApp</a>
      <button class="boton secundario" id="btn-copiar">Copiar link</button>
    </div>`;

  document.getElementById('btn-copiar').addEventListener('click', e => copiarLink(e.target));

  // Relacionadas: primero la misma categoría, después las más nuevas
  const otras = lista
    .filter(x => x.id !== n.id)
    .sort((a, b) =>
      (b.categoria === n.categoria) - (a.categoria === n.categoria) ||
      parsearFecha(b.fecha) - parsearFecha(a.fecha))
    .slice(0, 3);

  if (otras.length) {
    document.getElementById('lista-relacionadas').innerHTML = otras.map(tarjetaRelacionada).join('');
    document.getElementById('relacionadas').hidden = false;
  }
}

document.addEventListener('DOMContentLoaded', iniciarNoticia);