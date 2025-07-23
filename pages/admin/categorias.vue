<template>
  <div>
    <h1>Gestionar Categorías</h1>

    <div class="form-box">
      <h2>{{ editingCategory ? 'Editar Categoría' : 'Agregar Nueva Categoría' }}</h2>
      <form @submit.prevent="saveCategory">
        <input type="text" v-model="form.name" placeholder="Nombre de la categoría" required>
        <div class="form-actions">
          <button type="submit">{{ editingCategory ? 'Actualizar' : 'Agregar' }}</button>
          <button v-if="editingCategory" @click="cancelEdit" type="button" class="cancel">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="table-container">
      <h2>Lista de Categorías</h2>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td data-label="Categoría">{{ category.name }}</td>
            <td data-label="Acciones" class="actions-cell">
              <button @click="editCategory(category)" class="edit">Editar</button>
              <button @click="deleteCategory(category.id)" class="delete">Borrar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const categories = ref([]);
const editingCategory = ref(null);
const form = ref({ name: '' });

async function fetchData() {
  const { data } = await supabase.from('categories').select('*').order('name');
  categories.value = data;
}

function resetForm() {
  editingCategory.value = null;
  form.value = { name: '' };
}

async function saveCategory() {
  if (editingCategory.value) {
    await supabase.from('categories').update(form.value).eq('id', editingCategory.value.id);
  } else {
    await supabase.from('categories').insert([form.value]);
  }
  await fetchData();
  resetForm();
}

async function deleteCategory(id) {
  if (confirm('¿Estás seguro? Borrar una categoría puede afectar a los productos asociados.')) {
    await supabase.from('categories').delete().eq('id', id);
    await fetchData();
  }
}

function editCategory(category) {
  editingCategory.value = category;
  form.value = { ...category };
  window.scrollTo(0, 0);
}

function cancelEdit() {
  resetForm();
}

onMounted(fetchData);
</script>

<style scoped>
.form-box { background-color: #1e1e1e; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
input { background-color: #333; border: 1px solid #555; color: #fff; padding: 10px; border-radius: 4px; }
.form-actions { display: flex; gap: 1rem; }
button { padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; color: #fff; }
button[type="submit"] { background-color: #007bff; }
button.cancel { background-color: #6c757d; }
.edit { background-color: #ffc107; color: #000; }
.delete { background-color: #dc3545; }
.table-container { margin-top: 2rem; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; border-bottom: 1px solid #333; text-align: left; }
.actions-cell { text-align: right; }
.actions-cell button { margin-left: 0.5rem; }

/* --- ESTILOS RESPONSIVE PARA LA TABLA --- */
@media (max-width: 768px) {
  .table-container { border: none; padding: 0; }
  table, thead, tbody, th, td, tr { display: block; }
  thead { display: none; }
  tr { margin-bottom: 1rem; border: 1px solid #333; border-radius: 8px; padding: 1rem; }
  td { text-align: right; padding-left: 50%; position: relative; border-bottom: 1px dashed #333; }
  td:last-child { border-bottom: none; }
  td::before {
    content: attr(data-label);
    position: absolute;
    left: 1rem;
    text-align: left;
    font-weight: bold;
    color: #00aaff;
  }
  .actions-cell { text-align: right; }
  .actions-cell button { margin-top: 0.5rem; }
}
</style>