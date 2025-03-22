<?php
include 'conexionbd.php';

// Obtener datos del Encabezado
$query_jumbotron = $pdo->query("SELECT * FROM jumbotron");
$jumbotron = $query_jumbotron->fetch(PDO::FETCH_ASSOC);
?>

<!-- Encabezado -->
<div class="jumbotron w3-animate-top">
  <h6><?php echo $jumbotron['main_title']; ?></h6>
  <h2><?php echo $jumbotron['description_title']; ?></h2>
</div>