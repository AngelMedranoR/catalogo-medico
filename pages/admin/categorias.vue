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
/* --- Mejoras Responsive para Móviles --- */
@media (max-width: 479px) {
  .categories-container {
    padding: 0.4rem 0.1rem;
  }
  .title {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  .content-grid {
    gap: 0.7rem;
  }
  .widget-card {
    padding: 0.7rem 0.3rem;
    border-radius: 7px;
  }
  .widget-title {
    font-size: 1rem;
    padding-bottom: 0.7rem;
  }
  .category-form input {
    padding: 0.6rem;
    font-size: 0.95rem;
    border-radius: 6px;
  }
  .form-actions {
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .button-primary, .button-secondary {
    padding: 0.6rem 1rem;
    font-size: 0.95rem;
    border-radius: 6px;
  }
  .categories-list li {
    padding: 0.5rem;
    border-radius: 6px;
    font-size: 0.97rem;
  }
  .action-btn {
    font-size: 1rem;
    padding: 0.3rem;
    border-radius: 6px;
  }
  .empty-text {
    padding: 1rem;
    font-size: 0.98rem;
  }
}
.categories-container {
  padding: 1.5rem;
  background-color: #f8f9fa; /* Lighter background for a cleaner look */
  color: #333;             /* Darker text for contrast */
  max-width: 1400px;
  margin: 0 auto;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;         /* Deep blue-gray for titles */
  margin-bottom: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.widget-card {
  background-color: #ffffff;
  border: 1px solid #e9ecef;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: #2c3e50;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 1rem;
}

/* --- Formulario --- */
.category-form .form-group {
  margin-bottom: 1rem;
}

.category-form label {
  display: block;
  margin-bottom: 0.5rem;
  color: #6c757d;
  font-weight: 500;
}

.category-form input {
  width: 100%;
  padding: 0.9rem 1rem;
  background-color: #f8f9fa;
  border: 1.5px solid #dee2e6;
  border-radius: 10px;
  color: #333;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.category-form input:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.button-primary, .button-secondary {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.button-primary { background-color: #3b82f6; color: #fff; }
.button-primary:hover { background-color: #2563eb; transform: translateY(-1px); }

.button-secondary { background-color: #e5e7eb; color: #4b5563; }
.button-secondary:hover { background-color: #d1d5db; }

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
  padding: 1rem 1.2rem;
  border-radius: 10px;
  border: 1px solid #f1f3f5;
  margin-bottom: 0.5rem;
  background-color: #fcfcfc;
  color: #495057;
  font-weight: 500;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.categories-list li:hover { background-color: #f1f3f5; border-color: #e9ecef; }

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.action-btn:hover { background-color: #e9ecef; }
.edit-btn { color: #f59e0b; }
.delete-btn { color: #ef4444; }

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