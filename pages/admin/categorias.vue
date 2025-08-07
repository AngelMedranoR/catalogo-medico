<template>
  <div class="categories-container">
    <h1 class="title">Gestión de Categorías</h1>

    <div class="content-grid">
      <!-- Formulario de Categoría -->
      <div class="widget-card form-card">
        <h2 class="widget-title">{{ editingCategory ? 'Editar Categoría' : 'Agregar Nueva Categoría' }}</h2>
        <form @submit.prevent="saveCategory" class="category-form">
          <div class="form-group">
            <label for="category-name">Nombre</label>
            <input id="category-name" type="text" v-model="form.name" placeholder="Ej. Equipos Médicos" required>
          </div>
          <div class="form-actions">
            <button type="submit" class="button-primary">{{ editingCategory ? 'Actualizar' : 'Guardar' }}</button>
            <button v-if="editingCategory" @click="cancelEdit" type="button" class="button-secondary">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Lista de Categorías -->
      <div class="widget-card list-card">
        <h2 class="widget-title">Categorías Existentes</h2>
        <div v-if="categories.length > 0" class="categories-list">
          <ul>
            <li v-for="category in categories" :key="category.id">
              <span>{{ category.name }}</span>
              <div class="item-actions">
                <button @click="editCategory(category)" class="action-btn edit-btn">✏️</button>
                <button @click="deleteCategory(category.id)" class="action-btn delete-btn">🗑️</button>
              </div>
            </li>
          </ul>
        </div>
        <p v-else class="empty-text">No hay categorías registradas.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

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
  categories.value = data || [];
}

function resetForm() {
  editingCategory.value = null;
  form.value = { name: '' };
}

async function saveCategory() {
  if (!form.value.name) return;
  try {
    if (editingCategory.value) {
      const { error } = await supabase.from('categories').update({ name: form.value.name }).eq('id', editingCategory.value.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('categories').insert([{ name: form.value.name }]);
      if (error) throw error;
    }
    await fetchData();
    resetForm();
  } catch (error) {
    console.error('Error saving category:', error.message);
  }
}

async function deleteCategory(id) {
  if (confirm('¿Estás seguro? Borrar una categoría puede afectar a los productos asociados.')) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error.message);
    }
  }
}

function editCategory(category) {
  editingCategory.value = category;
  form.value = { ...category };
  document.getElementById('category-name').focus();
}

function cancelEdit() {
  resetForm();
}

onMounted(fetchData);
</script>

<style scoped>
.categories-container {
  padding: 1rem;
  background-color: #121212;
  color: #e0e0e0;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 1.8rem;
  color: #fff;
  margin-bottom: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.widget-card {
  background-color: #1e1e1e;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.5rem;
}

.widget-title {
  font-size: 1.2rem;
  margin: 0 0 1.5rem 0;
  color: #fff;
  border-bottom: 1px solid #333;
  padding-bottom: 1rem;
}

/* --- Formulario --- */
.category-form .form-group {
  margin-bottom: 1rem;
}

.category-form label {
  display: block;
  margin-bottom: 0.5rem;
  color: #aaa;
}

.category-form input {
  width: 100%;
  padding: 0.8rem;
  background-color: #2a2a2a;
  border: 1px solid #444;
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.button-primary, .button-secondary {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.button-primary { background-color: #007bff; color: #fff; }
.button-secondary { background-color: #444; color: #ccc; }

/* --- Lista de Categorías --- */
.categories-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.categories-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.categories-list li:hover { background-color: #2a2a2a; }

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}
.action-btn:hover { background-color: #333; }
.edit-btn { color: #ffc107; }
.delete-btn { color: #dc3545; }

.empty-text {
  color: #888;
  text-align: center;
  padding: 2rem;
}

@media (min-width: 992px) {
  .content-grid {
    grid-template-columns: 400px 1fr;
    align-items: flex-start;
  }
}
</style>