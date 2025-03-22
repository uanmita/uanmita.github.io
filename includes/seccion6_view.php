<?php
include 'conexionbd.php';

// Obtener datos de los productos
$query_seccion5 = $pdo->query("SELECT * FROM seccion WHERE ID=5");
$seccion5 = $query_seccion5->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="galeria_content w3-justyfied">
  <table class="seccion2">
    <?php foreach ($seccion6 as $fila): ?>
      <tr>
        <td>
        <?php echo $fila['seccion3_text']; ?>
        </td>
      </tr>
    <?php endforeach; ?>
  </table>
</div>
