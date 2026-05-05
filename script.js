// URL de tu Web App (Google Apps Script)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw7Z3SkHd-5N2Mfhm2rEgZ4N9w3iX8qnPNqRkBh2vP-H7zusCKMH4HuxMJx2ROZcLnW/exec";

async function loginYConsultar() {
    const usuario = document.getElementById("inputUsuario").value;
    const codigo = document.getElementById("inputCodigo").value;
    const contenedor = document.getElementById("resultadoHistorial");

    if (!usuario || !codigo) {
        alert("Completá usuario y código");
        return;
    }

    contenedor.innerHTML = "<p>Buscando tus salidas...</p>";

    try {
        // Construimos la URL con los parámetros necesarios
        const urlFinal = `${WEB_APP_URL}?action=login&user=${encodeURIComponent(usuario)}&pass=${encodeURIComponent(codigo)}`;
        
        const response = await fetch(urlFinal, {
            method: 'GET',
            redirect: 'follow' // CRUCIAL para Apps Script
        });

        const data = await response.json();

        if (data.success) {
            renderizarHistorial(data.nombre, data.fechas);
        } else {
            contenedor.innerHTML = `<p style="color: #ff4444;">${data.message}</p>`;
        }
    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = "<p>Error al conectar con el sistema. Reintentá en unos segundos.</p>";
    }
}

function renderizarHistorial(nombre, fechas) {
    const contenedor = document.getElementById("resultadoHistorial");
    const main = document.querySelector("main");
    
    // Agregamos una clase al main para que el CSS mueva la card
    main.classList.add("sesion-activa");

    let fechasTxt = fechas.reverse().join('\n'); // Preparamos el texto para el archivo
    
    let html = `
        <div class="historial-header">
            <h2>Hola, ${nombre}</h2>
            <button onclick="descargarTxt('${nombre}', '${fechasTxt}')" class="btn-descargar">
                Descargar .txt
            </button>
        </div>
        <div class="columna-fechas">
            ${fechas.length > 0 
                ? fechas.map(f => `<div class="item-fecha">${f}</div>`).join('') 
                : '<p>No hay salidas.</p>'}
        </div>
    `;
    
    contenedor.innerHTML = html;
}

function descargarTxt(nombre, contenido) {
    const elemento = document.createElement('a');
    const archivo = new Blob([`HISTORIAL DE SALIDAS - ${nombre}\n\n${contenido}`], {type: 'text/plain'});
    elemento.href = URL.createObjectURL(archivo);
    elemento.download = `Salidas_${nombre.replace(/ /g, '_')}.txt`;
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);
}