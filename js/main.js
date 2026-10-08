// ======================================================
// COMBINADO FC - MAIN.JS
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    cargarDatos();

});


// ======================================================
// CARGAR TODOS LOS DATOS
// ======================================================

async function cargarDatos() {

    await cargarPartidos();
    await cargarTabla();
    cargarGaleria();
    actualizarAnio();
    configurarMenu();

}


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
        return;
    }

    const finalizados = partidos.filter(
        partido => partido.estado === "finalizado"
    );

    if (finalizados.length === 0) {
        return;
    }

    const ultimo = finalizados[finalizados.length - 1];

    let resultadoTexto = "EMPATE";

    if (ultimo.goles_local > ultimo.goles_visitante) {
        resultadoTexto = "VICTORIA";
    }

    if (ultimo.goles_local < ultimo.goles_visitante) {
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

                        ${
                            goleador.goles > 1
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
// TABLA DE POSICIONES
// ======================================================

async function cargarTabla() {

    try {

        const respuestaEquipos = await fetch("data/equipos.json");

        if (!respuestaEquipos.ok) {
            throw new Error("No se pudo cargar equipos.json");
        }

        const datosEquipos = await respuestaEquipos.json();

        const equipos = datosEquipos.equipos || [];


        const respuestaPartidos = await fetch("data/partidos.json");

        if (!respuestaPartidos.ok) {
            throw new Error("No se pudo cargar partidos.json");
        }

        const datosPartidos = await respuestaPartidos.json();

        const partidos = datosPartidos.partidos || [];


        const tabla = calcularTabla(equipos, partidos);

        mostrarTabla(tabla);

    } catch (error) {

        console.error("Error cargando tabla:", error);

    }

}


// ======================================================
// CALCULAR TABLA
// ======================================================

function calcularTabla(equipos, partidos) {

    const tabla = equipos.map(equipo => {

        return {

            nombre: equipo.nombre,

            pj: 0,
            pg: 0,
            pe: 0,
            pp: 0,

            gf: 0,
            gc: 0,
            dg: 0,

            pts: 0

        };

    });


    const partidosFinalizados = partidos.filter(
        partido => partido.estado === "finalizado"
    );


    partidosFinalizados.forEach(partido => {

        const local = tabla.find(
            equipo => equipo.nombre === partido.local
        );

        const visitante = tabla.find(
            equipo => equipo.nombre === partido.visitante
        );


        if (!local || !visitante) {
            return;
        }


        const golesLocal = Number(partido.goles_local);
        const golesVisitante = Number(partido.goles_visitante);


        // Partidos jugados

        local.pj++;
        visitante.pj++;


        // Goles a favor y en contra

        local.gf += golesLocal;
        local.gc += golesVisitante;

        visitante.gf += golesVisitante;
        visitante.gc += golesLocal;


        // Victoria local

        if (golesLocal > golesVisitante) {

            local.pg++;
            local.pts += 3;

            visitante.pp++;

        }


        // Victoria visitante

        else if (golesLocal < golesVisitante) {

            visitante.pg++;
            visitante.pts += 3;

            local.pp++;

        }


        // Empate

        else {

            local.pe++;
            visitante.pe++;

            local.pts++;
            visitante.pts++;

        }

    });


    // Diferencia de gol

    tabla.forEach(equipo => {

        equipo.dg = equipo.gf - equipo.gc;

    });


    // Orden de clasificación

    tabla.sort((a, b) => {

        if (b.pts !== a.pts) {
            return b.pts - a.pts;
        }

        if (b.dg !== a.dg) {
            return b.dg - a.dg;
        }

        if (b.gf !== a.gf) {
            return b.gf - a.gf;
        }

        return a.nombre.localeCompare(b.nombre);

    });


    return tabla;

}


// ======================================================
// MOSTRAR TABLA
// ======================================================

function mostrarTabla(tabla) {

    const contenedor = document.querySelector("#tabla-posiciones");

    if (!contenedor) {
        console.error("No existe #tabla-posiciones");
        return;
    }


    if (tabla.length === 0) {

        contenedor.innerHTML = `

            <tr>

                <td colspan="10" class="empty-table">

                    Todavía no hay equipos cargados.

                </td>

            </tr>

        `;

        return;

    }


    contenedor.innerHTML = tabla.map((equipo, indice) => {

        const diferencia =
            equipo.dg > 0
                ? `+${equipo.dg}`
                : equipo.dg;


        return `

            <tr class="${
                equipo.nombre === "Combinado FC"
                    ? "mi-equipo"
                    : ""
            }">

                <td>
                    <strong>
                        ${indice + 1}
                    </strong>
                </td>

                <td>

                    <strong>
                        ${equipo.nombre}
                    </strong>

                </td>

                <td>
                    ${equipo.pj}
                </td>

                <td>
                    ${equipo.pg}
                </td>

                <td>
                    ${equipo.pe}
                </td>

                <td>
                    ${equipo.pp}
                </td>

                <td>
                    ${equipo.gf}
                </td>

                <td>
                    ${equipo.gc}
                </td>

                <td>
                    ${diferencia}
                </td>

                <td>

                    <strong>
                        ${equipo.pts}
                    </strong>

                </td>

            </tr>

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

        caption.textContent =
            fotosFiltradas[fotoActual].titulo;

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

        fotoActual =
            fotosFiltradas.length - 1;

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

    const imagen =
        document.querySelector("#gallery-modal-image");

    const caption =
        document.querySelector("#gallery-modal-caption");


    if (!imagen) {
        return;
    }


    imagen.src =
        fotosFiltradas[fotoActual].imagen;


    imagen.alt =
        fotosFiltradas[fotoActual].titulo;


    if (caption) {

        caption.textContent =
            fotosFiltradas[fotoActual].titulo;

    }

}


// ======================================================
// BOTONES DE GALERÍA
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

    const modal =
        document.querySelector("#gallery-modal");


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

    const modal =
        document.querySelector("#gallery-modal");


    if (
        !modal ||
        !modal.classList.contains("active")
    ) {

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
// AÑO
// ======================================================

function actualizarAnio() {

    const elemento =
        document.querySelector("#current-year");


    if (elemento) {

        elemento.textContent =
            new Date().getFullYear();

    }

}


// ======================================================
// MENÚ MOBILE
// ======================================================

function configurarMenu() {

    const boton =
        document.querySelector(".navbar-toggler");

    const menu =
        document.querySelector(".navbar-collapse");


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