// admin.js
// Lógica principal del panel de administración

import { db, auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const ADMIN_EMAILS = [
  // Puedes añadir más emails de administradores aquí
  "uanmita@gmail.com" // Añadido para acceso admin
];

const loginSection = document.getElementById('login-section');
const reservasSection = document.getElementById('reservas-section');
const preciosSection = document.getElementById('precios-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Configuración de EmailJS (igual que en main.js)
const emailjsConfig = {
  userId: 'GEEO4Ql6BtKkJP9hw',
  serviceId: 'service_f167wij',
  templateId: 'template_ny66xxg'
};

// Inicialización de EmailJS
if (window.emailjs) {
  emailjs.init(emailjsConfig.userId);
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function mostrarPanelAdmin() {
  loginSection.style.display = 'none';
  reservasSection.style.display = '';
  preciosSection.style.display = '';
}

function mostrarLogin() {
  loginSection.style.display = '';
  reservasSection.style.display = 'none';
  preciosSection.style.display = 'none';
}

onAuthStateChanged(auth, (user) => {
  if (user && ADMIN_EMAILS.includes(user.email)) {
    mostrarPanelAdmin();
    cargarReservas();
    cargarPreciosBase();
  } else {
    mostrarLogin();
    if (user && !ADMIN_EMAILS.includes(user.email)) {
      loginError.textContent = 'No tienes permisos de administrador.';
      signOut(auth);
    }
  }
});

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const email = loginForm.email.value;
    const password = loginForm.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El cambio de estado lo gestiona onAuthStateChanged
    } catch (err) {
      loginError.textContent = 'Error de autenticación: ' + err.message;
    }
  });
}

// Función para cargar reservas desde Firestore y mostrarlas en una tabla
async function cargarReservas() {
  const contenedor = document.getElementById('reservas-table-container');
  contenedor.innerHTML = '<p>Cargando reservas...</p>';
  try {
    const snapshot = await getDocs(collection(db, 'reservas'));
    if (snapshot.empty) {
      contenedor.innerHTML = '<p>No hay reservas registradas.</p>';
      return;
    }
    let tabla = `<table><thead><tr>
      <th>ID</th><th>Email</th><th>Fecha Reserva</th><th>Fecha Llegada</th><th>Fecha Salida</th><th>Adultos</th><th>Mascotas</th><th>Estado</th><th>Acciones</th>
    </tr></thead><tbody>`;
    snapshot.forEach(docSnap => {
      const r = docSnap.data();
      const esConfirmada = r.estado === 'confirmada';
      const esPendiente = r.estado === 'pendiente';
      const esCancelada = r.estado === 'cancelado';
      tabla += `<tr>
        <td>${docSnap.id}</td>
        <td>${r.email || ''}</td>
        <td class="fecha">${r.fechaReserva ? new Date(r.fechaReserva).toLocaleString() : ''}</td>
        <td class="fechallegada">${r.fechaLlegada || ''}</td>
        <td class="fechasalida">${r.fechaSalida || ''}</td>
        <td>${r.adultos || 0}</td>
        <td>${r.mascotas || 0}</td>
        <td>${r.estado || ''}</td>
        <td><div class="acciones">
          <button class="detalle-btn" data-id="${docSnap.id}">Ver Detalle</button>
          <button class="confirmar-btn" data-id="${docSnap.id}" data-estado="${r.estado}" ${esCancelada ? 'disabled' : ''}>${esConfirmada ? 'Marcar como pendiente' : 'Confirmar'}</button>
          <button class="cancelar-btn" data-id="${docSnap.id}" data-estado="${r.estado}">${esCancelada ? 'Marcar como pendiente' : 'Cancelar'}</button>
        </div></td>
      </tr>`;
    });
    tabla += '</tbody></table>';
    contenedor.innerHTML = tabla;
    // Listeners para detalle
    document.querySelectorAll('.detalle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        await mostrarDetalleReserva(id);
      });
    });
    // Listeners para confirmar
    document.querySelectorAll('.confirmar-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        const estadoActual = btn.getAttribute('data-estado');
        if (estadoActual === 'confirmada') {
          mostrarModalConfirmar('¿Quieres marcar esta reserva como pendiente?', async () => {
            await marcarReservaPendiente(id);
          });
        } else {
          mostrarModalConfirmar('¿Quieres confirmar esta reserva y enviar el email de confirmación?', async () => {
            await confirmarReserva(id);
          });
        }
      });
    });
    // Listeners para cancelar
    document.querySelectorAll('.cancelar-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        const estadoActual = btn.getAttribute('data-estado');
        if (estadoActual === 'cancelado') {
          mostrarModalConfirmar('¿Quieres marcar esta reserva como pendiente?', async () => {
            await marcarReservaPendiente(id);
          });
        } else {
          mostrarModalConfirmar('¿Estás seguro de que deseas cancelar esta reserva?', async () => {
          await cancelarReserva(id);
          });
        }
      });
    });
  } catch (err) {
    contenedor.innerHTML = `<p style="color:red;">Error al cargar reservas: ${err.message}</p>`;
  }
}

// Función para cargar precios base desde Firestore y mostrar todos los precios
async function cargarPreciosBase() {
  const contenedor = document.getElementById('precios-lista');
  contenedor.innerHTML = '<p>Cargando precios...</p>';
  try {
    // Obtener precios de huespedes
    const huespedesSnap = await getDoc(doc(db, 'prices', 'huespedes'));
    const vehiculosSnap = await getDoc(doc(db, 'prices', 'vehicles_base'));
    const extrasSnap = await getDoc(doc(db, 'prices', 'extra_services'));
    const huespedes = huespedesSnap.exists() ? huespedesSnap.data() : {};
    const vehiculos = vehiculosSnap.exists() ? vehiculosSnap.data() : {};
    const extras = extrasSnap.exists() ? extrasSnap.data() : {};
    let advertencias = '';
    if (!huespedes.adultos) advertencias += '<tr><td colspan="2" style="color:red;">Falta precio de adulto</td></tr>';
    if (!huespedes.niños) advertencias += '<tr><td colspan="2" style="color:red;">Falta precio de niño</td></tr>';
    if (!huespedes.mascota) advertencias += '<tr><td colspan="2" style="color:red;">Falta precio de mascota</td></tr>';
    if (Object.keys(vehiculos).length === 0) advertencias += '<tr><td colspan="2" style="color:red;">No hay precios de vehículos</td></tr>';
    let html = `<table>
      <thead><tr><th colspan="2">Precios por Noche</th></tr></thead>
      <tbody>
        <tr class="precios-categoria"><td colspan="2">Huéspedes</td></tr>
        <tr><td>${'adulto'.toUpperCase()}</td><td><div class='precios-valor'>${huespedes.adultos !== undefined ? huespedes.adultos + ' €' : '- €'} <button class="editar-precio-btn" data-doc="huespedes" data-campo="adultos">Editar</button></div></td></tr>
        <tr><td>${'niño'.toUpperCase()}</td><td><div class='precios-valor'>${huespedes.niños !== undefined ? huespedes.niños + ' €' : '- €'} <button class="editar-precio-btn" data-doc="huespedes" data-campo="niños">Editar</button></div></td></tr>
        <tr><td>${'mascota'.toUpperCase()}</td><td><div class='precios-valor'>${huespedes.mascota !== undefined ? huespedes.mascota + ' €' : '- €'} <button class="editar-precio-btn" data-doc="huespedes" data-campo="mascota">Editar</button></div></td></tr>
        <tr class="precios-categoria"><td colspan="2">Vehículos</td></tr>
        ${Object.entries(vehiculos).map(([tipo, precio]) => `<tr><td>${tipo.toUpperCase().replace(/\.$/, '')}</td><td><div class='precios-valor'>${precio} € <button class='editar-precio-btn' data-doc='vehicles_base' data-campo='${tipo}'>Editar</button></div></td></tr>`).join('')}
        <tr class="precios-categoria"><td colspan="2">Servicios Extra</td></tr>
        <tr><td>ELECTRICIDAD</td><td>5 €/noche</td></tr>
        ${Object.entries(extras).map(([nombre, precio]) => `<tr><td>${nombre.toUpperCase()}</td><td><div class='precios-valor'>${precio} € <button class='editar-precio-btn' data-doc='extra_services' data-campo='${nombre}'>Editar</button></div></td></tr>`).join('')}
        ${advertencias}
      </tbody>
    </table>`;
    contenedor.innerHTML = html;
    // Listeners para editar precios
    document.querySelectorAll('.editar-precio-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docName = btn.getAttribute('data-doc');
        const campo = btn.getAttribute('data-campo');
        const valorActual = btn.parentElement.textContent.match(/([\d,.]+)/) ? btn.parentElement.textContent.match(/([\d,.]+)/)[1] : '';
        abrirModalEditarPrecio(docName, campo, valorActual);
      });
    });
  } catch (err) {
    contenedor.innerHTML = `<p style=\"color:red;\">Error al cargar precios: ${err.message}</p>`;
  }
}

// Función para confirmar una reserva (actualiza estado y dispara email)
async function confirmarReserva(reservaId) {
  try {
    // Obtener datos de la reserva
    const reservaDoc = await getDoc(doc(db, 'reservas', reservaId));
    if (!reservaDoc.exists()) throw new Error('Reserva no encontrada');
    const reserva = reservaDoc.data();
    // Actualizar estado en Firestore
    await updateDoc(doc(db, 'reservas', reservaId), { estado: 'confirmada' });
    // Enviar email de confirmación
    if (window.emailjs) {
      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        {
          reservation_id: reservaId,
          name: reserva.nombre,
          email: reserva.email,
          phone: reserva.telefono,
          'vehicle-type': reserva.vehiculoId,
          'vehicle-length': reserva.longitud ? `${reserva.longitud} metros` : '',
          checkin: formatearFecha(reserva.fechaLlegada),
          checkout: formatearFecha(reserva.fechaSalida),
          adults: reserva.adultos,
          children: reserva.ninos || 0,
          pets: reserva.mascotas || 0,
          services: reserva.serviciosAdicionales && reserva.serviciosAdicionales.length > 0
            ? reserva.serviciosAdicionales.join(', ')
            : 'Ninguno',
          message: reserva.comentarios || 'Sin comentarios adicionales'
        }
      );
    }
    mostrarAnimacionEmailEnviado();
    setTimeout(() => cargarReservas(), 1800);
  } catch (err) {
    alert('Error al confirmar la reserva: ' + err.message);
  }
}

// Nueva función para cancelar reserva
async function cancelarReserva(reservaId) {
  try {
    await updateDoc(doc(db, 'reservas', reservaId), { estado: 'cancelado' });
    cargarReservas();
  } catch (err) {
    alert('Error al cancelar la reserva: ' + err.message);
  }
}

// Nueva función para marcar como pendiente
async function marcarReservaPendiente(reservaId) {
  try {
    await updateDoc(doc(db, 'reservas', reservaId), { estado: 'pendiente' });
    cargarReservas();
  } catch (err) {
    alert('Error al marcar como pendiente: ' + err.message);
  }
}

// Modal detalle reserva
const modal = document.getElementById('detalle-modal');
const modalContent = document.getElementById('detalle-reserva-content');
const cerrarModal = document.getElementById('cerrar-modal');
cerrarModal.onclick = () => { modal.style.display = 'none'; };
window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };

async function mostrarDetalleReserva(reservaId) {
  try {
    // Obtener datos de la reserva
    const reservaDoc = await getDoc(doc(db, 'reservas', reservaId));
    if (!reservaDoc.exists()) throw new Error('Reserva no encontrada');
    const reserva = reservaDoc.data();
    // Obtener precios base
    const preciosVehiculosSnap = await getDoc(doc(db, 'prices', 'vehicles_base'));
    const preciosVehiculos = preciosVehiculosSnap.exists() ? preciosVehiculosSnap.data() : {};
    const huespedesSnap = await getDoc(doc(db, 'prices', 'huespedes'));
    const huespedes = huespedesSnap.exists() ? huespedesSnap.data() : {};
    const extrasSnap = await getDoc(doc(db, 'prices', 'extra_services'));
    const extras = extrasSnap.exists() ? extrasSnap.data() : {};
    // Cálculo de noches
    const fechaIn = new Date(reserva.fechaLlegada);
    const fechaOut = new Date(reserva.fechaSalida);
    const noches = Math.max(1, Math.ceil((fechaOut - fechaIn) / (1000*60*60*24)));
    // Adultos y niños
    const adultos = Number(reserva.adultos) || 0;
    let ninos = 0;
    if (typeof reserva.ninos !== 'undefined') ninos = Number(reserva.ninos) || 0;
    else if (typeof reserva.children !== 'undefined') ninos = Number(reserva.children) || 0;
    // --- OBTENER TIPO DE VEHÍCULO ---
    let tipoVehiculo = '';
    // Buscar en la reserva un campo que coincida con las claves de precios
    const clavesPrecios = Object.keys(preciosVehiculos).map(k => k.trim().toLowerCase());
    // Buscar en reserva
    for (const key of ['tipo', 'vehicle-type', 'tipoVehiculo', 'tipo_vehiculo']) {
      if (reserva[key] && clavesPrecios.includes(reserva[key].trim().toLowerCase())) {
        tipoVehiculo = reserva[key].trim().toLowerCase();
        break;
      }
    }
    // Si no está en la reserva, buscar en el documento del vehículo
    if (!tipoVehiculo && reserva.vehiculoId) {
      const vehiculoDoc = await getDoc(doc(db, 'vehicles', reserva.vehiculoId));
      if (vehiculoDoc.exists()) {
        const vehiculoData = vehiculoDoc.data();
        for (const key of ['tipo', 'vehicle-type', 'tipoVehiculo', 'tipo_vehiculo']) {
          if (vehiculoData[key] && clavesPrecios.includes(vehiculoData[key].trim().toLowerCase())) {
            tipoVehiculo = vehiculoData[key].trim().toLowerCase();
            break;
          }
        }
      }
    }
    // Si no se encuentra tipo válido, mostrar advertencia
    let advertenciaTipo = '';
    if (!tipoVehiculo) {
      advertenciaTipo = `<p style='color:red;'>No se ha encontrado un tipo de vehículo válido para el cálculo. Revisa los datos de la reserva y del vehículo.</p>`;
    }
    // Precios
    const precioVehiculo = tipoVehiculo ? preciosVehiculos[tipoVehiculo] || 0 : 0;
    const precioAdulto = huespedes.adultos || 0;
    const precioNino = huespedes.niños || 0;
    const precioMascota = huespedes.mascota || 0;
    // Servicios extra
    let totalExtras = 0;
    let detalleExtras = '';
    if (Array.isArray(reserva.serviciosAdicionales)) {
      reserva.serviciosAdicionales.forEach(serv => {
        if (serv.toLowerCase().includes('electricidad')) {
          totalExtras += 5 * noches;
          detalleExtras += `<li>Electricidad: 5€/noche × ${noches} = ${5*noches}€</li>`;
        } else if (extras[serv]) {
          totalExtras += extras[serv];
          detalleExtras += `<li>${serv}: ${extras[serv]}€ (pago único)</li>`;
        }
      });
    }
    // Total
    const subtotalNoche = precioVehiculo + (precioAdulto * adultos) + (precioNino * ninos) + (precioMascota * (reserva.mascotas || 0));
    const total = (subtotalNoche * noches) + totalExtras;
    // Render
    modalContent.innerHTML = `
      <p><strong>Nombre:</strong> ${reserva.nombre || ''}</p>
      <p><strong>Email:</strong> ${reserva.email || ''}</p>
      <p><strong>Teléfono:</strong> ${reserva.telefono || ''}</p>
      <p><strong>Fechas:</strong> ${reserva.fechaLlegada} a ${reserva.fechaSalida} (${noches} noches)</p>
      <p><strong>Adultos:</strong> ${adultos} &nbsp; <strong>Niños:</strong> ${ninos} &nbsp; <strong>Mascotas:</strong> ${reserva.mascotas || 0}</p>
      <p><strong>Tipo de vehículo:</strong> ${tipoVehiculo ? tipoVehiculo.replace(/\.$/, '') : '<span style=\'color:red;\'>No encontrado</span>'}</p>
      <p><strong>Matrícula:</strong> ${reserva.vehiculoId || reserva.matricula || ''}</p>
      <p><strong>Marca:</strong> ${reserva.marca || ''}</p>
      <p><strong>Modelo:</strong> ${reserva.modelo || ''}</p>
      <p><strong>Longitud:</strong> ${reserva.longitud || ''} m</p>
      <p><strong>Carrocería:</strong> ${reserva.carroceria || ''}</p>
      ${advertenciaTipo}
      <hr>
      <p><strong>Precio vehículo:</strong> ${precioVehiculo} €/noche</p>
      <p><strong>Precio adulto:</strong> ${precioAdulto} €/noche</p>
      <p><strong>Precio niño:</strong> ${precioNino} €/noche</p>
      <p><strong>Precio mascota:</strong> ${precioMascota} €/noche</p>
      <p><strong>Subtotal por noche:</strong> ${subtotalNoche.toFixed(2)} €</p>
      <p><strong>Servicios adicionales:</strong></p>
      <ul>${detalleExtras || '<li>Ninguno</li>'}</ul>
      <hr>
      <h3>Total: ${total.toFixed(2)} €</h3>
      <p style='font-size:0.9em;color:#888;'><strong>ID de reserva:</strong> ${reserva.reservaId || reservaId}</p>
      <details style='margin-top:1.5rem; background:#f5f5f5; padding:1rem; border-radius:6px;'>
        <summary style='cursor:pointer; font-weight:bold;'>Depuración de cálculo</summary>
        <pre style='font-size:0.9em; white-space:pre-wrap;'>
Tipo vehículo reserva: ${tipoVehiculo}
Claves vehicles_base: ${Object.keys(preciosVehiculos).join(', ')}
precioVehiculo: ${precioVehiculo}
precioAdulto: ${precioAdulto}
precioNino: ${precioNino}
precioMascota: ${precioMascota}
adultos: ${adultos}
ninos: ${ninos}
reserva: ${JSON.stringify(reserva, null, 2)}
        </pre>
      </details>
    `;
    modal.style.display = 'block';
  } catch (err) {
    modalContent.innerHTML = `<p style='color:red;'>Error al cargar detalle: ${err.message}</p>`;
    modal.style.display = 'block';
  }
}

// Modal edición precio
function abrirModalEditarPrecio(docName, campo, valorActual) {
  const modal = document.getElementById('modal-editar-precio');
  const input = document.getElementById('input-editar-precio');
  const label = document.getElementById('label-editar-precio');
  input.value = valorActual.replace(',', '.');
  label.textContent = `Nuevo valor para '${campo}':`;
  modal.style.display = 'block';
  input.focus();
  // Guardar referencias para submit
  modal.dataset.doc = docName;
  modal.dataset.campo = campo;
}

// Cerrar modal
const cerrarModalPrecio = document.getElementById('cerrar-modal-precio');
cerrarModalPrecio.onclick = () => {
  document.getElementById('modal-editar-precio').style.display = 'none';
};

document.getElementById('cancelar-editar-precio').onclick = () => {
  document.getElementById('modal-editar-precio').style.display = 'none';
};

window.onclick = (event) => {
  const modal = document.getElementById('modal-editar-precio');
  if (event.target === modal) modal.style.display = 'none';
};

// Guardar precio
const formEditarPrecio = document.getElementById('form-editar-precio');
formEditarPrecio.onsubmit = async (e) => {
  e.preventDefault();
  const modal = document.getElementById('modal-editar-precio');
  const docName = modal.dataset.doc;
  const campo = modal.dataset.campo;
  const nuevoValor = document.getElementById('input-editar-precio').value;
  if (nuevoValor !== '' && !isNaN(Number(nuevoValor))) {
    try {
      await updateDoc(doc(db, 'prices', docName), { [campo]: Number(nuevoValor) });
      alert('Precio actualizado correctamente.');
      modal.style.display = 'none';
      cargarPreciosBase();
    } catch (err) {
      alert('Error al actualizar el precio: ' + err.message);
    }
  } else {
    alert('Introduce un valor numérico válido.');
  }
};

// Modal confirmación acción
function mostrarModalConfirmar(mensaje, onAceptar) {
  const modal = document.getElementById('modal-confirmar-accion');
  const mensajeEl = document.getElementById('mensaje-modal-confirmar');
  mensajeEl.textContent = mensaje;
  modal.style.display = 'block';
  // Limpiar listeners previos
  const aceptarBtn = document.getElementById('aceptar-modal-confirmar');
  const cancelarBtn = document.getElementById('cancelar-modal-confirmar');
  const cerrarBtn = document.getElementById('cerrar-modal-confirmar');
  aceptarBtn.onclick = async () => {
    modal.style.display = 'none';
    await onAceptar();
  };
  cancelarBtn.onclick = cerrarBtn.onclick = () => {
    modal.style.display = 'none';
  };
}

// Animación email enviado
function mostrarAnimacionEmailEnviado() {
  const anim = document.getElementById('email-enviado-anim');
  anim.style.display = 'flex';
  setTimeout(() => {
    anim.style.display = 'none';
  }, 1800);
}

// --- INFORMES DE RESERVAS ---

// Mostrar sección de informes al hacer clic en el menú (puedes adaptar esto a tu menú real)
window.mostrarInformes = function() {
  document.getElementById('reservas-section').style.display = 'none';
  document.getElementById('precios-section').style.display = 'none';
  document.getElementById('informes-section').style.display = '';
  // Resaltar botón Informes
  const menuInformes = document.getElementById('menu-informes');
  if (menuInformes) menuInformes.classList.add('activo-informes');
};
// Puedes añadir un botón en el menú que llame a mostrarInformes()

// Inicializar DataTable y cargar datos
let dataTableInformes;
async function cargarInformesReservas() {
  try {
    console.log('Iniciando carga de informes...');
    const tabla = $('#tabla-informes');
    if (!tabla.length) {
      console.error('No se encontró la tabla de informes');
      return;
    }

    // Destruir DataTable existente si existe
    if (dataTableInformes) {
      dataTableInformes.destroy();
    }

    const tbody = tabla.find('tbody');
    tbody.html('<tr><td colspan="20">Cargando reservas...</td></tr>');

    // Obtener datos de Firestore
    console.log('Obteniendo datos de Firestore...');
    const snapshot = await getDocs(collection(db, 'reservas'));
    if (snapshot.empty) {
      tbody.html('<tr><td colspan="20">No hay reservas registradas.</td></tr>');
      return;
    }

    const reservas = [];
    // Para filtros únicos
    const ids = new Set();
    const matriculas = new Set();
    const estados = new Set();
    const tipos = new Set();

    // Obtener precios base para el cálculo
    const preciosVehiculosSnap = await getDoc(doc(db, 'prices', 'vehicles_base'));
    const preciosVehiculos = preciosVehiculosSnap.exists() ? preciosVehiculosSnap.data() : {};
    const huespedesSnap = await getDoc(doc(db, 'prices', 'huespedes'));
    const huespedes = huespedesSnap.exists() ? huespedesSnap.data() : {};
    const extrasSnap = await getDoc(doc(db, 'prices', 'extra_services'));
    const extras = extrasSnap.exists() ? extrasSnap.data() : {};

    console.log('Procesando reservas...');
    snapshot.forEach(docSnap => {
      const r = docSnap.data();
      // Cálculo de noches
      const fechaIn = new Date(r.fechaLlegada);
      const fechaOut = new Date(r.fechaSalida);
      const noches = Math.max(1, Math.ceil((fechaOut - fechaIn) / (1000*60*60*24)));
      // Adultos, niños, mascotas
      const adultos = Number(r.adultos) || 0;
      let ninos = 0;
      if (typeof r.ninos !== 'undefined') ninos = Number(r.ninos) || 0;
      else if (typeof r.children !== 'undefined') ninos = Number(r.children) || 0;
      const mascotas = Number(r.mascotas) || 0;
      // Tipo vehículo
      let tipoVehiculo = r.tipo || '';
      if (!tipoVehiculo && r.vehiculoId && preciosVehiculos[r.vehiculoId]) tipoVehiculo = r.vehiculoId;
      // Precios
      const precioVehiculo = tipoVehiculo ? preciosVehiculos[tipoVehiculo] || 0 : 0;
      const precioAdulto = huespedes.adultos || 0;
      const precioNino = huespedes.niños || 0;
      const precioMascota = huespedes.mascota || 0;
      // Servicios extra
      let totalExtras = 0;
      if (Array.isArray(r.serviciosAdicionales)) {
        r.serviciosAdicionales.forEach(serv => {
          if (serv.toLowerCase().includes('electricidad')) {
            totalExtras += 5 * noches;
          } else if (extras[serv]) {
            totalExtras += extras[serv];
          }
        });
      }
      // Precio total
      const subtotalNoche = precioVehiculo + (precioAdulto * adultos) + (precioNino * ninos) + (precioMascota * mascotas);
      const precioTotal = (subtotalNoche * noches) + totalExtras;
      reservas.push({
        id: docSnap.id,
        estado: r.estado || '',
        fechaReserva: r.fechaReserva ? new Date(r.fechaReserva).toLocaleString() : '',
        comentarios: r.comentarios || '',
        fechaLlegada: r.fechaLlegada || '',
        fechaSalida: r.fechaSalida || '',
        nombre: r.nombre || '',
        email: r.email || '',
        telefono: r.telefono || '',
        adultos: r.adultos || 0,
        ninos: r.ninos || 0,
        mascotas: r.mascotas || 0,
        tipo: r.tipo || '',
        matricula: r.vehiculoId || '',
        marca: r.marca || '',
        modelo: r.modelo || '',
        carroceria: r.carroceria || '',
        longitud: r.longitud || '',
        servicios: Array.isArray(r.serviciosAdicionales) ? r.serviciosAdicionales.join(', ') : '',
        precio: precioTotal.toFixed(2)
      });
      ids.add(docSnap.id);
      if (r.vehiculoId) matriculas.add(r.vehiculoId);
      if (r.estado) estados.add(r.estado);
      if (r.tipo) tipos.add(r.tipo);
    });

    // Poblar filtros desplegables
    console.log('Poblando filtros...');
    const idSelect = document.getElementById('filtro-id-reserva');
    if (idSelect) {
      idSelect.innerHTML = '<option value="">Todas las reservas</option>' + 
        Array.from(ids).map(id => `<option value="${id}">${id}</option>`).join('');
    }

    const matriculaSelect = document.getElementById('filtro-matricula');
    if (matriculaSelect) {
      matriculaSelect.innerHTML = '<option value="">Todas las matrículas</option>' + 
        Array.from(matriculas).map(m => `<option value="${m}">${m}</option>`).join('');
    }

    const estadoSelect = document.getElementById('filtro-estado');
    if (estadoSelect) {
      estadoSelect.innerHTML = '<option value="">Todos los estados</option>' + 
        Array.from(estados).map(e => `<option value="${e}">${e.charAt(0).toUpperCase() + e.slice(1)}</option>`).join('');
    }

    const tipoSelect = document.getElementById('filtro-tipo-vehiculo');
    if (tipoSelect) {
      tipoSelect.innerHTML = '<option value="">Todos los tipos</option>' + 
        Array.from(tipos).map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('');
    }

    // Limpiar y poblar la tabla
    console.log('Poblando tabla...');
    tbody.html('');
    reservas.forEach(r => {
      tbody.append(`<tr>
        <td>${r.id}</td>
        <td>${r.estado}</td>
        <td>${r.fechaReserva}</td>
        <td>${r.fechaLlegada}</td>
        <td>${r.fechaSalida}</td>
        <td>${r.nombre}</td>
        <td>${r.email}</td>
        <td>${r.telefono}</td>
        <td>${r.adultos}</td>
        <td>${r.ninos}</td>
        <td>${r.mascotas}</td>
        <td>${r.precio}</td>
        <td>${r.tipo}</td>
        <td>${r.matricula}</td>
        <td>${r.marca}</td>
        <td>${r.modelo}</td>
        <td>${r.carroceria}</td>
        <td>${r.longitud}</td>
        <td>${r.servicios}</td>
        <td>${r.comentarios}</td>
      </tr>`);
    });
    // Añadir title automático a cada celda para tooltip
    $('#tabla-informes tbody tr').each(function() {
      $(this).find('td').each(function() {
        if (!$(this).attr('title')) {
          $(this).attr('title', $(this).text());
        }
      });
    });

    // Inicializar DataTable
    console.log('Inicializando DataTable...');
    dataTableInformes = tabla.DataTable({
      dom: 'Bfrtip',
      buttons: [
        {
          extend: 'csvHtml5',
          text: '<i class="fa fa-file-csv"></i> Exportar CSV',
          className: 'btn-guardar',
          exportOptions: { columns: ':visible' }
        },
        {
          extend: 'excelHtml5',
          text: '<i class="fa fa-file-excel"></i> Exportar Excel',
          className: 'btn-guardar',
          exportOptions: { columns: ':visible' }
        },
        {
          extend: 'print',
          text: '<i class="fa fa-file-pdf"></i> Imprimir / PDF',
          className: 'btn-guardar',
          exportOptions: { columns: ':visible' }
        }
      ],
      order: [[4, 'desc']],
      language: {
        url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json',
        search: 'Buscar:',
        lengthMenu: 'Mostrar _MENU_ registros',
        info: 'Mostrando _START_ a _END_ de _TOTAL_ reservas',
        paginate: { previous: 'Anterior', next: 'Siguiente' }
      },
      responsive: false,
      colReorder: true,
      autoWidth: false
    });

    console.log('Carga de informes completada');
  } catch (error) {
    console.error('Error al cargar informes:', error);
    const tbody = $('#tabla-informes tbody');
    if (tbody.length) {
      tbody.html(`<tr><td colspan="20" style="color:red;">Error al cargar los datos: ${error.message}</td></tr>`);
    }
  }
}

// Filtros avanzados (actualizado para usar los nuevos select)
$('#filtro-id-reserva, #filtro-nombre, #filtro-matricula, #filtro-estado, #filtro-tipo-vehiculo, #filtro-fecha-desde, #filtro-fecha-hasta, #filtro-precio-min, #filtro-precio-max').on('input change', function() {
  if (!dataTableInformes) return;
  let idReserva = $('#filtro-id-reserva').val();
  let nombre = $('#filtro-nombre').val().toLowerCase();
  let matricula = $('#filtro-matricula').val();
  let estado = $('#filtro-estado').val();
  let tipo = $('#filtro-tipo-vehiculo').val();
  let fechaDesde = $('#filtro-fecha-desde').val();
  let fechaHasta = $('#filtro-fecha-hasta').val();
  let precioMin = parseFloat($('#filtro-precio-min').val()) || 0;
  let precioMax = parseFloat($('#filtro-precio-max').val()) || Infinity;
  dataTableInformes.rows().every(function() {
    const data = this.data();
    let mostrar = true;
    if (idReserva && data[0] !== idReserva) mostrar = false;
    if (nombre && !(data[1].toLowerCase().includes(nombre) || data[2].toLowerCase().includes(nombre))) mostrar = false;
    if (matricula && data[12] !== matricula) mostrar = false;
    if (estado && data[7] !== estado) mostrar = false;
    if (tipo && data[11] !== tipo) mostrar = false;
    if (fechaDesde && data[5] < fechaDesde) mostrar = false;
    if (fechaHasta && data[5] > fechaHasta) mostrar = false;
    let precio = parseFloat(data[19]) || 0;
    if (precio < precioMin || precio > precioMax) mostrar = false;
    $(this.node()).toggle(mostrar);
  });
});

// Botones personalizados (opcional, ya que DataTables los incluye)
$('#exportar-csv').on('click', function() { if (dataTableInformes) dataTableInformes.button('.buttons-csv').trigger(); });
$('#exportar-excel').on('click', function() { if (dataTableInformes) dataTableInformes.button('.buttons-excel').trigger(); });
$('#imprimir-informe').on('click', function() { if (dataTableInformes) dataTableInformes.button('.buttons-print').trigger(); });

// Mostrar informes al cargar (puedes cambiar esto por un botón/menu)
window.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...
  // Puedes mostrar la sección de informes automáticamente para pruebas:
  // mostrarInformes();
  // cargarInformesReservas();
  const menuInformes = document.getElementById('menu-informes');
  if (menuInformes) {
    menuInformes.addEventListener('click', function(e) {
      e.preventDefault();
      mostrarInformes();
      cargarInformesReservas();
    });
  }
  const volverReservasBtn = document.getElementById('volver-reservas');
  if (volverReservasBtn) {
    volverReservasBtn.addEventListener('click', function() {
      document.getElementById('informes-section').style.display = 'none';
      document.getElementById('reservas-section').style.display = '';
      document.getElementById('precios-section').style.display = '';
      // Quitar resaltado del botón Informes
      const menuInformes = document.getElementById('menu-informes');
      if (menuInformes) menuInformes.classList.remove('activo-informes');
    });
  }
}); 