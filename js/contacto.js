/* ===== CONTACTO ===== */

let config = {};

function tarjeta(icono, titulo, detalle, url) {
  return `
    <a class="tarjeta-contacto" href="${esc(url)}" target="_blank" rel="noopener">
      <span class="ico">${icono}</span>
      <span><b>${esc(titulo)}</b><small>${esc(detalle)}</small></span>
    </a>`;
}

function armarTexto() {
  const nombre = document.getElementById('f-nombre').value.trim();
  const motivo = document.getElementById('f-motivo').value;
  const mensaje = document.getElementById('f-mensaje').value.trim();
  return { nombre, motivo, mensaje };
}

function validar() {
  const { nombre, mensaje } = armarTexto();
  const aviso = document.getElementById('form-aviso');
  if (!nombre || !mensaje) {
    aviso.textContent = 'Completá tu nombre y el mensaje.';
    return false;
  }
  aviso.textContent = '';
  return true;
}

async function iniciarContacto() {
  try {
    config = await cargarJSON('data/config.json');
  } catch (e) {
    console.error(e);
    return;
  }

  const canales = [
    tarjeta('💬', 'WhatsApp', 'Respondemos lo antes posible', `https://wa.me/${config.whatsapp}`),
    config.redes?.instagram ? tarjeta('📸', 'Instagram', 'Fotos y novedades', config.redes.instagram) : '',
    config.redes?.youtube ? tarjeta('▶️', 'YouTube', 'Resúmenes y videos', config.redes.youtube) : '',
    config.email ? tarjeta('✉️', 'Email', config.email, `mailto:${config.email}`) : ''
  ].join('');
  document.getElementById('canales').innerHTML = canales;

  // Enviar por WhatsApp
  document.getElementById('formulario').addEventListener('submit', e => {
    e.preventDefault();
    if (!validar()) return;
    const { nombre, motivo, mensaje } = armarTexto();
    const texto = `Hola ${config.nombre}! Soy ${nombre}.\nMotivo: ${motivo}\n\n${mensaje}`;
    window.open(`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  });

  // Enviar por email
  document.getElementById('btn-email').addEventListener('click', () => {
    if (!validar()) return;
    const { nombre, motivo, mensaje } = armarTexto();
    const asunto = `${motivo} — ${nombre}`;
    const cuerpo = `Hola! Soy ${nombre}.\n\n${mensaje}`;
    location.href = `mailto:${config.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  });
}

document.addEventListener('DOMContentLoaded', iniciarContacto);