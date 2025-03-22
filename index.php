<!DOCTYPE html>
<html>

<head>

  <!-- Metadatos y enlaces a recursos externos -->
  <html lang="es">

  </html>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Allerta+Stencil">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="icon" type="image/png" href="img/ico.png">
  <title>AC El Rinconcito</title>

  <!-- Encabezado principal de la página con conexion PHP -->
  <?php include 'includes/jumbotron_view.php'; ?>

</head>

<body>

  <!-- Botón de inicio -->

  <a href="#" class="inicio w3-circle"><i class="fa fa-home w3-xlarge"></i></a>

  <!-- Menú de navegación -->

  <div class="menu w3-center w3-animate-left" style="margin-left: 10%;margin-right:10%;">

    <div class="w3-bar w3-row-padding w3-blue-grey"><div class="w3-dropdown-hover w3-left">
        <button class="w3-button w3-blue-grey"><i class="fa fa-bars"></i></button>
        <div class="w3-dropdown-content w3-bar-block w3-card-2">
          <a href="#seccion4" class="w3-bar-item w3-button w3-grey">Reserva online<br>Online reservation</a>
        </div>
      </div>
      <a href="#seccion1" class="w3-button w3-blue-grey">El Area</a>
      <a href="#seccion2" class="w3-button w3-blue-grey">Servicios</a>
      <a href="#seccion3" class="w3-button w3-blue-grey">Galeria</a>
      <a href="#seccion4" class="w3-button w3-blue-grey">Contacto</a>
      <a href="https://maps.google.es" class="w3-button w3-blue-grey">¿Dónde estamos?</a>
      <a href="#seccion5" class="w3-button w3-blue-grey">Legal</a>

      

      <div class="banderas w3-right w3-blue-grey">
        <img src="img/españa.png" alt="sp">
        <img src="img/alemania.png" alt="ge">
        <img src="img/francia.png" alt="fr">
        <img src="img/inglaterra.png" alt="en">
        <img src="img/italia.png" alt="it">
      </div>

      <div id="google_translate_element" class="w3-button w3-right w3-blue-grey">
        <script type="text/javascript">

          function googleTranslateElementInit() {
            new google.translate.TranslateElement({ pageLanguage: 'es', includedLanguages: 'es,en,de,fr,it', layout: google.translate.TranslateElement.InlineLayout.SIMPLE, gaTrack: true }, 'google_translate_element');
          }

        </script>
        <script type="text/javascript"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>
      </div>
    </div>
  </div>

  <!-- Sección 1: El Área de Autocaravanas -->

  <section class="parallax" id="seccion1">

    <!-- Contenido de la sección 1 -->

    <div class="Rinconcito">
      <div class="background-watermark" style="background-image: url('img/area1.jpg');">
      </div>
      <div class="rinconcito_section" style="width:100%;">
        <header class="rinconcito_title w3-blue-grey">
          <h1>El Rinconcito</h1>
        </header>

        <?php include 'includes/seccion1_view.php'; ?>
        <br>
        <div class="img_general">
          <img src="img/galeria12.jpg" alt="acgeneral" style="width: 100%;">
          <br>
        </div>
  </section>

  <!-- Sección 2: Servicios -->

  <div class="Servicios"></div>
  <br>
  <section class="parallax" id="seccion2">

    <!-- Contenido de la sección 2 -->

    <div class="background-watermark" style="background-image: url('img/area2.jpg');"></div>
    <div class="servicios_section" style="width:100%;">
      <header class="servicios_title w3-blue-grey">
        <h1>Servicios para ti y tu AC</h1>
      </header>
      <?php include 'includes/seccion2_view.php'; ?>

      <br>
      <div class="w3-row-padding w3-margin-middle">
        <div class="w3-third">
          <div class="w3-card">
            <img src="img/servicios_tabla.jpg" style="width: 100%;">
            <div class="w3-container">

            </div>
          </div>
        </div>

        <div class="w3-third">
          <div class="w3-card">
            <img src="img/servicio_vaciado.jpg" style="width:100%">
            <div class="w3-container">

            </div>
          </div>
        </div>

        <div class="w3-third">
          <div class="w3-card">
            <img src="img/servicio_autolavado.jpg" style="width:100%">
            <div class="w3-container">

            </div>
          </div>
        </div>
      </div>
      <br>
  </section>


  <!-- Sección 3: Galería -->

  <section class="parallax" id="seccion3">

    <!-- Contenido de la sección 3 -->

    <div class="galeria_title">
      <div class="background-watermark" style="background-image: url('img/area3.jpg');"></div>
      <div class="galeria_section" style="width:100%;">
        <br>
        <header class="galeria_title w3-blue-grey">
          <h1>Galería</h1>
        </header>

        <?php include 'includes/seccion3_view.php'; ?>

        <div class="w3-content w3-section" style="max-width:500px">
          <img class="mySlides w3-animate-top" src="img/galeria1.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria2.jpg" style="width:100%">
          <img class="mySlides w3-animate-top" src="img/galeria3.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria4.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria5.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/general.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria8.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria9.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria10.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria11.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria12.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria13.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/galeria14.jpg" style="width:100%">
          <img class="mySlides w3-animate-bottom" src="img/panoramica_banner.jpg" style="width:100%">
        </div>

        <script>
          var myIndex = 0;
          carousel();

          function carousel() {
            var i;
            var x = document.getElementsByClassName("mySlides");
            for (i = 0; i < x.length; i++) {
              x[i].style.display = "none";
            }
            myIndex++;
            if (myIndex > x.length) { myIndex = 1 }
            x[myIndex - 1].style.display = "block";
            setTimeout(carousel, 3500);
          }
        </script>
  </section>

  <!-- Sección 4: Contacto -->

  <section class="parallax" id="seccion4">

    <!-- Contenido de la sección 4 -->

    <div class="contacto">
      <div class="background-watermark" style="background-image: url('img/galeria11.jpg');"></div>
      <div class="contacto_interes" style="width:100%;">
        <br>
        <header class="contacto w3-blue-grey">
          <h1>Contacto</h1>
        </header>

        <div class="contacto w3-justifiyed">

          <form class="contact_form" class="w3-container w3-card-4 w3-light-grey w3-text-blue-grey w3-margin">
            <h3 class="titulo_form w3-center">Formulario de Reserva o Contacto</h3>

            <div class="w3-row w3-section">
              <div class="w3-col" style="width:50px"><i class="w3-xxlarge fa fa-user"></i></div>
              <div class="w3-rest">
                <input class="w3-input w3-border" name="first" type="text" placeholder="Nombre">
              </div>
            </div>

            <div class="w3-row w3-section">
              <div class="w3-col" style="width:50px"><i class="w3-xxlarge fa fa-user"></i></div>
              <div class="w3-rest">
                <input class="w3-input w3-border" name="last" type="text" placeholder="Apellidos">
              </div>
            </div>

            <div class="w3-row w3-section">
              <div class="w3-col" style="width:50px"><i class="w3-xxlarge fa fa-envelope-o"></i></div>
              <div class="w3-rest">
                <input class="w3-input w3-border" name="email" type="text" placeholder="Email">
              </div>
            </div>

            <div class="w3-row w3-section">
              <div class="w3-col" style="width:50px"><i class="w3-xxlarge fa fa-phone"></i></div>
              <div class="w3-rest">
                <input class="w3-input w3-border" name="phone" type="text" placeholder="Tlf.">
              </div>
            </div>

            <div class="w3-row w3-section">
              <div class="w3-col" style="width:50px;"><i class="w3-xxlarge fa fa-pencil"></i></div>
              <div class="w3-rest">
                <input class="w3-input w3-border" name="message" type="text" placeholder="Mensaje">
              </div>
            </div>

            <div class="w3-row w3-section">
              <div class="w3-col" style="width:50px;"><i class="w3-xxlarge fa fa-search"></i></div>
              <div class="w3-rest">
                <label>Fecha de entrada</label><br>
                <input class="fentrada w3-border" name="fentrada" type="date">
              </div>
            </div>

            <div class="w3-row w3-section">
              <div class="w3-col" style="width:50px;"><i class="w3-xxlarge fa fa-search"></i></div>
              <div class="w3-rest">
                <label>Fecha de salida</label><br>
                <input class="fsalida w3-border" name="fentrada" type="date">
              </div>
            </div>

            <button class="w3-button w3-block w3-section w3-blue-grey w3-ripple w3-padding"> Enviar</button>

          </form>


  </section>

  <!-- Sección 5: Avisos Legales -->

  <section class="parallax" id="seccion6">

    <!-- Contenido de la sección 5 -->

    <div class="avisos">
      <div class="background-watermark" style="background-image: url('img/area2.jpg');"></div>
      <div class="avisos" style="width:100%;"></div>
    </div>
    <br>
    <header class="avisos w3-blue-grey">
      <h1>Avisos Legales</h1>
    </header>


    <table class="seccion5">
      <tr>
        <td>
          <?php include 'includes/seccion6_view.php'; ?>
        </td>
      </tr>
    </table>

  </section>

  <section class="parallax" id="footer">
    <div class="footer">
      <div class="background-watermark" style="background-image: url('img/galeria12.webp');"></div>
      <div class="footer" style="width:100%;">
        <br>
        <header class="footer w3-blue-grey">
          <h1>! Muchas Gracias por su visita !</h1>
          <table class="footer_table" style="width:100%;">
            <tr>
              <td>
                <ul>
                  Contacto<br>
                  +34 555 344 001 (reservas)<br>
                  +34 555 344 002 (incidencias)<br>
                  +34 555 344 003 (mensajes)<br>
                  uanmita@gmail.com</ul>
              </td>
              <td>
                <ul>
                  Dirección
                  Calle El Rinconcito, 42. 29738 Torre de Benagalbon<br>
                  Rincon de la Victoria (Málaga)<br>
                  41°02'56.0"N 4°11'28.0"E</ul>
              </td>
              <td>
                <div class="rr_ss">
                  <div class="w3-bar" style="font-weight: normal; font-size: 90%;margin-left: 10%;">
                    <button class="w3-button w3-circle w3-center">f</button>
                    <button class="w3-button w3-circle w3-center">t</button>
                    <button class="w3-button w3-circle w3-center">c</button>
                    <button class="w3-button w3-circle w3-center">\</button>
                    <button class="w3-button w3-circle w3-center">6</button>
                  </div>
                </div>
              </td>
              <td>
                <img src="img/ico.png" alt="Car" style="margin-left: 50%; width: 100%;">
              </td>
            </tr>
          </table>
          <br>
          <br>
          <br>
        </header>


  </section>

  </>

</html>
