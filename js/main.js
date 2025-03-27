
// ==============================================
// GOOGLE TRANSLATE INTEGRATION (SELECTOR DE IDIOMAS)
// ==============================================

// 1. Función para cargar la API de Google Translate
function loadGoogleTranslate() {
  // Verificar si ya está cargada para no duplicar
  if (typeof google !== 'undefined' && google.translate) return;
  
  var script = document.createElement('script');
  script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);
}

// 2. Callback cuando la API está lista
function googleTranslateElementInit() {
  new google.translate.TranslateElement({
      pageLanguage: 'es',
      includedLanguages: 'es,en,de,fr',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
  }, 'google_translate_element');
  
  // Inicializar nuestro selector personalizado
  initLanguageSelector();
}

// 3. Función principal para el selector de idiomas
function initLanguageSelector() {
  const languageLinks = document.querySelectorAll('.language-dropdown a');
  const currentLanguageFlag = document.getElementById('currentLanguageFlag');
  const languageBtn = document.querySelector('.language-btn');
  const languageDropdown = document.querySelector('.language-dropdown');
  
  if (!languageLinks.length || !currentLanguageFlag) return;
  
  // Función para cambiar el idioma
  function changeLanguage(lang, flagSrc) {
      // Cambiar la bandera mostrada
      currentLanguageFlag.src = 'img/' + flagSrc;
      currentLanguageFlag.alt = lang;
      
      // Usar la API de Google Translate para cambiar el idioma
      if (typeof google !== 'undefined' && google.translate) {
          const select = document.querySelector('#google_translate_element select');
          if (select) {
              select.value = lang;
              select.dispatchEvent(new Event('change'));
          }
      }
      
      // Cerrar el dropdown
      languageDropdown.classList.remove('show');
      
      // Guardar preferencia en localStorage
      localStorage.setItem('preferredLanguage', lang);
  }
  
  // Manejar clics en los enlaces de idioma
  languageLinks.forEach(link => {
      link.addEventListener('click', function(e) {
          e.preventDefault();
          const lang = this.getAttribute('data-lang');
          const flag = this.getAttribute('data-flag');
          changeLanguage(lang, flag);
      });
  });
  
  // Botón para mostrar/ocultar dropdown
  languageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      languageDropdown.classList.toggle('show');
  });
  
  // Cargar idioma guardado si existe
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang) {
      const langLink = document.querySelector(`.language-dropdown a[data-lang="${savedLang}"]`);
      if (langLink) {
          const flag = langLink.getAttribute('data-flag');
          changeLanguage(savedLang, flag);
      }
  }
  
  // Cerrar dropdown al hacer clic fuera
  document.addEventListener('click', function() {
      languageDropdown.classList.remove('show');
  });
}

// 4. Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Cargar Google Translate
  loadGoogleTranslate();
  
  // Verificar periódicamente si la API está lista (por si tarda en cargar)
  let attempts = 0;
  const checkTranslateAPI = setInterval(function() {
      attempts++;
      if (typeof google !== 'undefined' && google.translate) {
          clearInterval(checkTranslateAPI);
          if (!document.querySelector('#google_translate_element select')) {
              googleTranslateElementInit();
          }
      } else if (attempts > 10) {
          clearInterval(checkTranslateAPI);
          console.error('Google Translate API no se cargó correctamente');
      }
  }, 500);
});

// ==============================================
// EMAILJS INTEGRATION (FORMULARIO DE RESERVAS)
// ==============================================
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