/* =========================================================
   COMBINADO FC
   MAIN.JS
========================================================= */


/* =========================================================
   AÑO AUTOMÁTICO
========================================================= */

const currentYear = document.getElementById("current-year");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}


/* =========================================================
   GALERÍA
========================================================= */

/*
    Por ahora dejamos algunas imágenes de prueba.

    Después vamos a reemplazarlas por las fotos reales
    de Combinado FC.
*/

const galeria = [

    {
        imagen: "img/galeria/foto1.jpg",
        categoria: "partidos",
        titulo: "Día de partido"
    },

    {
        imagen: "img/galeria/foto2.jpg",
        categoria: "equipo",
        titulo: "El equipo"
    },

    {
        imagen: "img/galeria/foto3.jpg",
        categoria: "momentos",
        titulo: "Momento Combinado"
    },

    {
        imagen: "img/galeria/foto4.jpg",
        categoria: "partidos",
        titulo: "En la cancha"
    },

    {
        imagen: "img/galeria/foto5.jpg",
        categoria: "equipo",
        titulo: "Combinado FC"
    },

    {
        imagen: "img/galeria/foto6.jpg",
        categoria: "momentos",
        titulo: "Después del partido"
    }

];


const galleryGrid = document.getElementById("galeria-grid");


function mostrarGaleria(filtro = "todos") {

    if (!galleryGrid) return;

    const fotosFiltradas =
        filtro === "todos"
            ? galeria
            : galeria.filter(foto => foto.categoria === filtro);


    galleryGrid.innerHTML = "";


    fotosFiltradas.forEach((foto, index) => {

        const item = document.createElement("div");

        item.className = "gallery-item";

        item.dataset.index = index;

        item.innerHTML = `

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


        item.addEventListener("click", () => {

            abrirGaleria(index, fotosFiltradas);

        });


        galleryGrid.appendChild(item);

    });

}


/* =========================================================
   FILTROS DE GALERÍA
========================================================= */

const galleryFilters =
    document.querySelectorAll(".gallery-filter");


galleryFilters.forEach(button => {

    button.addEventListener("click", () => {

        galleryFilters.forEach(btn => {

            btn.classList.remove("active");

        });


        button.classList.add("active");


        const filtro =
            button.dataset.filter;


        mostrarGaleria(filtro);

    });

});


/* =========================================================
   MODAL GALERÍA
========================================================= */

const galleryModal =
    document.getElementById("gallery-modal");

const galleryModalImage =
    document.getElementById("gallery-modal-image");

const galleryModalCaption =
    document.getElementById("gallery-modal-caption");

const galleryModalClose =
    document.getElementById("gallery-modal-close");

const galleryModalPrev =
    document.getElementById("gallery-modal-prev");

const galleryModalNext =
    document.getElementById("gallery-modal-next");


let fotosActuales = [];

let fotoActual = 0;


function abrirGaleria(index, fotos) {

    fotosActuales = fotos;

    fotoActual = index;

    actualizarModal();

    galleryModal.classList.add("active");

    document.body.style.overflow = "hidden";

}


function actualizarModal() {

    const foto =
        fotosActuales[fotoActual];


    if (!foto) return;


    galleryModalImage.src =
        foto.imagen;


    galleryModalImage.alt =
        foto.titulo;


    galleryModalCaption.textContent =
        foto.titulo;

}


function cerrarGaleria() {

    galleryModal.classList.remove("active");

    document.body.style.overflow = "";

}


function siguienteFoto() {

    if (fotosActuales.length === 0) return;


    fotoActual++;

    if (fotoActual >= fotosActuales.length) {

        fotoActual = 0;

    }


    actualizarModal();

}


function anteriorFoto() {

    if (fotosActuales.length === 0) return;


    fotoActual--;

    if (fotoActual < 0) {

        fotoActual =
            fotosActuales.length - 1;

    }


    actualizarModal();

}


/* =========================================================
   EVENTOS GALERÍA
========================================================= */

galleryModalClose.addEventListener(
    "click",
    cerrarGaleria
);


galleryModalNext.addEventListener(
    "click",
    siguienteFoto
);


galleryModalPrev.addEventListener(
    "click",
    anteriorFoto
);


galleryModal.addEventListener(
    "click",
    (event) => {

        if (event.target === galleryModal) {

            cerrarGaleria();

        }

    }
);


/* =========================================================
   TECLADO
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (!galleryModal.classList.contains("active")) {

            return;

        }


        if (event.key === "Escape") {

            cerrarGaleria();

        }


        if (event.key === "ArrowRight") {

            siguienteFoto();

        }


        if (event.key === "ArrowLeft") {

            anteriorFoto();

        }

    }
);


/* =========================================================
   INICIALIZAR
========================================================= */

mostrarGaleria();