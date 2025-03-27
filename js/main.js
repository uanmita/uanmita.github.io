// ==============================================
// INITIALIZATION SYSTEM
// ==============================================

/**
 * Sistema de inicialización robusto con reintentos
 * Garantiza que los elementos existan antes de ejecutar código
 */
class SafeInitializer {
  constructor() {
    this.maxAttempts = 10;
    this.attemptInterval = 100;
  }

  initializeWhenReady(elementIds, callback) {
    let attempts = 0;
    
    const tryInitialization = () => {
      attempts++;
      const elements = this.getElements(elementIds);
      
      if (this.allElementsExist(elements)) {
        console.log('Todos los elementos encontrados en el intento', attempts);
        callback(elements);
      } else if (attempts < this.maxAttempts) {
        setTimeout(tryInitialization, this.attemptInterval);
      } else {
        this.handleMissingElements(elementIds, elements);
      }
    };

    tryInitialization();
  }

  getElements(ids) {
    return ids.map(id => ({
      id,
      element: document.getElementById(id),
      exists: !!document.getElementById(id)
    }));
  }

  allElementsExist(elements) {
    return elements.every(item => item.exists);
  }

  handleMissingElements(ids, elements) {
    console.error('ERROR: No se encontraron los siguientes elementos después de', this.maxAttempts, 'intentos:');
    elements.forEach(item => {
      if (!item.exists) {
        console.error('- Falta:', item.id);
      }
    });
    console.log('Elementos disponibles:', document.querySelectorAll('[id]'));
  }
}

// ==============================================
// LANGUAGE SELECTOR (SELECTOR DE IDIOMAS)
// ==============================================

function initializeLanguageSelector() {
  const initializer = new SafeInitializer();
  
  initializer.initializeWhenReady(
    ['languageButton', 'languageDropdown'], 
    (elements) => {
      const button = elements[0].element;
      const dropdown = elements[1].element;
      
      // Configuración visual inicial
      dropdown.style.transition = 'all 0.3s ease';
      dropdown.style.display = 'none';
      
      // Evento para mostrar/ocultar
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
      });

      // Cerrar al hacer clic fuera
      document.addEventListener('click', function() {
        dropdown.style.display = 'none';
      });

      // Configurar opciones de idioma
      const options = document.querySelectorAll('.language-dropdown a');
      options.forEach(option => {
        option.addEventListener('click', function(e) {
          e.preventDefault();
          const lang = this.getAttribute('data-lang');
          const flag = this.getAttribute('data-flag');
          const text = this.getAttribute('data-text');
          
          // Actualizar visualización
          document.getElementById('currentLanguageFlag').src = 'img/' + flag;
          document.getElementById('currentLanguageText').textContent = text;
          
          // Cerrar dropdown
          dropdown.style.display = 'none';
          
          // Guardar preferencia
          localStorage.setItem('preferredLanguage', lang);
          
          // Cambiar idioma con Google Translate si está disponible
          if (window.google && google.translate) {
            const select = document.querySelector('#google_translate_element select');
            if (select) {
              select.value = lang;
              select.dispatchEvent(new Event('change'));
            }
          }
        });
      });

      console.log('Selector de idiomas inicializado correctamente');
    }
  );
}

// ==============================================
// EMAILJS FORM HANDLER (FORMULARIO DE RESERVAS)
// ==============================================

function initializeReservationForm() {
  const initializer = new SafeInitializer();
  
  initializer.initializeWhenReady(
    ['reservationForm'], 
    (elements) => {
      const form = elements[0].element;
      
      // Configuración de EmailJS
      const emailjsConfig = {
        userId: 'GEEO4Ql6BtKkJP9hw',
        serviceId: 'service_f167wij',
        templateId: 'template_ny66xxg'
      };
      
      emailjs.init(emailjsConfig.userId);

      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
          // Validación
          if (!validateForm(form)) return;
          
          // Estado de carga
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
          
          // Enviar formulario
          await emailjs.sendForm(
            emailjsConfig.serviceId,
            emailjsConfig.templateId,
            form
          );
          
          showNotification('success', 'Solicitud de reserva enviada con éxito ✔️');
          form.reset();
          
        } catch (error) {
          console.error('Error:', error);
          showNotification('error', `Error al enviar: ${error.text || 'Por favor intente más tarde'}`);
          
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
      
      console.log('Formulario de reservas inicializado correctamente');
    }
  );
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

function validateForm(form) {
  const requiredFields = [
    { id: 'name', name: 'Nombre completo' },
    { id: 'email', name: 'Email' },
    { id: 'phone', name: 'Teléfono' },
    { id: 'checkin', name: 'Fecha de llegada' },
    { id: 'checkout', name: 'Fecha de salida' },
    { id: 'vehicle-type', name: 'Tipo de vehículo' },
    { id: 'vehicle-length', name: 'Longitud del vehículo' }
  ];

  for (const field of requiredFields) {
    const element = document.getElementById(field.id);
    if (!element.value.trim()) {
      showNotification('error', `Complete: ${field.name}`);
      element.focus();
      return false;
    }
  }

  // Validación de fechas
  const checkin = new Date(document.getElementById('checkin').value);
  const checkout = new Date(document.getElementById('checkout').value);

  if (checkin >= checkout) {
    showNotification('error', 'La fecha de salida debe ser posterior');
    return false;
  }

  return true;
}

function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 5000);
}

// ==============================================
// GOOGLE TRANSLATE INITIALIZATION
// ==============================================

function initializeGoogleTranslate() {
  if (!document.getElementById('google_translate_element')) {
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);
  }

  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'es',
      includedLanguages: 'es,en,de,fr',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false
    }, 'google_translate_element');
    
    // Ocultar elementos de Google
    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame, .goog-te-gadget-icon, 
      .goog-logo-link, .goog-te-gadget, 
      .goog-te-combo, .goog-te-ftab-link {
        display: none !important;
      }
      body { top: 0 !important; }
    `;
    document.head.appendChild(style);
  };

  if (!window.google || !google.translate) {
    const script = document.createElement('script');
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);
  }
}

// ==============================================
// MAIN INITIALIZATION
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
  initializeLanguageSelector();
  initializeReservationForm();
  initializeGoogleTranslate();
});

// Inicialización redundante para mayor seguridad
window.addEventListener('load', function() {
  if (!document.querySelector('#languageDropdown.show')) {
    initializeLanguageSelector();
  }
});