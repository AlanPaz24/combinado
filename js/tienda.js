/* ===== TIENDA ===== */

const CLAVE_CARRITO = 'combinado-carrito';
let productos = [];
let config = {};
let categoriaActual = 'Todos';
let carrito = leerCarrito();   // [{ id, talle, cant }]

/* ----- Guardado en el celular del cliente ----- */

function leerCarrito() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    return Array.isArray(d) ? d : [];
  } catch { return []; }
}
function guardarCarrito() {
  try { localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito)); } catch { /* sin guardado */ }
}

/* ----- Productos ----- */

function tarjetaProducto(p) {
  const agotado = p.disponible === false;
  const talles = (p.talles || []).map(t =>
    `<button type="button" class="talle" data-talle="${esc(t)}">${esc(t)}</button>`).join('');

  return `
    <article class="producto ${agotado ? 'agotado' : ''}" data-id="${esc(p.id)}">
      <div class="producto-img">
        <img src="${esc(p.imagen)}" alt="${esc(p.nombre)}${p.detalle ? ' — ' + esc(p.detalle) : ''}" loading="lazy"
             onerror="this.src='img/logo/escudo.png'">
        ${agotado ? '<span class="sello">Agotado</span>' : ''}
      </div>
      <div class="producto-info">
        <h3>${esc(p.nombre)}</h3>
        ${p.detalle ? `<p class="detalle">${esc(p.detalle)}</p>` : ''}
        ${talles ? `<div class="talles" role="group" aria-label="Talles">${talles}</div>` : ''}
        <p class="precio">${precio(p.precio)}</p>
        <button class="boton agregar" ${agotado ? 'disabled' : ''}>${agotado ? 'Agotado' : 'Agregar al pedido'}</button>
        <small class="aviso" aria-live="polite"></small>
      </div>
    </article>`;
}

function dibujarFiltros() {
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  const filtros = document.getElementById('filtros');
  if (!categorias.length) { filtros.innerHTML = ''; return; }
  filtros.innerHTML = ['Todos', ...categorias].map(c => {
    const cant = c === 'Todos' ? productos.length : productos.filter(p => p.categoria === c).length;
    return `<button class="filtro ${c === categoriaActual ? 'activo' : ''}" data-cat="${esc(c)}">${esc(c)}<small>${cant}</small></button>`;
  }).join('');
}

function dibujarProductos() {
  const lista = categoriaActual === 'Todos' ? productos : productos.filter(p => p.categoria === categoriaActual);
  document.getElementById('grid-productos').innerHTML =
    lista.map(tarjetaProducto).join('') || '<p class="mensaje-vacio">No hay productos en esta categoría.</p>';
}

/* ----- Carrito ----- */

function buscarProducto(id) { return productos.find(p => p.id === id); }

function agregarAlCarrito(id, talle) {
  const item = carrito.find(i => i.id === id && i.talle === talle);
  if (item) item.cant++; else carrito.push({ id, talle, cant: 1 });
  guardarCarrito();
  dibujarCarrito();
  const btn = document.getElementById('abrir-carrito');
  btn.classList.remove('salto'); void btn.offsetWidth; btn.classList.add('salto');
}

function cambiarCantidad(i, delta) {
  if (!carrito[i]) return;
  carrito[i].cant += delta;
  if (carrito[i].cant <= 0) carrito.splice(i, 1);
  guardarCarrito();
  dibujarCarrito();
}

function quitarItem(i) {
  carrito.splice(i, 1);
  guardarCarrito();
  dibujarCarrito();
}

function mensajeWhatsApp(lineas, total) {
  const detalle = lineas.map(l =>
    `• ${l.cant}x ${l.p.nombre}${l.talle ? ' (Talle ' + l.talle + ')' : ''} — ${precio(l.p.precio * l.cant)}`
  ).join('\n');
  return `¡Hola ${config.nombre || 'Combinado FC'}! Quiero hacer este pedido:\n\n${detalle}\n\nTotal: ${precio(total)}\n\nMi nombre es: `;
}

function dibujarCarrito() {
  // Se descartan productos que ya no existen en el catálogo
  carrito = carrito.filter(i => buscarProducto(i.id));
  const lineas = carrito.map(i => ({ ...i, p: buscarProducto(i.id) }));
  const cantidad = lineas.reduce((s, l) => s + l.cant, 0);
  const total = lineas.reduce((s, l) => s + l.p.precio * l.cant, 0);

  document.getElementById('carrito-cant').textContent = cantidad;

  const items = document.getElementById('carrito-items');
  const pie = document.getElementById('carrito-pie');

  if (!lineas.length) {
    items.innerHTML = '<p class="carrito-vacio">Todavía no agregaste nada.<br>¡Elegí algo de la tienda!</p>';
    pie.innerHTML = '';
    return;
  }

  items.innerHTML = lineas.map((l, i) => `
    <div class="item-carrito">
      <img src="${esc(l.p.imagen)}" alt="${esc(l.p.nombre)}" onerror="this.src='img/logo/escudo.png'">
      <div>
        <h4>${esc(l.p.nombre)}</h4>
        ${l.talle ? `<small>Talle ${esc(l.talle)}</small>` : ''}
        <div class="cantidad">
          <button data-accion="menos" data-i="${i}" aria-label="Quitar uno">−</button>
          <b>${l.cant}</b>
          <button data-accion="mas" data-i="${i}" aria-label="Agregar uno">+</button>
        </div>
        <p class="sub">${precio(l.p.precio * l.cant)}</p>
      </div>
      <button class="item-quitar" data-accion="quitar" data-i="${i}" aria-label="Quitar del pedido">🗑</button>
    </div>`).join('');

  const link = `https://wa.me/${esc(config.whatsapp)}?text=${encodeURIComponent(mensajeWhatsApp(lineas, total))}`;
  pie.innerHTML = `
    <div class="total"><span>Total</span><b>${precio(total)}</b></div>
    <a class="boton" href="${link}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
    <button class="vaciar" data-accion="vaciar">Vaciar pedido</button>`;
}

/* ----- Abrir / cerrar panel ----- */

function abrirCarrito() {
  document.getElementById('carrito').classList.add('abierto');
  document.getElementById('carrito').setAttribute('aria-hidden', 'false');
  document.getElementById('carrito-fondo').hidden = false;
}
function cerrarCarrito() {
  document.getElementById('carrito').classList.remove('abierto');
  document.getElementById('carrito').setAttribute('aria-hidden', 'true');
  document.getElementById('carrito-fondo').hidden = true;
}

/* ----- Inicio ----- */

async function iniciarTienda() {
  try {
    [productos, config] = await Promise.all([
      cargarJSON('data/productos.json'),
      cargarJSON('data/config.json')
    ]);
  } catch (e) {
    console.error(e);
    document.getElementById('grid-productos').innerHTML =
      '<p class="mensaje-vacio">No se pudo cargar la tienda. Revisá data/productos.json.</p>';
    return;
  }

  dibujarFiltros();
  dibujarProductos();
  dibujarCarrito();

  document.getElementById('filtros').addEventListener('click', e => {
    const btn = e.target.closest('.filtro');
    if (!btn) return;
    categoriaActual = btn.dataset.cat;
    dibujarFiltros();
    dibujarProductos();
  });

  // Clics dentro de la grilla: elegir talle y agregar
  document.getElementById('grid-productos').addEventListener('click', e => {
    const card = e.target.closest('.producto');
    if (!card) return;
    const aviso = card.querySelector('.aviso');

    const talleBtn = e.target.closest('.talle');
    if (talleBtn) {
      card.querySelectorAll('.talle').forEach(b => b.classList.remove('activo'));
      talleBtn.classList.add('activo');
      aviso.textContent = '';
      return;
    }

    if (e.target.closest('.agregar')) {
      const p = buscarProducto(card.dataset.id);
      if (!p || p.disponible === false) return;

      const tieneTalles = (p.talles || []).length > 0;
      const elegido = card.querySelector('.talle.activo');
      if (tieneTalles && !elegido) {
        aviso.textContent = 'Elegí un talle primero';
        aviso.classList.add('error');
        return;
      }
      aviso.classList.remove('error');
      agregarAlCarrito(p.id, elegido ? elegido.dataset.talle : '');
      aviso.textContent = '✓ Agregado a tu pedido';
      setTimeout(() => { aviso.textContent = ''; }, 2000);
    }
  });

  // Clics dentro del carrito
  document.getElementById('carrito').addEventListener('click', e => {
    const b = e.target.closest('[data-accion]');
    if (!b) return;
    const i = Number(b.dataset.i);
    if (b.dataset.accion === 'mas') cambiarCantidad(i, 1);
    if (b.dataset.accion === 'menos') cambiarCantidad(i, -1);
    if (b.dataset.accion === 'quitar') quitarItem(i);
    if (b.dataset.accion === 'vaciar' && confirm('¿Vaciar todo el pedido?')) {
      carrito = []; guardarCarrito(); dibujarCarrito();
    }
  });

  document.getElementById('abrir-carrito').addEventListener('click', abrirCarrito);
  document.getElementById('cerrar-carrito').addEventListener('click', cerrarCarrito);
  document.getElementById('carrito-fondo').addEventListener('click', cerrarCarrito);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarCarrito(); });
}

document.addEventListener('DOMContentLoaded', iniciarTienda);