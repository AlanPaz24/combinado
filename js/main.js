// ======================================================
// COMBINADO FC - MAIN.JS
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    cargarPartidos();
    cargarGaleria();
    actualizarAnio();
    configurarMenu();

});


// ======================================================
// PARTIDOS
// ======================================================

async function cargarPartidos() {

    try {

        const respuesta = await fetch("data/partidos.json");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar partidos.json");
        }

        const datos = await respuesta.json();

        const partidos = datos.partidos || [];

        console.log("Partidos cargados:", partidos);

        if (partidos.length === 0) {
            return;
        }

        // Ordenar partidos por fecha
        partidos.sort((a, b) => {
            return new Date(a.fecha_partido) - new Date(b.fecha_partido);
        });

        mostrarUltimoResultado(partidos);
        mostrarFixture(partidos);
        mostrarResultados(partidos);

    } catch (error) {

        console.error("Error cargando partidos:", error);

    }

}


// ======================================================
// ÚLTIMO RESULTADO
// ======================================================

function mostrarUltimoResultado(partidos) {

    const contenedor = document.querySelector("#ultimo-resultado");

    if (!contenedor) {
        console.error("No existe #ultimo-resultado");
        return;
    }

    const finalizados = partidos.filter(
        partido => partido.estado === "finalizado"
    );

    if (finalizados.length === 0) {
        return;
    }

    const ultimo = finalizados[finalizados.length - 1];

    const gano =
        ultimo.goles_local > ultimo.goles_visitante;

    const perdio =
        ultimo.goles_local < ultimo.goles_visitante;

    const empato =
        ultimo.goles_local === ultimo.goles_visitante;

    let resultadoTexto = "EMPATE";

    if (gano) {
        resultadoTexto = "VICTORIA";
    }

    if (perdio) {
        resultadoTexto = "DERROTA";
    }

    contenedor.innerHTML = `

        <div class="result-card">

            <div class="result-team">

                <span>${ultimo.local}</span>

            </div>

            <div class="result-score">

                <strong>
                    ${ultimo.goles_local} - ${ultimo.goles_visitante}
                </strong>

                <small>
                    ${resultadoTexto}
                </small>

            </div>

            <div class="result-team">

                <span>${ultimo.visitante}</span>

            </div>

        </div>

        <div class="text-center mt-3">

            <small class="text-muted">
                ${ultimo.torneo} · Fecha ${ultimo.fecha}
            </small>

        </div>

        ${mostrarGoleadores(ultimo)}

    `;

}


// ======================================================
// GOLEADORES DEL PARTIDO
// ======================================================

function mostrarGoleadores(partido) {

    if (!partido.goleadores || partido.goleadores.length === 0) {
        return "";
    }

    return `

        <div class="text-center mt-3">

            <strong>⚽ Goleadores</strong>

            <div class="mt-2">

                ${partido.goleadores.map(goleador => `

                    <span class="badge bg-danger me-1 mb-1">

                        ${goleador.jugador}

                        ${goleador.goles > 1
                            ? ` x${goleador.goles}`
                            : ""
                        }

                    </span>

                `).join("")}

            </div>

        </div>

    `;

}


// ======================================================
// FIXTURE
// ======================================================

function mostrarFixture(partidos) {

    const contenedor = document.querySelector("#fixture");

    if (!contenedor) {
        console.error("No existe #fixture");
        return;
    }

    const proximos = partidos.filter(
        partido => partido.estado !== "finalizado"
    );

    if (proximos.length === 0) {

        contenedor.innerHTML = `

            <p class="empty-message">
                No hay próximos partidos cargados.
            </p>

        `;

        return;
    }

    contenedor.innerHTML = proximos.map(partido => `

        <div class="match-item">

            <div>

                <strong>
                    ${partido.local}
                </strong>

                <span> vs </span>

                <strong>
                    ${partido.visitante}
                </strong>

            </div>

            <small>
                ${partido.torneo} · Fecha ${partido.fecha}
            </small>

        </div>

    `).join("");

}


// ======================================================
// RESULTADOS
// ======================================================

function mostrarResultados(partidos) {

    const contenedor = document.querySelector("#resultados");

    if (!contenedor) {
        console.error("No existe #resultados");
        return;
    }

    const finalizados = partidos
        .filter(partido => partido.estado === "finalizado")
        .reverse();

    if (finalizados.length === 0) {

        contenedor.innerHTML = `

            <p class="empty-message">
                Todavía no hay resultados cargados.
            </p>

        `;

        return;
    }

    contenedor.innerHTML = finalizados.map(partido => {

        let claseResultado = "empate";

        if (partido.goles_local > partido.goles_visitante) {
            claseResultado = "victoria";
        }

        if (partido.goles_local < partido.goles_visitante) {
            claseResultado = "derrota";
        }

        return `

            <div class="result-list-item">

                <div class="result-list-date">

                    <span>
                        Fecha ${partido.fecha}
                    </span>

                    <small>
                        ${partido.torneo}
                    </small>

                </div>

                <div class="result-list-teams">

                    <strong>
                        ${partido.local}
                    </strong>

                    <span class="${claseResultado}">

                        ${partido.goles_local}
                        -
                        ${partido.goles_visitante}

                    </span>

                    <strong>
                        ${partido.visitante}
                    </strong>

                </div>

            </div>

        `;

    }).join("");

}


// ======================================================
// GALERÍA
// ======================================================

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


// ======================================================
// CARGAR GALERÍA
// ======================================================

function cargarGaleria() {

    mostrarFotos("todos");

}


// ======================================================
// MOSTRAR FOTOS
// ======================================================

function mostrarFotos(categoria) {

    const galeria = document.querySelector("#galeria-grid");

    if (!galeria) {
        console.error("No existe #galeria-grid");
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

        elemento.className = "gallery-item";

        elemento.innerHTML = `

            <img
                src="${foto.imagen}"
                alt="${foto.titulo}"
                loading="lazy"
            >

            <div class="gallery-overlay">

                <span>
                    ${foto.titulo}
                </span>

            </div>

        `;

        elemento.addEventListener("click", () => {

            abrirGaleria(indice);

        });

        galeria.appendChild(elemento);

    });

}


// ======================================================
// FILTROS DE GALERÍA
// ======================================================

document.addEventListener("click", event => {

    const boton = event.target.closest(".gallery-filter");

    if (!boton) {
        return;
    }

    const categoria = boton.dataset.filter;

    document
        .querySelectorAll(".gallery-filter")
        .forEach(btn => {
            btn.classList.remove("active");
        });

    boton.classList.add("active");

    mostrarFotos(categoria);

});


// ======================================================
// ABRIR GALERÍA
// ======================================================

function abrirGaleria(indice) {

    if (!fotosFiltradas[indice]) {
        return;
    }

    fotoActual = indice;

    const modal = document.querySelector("#gallery-modal");
    const imagen = document.querySelector("#gallery-modal-image");
    const caption = document.querySelector("#gallery-modal-caption");

    if (!modal || !imagen) {
        return;
    }

    imagen.src = fotosFiltradas[fotoActual].imagen;
    imagen.alt = fotosFiltradas[fotoActual].titulo;

    if (caption) {
        caption.textContent = fotosFiltradas[fotoActual].titulo;
    }

    modal.classList.add("active");

}


// ======================================================
// CERRAR GALERÍA
// ======================================================

function cerrarGaleria() {

    const modal = document.querySelector("#gallery-modal");

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

}


// ======================================================
// FOTO ANTERIOR
// ======================================================

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


// ======================================================
// FOTO SIGUIENTE
// ======================================================

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


// ======================================================
// ACTUALIZAR MODAL
// ======================================================

function actualizarFotoModal() {

    const imagen = document.querySelector("#gallery-modal-image");
    const caption = document.querySelector("#gallery-modal-caption");

    if (!imagen) {
        return;
    }

    imagen.src = fotosFiltradas[fotoActual].imagen;
    imagen.alt = fotosFiltradas[fotoActual].titulo;

    if (caption) {
        caption.textContent = fotosFiltradas[fotoActual].titulo;
    }

}


// ======================================================
// BOTONES DEL MODAL
// ======================================================

document.addEventListener("click", event => {

    if (event.target.closest("#gallery-modal-close")) {

        cerrarGaleria();

    }

    if (event.target.closest("#gallery-modal-prev")) {

        fotoAnterior();

    }

    if (event.target.closest("#gallery-modal-next")) {

        fotoSiguiente();

    }

});


// ======================================================
// CERRAR MODAL HACIENDO CLICK AFUERA
// ======================================================

document.addEventListener("click", event => {

    const modal = document.querySelector("#gallery-modal");

    if (!modal) {
        return;
    }

    if (event.target === modal) {

        cerrarGaleria();

    }

});


// ======================================================
// TECLADO
// ======================================================

document.addEventListener("keydown", event => {

    const modal = document.querySelector("#gallery-modal");

    if (!modal || !modal.classList.contains("active")) {
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


// ======================================================
// AÑO DEL FOOTER
// ======================================================

function actualizarAnio() {

    const elemento = document.querySelector("#current-year");

    if (elemento) {

        elemento.textContent = new Date().getFullYear();

    }

}


// ======================================================
// MENÚ MOBILE
// ======================================================

function configurarMenu() {

    const boton = document.querySelector(".navbar-toggler");
    const menu = document.querySelector(".navbar-collapse");

    if (!boton || !menu) {
        return;
    }

    document
        .querySelectorAll(".navbar-nav .nav-link")
        .forEach(link => {

            link.addEventListener("click", () => {

                if (menu.classList.contains("show")) {

                    boton.click();

                }

            });

        });

}