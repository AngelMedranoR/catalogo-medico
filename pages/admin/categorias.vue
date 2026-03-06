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
        <h2 class="widget-title">Categorías Existentes <small class="drag-hint">(Arrastra para re-ordenar)</small></h2>
        <div v-if="categories.length > 0" class="categories-list">
          <ul>
            <li 
              v-for="(category, index) in categories" 
              :key="category.id"
              draggable="true"
              @dragstart="onDragStartCat(index)"
              @dragover.prevent
              @drop="onDropCat($event, index)"
              @touchstart="onTouchStartCat(index)"
              @touchmove.prevent="onTouchMoveCat($event)"
              @touchend="onTouchEndCat"
              :class="{ 'is-dragging': draggingCatIdx === index }"
            >
              <span class="drag-handle"><GripVerticalIcon class="icon-small" /></span>
              <span class="cat-name">{{ category.name }}</span>
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
import { useToast } from 'vue-toastification';
import { GripVerticalIcon } from 'lucide-vue-next';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const toast = useToast();
const supabase = useSupabaseClient();
const categories = ref([]);
const editingCategory = ref(null);
const form = ref({ name: '' });

// --- DRAG & DROP LOGIC ---
const draggingCatIdx = ref(null);
let touchOverIdx = null;

const reorderDataInDb = async (arr) => {
  // Update order fields iteratively
  try {
    const promises = arr.map((cat, i) => {
      cat.order_index = i;
      return supabase.from('categories').update({ order_index: i }).eq('id', cat.id);
    });
    await Promise.all(promises);
    toast.success('Orden guardado correctamente', { timeout: 1500 });
  } catch(e) { toast.error('Error re-ordenando base de datos'); }
};

const onDragStartCat = (idx) => { draggingCatIdx.value = idx; };
const onDropCat = async (e, targetIdx) => {
  if (draggingCatIdx.value === null || draggingCatIdx.value === targetIdx) return;
  const moved = categories.value.splice(draggingCatIdx.value, 1)[0];
  categories.value.splice(targetIdx, 0, moved);
  await reorderDataInDb(categories.value);
  draggingCatIdx.value = null;
};

// Touch events mapping
const onTouchStartCat = (idx) => { draggingCatIdx.value = idx; };
const onTouchMoveCat = (e) => {
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target) return;
  const li = target.closest('li');
  if (li) touchOverIdx = Array.from(li.parentNode.children).indexOf(li);
};
const onTouchEndCat = async () => {
  if (draggingCatIdx.value !== null && touchOverIdx !== null && draggingCatIdx.value !== touchOverIdx) {
    const moved = categories.value.splice(draggingCatIdx.value, 1)[0];
    categories.value.splice(touchOverIdx, 0, moved);
    await reorderDataInDb(categories.value);
  }
  draggingCatIdx.value = null;
  touchOverIdx = null;
};

async function fetchData() {
  const { data, error } = await supabase.from('categories').select('*').order('order_index', { ascending: true , nullsFirst: false}).order('name');
  if (error && error.message.includes('order_index')) {
    // Fallback if the user hasn't added order_index column yet
    const fallback = await supabase.from('categories').select('*').order('name');
    categories.value = fallback.data || [];
  } else {
    categories.value = data || [];
  }
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
      toast.success('Categoría actualizada');
    } else {
      // automatically assign order index at the bottom
      const nextIdx = categories.value.length;
      const { error } = await supabase.from('categories').insert([{ name: form.value.name, order_index: nextIdx }]);
      if (error && error.message.includes('order_index')) {
        const fallbackErr = await supabase.from('categories').insert([{ name: form.value.name }]);
        if (fallbackErr.error) throw fallbackErr.error;
      } else if (error) throw error;
      toast.success('Nueva categoría agregada');
    }
    await fetchData();
    resetForm();
  } catch (error) {
    console.error('Error saving category:', error.message);
    toast.error('Ocurrió un error guardando la categoría');
  }
}

async function deleteCategory(id) {
  if (confirm('¿Estás seguro? Borrar una categoría afectará a todos sus productos.')) {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      toast.info('Categoría eliminada del panel');
      await fetchData();
    } catch (error) {
      console.error('Error deleting category:', error.message);
      toast.error('Fallo al eliminar la categoría');
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
  background-color: var(--bg-main); 
  color: var(--text-body);             
  max-width: 1400px;
  margin: 0 auto;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);         
  margin-bottom: 2rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.widget-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px var(--shadow-color);
  transition: background-color 0.3s, border-color 0.3s;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

/* --- Formulario --- */
.category-form .form-group {
  margin-bottom: 1rem;
}

.category-form label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.category-form input {
  width: 100%;
  padding: 0.9rem 1rem;
  background-color: var(--bg-hover);
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-body);
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.3s, color 0.3s;
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
  border: 1px solid var(--border-color);
  margin-bottom: 0.5rem;
  background-color: var(--bg-card);
  color: var(--text-body);
  font-weight: 500;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.categories-list li.is-dragging {
  opacity: 0.5;
  background-color: var(--bg-hover);
  border: 1.5px dashed #3b82f6;
  transform: scale(0.98);
}

.categories-list li:hover { background-color: var(--bg-hover); border-color: var(--border-color); }

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
.action-btn:hover { background-color: var(--bg-hover); }
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