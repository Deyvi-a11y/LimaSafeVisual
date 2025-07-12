// Inicializar el mapa
const map = L.map('map').setView([-12.0464, -77.0428], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Captura coordenadas al hacer clic en el mapa
map.on('click', function (e) {
  const { lat, lng } = e.latlng;
  document.getElementById('coordenadas').value = `${lat},${lng}`;
});

// ================= FORMULARIO DE REPORTE =================
document.getElementById('reporteForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const descripcion = document.getElementById('descripcion').value;
  const riesgo = document.getElementById('riesgo').value;
  const coords = document.getElementById('coordenadas').value;

  if (!descripcion || !riesgo || !coords) return alert('Completa todos los campos');

  try {
    const res = await fetch('http://localhost:3000/zonas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Nombre_Zona: descripcion.slice(0, 50),
        Coordenadas: coords,
        Nivel_Riesgo: riesgo
      })
    });

    if (res.ok) {
      const [lat, lng] = coords.split(',').map(parseFloat);
      const color = riesgo === 'Alto' ? 'red' : riesgo === 'Medio' ? 'orange' : 'green';
      L.circle([lat, lng], { radius: 300, color }).addTo(map)
        .bindPopup(`<b>${descripcion}</b><br>Riesgo: ${riesgo}`)
        .openPopup();

      alert('✅ Reporte enviado correctamente');
      document.getElementById('reporteForm').reset();
    } else throw new Error(await res.text());

  } catch (err) {
    alert('❌ Error al enviar: ' + err.message);
  }
});

// ================= FORMULARIO DE REGISTRO =================
document.getElementById('registroForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const nombre = document.getElementById('nombre').value;
  const apellidos = document.getElementById('apellidos').value;
  const correo = document.getElementById('correo').value;
  const contrasena = document.getElementById('contrasena').value;
  const dni = document.getElementById('dni').value;

  if (dni.length !== 8 || isNaN(dni)) return alert('❌ El DNI debe tener exactamente 8 dígitos numéricos.');

  try {
    const res = await fetch('http://localhost:3000/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellidos, correo, contrasena, dni })
    });

    if (res.ok) {
      alert('✅ Usuario registrado correctamente');
      document.getElementById('registroForm').reset();
    } else throw new Error(await res.text());

  } catch (err) {
    alert('❌ Error al registrar: ' + err.message);
  }
});

// ================= FORMULARIO DE LOGIN =================
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const correo = document.getElementById('loginCorreo').value;
  const contrasena = document.getElementById('loginContrasena').value;

  try {
    const res = await fetch('http://localhost:3000/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena })
    });

    if (res.ok) {
      const user = await res.json();
      localStorage.setItem('usuarioNombre', user.Nombre);
      document.getElementById('bienvenida').textContent = `Bienvenido, ${user.Nombre}`;
      alert('✅ Inicio de sesión exitoso');
    } else alert('❌ Credenciales incorrectas');

  } catch (err) {
    alert('❌ Error al iniciar sesión: ' + err.message);
  }
});

// ================= MOSTRAR FORMULARIOS =================
function mostrarFormulario(nombre) {
  const formularios = ['registro', 'login', 'reporte'];

  formularios.forEach(f => {
    document.getElementById(f + 'Container').style.display = 'none';
  });

  document.getElementById(nombre + 'Container').style.display = 'block';
}

// ================= CARGA Y FILTRO DE ZONAS =================
let zonasCargadas = [];

fetch('http://localhost:3000/zonas')
  .then(res => res.json())
  .then(data => {
    zonasCargadas = data;
    mostrarZonasFiltradas();
  });

document.getElementById('buscarZona').addEventListener('input', mostrarZonasFiltradas);
document.getElementById('filtrarRiesgo').addEventListener('change', mostrarZonasFiltradas);

function mostrarZonasFiltradas() {
  const texto = document.getElementById('buscarZona').value.toLowerCase();
  const riesgo = document.getElementById('filtrarRiesgo').value;

  map.eachLayer(layer => {
    if (layer instanceof L.Circle && layer.options.color !== 'purple') map.removeLayer(layer);
  });

  zonasCargadas.forEach(z => {
    const nombreMatch = z.Nombre_Zona.toLowerCase().includes(texto);
    const riesgoMatch = !riesgo || z.Nivel_Riesgo === riesgo;

    if (nombreMatch && riesgoMatch) {
      const coords = z.Coordenadas.includes('[') ? JSON.parse(z.Coordenadas) : z.Coordenadas.split(',').map(parseFloat);
      const color = z.Nivel_Riesgo === 'Alto' ? 'red' : z.Nivel_Riesgo === 'Medio' ? 'orange' : 'green';

      L.circle(coords, { radius: 300, color }).addTo(map)
        .bindPopup(`<b>${z.Nombre_Zona}</b><br>Riesgo: ${z.Nivel_Riesgo}`);
    }
  });
}

// ================= MOSTRAR INCIDENTES =================
fetch('http://localhost:3000/incidentes')
  .then(res => res.json())
  .then(data => {
    data.forEach(i => {
      const coords = JSON.parse(i.Coordenadas);
      L.circleMarker(coords, { radius: 6, color: 'purple' }).addTo(map)
        .bindPopup(`<b>Incidente:</b> ${i.Tipo}<br><b>Descripción:</b> ${i.Descripcion}<br><b>Zona:</b> ${i.Nombre_Zona}`);
    });
  });

// ================= MOSTRAR REPORTES =================
fetch('http://localhost:3000/reportes')
  .then(res => res.json())
  .then(data => {
    data.forEach(r => {
      const coords = JSON.parse(r.Coordenadas);
      L.marker(coords).addTo(map)
        .bindPopup(`<b>Reporte:</b> ${r.Descripcion}<br><b>Zona:</b> ${r.Nombre_Zona}<br><b>Estado:</b> ${r.Estado_Verificacion}`);
    });
  });
