// URL de tu Web App (Google Apps Script)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyC-eWWNOWiHKrGE99DaIdwLRHGOmmlcqyvVKRHEacfwdAm8rR3tFiOruYDD9YrlHGH/exec"

// Variables globales de sesión
let usuarioLogueado = null;
let nombreLogueado = "";

//Variable global de obtener las salidas de la API
let salidasGuardadas = [];

// 1. INICIO DE SESIÓN
async function login() {
    const usuarioInput = document.getElementById("inputUsuario").value.toLowerCase().trim();
    const codigoInput = document.getElementById("inputCodigo").value.trim();
    
    const columnaLogin = document.getElementById("columna-login") || document.querySelector(".columna-login");
    const columnaMenu = document.getElementById("columna-menu");
    const userSessionControl = document.getElementById("user-session-control");
    const mensajeCarga = document.getElementById("mensajeCarga");

    if (!usuarioInput || !codigoInput) {
        alert("Completá usuario y contraseña");
        return;
    }

    if (mensajeCarga) mensajeCarga.classList.remove("hidden");

    try {
        const urlFinal = `${WEB_APP_URL}?action=login&user=${encodeURIComponent(usuarioInput)}&pass=${encodeURIComponent(codigoInput)}`;
        
        const response = await fetch(urlFinal, {
            method: 'GET',
            redirect: 'follow'
        });

        const data = await response.json();

        if (data.success) {
            usuarioLogueado = usuarioInput;
            nombreLogueado = data.nombre;

            // Ocultar login y activar interfaz del menú
            if (columnaLogin) columnaLogin.classList.add("hidden");
            if (userSessionControl) userSessionControl.classList.remove("hidden");
            if (columnaMenu) columnaMenu.classList.remove("hidden");
        } else {
            alert(data.message || "Credenciales no válidas");
        }
    } catch (error) {
        console.error("Error al conectar:", error);
        alert("Error de conexión al intentar validar las credenciales.");
    } finally {
        if (mensajeCarga) mensajeCarga.classList.add("hidden");
    }
}

// Función auxiliar para normalizar cualquier fecha al formato DD/MM/AAAA
function formatearFechaTexto(texto) {
    if (!texto) return "";
    
    // Si viene la cadena larga de fecha JS (contiene GMT o días en inglés como Thu, Fri, etc.)
    if (texto.includes("GMT") || texto.includes("hora estándar") || !isNaN(Date.parse(texto)) && texto.length > 20) {
        const d = new Date(texto);
        if (!isNaN(d.getTime())) {
            const dia = String(d.getDate()).padStart(2, '0');
            const mes = String(d.getMonth() + 1).padStart(2, '0');
            const anio = d.getFullYear();
            return `${dia}/${mes}/${anio}`;
        }
    }
    
    return texto;
}

// 2. BUSCAR HISTORIAL DE SALIDAS
async function buscarSalidas() {
    const columnaResultados = document.getElementById("columna-resultados");
    const contenedorHistorial = document.getElementById("resultadoHistorial");
    const tituloDelegado = document.getElementById("nombreDelegado");

    if (columnaResultados) {
        columnaResultados.classList.remove("hidden");
    }

    if (tituloDelegado && nombreLogueado) {
        tituloDelegado.textContent = `Historial de ${nombreLogueado}`;
    }

    if (contenedorHistorial) {
        contenedorHistorial.innerHTML = "<p>Cargando historial...</p>";
    }

    try {
        const urlFinal = `${WEB_APP_URL}?action=getSalidas&user=${encodeURIComponent(usuarioLogueado)}`;
        
        const response = await fetch(urlFinal, { method: 'GET', redirect: 'follow' });
        const data = await response.json();

        if (data.success && data.fechas && data.fechas.length > 0) {
            const ul = document.createElement("ul");
            
            // 1. Invertimos el orden para que lo último ingresado en el Sheet quede arriba
            data.fechas.reverse();
            
            //2. Guardo en mi variable global los datos, para usarlos en otro lado
            salidasGuardadas = data.fechas

            //3. Arranco bucle para armar la lista de salidas
            data.fechas.forEach(item => {
                const li = document.createElement("li");
                li.className = "tag-fecha";

                // 4. Limpiamos y corregimos el texto de la fecha si venía en formato feo
                const fechaLimpia = formatearFechaTexto(item.fecha);

                // 5.Armamos el texto de fecha + horario según el tipo de celda
                let textoFecha = fechaLimpia;

                if (item.esDiaCompleto) {
                    textoFecha = `GREMIAL - ${fechaLimpia}`;
                } else if (item.horarioEgreso && item.horarioRegreso) {
                    if (item.horarioRegreso.toUpperCase().includes("SIN REGRESO")) {
                        textoFecha = `${fechaLimpia} (Egreso ${item.horarioEgreso} - Sin Regreso)`;
                    } else {
                        textoFecha = `${fechaLimpia} (${item.horarioEgreso} - ${item.horarioRegreso})`;
                    }
                }

                if (item.link) {
                    const textoNota = item.numeroNota ? `Nota N°: ${item.numeroNota}` : "Ver Nota";
                    li.innerHTML = `<span>${textoFecha}</span> - <a href="${item.link}" target="_blank" rel="noopener">${textoNota}</a>`;
                } else {
                    li.innerHTML = `<span>${textoFecha}</span>`;
                }

                ul.appendChild(li);
            });

            contenedorHistorial.innerHTML = "";
            contenedorHistorial.appendChild(ul);
        } else {
            salidasGuardadas = []; // Limpiamos la variable si no hay datos
            if (contenedorHistorial) contenedorHistorial.innerHTML = "<p>No tenés salidas registradas.</p>";
        }

    } catch (error) {
        console.error("Error al consultar las salidas:", error);
        if (contenedorHistorial) contenedorHistorial.innerHTML = "<p>Error al obtener los datos. Intentá nuevamente.</p>";
    }
};

//3. DESCARGAR HISTORIAL EN TXT

function descargarTxt() {
    if (!salidasGuardadas || salidasGuardadas.length === 0) {
        alert("No hay salidas para descargar.");
        return;
    }

    // Armamos el contenido del archivo procesando cada ítem
    let contenidoTxt = `Historial de Salidas - ${nombreLogueado || usuarioLogueado}\n`;
    contenidoTxt += `========================================\n\n`;

    salidasGuardadas.forEach(item => {
        const fechaLimpia = formatearFechaTexto(item.fecha);
        let linea = "";

        if (item.esDiaCompleto) {
            linea = `GREMIAL - ${fechaLimpia}`;
        } else if (item.horarioEgreso && item.horarioRegreso) {
            if (item.horarioRegreso.toUpperCase().includes("SIN REGRESO")) {
                linea = `${fechaLimpia} (Egreso ${item.horarioEgreso} - Sin Regreso)`;
            } else {
                linea = `${fechaLimpia} (${item.horarioEgreso} - ${item.horarioRegreso})`;
            }
        } else {
            linea = fechaLimpia;
        }

        if (item.link) {
            linea += ` | Nota: ${item.numeroNota}`;
        }

        contenidoTxt += `${linea}\n`;
    });

    // Crear el objeto Blob con el texto en formato UTF-8
    const blob = new Blob([contenidoTxt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    // Crear un elemento <a> invisible para disparar la descarga en el navegador
    const a = document.createElement("a");
    a.href = url;
    const nombreLimpio = nombreLogueado ? nombreLogueado.replace(/[, ]+/g, " ") : usuarioLogueado;
    a.download = `${nombreLimpio} - Historial de salidas`;
    document.body.appendChild(a);
    a.click();

    // Limpieza de memoria del enlace
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};


// 4. CERRAR SESIÓN
function logout() {
    usuarioLogueado = null;
    nombreLogueado = "";

    const inputUsuario = document.getElementById("inputUsuario");
    const inputCodigo = document.getElementById("inputCodigo");
    
    if (inputUsuario) inputUsuario.value = "";
    if (inputCodigo) inputCodigo.value = "";

    const columnaLogin = document.getElementById("columna-login") || document.querySelector(".columna-login");
    const columnaMenu = document.getElementById("columna-menu");
    const columnaResultados = document.getElementById("columna-resultados");
    const userSessionControl = document.getElementById("user-session-control");

    if (columnaMenu) columnaMenu.classList.add("hidden");
    if (columnaResultados) columnaResultados.classList.add("hidden");
    if (userSessionControl) userSessionControl.classList.add("hidden");
    if (columnaLogin) columnaLogin.classList.remove("hidden");
}

// 4. INICIALIZACIÓN DE EVENTOS (Un solo listener general)
document.addEventListener("DOMContentLoaded", () => {
    // Botón Salir
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", logout);
    }

    // Botón Buscar Salidas
    const btnBuscarSalidas = document.getElementById("btn-ir-chequear");
    if (btnBuscarSalidas) {
        btnBuscarSalidas.addEventListener("click", buscarSalidas);
    }

    // Botón Ingresar para Login
    const loginIngreso = document.getElementById("btn-ingresar");
    if (loginIngreso) {
        loginIngreso.addEventListener("click", login);
    }

    const btnDescargarHistorial = document.getElementById("btnDescargar");
    if(btnDescargarHistorial) {
        btnDescargarHistorial.addEventListener("click", descargarTxt);
    }
});