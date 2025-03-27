// 1. Configuración (REMPLAZA CON TUS DATOS REALES)
const emailjsConfig = {
  userId: 'GEEO4Ql6BtKkJP9hw', // Ej: 'user_AbC123xyz'
  serviceId: 'service_f167wij', // Ej: 'service_autocaravanas'
  templateId: 'template_ny66xxg' // Ej: 'template_reservas'
};

// 2. Inicialización
emailjs.init(emailjsConfig.userId);

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

// 4. Manejo del formulario
document.getElementById('reservationForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  try {
    // Validación
    if (!validarFormulario()) return;
    
    // Estado de carga
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    
    // Enviar formulario
    const response = await emailjs.sendForm(
      emailjsConfig.serviceId,
      emailjsConfig.templateId,
      this
    );
    
    console.log('Éxito:', response);
    mostrarNotificacion('exito', 'Solicitud de reserva enviada con éxito ✔️');
    this.reset();
    
  } catch (error) {
    console.error('Error:', error);
    mostrarNotificacion('error', `Error al enviar: ${error.text || 'Por favor intente más tarde'}`);
    
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
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
    {id: 'vehicle-length', nombre: 'Longitud del vehículo'}
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
