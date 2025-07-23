<template>
  <div>
    <h1>Gestionar Slides del Hero</h1>

    <div class="form-box">
      <h2>{{ editingSlide ? 'Editar Slide' : 'Agregar Nuevo Slide' }}</h2>
      <form @submit.prevent="saveSlide">
        <input type="text" v-model="form.title" placeholder="Título del Slide" required>
        
        <select v-model="form.animation_style" required>
          <option :value="null" disabled>Elige un estilo de animación</option>
          <option value="style_one">Letras que saltan</option>
          <option value="style_two">Letras delineadas</option>
          <option value="style_three">Expandir Espaciado</option>
          <option value="style_four">Letras Desordenadas</option>
          <option value="style_five">Efecto glitch</option>
        </select>

        <input type="number" v-model="form.order_index" placeholder="Orden de aparición (ej: 1, 2, 3)">
        
        <div>
          <label for="slideImage">Imagen de Fondo</label>
          <input id="slideImage" type="file" @change="handleFileSelect" accept="image/*">
          <img v-if="imagePreview" :src="imagePreview" alt="Vista previa" class="image-preview">
        </div>

        <label class="checkbox-label">
          <input type="checkbox" v-model="form.is_active">
          Mostrar este slide en la página de inicio
        </label>

        <div class="form-actions">
          <button type="submit" :disabled="isUploading">{{ isUploading ? 'Guardando...' : 'Guardar Slide' }}</button>
          <button v-if="editingSlide" @click="cancelEdit" type="button" class="cancel">Cancelar</button>
        </div>
      </form>
    </div>

    <div class="table-container">
      <h2>Slides Actuales</h2>
      <table>
        <thead>
          <tr>
            <th>Orden</th>
            <th>Título</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="slide in slides" :key="slide.id">
            <td data-label="Orden">{{ slide.order_index }}</td>
            <td data-label="Título">{{ slide.title }}</td>
            <td data-label="Estado">{{ slide.is_active ? 'Activo' : 'Inactivo' }}</td>
            <td data-label="Acciones" class="actions">
              <button @click="editSlide(slide)" class="edit">Editar</button>
              <button @click="deleteSlide(slide.id)" class="delete">Borrar</button>
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
const slides = ref([]);
const editingSlide = ref(null);
const isUploading = ref(false);
const selectedFile = ref(null);
const imagePreview = ref('');

const form = ref({
  title: '',
  image_url: '',
  animation_style: 'style_one',
  order_index: 0,
  is_active: true,
});

async function fetchData() {
  const { data } = await supabase.from('hero_slides').select('*').order('order_index');
  slides.value = data;
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => { imagePreview.value = e.target.result; };
  reader.readAsDataURL(file);
}

function resetForm() {
  editingSlide.value = null;
  selectedFile.value = null;
  imagePreview.value = '';
  form.value = { title: '', image_url: '', animation_style: 'style_one', order_index: 0, is_active: true };
  const fileInput = document.getElementById('slideImage');
  if (fileInput) fileInput.value = null;
}

async function saveSlide() {
  isUploading.value = true;
  if (selectedFile.value) {
    const fileName = `${Date.now()}-${selectedFile.value.name}`;
    const { data, error } = await supabase.storage.from('hero-images').upload(fileName, selectedFile.value);
    if (error) {
      console.error('Error al subir la imagen:', error);
      alert('Hubo un error al subir la imagen.');
      isUploading.value = false;
      return;
    }
    const { data: urlData } = supabase.storage.from('hero-images').getPublicUrl(data.path);
    form.value.image_url = urlData.publicUrl;
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
    console.error('Error al guardar el slide:', error.message);
    alert('No se pudo guardar el slide. Revisa la consola para más detalles.');
  } finally {
    isUploading.value = false;
  }
}

function editSlide(slide) {
  editingSlide.value = slide;
  form.value = { ...slide };
  imagePreview.value = slide.image_url;
  selectedFile.value = null;
  window.scrollTo(0, 0);
}

function cancelEdit() {
  resetForm();
}

async function deleteSlide(id) {
  if (confirm('¿Estás seguro de que quieres borrar este slide?')) {
    try {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error al borrar el slide:', error.message);
      alert('No se pudo borrar el slide.');
    }
  }
}

onMounted(fetchData);
</script>

<style scoped>
.image-preview { display: block; max-width: 200px; margin-top: 1rem; border-radius: 8px; }
.form-box { background-color: #1e1e1e; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
input, select { background-color: #333; border: 1px solid #555; color: #fff; padding: 10px; border-radius: 4px; }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.form-actions { display: flex; gap: 1rem; }
button { padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; color: #fff; }
button[type="submit"] { background-color: #007bff; }
button.cancel { background-color: #6c757d; }
.table-container { margin-top: 2rem; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; border-bottom: 1px solid #333; text-align: left; }
.actions button { margin-right: 0.5rem; }
.edit { background-color: #ffc107; color: #000; }
.delete { background-color: #dc3545; }

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
}
</style>