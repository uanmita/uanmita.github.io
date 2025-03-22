<?php
include 'conexionbd.php';

// Obtener datos de los productos
$query_seccion1 = $pdo->query("SELECT * FROM seccion WHERE ID=1");
$seccion1 = $query_seccion1->fetchAll(PDO::FETCH_ASSOC);
?>

<div class="galeria_content w3-justyfied">
  <table class="seccion1">
    <?php foreach ($seccion1 as $fila): ?>
      <tr>
        <td>
        <?php echo $fila['seccion3_text']; ?>
        </td>
      </tr>
    <?php endforeach; ?>
  </table>
</div>