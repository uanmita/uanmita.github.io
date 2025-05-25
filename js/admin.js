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
  templateId: 'template_3wlt7x4'
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
      <th>ID</th><th>Email</th><th>Fecha Reserva</th><th>Fecha Llegada</th><th>Fecha Salida</th><th>Adultos</th><th>Mascotas</th><th>Estado</th><th>Pagada</th><th>Método de pago</th><th>Acciones</th>
    </tr></thead><tbody>`;
    snapshot.forEach(docSnap => {
      const r = docSnap.data();
      const esConfirmada = r.estado === 'confirmada';
      const esPendiente = r.estado === 'pendiente';
      const esCancelada = r.estado === 'cancelado';
      const pagoValido = ['Tarjeta bancaria','Transferencia','Bizum','Paypal'].includes(r.metodoPago);
      const esPagada = r.pagada;
      const clase = (esPagada && pagoValido) ? 'fila-pagada' : '';
      tabla += `<tr class="${clase}">
        <td>${docSnap.id}</td>
        <td>${r.email || ''}</td>
        <td class="fecha">${r.fechaReserva ? new Date(r.fechaReserva).toLocaleString() : ''}</td>
        <td class="fechallegada">${r.fechaLlegada || ''}</td>
        <td class="fechasalida">${r.fechaSalida || ''}</td>
        <td>${r.adultos || 0}</td>
        <td>${r.mascotas || 0}</td>
        <td>${r.estado || ''}</td>
        <td><input type="checkbox" class="check-pagada" data-id="${docSnap.id}" ${r.pagada ? 'checked' : ''} ${r.estado !== 'confirmada' ? 'disabled' : ''}></td>
        <td>
          <select class="select-metodo-pago" data-id="${docSnap.id}" ${r.estado !== 'confirmada' ? 'disabled' : ''}>
            <option value="">Sin especificar</option>
            <option value="Tarjeta bancaria" ${r.metodoPago === 'Tarjeta bancaria' ? 'selected' : ''}>Tarjeta bancaria</option>
            <option value="Transferencia" ${r.metodoPago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
            <option value="Bizum" ${r.metodoPago === 'Bizum' ? 'selected' : ''}>Bizum</option>
            <option value="Paypal" ${r.metodoPago === 'Paypal' ? 'selected' : ''}>Paypal</option>
          </select>
        </td>
        <td><div class="acciones">
          <button class="detalle-btn" data-id="${docSnap.id}">Ver Detalle</button>
          <button class="confirmar-btn" data-id="${docSnap.id}" data-estado="${r.estado}" ${esCancelada ? 'disabled' : ''}>${esConfirmada ? 'Marcar como pendiente' : 'Confirmar'}</button>
          <button class="cancelar-btn" data-id="${docSnap.id}" data-estado="${r.estado}">${esCancelada ? 'Marcar como pendiente' : 'Cancelar'}</button>
        </div></td>
      </tr>`;
    });
    tabla += '</tbody></table>';
    contenedor.innerHTML = tabla;
    activarListenersPagos();
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
        const fila = btn.closest('tr');
        if (estadoActual === 'confirmada') {
          mostrarModalConfirmar('¿Quieres marcar esta reserva como pendiente?', async () => {
            await marcarReservaPendiente(id);
            // Deshabilitar y limpiar pagada/metodoPago
            const chk = fila.querySelector('.check-pagada');
            const sel = fila.querySelector('.select-metodo-pago');
            if (chk) { chk.checked = false; chk.disabled = true; }
            if (sel) { sel.value = ''; sel.disabled = true; }
            fila.classList.remove('fila-pagada');
            await updateDoc(doc(db, 'reservas', id), { pagada: false, metodoPago: '' });
          });
        } else {
          mostrarModalConfirmar('¿Quieres confirmar esta reserva y enviar el email de confirmación?', async () => {
            await confirmarReserva(id);
            // Habilitar pagada/metodoPago
            const chk = fila.querySelector('.check-pagada');
            const sel = fila.querySelector('.select-metodo-pago');
            if (chk) chk.disabled = false;
            if (sel) sel.disabled = false;
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

function activarListenersPagos() {
  // Listener para el checkbox de pagada
  document.querySelectorAll('.check-pagada').forEach(chk => {
    chk.addEventListener('change', async function() {
      const id = this.getAttribute('data-id');
      const pagada = this.checked;
      await updateDoc(doc(db, 'reservas', id), { pagada });
      // Actualizar color de la fila en tiempo real
      const fila = this.closest('tr');
      const metodoPago = fila.querySelector('.select-metodo-pago').value;
      const pagoValido = ['Tarjeta bancaria','Transferencia','Bizum','Paypal'].includes(metodoPago);
      if (pagada && pagoValido) {
        fila.classList.add('fila-pagada');
      } else {
        fila.classList.remove('fila-pagada');
      }
    });
  });
  // Listener para el select de método de pago
  document.querySelectorAll('.select-metodo-pago').forEach(sel => {
    sel.addEventListener('change', async function() {
      const id = this.getAttribute('data-id');
      const metodoPago = this.value;
      await updateDoc(doc(db, 'reservas', id), { metodoPago });
      // Actualizar color de la fila en tiempo real
      const fila = this.closest('tr');
      const pagada = fila.querySelector('.check-pagada').checked;
      const pagoValido = ['Tarjeta bancaria','Transferencia','Bizum','Paypal'].includes(metodoPago);
      if (pagada && pagoValido) {
        fila.classList.add('fila-pagada');
      } else {
        fila.classList.remove('fila-pagada');
      }
    });
  });
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
    // Obtener precios base para el cálculo
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
    const clavesPrecios = Object.keys(preciosVehiculos).map(k => k.trim().toLowerCase());
    for (const key of ['tipo', 'vehicle-type', 'tipoVehiculo', 'tipo_vehiculo']) {
      if (reserva[key] && clavesPrecios.includes(reserva[key].trim().toLowerCase())) {
        tipoVehiculo = reserva[key].trim().toLowerCase();
        break;
      }
    }
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
    // Precios
    const precioVehiculo = tipoVehiculo ? preciosVehiculos[tipoVehiculo] || 0 : 0;
    const precioAdulto = huespedes.adultos || 0;
    const precioNino = huespedes.niños || 0;
    const precioMascota = huespedes.mascota || 0;
    // Servicios extra
    let totalExtras = 0;
    if (Array.isArray(reserva.serviciosAdicionales)) {
      reserva.serviciosAdicionales.forEach(serv => {
        if (serv.toLowerCase().includes('electricidad')) {
          totalExtras += 5 * noches;
        } else if (extras[serv]) {
          totalExtras += extras[serv];
        }
      });
    }
    // Total
    const subtotalNoche = precioVehiculo + (precioAdulto * adultos) + (precioNino * ninos) + (precioMascota * (reserva.mascotas || 0));
    const total = (subtotalNoche * noches) + totalExtras;
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
          message: reserva.comentarios || 'Sin comentarios adicionales',
          total_price: total.toFixed(2) + ' €'
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
    const tabla = $('#tabla-informes');
    if (!tabla.length) return;
    // Destruir DataTable existente y limpiar tbody antes de volver a inicializar
    if (dataTableInformes) {
      dataTableInformes.destroy();
      tabla.find('tbody').empty();
    }
    const tbody = tabla.find('tbody');
    tbody.html('<tr><td colspan="22">Cargando reservas...</td></tr>');

    // Obtener precios base para el cálculo
    const preciosVehiculosSnap = await getDoc(doc(db, 'prices', 'vehicles_base'));
    const preciosVehiculos = preciosVehiculosSnap.exists() ? preciosVehiculosSnap.data() : {};
    const huespedesSnap = await getDoc(doc(db, 'prices', 'huespedes'));
    const huespedes = huespedesSnap.exists() ? huespedesSnap.data() : {};
    const extrasSnap = await getDoc(doc(db, 'prices', 'extra_services'));
    const extras = extrasSnap.exists() ? extrasSnap.data() : {};

    const snapshot = await getDocs(collection(db, 'reservas'));
    if (snapshot.empty) {
      tbody.html('<tr><td colspan="22">No hay reservas registradas.</td></tr>');
      return;
    }
    const reservas = [];
    snapshot.forEach(docSnap => {
      const r = docSnap.data();
      // Cálculo de noches y precios igual que antes...
      const fechaIn = new Date(r.fechaLlegada);
      const fechaOut = new Date(r.fechaSalida);
      const noches = Math.max(1, Math.ceil((fechaOut - fechaIn) / (1000*60*60*24)));
      const adultos = Number(r.adultos) || 0;
      let ninos = 0;
      if (typeof r.ninos !== 'undefined') ninos = Number(r.ninos) || 0;
      else if (typeof r.children !== 'undefined') ninos = Number(r.children) || 0;
      const mascotas = Number(r.mascotas) || 0;
      let tipoVehiculo = r.tipo || '';
      if (!tipoVehiculo && r.vehiculoId && preciosVehiculos[r.vehiculoId]) tipoVehiculo = r.vehiculoId;
      const precioVehiculo = tipoVehiculo ? preciosVehiculos[tipoVehiculo] || 0 : 0;
      const precioAdulto = huespedes.adultos || 0;
      const precioNino = huespedes.niños || 0;
      const precioMascota = huespedes.mascota || 0;
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
      const subtotalNoche = precioVehiculo + (precioAdulto * adultos) + (precioNino * ninos) + (precioMascota * mascotas);
      const precioTotal = (subtotalNoche * noches) + totalExtras;
      reservas.push({
        id: docSnap.id,
        estado: r.estado || '',
        fechaReserva: r.fechaReserva ? new Date(r.fechaReserva).toLocaleString() : '',
        fechaLlegada: r.fechaLlegada || '',
        fechaSalida: r.fechaSalida || '',
        nombre: r.nombre || '',
        email: r.email || '',
        telefono: r.telefono || '',
        adultos: r.adultos || 0,
        ninos: r.ninos || 0,
        mascotas: r.mascotas || 0,
        precio: precioTotal.toFixed(2),
        tipo: r.tipo || '',
        matricula: r.vehiculoId || '',
        marca: r.marca || '',
        modelo: r.modelo || '',
        carroceria: r.carroceria || '',
        longitud: r.longitud || '',
        servicios: Array.isArray(r.serviciosAdicionales) ? r.serviciosAdicionales.join(', ') : '',
        comentarios: r.comentarios || '',
        pagada: r.pagada ? 'Sí' : 'No',
        metodoPago: r.metodoPago || ''
      });
    });
    tbody.html('');
    reservas.forEach(r => {
      const clase = (r.pagada === 'Sí' && ['Tarjeta bancaria','Transferencia','Bizum','Paypal'].includes(r.metodoPago)) ? 'fila-pagada' : '';
      tbody.append(`<tr class="${clase}">
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
        <td>${r.pagada}</td>
        <td>${r.metodoPago}</td>
      `);
    });
    // Inicializar DataTable con columnas alineadas y botones ocultos
    dataTableInformes = tabla.DataTable({
      data: reservas,
      columns: [
        { data: 'id' },
        { data: 'estado' },
        { data: 'fechaReserva' },
        { data: 'fechaLlegada' },
        { data: 'fechaSalida' },
        { data: 'nombre' },
        { data: 'email' },
        { data: 'telefono' },
        { data: 'adultos' },
        { data: 'ninos' },
        { data: 'mascotas' },
        { data: 'precio' },
        { data: 'tipo' },
        { data: 'matricula' },
        { data: 'marca' },
        { data: 'modelo' },
        { data: 'carroceria' },
        { data: 'longitud' },
        { data: 'servicios' },
        { data: 'comentarios' },
        { data: 'pagada' },
        { data: 'metodoPago' }
      ],
      responsive: true,
      colReorder: { fixedColumns: 0, realtime: true },
      dom: 'Btip',
      buttons: [
        { extend: 'copy', className: 'd-none' },
        { extend: 'excel', className: 'd-none' },
        { extend: 'csv', className: 'd-none' },
        { extend: 'pdf', className: 'd-none' },
        { extend: 'print', className: 'd-none' }
      ],
      language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
      order: [[2, 'desc']],
      pageLength: 25,
      scrollX: true,
      scrollCollapse: true,
      fixedColumns: true
    });
    // Asignar listeners de modales personalizados después de inicializar la tabla
    asignarListenersModalesInformes();
  } catch (error) {
    const tbody = $('#tabla-informes tbody');
    if (tbody.length) {
      tbody.html(`<tr><td colspan="22" style="color:red;">Error al cargar los datos: ${error.message}</td></tr>`);
    }
  }
}

function asignarListenersModalesInformes() {
  // Botones de exportación
  document.getElementById('btn-exportar-copiar').onclick = () => { dataTableInformes.button('.buttons-copy').trigger(); document.getElementById('modal-exportar').style.display = 'none'; };
  document.getElementById('btn-exportar-excel').onclick = () => { dataTableInformes.button('.buttons-excel').trigger(); document.getElementById('modal-exportar').style.display = 'none'; };
  document.getElementById('btn-exportar-csv').onclick = () => { dataTableInformes.button('.buttons-csv').trigger(); document.getElementById('modal-exportar').style.display = 'none'; };
  document.getElementById('btn-exportar-pdf').onclick = () => { dataTableInformes.button('.buttons-pdf').trigger(); document.getElementById('modal-exportar').style.display = 'none'; };
  document.getElementById('btn-exportar-imprimir').onclick = () => { dataTableInformes.button('.buttons-print').trigger(); document.getElementById('modal-exportar').style.display = 'none'; };
  // Modal columnas
  document.getElementById('abrir-modal-columnas').onclick = () => {
    rellenarColumnasModalInformes();
    document.getElementById('modal-columnas').style.display = 'block';
  };
  document.getElementById('guardar-columnas').onclick = () => {
    document.querySelectorAll('#form-columnas input[type=checkbox]').forEach(chk => {
      dataTableInformes.column(parseInt(chk.dataset.col)).visible(chk.checked);
    });
    document.getElementById('modal-columnas').style.display = 'none';
  };
}
function rellenarColumnasModalInformes() {
  const form = document.getElementById('form-columnas');
  form.innerHTML = '';
  dataTableInformes.columns().every(function(idx) {
    const col = this;
    const colName = col.header().textContent;
    const checked = col.visible() ? 'checked' : '';
    form.innerHTML += `
      <label style="display:flex;align-items:center;gap:0.5rem;">
        <input type="checkbox" data-col="${idx}" ${checked}>
        ${colName}
      </label>
    `;
  });
}

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
      mostrarInformesNueva();
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

// --- MODALES PERSONALIZADOS DE EXPORTAR Y COLUMNAS ---
window.addEventListener('DOMContentLoaded', () => {
  // Botones personalizados
  const btnExportar = document.getElementById('abrir-modal-exportar');
  const btnColumnas = document.getElementById('abrir-modal-columnas');
  const modalExportar = document.getElementById('modal-exportar');
  const modalColumnas = document.getElementById('modal-columnas');
  const cerrarExportar = document.getElementById('cerrar-modal-exportar');
  const cerrarColumnas = document.getElementById('cerrar-modal-columnas');
  const cancelarColumnas = document.getElementById('cancelar-columnas');
  const guardarColumnas = document.getElementById('guardar-columnas');
  const formColumnas = document.getElementById('form-columnas');

  // Mostrar modales
  if(btnExportar) btnExportar.onclick = () => { modalExportar.style.display = 'block'; };
  if(btnColumnas) btnColumnas.onclick = () => { rellenarColumnasModal(); modalColumnas.style.display = 'block'; };
  if(cerrarExportar) cerrarExportar.onclick = () => { modalExportar.style.display = 'none'; };
  if(cerrarColumnas) cerrarColumnas.onclick = () => { modalColumnas.style.display = 'none'; };
  if(cancelarColumnas) cancelarColumnas.onclick = () => { modalColumnas.style.display = 'none'; };

  // Acciones de exportación
  if(window.dataTableInformes) {
    document.getElementById('btn-exportar-copiar').onclick = () => { dataTableInformes.button('.buttons-copy').trigger(); modalExportar.style.display = 'none'; };
    document.getElementById('btn-exportar-excel').onclick = () => { dataTableInformes.button('.buttons-excel').trigger(); modalExportar.style.display = 'none'; };
    document.getElementById('btn-exportar-csv').onclick = () => { dataTableInformes.button('.buttons-csv').trigger(); modalExportar.style.display = 'none'; };
    document.getElementById('btn-exportar-pdf').onclick = () => { dataTableInformes.button('.buttons-pdf').trigger(); modalExportar.style.display = 'none'; };
    document.getElementById('btn-exportar-imprimir').onclick = () => { dataTableInformes.button('.buttons-print').trigger(); modalExportar.style.display = 'none'; };
  }

  // Selección de columnas
  function rellenarColumnasModal() {
    if(!window.dataTableInformes) return;
    formColumnas.innerHTML = '';
    dataTableInformes.columns().every(function(idx) {
      const col = this;
      const colName = col.header().textContent;
      const checked = col.visible() ? 'checked' : '';
      formColumnas.innerHTML += `
        <label style="display:flex;align-items:center;gap:0.5rem;">
          <input type="checkbox" data-col="${idx}" ${checked}>
          ${colName}
        </label>
      `;
    });
  }
  if(guardarColumnas) guardarColumnas.onclick = () => {
    document.querySelectorAll('#form-columnas input[type=checkbox]').forEach(chk => {
      window.dataTableInformes.column(parseInt(chk.dataset.col)).visible(chk.checked);
    });
    modalColumnas.style.display = 'none';
  };

  // Cerrar modales al hacer click fuera
  window.onclick = function(event) {
    if(event.target === modalExportar) modalExportar.style.display = 'none';
    if(event.target === modalColumnas) modalColumnas.style.display = 'none';
  };
});

// Filtros personalizados robustos solo para la tabla de informes
$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
  if (settings.nTable.id !== 'tabla-informes') return true;
  const rowData = dataTableInformes.row(dataIndex).data();
  if (!rowData) return true;

  let idReserva = $('#filtro-id-reserva').val();
  let nombre = ($('#filtro-nombre').val() || '').toLowerCase();
  let matricula = $('#filtro-matricula').val();
  let estado = $('#filtro-estado').val();
  let tipo = $('#filtro-tipo-vehiculo').val();
  let fechaDesde = $('#filtro-fecha-desde').val();
  let fechaHasta = $('#filtro-fecha-hasta').val();
  let precioMin = parseFloat($('#filtro-precio-min').val()) || 0;
  let precioMax = parseFloat($('#filtro-precio-max').val()) || Infinity;
  let pagada = $('#filtro-pagada').val();
  let metodoPago = $('#filtro-metodo-pago').val();

  if (idReserva && rowData.id !== idReserva) return false;
  if (nombre && !(rowData.nombre?.toLowerCase().includes(nombre) || rowData.email?.toLowerCase().includes(nombre))) return false;
  if (matricula && rowData.matricula !== matricula) return false;
  if (estado && rowData.estado !== estado) return false;
  if (tipo && rowData.tipo !== tipo) return false;
  if (fechaDesde && rowData.fechaLlegada < fechaDesde) return false;
  if (fechaHasta && rowData.fechaLlegada > fechaHasta) return false;
  let precio = parseFloat(rowData.precio) || 0;
  if (precio < precioMin || precio > precioMax) return false;
  if (pagada && rowData.pagada !== pagada) return false;
  if (metodoPago && rowData.metodoPago !== metodoPago) return false;

  return true;
});
$('#filtro-id-reserva, #filtro-nombre, #filtro-matricula, #filtro-estado, #filtro-tipo-vehiculo, #filtro-fecha-desde, #filtro-fecha-hasta, #filtro-precio-min, #filtro-precio-max, #filtro-pagada, #filtro-metodo-pago').on('input change', function() {
  if (window.dataTableInformes) window.dataTableInformes.draw();
});

// --- NUEVA TABLA DE INFORMES ---
async function cargarInformesNueva() {
  const tabla = document.getElementById('tabla-informes-nueva').getElementsByTagName('tbody')[0];
  tabla.innerHTML = '<tr><td colspan="22">Cargando reservas...</td></tr>';
  try {
    // Obtener precios base
    const preciosVehiculosSnap = await getDoc(doc(db, 'prices', 'vehicles_base'));
    const preciosVehiculos = preciosVehiculosSnap.exists() ? preciosVehiculosSnap.data() : {};
    const huespedesSnap = await getDoc(doc(db, 'prices', 'huespedes'));
    const huespedes = huespedesSnap.exists() ? huespedesSnap.data() : {};
    const extrasSnap = await getDoc(doc(db, 'prices', 'extra_services'));
    const extras = extrasSnap.exists() ? extrasSnap.data() : {};

    const snapshot = await getDocs(collection(db, 'reservas'));
    if (snapshot.empty) {
      tabla.innerHTML = '<tr><td colspan="22">No hay reservas registradas.</td></tr>';
      return;
    }
    let reservas = [];
    let ids = [];
    let metodosPagoSet = new Set();
    const docs = snapshot.docs;
    for (const docSnap of docs) {
      const r = docSnap.data();
      // --- Cálculo de precio total (idéntico al modal de detalle) ---
      const fechaIn = new Date(r.fechaLlegada);
      const fechaOut = new Date(r.fechaSalida);
      const noches = (fechaIn && fechaOut && !isNaN(fechaIn) && !isNaN(fechaOut)) ? Math.max(1, Math.ceil((fechaOut - fechaIn) / (1000*60*60*24))) : 1;
      const adultos = Number(r.adultos) || 0;
      let ninos = 0;
      if (typeof r.ninos !== 'undefined') ninos = Number(r.ninos) || 0;
      else if (typeof r.children !== 'undefined') ninos = Number(r.children) || 0;
      let tipoVehiculo = '';
      const clavesPrecios = Object.keys(preciosVehiculos).map(k => k.trim().toLowerCase());
      for (const key of ['tipo', 'vehicle-type', 'tipoVehiculo', 'tipo_vehiculo']) {
        if (r[key] && clavesPrecios.includes(r[key].trim().toLowerCase())) {
          tipoVehiculo = r[key].trim().toLowerCase();
          break;
        }
      }
      // NUEVO: Si no se encuentra tipoVehiculo, buscar en la colección vehicles
      if (!tipoVehiculo && r.vehiculoId) {
        try {
          const vehiculoDoc = await getDoc(doc(db, 'vehicles', r.vehiculoId));
          if (vehiculoDoc.exists()) {
            const vehiculoData = vehiculoDoc.data();
            for (const key of ['tipo', 'vehicle-type', 'tipoVehiculo', 'tipo_vehiculo']) {
              if (vehiculoData[key] && clavesPrecios.includes(vehiculoData[key].trim().toLowerCase())) {
                tipoVehiculo = vehiculoData[key].trim().toLowerCase();
                break;
              }
            }
          }
        } catch (e) {
          // Si hay error, dejar tipoVehiculo vacío
        }
      }
      const precioVehiculo = tipoVehiculo ? preciosVehiculos[tipoVehiculo] || 0 : 0;
      const precioAdulto = huespedes.adultos || 0;
      const precioNino = huespedes.niños || 0;
      const precioMascota = huespedes.mascota || 0;
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
      const subtotalNoche = precioVehiculo + (precioAdulto * adultos) + (precioNino * ninos) + (precioMascota * (r.mascotas || 0));
      const precioTotal = (subtotalNoche * noches) + totalExtras;
      // LOG DE DEPURACIÓN
      if (docSnap.id === '5O9t2i0Xn3wz6qkwmdFs') {
        console.log('DEPURACIÓN RESERVA', {
          id: docSnap.id,
          adultos, ninos, precioVehiculo, precioAdulto, precioNino, precioMascota, subtotalNoche, noches, totalExtras, precioTotal,
          tipoVehiculo,
          datosReserva: r
        });
      }
      reservas.push({
        id: docSnap.id,
        estado: r.estado || '',
        fechaReserva: r.fechaReserva ? new Date(r.fechaReserva).toLocaleString() : '',
        fechaLlegada: r.fechaLlegada || '',
        fechaSalida: r.fechaSalida || '',
        nombre: r.nombre || '',
        email: r.email || '',
        telefono: r.telefono || '',
        adultos: r.adultos || 0,
        ninos: r.ninos || 0,
        mascotas: r.mascotas || 0,
        precio: precioTotal.toFixed(2),
        tipo: r.tipo || '',
        matricula: r.vehiculoId || '',
        marca: r.marca || '',
        modelo: r.modelo || '',
        carroceria: r.carroceria || '',
        longitud: r.longitud || '',
        servicios: Array.isArray(r.serviciosAdicionales) ? r.serviciosAdicionales.join(', ') : '',
        comentarios: r.comentarios || '',
        pagada: r.pagada ? 'Sí' : 'No',
        metodoPago: r.metodoPago || ''
      });
      ids.push(docSnap.id);
      if (r.metodoPago) metodosPagoSet.add(r.metodoPago);
    }
    // Rellenar select de ID
    const idSelect = document.getElementById('filtro-id-nueva');
    if (idSelect) {
      idSelect.innerHTML = '<option value="">Todas</option>' + ids.map(id => `<option value="${id}">${id}</option>`).join('');
    }
    // Rellenar select de método de pago
    const metodoPagoSelect = document.getElementById('filtro-metodo-pago-nueva');
    if (metodoPagoSelect) {
      metodoPagoSelect.innerHTML = '<option value="">Todos</option>' + Array.from(metodosPagoSet).map(m => `<option value="${m}">${m}</option>`).join('');
    }
    renderizarTablaInformesNueva(reservas);
    activarFiltrosInformesNueva(reservas);
  } catch (err) {
    tabla.innerHTML = `<tr><td colspan="22" style="color:red;">Error al cargar reservas: ${err.message}</td></tr>`;
  }
}

function renderizarTablaInformesNueva(reservas) {
  const tbody = document.getElementById('tabla-informes-nueva').getElementsByTagName('tbody')[0];
  if (!reservas.length) {
    tbody.innerHTML = '<tr><td colspan="22">No hay reservas registradas.</td></tr>';
    return;
  }
  tbody.innerHTML = reservas.map(r => `
    <tr>
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
      <td>${r.pagada}</td>
      <td>${r.metodoPago}</td>
    </tr>
  `).join('');
}

function activarFiltrosInformesNueva(reservas) {
  const idSel = document.getElementById('filtro-id-nueva');
  const nombreInput = document.getElementById('filtro-nombre-nueva');
  const emailInput = document.getElementById('filtro-email-nueva');
  const estadoSel = document.getElementById('filtro-estado-nueva');
  const tipoSel = document.getElementById('filtro-tipo-nueva');
  const pagadaSel = document.getElementById('filtro-pagada-nueva');
  const fechaDesdeInput = document.getElementById('filtro-fecha-desde-nueva');
  const fechaHastaInput = document.getElementById('filtro-fecha-hasta-nueva');
  const fechaReservaDesdeInput = document.getElementById('filtro-fechareserva-desde-nueva');
  const fechaReservaHastaInput = document.getElementById('filtro-fechareserva-hasta-nueva');
  const precioMinInput = document.getElementById('filtro-precio-min-nueva');
  const precioMaxInput = document.getElementById('filtro-precio-max-nueva');
  const metodoPagoSel = document.getElementById('filtro-metodo-pago-nueva');
  const buscador = document.getElementById('buscador-nueva');
  function filtrar() {
    let id = idSel.value;
    let nombre = (nombreInput.value || '').toLowerCase();
    let email = (emailInput.value || '').toLowerCase();
    let estado = estadoSel.value;
    let tipo = tipoSel.value;
    let pagada = pagadaSel.value;
    let fechaDesde = fechaDesdeInput.value;
    let fechaHasta = fechaHastaInput.value;
    let fechaReservaDesde = fechaReservaDesdeInput.value;
    let fechaReservaHasta = fechaReservaHastaInput.value;
    let precioMin = parseFloat(precioMinInput.value) || 0;
    let precioMax = parseFloat(precioMaxInput.value) || Infinity;
    let metodoPago = metodoPagoSel.value;
    let texto = buscador.value.toLowerCase();
    let filtradas = reservas.filter(r => {
      if (id && r.id !== id) return false;
      if (nombre && !r.nombre.toLowerCase().includes(nombre)) return false;
      if (email && !r.email.toLowerCase().includes(email)) return false;
      if (estado && r.estado !== estado) return false;
      if (tipo && r.tipo !== tipo) return false;
      if (pagada && r.pagada !== pagada) return false;
      if (fechaDesde && r.fechaLlegada < fechaDesde) return false;
      if (fechaHasta && r.fechaLlegada > fechaHasta) return false;
      if (fechaReservaDesde) {
        // Convertir fechaReserva a yyyy-mm-dd para comparar
        let fechaReserva = '';
        if (r.fechaReserva) {
          const partes = r.fechaReserva.split('/');
          if (partes.length === 3) {
            // Formato dd/mm/yyyy hh:mm:ss
            const [dia, mes, anio] = partes[0].split('.').length === 3 ? partes[0].split('.') : partes[0].split('/');
            fechaReserva = `${anio}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`;
          }
        }
        if (!fechaReserva || fechaReserva < fechaReservaDesde) return false;
      }
      if (fechaReservaHasta) {
        let fechaReserva = '';
        if (r.fechaReserva) {
          const partes = r.fechaReserva.split('/');
          if (partes.length === 3) {
            const [dia, mes, anio] = partes[0].split('.').length === 3 ? partes[0].split('.') : partes[0].split('/');
            fechaReserva = `${anio}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`;
          }
        }
        if (!fechaReserva || fechaReserva > fechaReservaHasta) return false;
      }
      let precio = parseFloat(r.precio) || 0;
      if (precio < precioMin || precio > precioMax) return false;
      if (metodoPago && r.metodoPago !== metodoPago) return false;
      if (texto) {
        const campos = [r.nombre, r.email, r.matricula, r.id, r.telefono, r.comentarios].map(x => (x||'').toLowerCase());
        if (!campos.some(c => c.includes(texto))) return false;
      }
      return true;
    });
    renderizarTablaInformesNueva(filtradas);
  }
  idSel.onchange = nombreInput.oninput = emailInput.oninput = estadoSel.onchange = tipoSel.onchange = pagadaSel.onchange = fechaDesdeInput.onchange = fechaHastaInput.onchange = fechaReservaDesdeInput.onchange = fechaReservaHastaInput.onchange = precioMinInput.oninput = precioMaxInput.oninput = metodoPagoSel.onchange = buscador.oninput = filtrar;
}

// Llamar a cargarInformesNueva al mostrar la sección de informes
window.mostrarInformesNueva = function() {
  document.getElementById('reservas-section').style.display = 'none';
  document.getElementById('precios-section').style.display = 'none';
  document.getElementById('informes-section').style.display = '';
  cargarInformesNueva();
};
// Puedes llamar a mostrarInformesNueva() desde el menú o un botón para mostrar la nueva sección

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
      mostrarInformesNueva();
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

// --- LÓGICA DE EXPORTAR Y COLUMNAS PARA LA NUEVA TABLA DE INFORMES ---

// Configuración de columnas (debe coincidir con el thead)
const columnasInformesNueva = [
  'ID', 'Estado', 'Fecha Reserva', 'Fecha Llegada', 'Fecha Salida', 'Nombre', 'Email', 'Teléfono',
  'Adultos', 'Niños', 'Mascotas', 'Precio Total', 'Tipo Vehículo', 'Matrícula', 'Marca', 'Modelo',
  'Carrocería', 'Longitud', 'Servicios', 'Comentarios', 'Pagada', 'Método de pago'
];

// Estado de columnas visibles (por defecto todas visibles)
let columnasVisiblesNueva = columnasInformesNueva.map(() => true);

// Mostrar modal de columnas
const btnColumnasNueva = document.getElementById('btn-columnas-nueva');
const modalColumnasNueva = document.getElementById('modal-columnas-nueva');
const cerrarModalColumnasNueva = document.getElementById('cerrar-modal-columnas-nueva');
const cancelarColumnasNueva = document.getElementById('cancelar-columnas-nueva');
const guardarColumnasNueva = document.getElementById('guardar-columnas-nueva');
const formColumnasNueva = document.getElementById('form-columnas-nueva');
const seleccionarTodoColumnas = document.getElementById('seleccionar-todo-columnas');
const borrarTodoColumnas = document.getElementById('borrar-todo-columnas');

function abrirModalColumnasNueva() {
  formColumnasNueva.innerHTML = '';
  columnasInformesNueva.forEach((col, idx) => {
    formColumnasNueva.innerHTML += `
      <label style="display:flex;align-items:center;gap:0.5rem;">
        <input type="checkbox" data-col="${idx}" ${columnasVisiblesNueva[idx] ? 'checked' : ''}>
        ${col}
      </label>
    `;
  });
  modalColumnasNueva.style.display = 'block';
}
if (btnColumnasNueva) btnColumnasNueva.onclick = abrirModalColumnasNueva;
if (cerrarModalColumnasNueva) cerrarModalColumnasNueva.onclick = () => { modalColumnasNueva.style.display = 'none'; };
if (cancelarColumnasNueva) cancelarColumnasNueva.onclick = () => { modalColumnasNueva.style.display = 'none'; };
window.onclick = function(event) {
  if (event.target === modalColumnasNueva) modalColumnasNueva.style.display = 'none';
  if (event.target === modalExportarNueva) modalExportarNueva.style.display = 'none';
};
if (seleccionarTodoColumnas) seleccionarTodoColumnas.onclick = () => {
  formColumnasNueva.querySelectorAll('input[type=checkbox]').forEach(chk => chk.checked = true);
};
if (borrarTodoColumnas) borrarTodoColumnas.onclick = () => {
  formColumnasNueva.querySelectorAll('input[type=checkbox]').forEach(chk => chk.checked = false);
};
if (guardarColumnasNueva) guardarColumnasNueva.onclick = () => {
  // Actualizar el estado de columnas visibles
  columnasVisiblesNueva = Array.from(formColumnasNueva.querySelectorAll('input[type=checkbox]')).map(chk => chk.checked);
  // Mostrar/ocultar columnas en la tabla
  const tabla = document.getElementById('tabla-informes-nueva');
  // Cabecera
  tabla.querySelectorAll('thead th').forEach((th, idx) => {
    th.style.display = columnasVisiblesNueva[idx] ? '' : 'none';
  });
  // Filas
  tabla.querySelectorAll('tbody tr').forEach(tr => {
    tr.querySelectorAll('td').forEach((td, idx) => {
      td.style.display = columnasVisiblesNueva[idx] ? '' : 'none';
    });
  });
  modalColumnasNueva.style.display = 'none';
};

// Mostrar modal de exportar
const btnExportarNueva = document.getElementById('btn-exportar-nueva');
const modalExportarNueva = document.getElementById('modal-exportar-nueva');
const cerrarModalExportarNueva = document.getElementById('cerrar-modal-exportar-nueva');
if (btnExportarNueva) btnExportarNueva.onclick = () => { modalExportarNueva.style.display = 'block'; };
if (cerrarModalExportarNueva) cerrarModalExportarNueva.onclick = () => { modalExportarNueva.style.display = 'none'; };

// Función para obtener los datos visibles de la tabla
function obtenerDatosVisiblesTabla() {
  const tabla = document.getElementById('tabla-informes-nueva');
  const filas = Array.from(tabla.querySelectorAll('tbody tr'));
  return filas.map(tr =>
    Array.from(tr.querySelectorAll('td')).filter((td, idx) => columnasVisiblesNueva[idx]).map(td => td.textContent)
  );
}
// Función para obtener los títulos visibles
function obtenerTitulosVisibles() {
  return columnasInformesNueva.filter((_, idx) => columnasVisiblesNueva[idx]);
}

// Funciones de exportación e impresión
function exportarCSV() {
  const titulos = obtenerTitulosVisibles();
  const datos = obtenerDatosVisiblesTabla();
  let csv = titulos.join(';') + '\n';
  datos.forEach(fila => { csv += fila.join(';') + '\n'; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reservas.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportarExcel() {
  // Exportación simple a Excel usando CSV
  exportarCSV();
}
function exportarPDF() {
  // Exportación simple a PDF usando window.print() (solo columnas visibles)
  imprimirTabla(true);
}
function copiarTabla() {
  const titulos = obtenerTitulosVisibles();
  const datos = obtenerDatosVisiblesTabla();
  const texto = [titulos.join('\t'), ...datos.map(fila => fila.join('\t'))].join('\n');
  navigator.clipboard.writeText(texto);
  alert('Datos copiados al portapapeles');
}
function imprimirTabla(esPDF = false) {
  const titulos = obtenerTitulosVisibles();
  const datos = obtenerDatosVisiblesTabla();
  let html = '<table style="width:100%;border-collapse:collapse;font-family:inherit;">';
  html += '<thead><tr>' + titulos.map(t => `<th style=\"border:1px solid #ccc;padding:8px;background:#e3e8fa;\">${t}</th>`).join('') + '</tr></thead>';
  html += '<tbody>' + datos.map(fila => '<tr>' + fila.map(d => `<td style=\"border:1px solid #ccc;padding:8px;\">${d}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
  const win = window.open('', '', 'width=900,height=700');
  win.document.write('<html><head><title>Imprimir Reservas</title></head><body>' + html + '</body></html>');
  win.document.close();
  win.focus();
  win.print();
  if (esPDF) setTimeout(() => win.close(), 1000);
}

// Asignar acciones a los botones del modal de exportar
const btnCopiar = document.getElementById('btn-exportar-copiar-nueva');
const btnExcel = document.getElementById('btn-exportar-excel-nueva');
const btnCSV = document.getElementById('btn-exportar-csv-nueva');
const btnPDF = document.getElementById('btn-exportar-pdf-nueva');
const btnImprimir = document.getElementById('btn-exportar-imprimir-nueva');
if (btnCopiar) btnCopiar.onclick = () => { copiarTabla(); modalExportarNueva.style.display = 'none'; };
if (btnExcel) btnExcel.onclick = () => { exportarExcel(); modalExportarNueva.style.display = 'none'; };
if (btnCSV) btnCSV.onclick = () => { exportarCSV(); modalExportarNueva.style.display = 'none'; };
if (btnPDF) btnPDF.onclick = () => { exportarPDF(); modalExportarNueva.style.display = 'none'; };
if (btnImprimir) btnImprimir.onclick = () => { imprimirTabla(); modalExportarNueva.style.display = 'none'; };

// Al aplicar columnas, refrescar la tabla para que los cambios sean inmediatos
// (ya se hace en guardarColumnasNueva)

// --- DRAG & DROP DE COLUMNAS EN LA NUEVA TABLA DE INFORMES ---
function activarDragDropColumnas() {
  const tabla = document.getElementById('tabla-informes-nueva');
  const thead = tabla.querySelector('thead');
  let dragSrcIdx = null;

  thead.querySelectorAll('th').forEach((th, idx) => {
    th.draggable = true;
    th.ondragstart = function(e) {
      dragSrcIdx = idx;
      e.dataTransfer.effectAllowed = 'move';
      th.classList.add('dragging');
    };
    th.ondragend = function() {
      th.classList.remove('dragging');
    };
    th.ondragover = function(e) {
      e.preventDefault();
      th.classList.add('col-hover');
    };
    th.ondragleave = function() {
      th.classList.remove('col-hover');
    };
    th.ondrop = function(e) {
      e.preventDefault();
      th.classList.remove('col-hover');
      if (dragSrcIdx === null || dragSrcIdx === idx) return;
      moverColumnaTabla(dragSrcIdx, idx);
      dragSrcIdx = null;
    };
  });
}

function moverColumnaTabla(fromIdx, toIdx) {
  const tabla = document.getElementById('tabla-informes-nueva');
  // Mover th
  const ths = Array.from(tabla.querySelectorAll('thead th'));
  tabla.querySelector('thead tr').insertBefore(ths[fromIdx], ths[toIdx + (fromIdx < toIdx ? 1 : 0)]);
  // Mover cada td en cada fila
  tabla.querySelectorAll('tbody tr').forEach(tr => {
    const tds = Array.from(tr.children);
    tr.insertBefore(tds[fromIdx], tds[toIdx + (fromIdx < toIdx ? 1 : 0)]);
  });
  // Actualizar el orden en columnasInformesNueva y columnasVisiblesNueva
  const col = columnasInformesNueva.splice(fromIdx, 1)[0];
  columnasInformesNueva.splice(toIdx, 0, col);
  const vis = columnasVisiblesNueva.splice(fromIdx, 1)[0];
  columnasVisiblesNueva.splice(toIdx, 0, vis);
}

// Llamar a activarDragDropColumnas después de renderizar la tabla
const oldRenderizarTablaInformesNueva = renderizarTablaInformesNueva;
renderizarTablaInformesNueva = function(reservas) {
  oldRenderizarTablaInformesNueva(reservas);
  activarDragDropColumnas();
}; 