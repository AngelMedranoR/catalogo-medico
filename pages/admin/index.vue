<template>
  <div>
    <h1>Dashboard</h1>
    <p>Bienvenido al panel de administración. Desde aquí puedes gestionar el contenido de tu catálogo.</p>

    <div class="table-container">
      <h2>Productos Recientes</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.name }}</td>
            <td>{{ product.categories?.name || 'N/A' }}</td>
            <td>{{ product.stock }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-container">
      <h2>Categorías</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td>{{ category.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
// Aplicar el layout de admin y el middleware de autenticación
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const products = ref([]);
const categories = ref([]);

async function fetchData() {
  // Obtener productos con el nombre de su categoría
  const { data: productData } = await supabase
    .from('products')
    .select('name, stock, categories(name)')
    .limit(5); // Mostramos solo los 5 más recientes
  products.value = productData;

  // Obtener todas las categorías
  const { data: categoryData } = await supabase.from('categories').select('*');
  categories.value = categoryData;
}

onMounted(fetchData);
</script>

<style scoped>
.table-container {
  margin-top: 2rem;
  background-color: #1e1e1e;
  padding: 1.5rem;
  border-radius: 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  padding: 1rem;
  border-bottom: 1px solid #333;
  text-align: left;
}
</style>