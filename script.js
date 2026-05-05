// URL de tu Web App (Google Apps Script)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw7Z3SkHd-5N2Mfhm2rEgZ4N9w3iX8qnPNqRkBh2vP-H7zusCKMH4HuxMJx2ROZcLnW/exec";

// Variable global para guardar datos y poder descargar el TXT luego
let datosGlobales = { nombre: "", fechas: [] };

async function loginYConsultar() {
    const usuario = document.getElementById("inputUsuario").value;
    const codigo = document.getElementById("inputCodigo").value;
    const contenedorLista = document.getElementById("resultadoHistorial");
    const columnaResultados = document.getElementById("columna-resultados");

    if (!usuario || !codigo) {
        alert("Completá usuario y código");
        return;
    }

    contenedorLista.innerHTML = "<p>Buscando...</p>";

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
            contenedorLista.innerHTML = `<p style="color: red;">${data.message}</p>`;
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión. Revisá tu internet o la consola (F12).");
    }
}

function renderizarHistorial(nombre, fechas) {
    const tituloNombre = document.getElementById("nombreDelegado");
    const contenedorLista = document.getElementById("resultadoHistorial");

    tituloNombre.innerText = `Historial de ${nombre}`;

    if (fechas.length === 0) {
        contenedorLista.innerHTML = "<p>No tenés salidas registradas.</p>";
        return;
    }

    // Inyectamos las fechas en formato de lista (columna)
    // Usamos reverse() para que la más nueva salga arriba
    contenedorLista.innerHTML = fechas.reverse().map(f => `
        <div class="tag-fecha">📅 ${f}</div>
    `).join("");
}

function descargarTxt() {
    if (!datosGlobales.nombre || datosGlobales.fechas.length === 0) {
        alert("No hay datos para descargar");
        return;
    }

    const nombreArchivo = `Salidas_${datosGlobales.nombre.replace(/ /g, '_')}.txt`;
    const contenido = `HISTORIAL DE SALIDAS - ${datosGlobales.nombre}\n` +
                      `------------------------------------------\n` +
                      datosGlobales.fechas.join('\n');

    const elemento = document.createElement('a');
    const archivo = new Blob([contenido], {type: 'text/plain'});
    
    elemento.href = URL.createObjectURL(archivo);
    elemento.download = nombreArchivo;
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
}