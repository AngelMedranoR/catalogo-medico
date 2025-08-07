<template>
  <div class="hero-container">
    <h1 class="title">Gestión del Hero Slider</h1>

    <div class="content-grid">
      <!-- Formulario de Slide -->
      <div class="widget-card form-card">
        <h2 class="widget-title">{{ editingSlide ? 'Editar Slide' : 'Agregar Nuevo Slide' }}</h2>
        <form @submit.prevent="saveSlide">
          <div class="form-group">
            <label for="slide-title">Título</label>
            <input id="slide-title" type="text" v-model="form.title" required>
          </div>
          <div class="form-group">
            <label for="slide-animation">Estilo de Animación</label>
            <select id="slide-animation" v-model="form.animation_style" required>
              <option value="style_one">Letras que saltan</option>
              <option value="style_two">Letras delineadas</option>
              <option value="style_three">Expandir Espaciado</option>
              <option value="style_four">Letras Desordenadas</option>
              <option value="style_five">Efecto glitch</option>
            </select>
          </div>
          <div class="form-group">
            <label for="slide-order">Orden</label>
            <input id="slide-order" type="number" v-model.number="form.order_index">
          </div>
          <div class="form-group">
            <label>Imagen de Fondo</label>
            <div class="image-upload-area">
              <input id="slideImageInput" type="file" @change="handleFileSelect" accept="image/*" class="file-input">
              <label for="slideImageInput" class="file-label">
                <span class="icon">🖼️</span>
                <span>{{ imagePreview ? 'Cambiar Imagen' : 'Seleccionar' }}</span>
              </label>
              <img v-if="imagePreview" :src="imagePreview" alt="Vista previa" class="image-preview">
            </div>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.is_active">
              <span>Activo</span>
            </label>
          </div>
          <div class="form-actions">
            <button type="submit" class="button-primary" :disabled="isUploading">{{ isUploading ? 'Guardando...' : 'Guardar' }}</button>
            <button v-if="editingSlide" @click="cancelEdit" type="button" class="button-secondary">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Lista de Slides -->
      <div class="widget-card list-card">
        <h2 class="widget-title">Slides Actuales</h2>
        <div v-if="slides.length > 0" class="slides-list">
          <div v-for="slide in slides" :key="slide.id" class="slide-item-card">
            <img :src="slide.image_url || '/placeholder.png'" :alt="slide.title" class="slide-image">
            <div class="slide-info">
              <h4 class="slide-item-title">{{ slide.title }}</h4>
              <p>Orden: {{ slide.order_index }}</p>
              <span :class="['status-badge', slide.is_active ? 'status-active' : 'status-inactive']">
                {{ slide.is_active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div class="slide-actions">
              <button @click="editSlide(slide)" class="action-btn edit-btn">✏️ Editar</button>
              <button @click="deleteSlide(slide.id)" class="action-btn delete-btn">🗑️ Borrar</button>
            </div>
          </div>
        </div>
        <p v-else class="empty-text">No hay slides para mostrar.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const supabase = useSupabaseClient();
const slides = ref([]);
const editingSlide = ref(null);
const isUploading = ref(false);
const selectedFile = ref(null);
const imagePreview = ref('');

const getInitialFormState = () => ({ title: '', image_url: '', animation_style: 'style_one', order_index: 0, is_active: true });
const form = ref(getInitialFormState());

async function fetchData() {
  const { data } = await supabase.from('hero_slides').select('*').order('order_index');
  slides.value = data || [];
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
}

function resetForm() {
  editingSlide.value = null;
  selectedFile.value = null;
  imagePreview.value = '';
  form.value = getInitialFormState();
  const fileInput = document.getElementById('slideImageInput');
  if (fileInput) fileInput.value = null;
}

async function saveSlide() {
  isUploading.value = true;
  if (selectedFile.value) {
    const fileName = `${Date.now()}-${selectedFile.value.name}`;
    const { data, error } = await supabase.storage.from('hero-images').upload(fileName, selectedFile.value);
    if (error) { console.error('Error uploading image:', error); isUploading.value = false; return; }
    form.value.image_url = supabase.storage.from('hero-images').getPublicUrl(data.path).data.publicUrl;
  }

  try {
    if (editingSlide.value) {
      const { error } = await supabase.from('hero_slides').update({ ...form.value }).eq('id', editingSlide.value.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('hero_slides').insert([{ ...form.value }]);
      if (error) throw error;
    }
    await fetchData();
    resetForm();
  } catch (error) {
    console.error('Error saving slide:', error.message);
  } finally {
    isUploading.value = false;
  }
}

function editSlide(slide) {
  editingSlide.value = slide;
  form.value = { ...slide };
  imagePreview.value = slide.image_url;
  selectedFile.value = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  resetForm();
}

async function deleteSlide(id) {
  if (confirm('¿Seguro que quieres borrar este slide?')) {
    await supabase.from('hero_slides').delete().eq('id', id);
    fetchData();
  }
}

onMounted(fetchData);
</script>

<style scoped>
.hero-container { padding: 1rem; max-width: 1200px; margin: 0 auto; }
.title { font-size: 1.8rem; color: #fff; margin-bottom: 2rem; }

.content-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }

.widget-card { background-color: #1e1e1e; border: 1px solid #333; border-radius: 12px; padding: 1.5rem; }
.widget-title { font-size: 1.2rem; margin: 0 0 1.5rem 0; color: #fff; border-bottom: 1px solid #333; padding-bottom: 1rem; }

/* --- Formulario --- */
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; color: #aaa; }
input[type="text"], input[type="number"], select { width: 100%; padding: 0.8rem; background-color: #2a2a2a; border: 1px solid #444; border-radius: 8px; color: #e0e0e0; font-size: 1rem; }

.image-upload-area { display: flex; align-items: center; gap: 1rem; }
.file-input { display: none; }
.file-label { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1.2rem; background-color: #444; color: #fff; border-radius: 8px; cursor: pointer; }
.image-preview { width: 120px; height: 67.5px; border-radius: 8px; object-fit: cover; border: 2px solid #444; }

.checkbox-label { display: flex; align-items: center; gap: 0.8rem; color: #ccc; cursor: pointer; }
.checkbox-label input { width: auto; accent-color: #007bff; }

.form-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
.button-primary, .button-secondary { padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 500; }
.button-primary { background-color: #007bff; color: #fff; }
.button-secondary { background-color: #444; color: #ccc; }
.button-primary:disabled { background-color: #555; cursor: not-allowed; }

/* --- Lista de Slides --- */
.slides-list { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.slide-item-card { background-color: #242424; border-radius: 8px; display: flex; align-items: center; gap: 1rem; padding: 1rem; }
.slide-image { width: 100px; height: 56px; object-fit: cover; border-radius: 6px; }
.slide-info { flex-grow: 1; }
.slide-item-title { margin: 0 0 0.25rem; color: #fff; }
.slide-info p { margin: 0; color: #aaa; font-size: 0.9rem; }

.status-badge { padding: 0.2rem 0.6rem; border-radius: 15px; font-size: 0.8rem; font-weight: bold; }
.status-active { background-color: #5cb85c; color: #fff; }
.status-inactive { background-color: #6c757d; color: #fff; }

.slide-actions { display: flex; flex-direction: column; gap: 0.5rem; }
.action-btn { background: none; border: none; color: #fff; padding: 0.5rem; cursor: pointer; font-size: 0.9rem; border-radius: 6px; width: 100%; text-align: left; }
.action-btn:hover { background-color: #333; }
.edit-btn { color: #ffc107; }
.delete-btn { color: #dc3545; }

.empty-text { color: #888; text-align: center; padding: 2rem; }

@media (min-width: 992px) {
  .content-grid { grid-template-columns: 450px 1fr; align-items: flex-start; }
}
</style>