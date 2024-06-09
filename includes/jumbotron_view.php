<?php
include 'conexionbd.php';

// Obtener datos de la empresa
$query_jumbotron = $pdo->query("SELECT * FROM jumbotron");
$jumbotron = $query_jumbotron->fetch(PDO::FETCH_ASSOC);
?>

<!-- Encabezado -->
<div class="jumbotron w3-animate-top">
    <h6><?php echo $jumbotron['titulo']; ?></h6>
    <h2><?php echo $jumbotron['descripcion']; ?></h2>
  </div>


        
    