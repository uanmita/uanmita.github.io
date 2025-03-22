<?php
include 'conexionbd.php';

// Obtener datos de los productos
$query_seccion2 = $pdo->query("SELECT * FROM seccion WHERE ID=2");
$seccion2 = $query_seccion2->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="galeria_content w3-justyfied">
  <table class="seccion2">
    <?php foreach ($seccion2 as $fila): ?>
      <tr>
        <td>
        <?php echo $fila['seccion3_text']; ?>
        </td>
      </tr>
    <?php endforeach; ?>
  </table>
</div>