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
    
    let html = `<h2>Hola, ${nombre}</h2>`;
    
    if (fechas.length === 0) {
        html += "<p>No tenés salidas registradas hasta el momento.</p>";
    } else {
        html += "<p>Tus fechas de salida:</p><div class='grid-fechas'>";
        // Mostramos las fechas de la más reciente a la más antigua
        fechas.reverse().forEach(f => {
            html += `<span class="tag-fecha">${f}</span>`;
        });
        html += "</div>";
    }
    
    contenedor.innerHTML = html;
}