// URL de tu Web App (Google Apps Script)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzwk1khKFdWfFoJSZ0BLb70UeTXZrS7MMSQyVzMehGW-SnMuPGOTf1DQtjIUB-3Eeo5/exec";

// Variable global para guardar datos y poder descargar el TXT luego
let datosGlobales = { nombre: "", fechas: [] };

async function loginYConsultar() {
    const usuario = document.getElementById("inputUsuario").value.toLowerCase().trim();
    const codigo = document.getElementById("inputCodigo").value.trim();
    const contenedorLista = document.getElementById("resultadoHistorial");
    const columnaResultados = document.getElementById("columna-resultados");
    const mensajeCarga = document.getElementById("mensajeCarga");

    if (!usuario || !codigo) {
        alert("Completá usuario y código");
        return;
    }
    // --- PASO A: MOSTRAR EL MENSAJE ---
    mensajeCarga.classList.remove("hidden");
    contenedorLista.innerHTML = ""; // Limpiamos el historial previo si existiera
    contenedorLista.innerHTML = "<p class='vacio'>Buscando...</p>";

    try {
        const urlFinal = `${WEB_APP_URL}?action=login&user=${encodeURIComponent(usuario)}&pass=${encodeURIComponent(codigo)}`;
        
        const response = await fetch(urlFinal, {
            method: 'GET',
            redirect: 'follow'
        });

        const data = await response.json();

        if (data.success) {
            // Guardamos en la variable global para el TXT
            datosGlobales.nombre = data.nombre;
            datosGlobales.fechas = data.fechas;

            // Mostramos la columna de la derecha
            columnaResultados.classList.remove("hidden");
            
            // Renderizamos
            renderizarHistorial(data.nombre, data.fechas);
        } else {
            alert(data.message || "Usuario o código incorrectos");
            contenedorLista.innerHTML = `<p class="mensaje-error">${data.message}</p>`;
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión. Revisá tu internet o la consola (F12).");
    } finally {
        // --- PASO B: OCULTAR EL MENSAJE SIEMPRE AL FINALIZAR ---
        mensajeCarga.classList.add("hidden");
    }
}
    
function renderizarHistorial(nombre, fechas) {
    const tituloNombre = document.getElementById("nombreDelegado");
    const contenedorLista = document.getElementById("resultadoHistorial");

    tituloNombre.innerText = `Resultados de: ${nombre}`;

    if (!fechas || fechas.length === 0) {
        contenedorLista.innerHTML = '<p class="vacio">No tenés salidas registradas.</p>';
        return;
    }

    // Inyectamos las fechas en formato de lista (columna)
    // Usamos reverse() para que la más nueva salga arriba
    contenedorLista.innerHTML = fechas.slice().reverse().map(item => {
        // Compatibilidad: por si llega como string directo o como objeto {fecha, link}
        const textoFecha = typeof item === 'object' ? item.fecha : item;
        const linkNota = typeof item === 'object' ? item.link : null;

        if (linkNota) {
            return `
                <div class="tag-fecha tag-fecha-link">
                    <span>📅 ${textoFecha}</span>
                    <a href="${linkNota}" target="_blank" rel="noopener noreferrer" class="link-nota">📄 Ver Nota</a>
                </div>
            `;
        } else {
            return `<div class="tag-fecha">📅 ${textoFecha}</div>`;
        }
    }).join("");
}

function descargarTxt() {
    if (!datosGlobales.nombre || datosGlobales.fechas.length === 0) {
        alert("No hay datos para descargar");
        return;
    }

    // Mapeamos para extraer únicamente el texto de la fecha
    const listaTextoFechas = datosGlobales.fechas.map(item => typeof item === 'object' ? item.fecha : item);

    const nombreArchivo = `Salidas_${datosGlobales.nombre.replace(/ /g, '_')}.txt`;
    const contenido = `HISTORIAL DE SALIDAS - ${datosGlobales.nombre}\n` +
                      `------------------------------------------\n` +
                      listaTextoFechas.join('\n');

    const elemento = document.createElement('a');
    const archivo = new Blob([contenido], {type: 'text/plain'});
    
    elemento.href = URL.createObjectURL(archivo);
    elemento.download = nombreArchivo;
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
}
