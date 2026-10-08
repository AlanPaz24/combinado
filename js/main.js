// ==========================================
// COMBINADO FC - MAIN.JS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    cargarPartidos();
    cargarGaleria();
    actualizarAnio();

});


// ==========================================
// PARTIDOS
// ==========================================

async function cargarPartidos() {

    try {

        const respuesta = await fetch("data/partidos.json");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar partidos.json");
        }

        const datos = await respuesta.json();

        const partidos = datos.partidos || [];

        if (partidos.length === 0) {
            return;
        }

        // Ordenar por fecha
        partidos.sort((a, b) => {
            return new Date(a.fecha_partido) - new Date(b.fecha_partido);
        });

        mostrarUltimoPartido(partidos);
        mostrarFixture(partidos);

    } catch (error) {

        console.error("Error cargando partidos:", error);

    }

}


// ==========================================
// ÚLTIMO PARTIDO
// ==========================================

function mostrarUltimoPartido(partidos) {

    const finalizados = partidos.filter(
        partido => partido.estado === "finalizado"
    );

    if (finalizados.length === 0) {
        return;
    }

    const ultimo = finalizados[finalizados.length - 1];

    const seccion = document.querySelector("#ultimo-partido");

    if (!seccion) {
        return;
    }

    seccion.innerHTML = `

        <div class="resultado-card">

            <div class="resultado-header">
                <span>${ultimo.torneo}</span>
                <span>Fecha ${ultimo.fecha}</span>
            </div>

            <div class="resultado-equipos">

                <div class="equipo">
                    <strong>${ultimo.local}</strong>
                    <span>${ultimo.goles_local}</span>
                </div>

                <div class="resultado-separador">
                    -
                </div>

                <div class="equipo">
                    <strong>${ultimo.visitante}</strong>
                    <span>${ultimo.goles_visitante}</span>
                </div>

            </div>

            <div class="resultado-goleadores">

                ${generarGoleadores(ultimo.goleadores)}

            </div>

        </div>

    `;

}


// ==========================================
// GOLEADORES
// ==========================================

function generarGoleadores(goleadores) {

    if (!goleadores || goleadores.length === 0) {
        return "";
    }

    return `

        <div class="goleadores">

            <strong>⚽ Goles:</strong>

            ${goleadores.map(goleador => `
                <span>
                    ${goleador.jugador}
                    ${goleador.goles > 1 ? ` x${goleador.goles}` : ""}
                </span>
            `).join("")}

        </div>

    `;

}


// ==========================================
// FIXTURE Y RESULTADOS
// ==========================================

function mostrarFixture(partidos) {

    const contenedor = document.querySelector("#lista-partidos");

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    partidos.forEach(partido => {

        const resultado = partido.estado === "finalizado"
            ? `${partido.goles_local} - ${partido.goles_visitante}`
            : "vs";

        const tarjeta = document.createElement("div");

        tarjeta.className = "partido-card";

        tarjeta.innerHTML = `

            <div class="partido-info">

                <span class="partido-torneo">
                    ${partido.torneo}
                </span>

                <span class="partido-fecha">
                    Fecha ${partido.fecha}
                </span>

            </div>

            <div class="partido-equipos">

                <strong>${partido.local}</strong>

                <span class="partido-resultado">
                    ${resultado}
                </span>

                <strong>${partido.visitante}</strong>

            </div>

        `;

        contenedor.appendChild(tarjeta);

    });

}


// ==========================================
// GALERÍA
// ==========================================

const fotosGaleria = [

    {
        imagen: "img/galeria/foto1.jpg",
        categoria: "partidos",
        titulo: "Día de partido"
    },

    {
        imagen: "img/galeria/foto2.jpg",
        categoria: "equipo",
        titulo: "Combinado FC"
    },

    {
        imagen: "img/galeria/foto3.jpg",
        categoria: "momentos",
        titulo: "Momentos"
    },

    {
        imagen: "img/galeria/foto4.jpg",
        categoria: "partidos",
        titulo: "Partido"
    },

    {
        imagen: "img/galeria/foto5.jpg",
        categoria: "equipo",
        titulo: "El equipo"
    },

    {
        imagen: "img/galeria/foto6.jpg",
        categoria: "momentos",
        titulo: "Momentos Combinado"
    }

];


let fotosFiltradas = [...fotosGaleria];

let fotoActual = 0;


// ==========================================
// MOSTRAR GALERÍA
// ==========================================

function cargarGaleria() {

    const galeria = document.querySelector("#galeria");

    if (!galeria) {
        return;
    }

    mostrarFotos("todos");

}


// ==========================================
// FILTRO GALERÍA
// ==========================================

function mostrarFotos(categoria) {

    const galeria = document.querySelector("#galeria");

    if (!galeria) {
        return;
    }

    if (categoria === "todos") {

        fotosFiltradas = [...fotosGaleria];

    } else {

        fotosFiltradas = fotosGaleria.filter(
            foto => foto.categoria === categoria
        );

    }

    galeria.innerHTML = "";

    fotosFiltradas.forEach((foto, indice) => {

        const elemento = document.createElement("div");

        elemento.className = "galeria-item";

        elemento.innerHTML = `

            <img
                src="${foto.imagen}"
                alt="${foto.titulo}"
                onclick="abrirGaleria(${indice})"
            >

            <div class="galeria-overlay">
                <span>${foto.titulo}</span>
            </div>

        `;

        galeria.appendChild(elemento);

    });

}


// ==========================================
// ABRIR FOTO
// ==========================================

function abrirGaleria(indice) {

    fotoActual = indice;

    const modal = document.querySelector("#galeriaModal");
    const imagen = document.querySelector("#imagenModal");
    const titulo = document.querySelector("#tituloModal");

    if (!modal || !imagen) {
        return;
    }

    imagen.src = fotosFiltradas[fotoActual].imagen;

    if (titulo) {
        titulo.textContent = fotosFiltradas[fotoActual].titulo;
    }

    modal.classList.add("activo");

}


// ==========================================
// CERRAR FOTO
// ==========================================

function cerrarGaleria() {

    const modal = document.querySelector("#galeriaModal");

    if (!modal) {
        return;
    }

    modal.classList.remove("activo");

}


// ==========================================
// FOTO ANTERIOR
// ==========================================

function fotoAnterior() {

    if (fotosFiltradas.length === 0) {
        return;
    }

    fotoActual--;

    if (fotoActual < 0) {
        fotoActual = fotosFiltradas.length - 1;
    }

    actualizarFotoModal();

}


// ==========================================
// FOTO SIGUIENTE
// ==========================================

function fotoSiguiente() {

    if (fotosFiltradas.length === 0) {
        return;
    }

    fotoActual++;

    if (fotoActual >= fotosFiltradas.length) {
        fotoActual = 0;
    }

    actualizarFotoModal();

}


// ==========================================
// ACTUALIZAR MODAL
// ==========================================

function actualizarFotoModal() {

    const imagen = document.querySelector("#imagenModal");
    const titulo = document.querySelector("#tituloModal");

    if (!imagen) {
        return;
    }

    imagen.src = fotosFiltradas[fotoActual].imagen;

    if (titulo) {
        titulo.textContent = fotosFiltradas[fotoActual].titulo;
    }

}


// ==========================================
// FILTROS DE GALERÍA
// ==========================================

document.addEventListener("click", (event) => {

    const boton = event.target.closest("[data-filtro]");

    if (!boton) {
        return;
    }

    const filtro = boton.dataset.filtro;

    document
        .querySelectorAll("[data-filtro]")
        .forEach(btn => btn.classList.remove("activo"));

    boton.classList.add("activo");

    mostrarFotos(filtro);

});


// ==========================================
// TECLADO GALERÍA
// ==========================================

document.addEventListener("keydown", (event) => {

    const modal = document.querySelector("#galeriaModal");

    if (!modal || !modal.classList.contains("activo")) {
        return;
    }

    if (event.key === "Escape") {
        cerrarGaleria();
    }

    if (event.key === "ArrowLeft") {
        fotoAnterior();
    }

    if (event.key === "ArrowRight") {
        fotoSiguiente();
    }

});


// ==========================================
// AÑO AUTOMÁTICO
// ==========================================

function actualizarAnio() {

    const elemento = document.querySelector("#anio");

    if (elemento) {
        elemento.textContent = new Date().getFullYear();
    }

}