<?php
include 'conexionbd.php';

// Obtener datos de los productos
$query_seccion3 = $pdo->query("SELECT * FROM seccion WHERE ID=3");
$seccion3 = $query_seccion3->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="galeria_content w3-justyfied">
  <table class="seccion3">
    <?php foreach ($seccion3 as $fila): ?>
      <tr>
        <td>
        <?php echo $fila['seccion3_text']; ?>
        </td>
      </tr>
    <?php endforeach; ?>
  </table>
</div>
