// Añadir este código para manejar el estado de autenticación
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { db, auth } from './firebase-config.js';

onAuthStateChanged(auth, async (user) => {
    const loginMessage = document.getElementById('loginMessage');
    const formContent = document.getElementById('formContent');
    const navUserLink = document.querySelector('.nav-link');

    if (user) {
        // Obtener nombre real de Firestore
        let nombre = '';
        try {
            const userDoc = await getDoc(doc(db, 'customers', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                nombre = userData.name || user.email;
            } else {
                nombre = user.email;
            }
        } catch (e) {
            nombre = user.email;
        }
        // Usuario autenticado
        if (loginMessage) loginMessage.style.display = 'none';
        if (formContent) {
            formContent.classList.remove('disabled');
            formContent.style.opacity = '1';
        }
        if (navUserLink) {
            navUserLink.innerHTML = `<i class="fas fa-user"></i> ${nombre}`;
            navUserLink.href = 'profile.html';
        }
    } else {
        // Usuario no autenticado
        if (loginMessage) loginMessage.style.display = 'block';
        if (formContent) formContent.classList.add('disabled');
        if (navUserLink) {
            navUserLink.innerHTML = `<i class="fas fa-user"></i> Acceso Clientes`;
            navUserLink.href = 'login.html';
        }
    }
});

// Configuración de EmailJS
const emailjsConfig = {
  userId: 'GEEO4Ql6BtKkJP9hw',
  serviceId: 'service_f167wij',
  templateId: 'template_ny66xxg'
};

// Inicialización
emailjs.init(emailjsConfig.userId);

// Añadir esta función de ayuda
function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 3. Función para mostrar notificaciones bonitas
function mostrarNotificacion(tipo, mensaje) {
  // Crea el elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  notificacion.innerHTML = `
    <div class="notificacion-contenido">
      <i class="fas ${tipo === 'exito' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${mensaje}</span>
    </div>
  `;
  
  // Añade al cuerpo del documento
  document.body.appendChild(notificacion);
  
  // Elimina después de 5 segundos
  setTimeout(() => {
    notificacion.classList.add('desvanecer');
    setTimeout(() => notificacion.remove(), 500);
  }, 5000);
}

// Manejo del formulario
document.getElementById('reservationForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  try {
    // Verificar si el usuario está autenticado
    if (!auth.currentUser) {
      mostrarNotificacion('error', 'Debes iniciar sesión para realizar una reserva');
      return;
    }

    // Validación del formulario
    if (!validarFormulario()) return;

    const userId = auth.currentUser.uid;
    
    // Normalizar matrícula: mayúsculas y sin espacios
    const matriculaNormalizada = document.getElementById('vehicle-plate').value.toUpperCase().replace(/\s+/g, '');
    const vehiculoData = {
      tipo: document.getElementById('vehicle-type').value,
      longitud: document.getElementById('vehicle-length').value,
      marca: document.getElementById('vehicle-brand').value,
      modelo: document.getElementById('vehicle-model').value,
      matricula: matriculaNormalizada,
      carroceria: document.getElementById('vehicle-body').value,
      ultimaActualizacion: new Date().toISOString()
    };

    // Crear referencia al vehículo usando la matrícula normalizada como ID
    const vehiculoRef = doc(db, `customers/${userId}/vehicles`, matriculaNormalizada);
    await setDoc(vehiculoRef, vehiculoData);
    // Guardar también en la colección global 'vehicles'
    const vehiculoGlobalRef = doc(db, 'vehicles', matriculaNormalizada);
    await setDoc(vehiculoGlobalRef, { ...vehiculoData, userId });

    // 2. Luego crear la reserva vinculada al usuario y vehículo
    const reservaData = {
      userId: userId,
      userEmail: auth.currentUser.email,
      nombre: document.getElementById('name').value,
      email: document.getElementById('email').value,
      telefono: document.getElementById('phone').value,
      adultos: parseInt(document.getElementById('adults').value),
      ninos: parseInt(document.getElementById('children').value),
      mascotas: parseInt(document.getElementById('pets').value),
      fechaLlegada: document.getElementById('checkin').value,
      fechaSalida: document.getElementById('checkout').value,
      vehiculoId: matriculaNormalizada, // Referencia normalizada
      tipo: vehiculoData.tipo,
      longitud: vehiculoData.longitud,
      marca: vehiculoData.marca,
      modelo: vehiculoData.modelo,
      carroceria: vehiculoData.carroceria,
      serviciosAdicionales: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(input => input.value),
      comentarios: document.getElementById('message').value,
      fechaReserva: new Date().toISOString(),
      estado: 'pendiente'
    };

    // Guardar la reserva en la subcolección del usuario
    const reservaRef = await addDoc(
      collection(db, `customers/${userId}/reservas`), 
      reservaData
    );

    // También guardar en la colección general de reservas para consulta global
    await setDoc(doc(db, 'reservas', reservaRef.id), {
      ...reservaData,
      reservaId: reservaRef.id
    });

    console.log("Reserva guardada con ID:", reservaRef.id);

    // Enviar email de confirmación
    const emailResponse = await emailjs.send(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      {
        reservation_id: reservaRef.id,
        name: reservaData.nombre,
        email: reservaData.email,
        phone: reservaData.telefono,
        'vehicle-type': reservaData.vehiculoId,
        'vehicle-length': `${reservaData.longitud} metros`,
        checkin: formatearFecha(reservaData.fechaLlegada),
        checkout: formatearFecha(reservaData.fechaSalida),
        adults: reservaData.adultos,
        children: reservaData.ninos,
        pets: reservaData.mascotas,
        services: reservaData.serviciosAdicionales.length > 0 
            ? reservaData.serviciosAdicionales.join(', ')
            : 'Ninguno',
        message: reservaData.comentarios || 'Sin comentarios adicionales'
      }
    );

    console.log('Email enviado:', emailResponse);
    mostrarNotificacion('exito', 'Reserva realizada con éxito. Se ha enviado un email de confirmación.');
    e.target.reset();

  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('error', 'Error al procesar la reserva');
  }
});

// 5. Función de validación (mejorada)
function validarFormulario() {
  const camposRequeridos = [
    {id: 'name', nombre: 'Nombre completo'},
    {id: 'email', nombre: 'Email'},
    {id: 'phone', nombre: 'Teléfono'},
    {id: 'checkin', nombre: 'Fecha de llegada'},
    {id: 'checkout', nombre: 'Fecha de salida'},
    {id: 'vehicle-type', nombre: 'Tipo de vehículo'},
    {id: 'vehicle-length', nombre: 'Longitud del vehículo'},
    {id: 'vehicle-brand', nombre: 'Marca del vehículo'},
    {id: 'vehicle-model', nombre: 'Modelo del vehículo'},
    {id: 'vehicle-plate', nombre: 'Matrícula'},
    {id: 'vehicle-body', nombre: 'Tipo de carrocería'}
  ];

  for (const campo of camposRequeridos) {
    const elemento = document.getElementById(campo.id);
    if (!elemento.value.trim()) {
      mostrarNotificacion('error', `Complete: ${campo.nombre}`);
      elemento.focus();
      return false;
    }
  }

  // Validación de fechas
  const checkin = new Date(document.getElementById('checkin').value);
  const checkout = new Date(document.getElementById('checkout').value);
  
  if (checkin >= checkout) {
    mostrarNotificacion('error', 'La fecha de salida debe ser posterior');
    return false;
  }

  return true;
}

async function obtenerHistorialReservas(userId) {
  try {
    const reservasRef = collection(db, `customers/${userId}/reservas`);
    const reservasSnapshot = await getDocs(reservasRef);
    
    const reservas = [];
    for (const doc of reservasSnapshot.docs) {
      const reserva = doc.data();
      
      // Obtener datos del vehículo asociado
      const vehiculoRef = doc(db, `customers/${userId}/vehicles`, reserva.vehiculoId);
      const vehiculoDoc = await getDoc(vehiculoRef);
      
      reservas.push({
        id: doc.id,
        ...reserva,
        vehiculo: vehiculoDoc.exists() ? vehiculoDoc.data() : null
      });
    }
    
    return reservas;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return [];
  }
}