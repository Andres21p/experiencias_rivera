let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let ordenActual = "normal";
let temporizadorNotificacion = null;

const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const ordenPrecio = document.querySelector("#ordenPrecio");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const estado = document.querySelector("#estado");
const notificacion = document.querySelector("#notificacion");

function mostrarNotificacion(mensaje, tipo = "error") {
    if (temporizadorNotificacion) clearTimeout(temporizadorNotificacion);

    notificacion.textContent = mensaje;
    notificacion.className = `notificacion ${tipo}`;
    notificacion.scrollIntoView({ behavior: "smooth", block: "nearest" });
    temporizadorNotificacion = setTimeout(() => {
        notificacion.className = "notificacion oculto";
    }, 4000);
}

async function cargarExperiencias() {
    try {
        estado.textContent = "Cargando experiencias...";
        const respuesta = await fetch("./data/experiencias.json");
        
        if (!respuesta.ok) throw new Error("No fue posible cargar las experiencias");

        experiencias = await respuesta.json();
        estado.textContent = `${experiencias.length} experiencias disponibles`;
        actualizarCatalogo();
    } catch (error) {
        estado.textContent = "Error al cargar la información";
        console.error(error);
    }
}

function obtenerResultados() {
    let resultados = [...experiencias];

    if (categoriaActual !== "todas") {
        resultados = resultados.filter(e => e.categoria === categoriaActual);
    }

    if (textoBusqueda !== "") {
        resultados = resultados.filter(e => 
            e.nombre.toLowerCase().includes(textoBusqueda) ||
            e.categoria.toLowerCase().includes(textoBusqueda)
        );
    }

    if (ordenActual === "ascendente") resultados.sort((a, b) => a.precio - b.precio);
    if (ordenActual === "descendente") resultados.sort((a, b) => b.precio - a.precio);

    return resultados;
}

function actualizarCatalogo() {
    const resultados = obtenerResultados();

    if (resultados.length === 0) {
        catalogo.innerHTML = `<p class="sin-resultados">No se encontraron experiencias</p>`;
        estado.textContent = "0 resultados";
        return;
    }

    catalogo.innerHTML = resultados.map(e => `
        <article class="tarjeta">
            <div class="imagen">${e.icono}</div>
            <div class="informacion">
                <span class="categoria">${e.categoria}</span>
                <h3>${e.nombre}</h3>
                <p>Cupo disponible: ${e.cupo}</p>
                <p class="precio">$${e.precio} MXN</p>
                <label>Personas:
                    <input type="number" id="cantidad-${e.id}" min="1" max="${e.cupo}" value="1">
                </label>
                <button class="btn-reservar" data-id="${e.id}">Agregar</button>
            </div>
        </article>
    `).join("");

    estado.textContent = `${resultados.length} resultados`;
    agregarEventosReservar();
}

function agregarEventosReservar() {
    document.querySelectorAll(".btn-reservar").forEach(boton => {
        boton.addEventListener("click", () => {
            const id = Number(boton.dataset.id);
            agregarReserva(id);
        });
    });
}

function agregarReserva(id) {
    const experiencia = experiencias.find(e => e.id === id);
    const entradaCantidad = document.querySelector(`#cantidad-${id}`);
    const cantidad = Number(entradaCantidad.value);

    if (cantidad < 1 || cantidad > experiencia.cupo) {
        mostrarNotificacion(` Cantidad no válida. Debe seleccionar entre 1 y ${experiencia.cupo} personas.`, "error");
        return;
    }

    const reservaExistente = reservas.find(r => r.experienciaId === id);

    if (reservaExistente) {
        const nuevaCantidad = reservaExistente.cantidad + cantidad;
        if (nuevaCantidad > experiencia.cupo) {
            mostrarNotificacion(` La cantidad total (${nuevaCantidad}) supera el cupo disponible (${experiencia.cupo}).`, "error");
            return;
        }
        reservaExistente.cantidad = nuevaCantidad;
        reservaExistente.subtotal = nuevaCantidad * experiencia.precio;
    } else {
        reservas.push({
            experienciaId: experiencia.id,
            nombre: experiencia.nombre,
            precio: experiencia.precio,
            cantidad,
            subtotal: experiencia.precio * cantidad
        });
    }

    mostrarReservas();
    mostrarNotificacion(` Se agregaron ${cantidad} lugar(es) para "${experiencia.nombre}".`, "exito");
}

function mostrarReservas() {
    if (reservas.length === 0) {
        listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
        total.textContent = "$0 MXN";
        return;
    }

    listaReservas.innerHTML = reservas.map(r => `
        <article class="item-reserva">
            <div>
                <strong>${r.nombre}</strong>
                <p>${r.cantidad} persona(s) x $${r.precio} MXN</p>
            </div>
            <div>
                <strong>$${r.subtotal} MXN</strong>
                <button class="btn-eliminar" data-id="${r.experienciaId}">Eliminar</button>
            </div>
        </article>
    `).join("");

    const totalReserva = reservas.reduce((suma, r) => suma + r.subtotal, 0);
    total.textContent = `$${totalReserva} MXN`;

    agregarEventosEliminar();
}

function agregarEventosEliminar() {
    document.querySelectorAll(".btn-eliminar").forEach(boton => {
        boton.addEventListener("click", () => {
            const id = Number(boton.dataset.id);
            eliminarReserva(id);
        });
    });
}

function eliminarReserva(id) {
    const reservaEliminada = reservas.find(r => r.experienciaId === id);
    reservas = reservas.filter(r => r.experienciaId !== id);
    mostrarReservas();

    if (reservaEliminada) {
        mostrarNotificacion(`Se eliminó "${reservaEliminada.nombre}" de tu reservación.`, "error");
    }
}

buscador.addEventListener("input", () => {
    textoBusqueda = buscador.value.trim().toLowerCase();
    actualizarCatalogo();
});

filtroCategoria.addEventListener("change", () => {
    categoriaActual = filtroCategoria.value;
    actualizarCatalogo();
});

ordenPrecio.addEventListener("change", () => {
    ordenActual = ordenPrecio.value;
    actualizarCatalogo();
});

cargarExperiencias();