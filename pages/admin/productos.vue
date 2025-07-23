<template>
  <div>
    <h1>Gestionar Productos</h1>

    <div class="form-box">
      <h2>{{ editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto' }}</h2>
      <form @submit.prevent="saveProduct">
        <input type="text" v-model="form.name" placeholder="Nombre del producto" required>
        <input type="text" v-model="form.slug" placeholder="Slug (URL amigable)" required>
        <input type="number" step="0.01" v-model="form.price" placeholder="Precio" required>

        <select v-model="form.category_id" required>
          <option :value="null" disabled>Selecciona una categoría</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>

        <input type="number" v-model="form.stock" placeholder="Stock en bultos" required>
        <textarea v-model="form.description" placeholder="Descripción"></textarea>

        <div>
          <label for="productImageInput">Imagen del Producto</label>
          <input id="productImageInput" type="file" @change="handleFileSelect" accept="image/*">
          <img v-if="imagePreview" :src="imagePreview" alt="Vista previa de la imagen recortada" class="image-preview">
        </div>
        
        <div class="form-actions">
            <button type="submit" :disabled="isUploading">{{ isUploading ? 'Guardando...' : (editingProduct ? 'Actualizar Producto' : 'Agregar Producto') }}</button>
            <button v-if="editingProduct" @click="cancelEdit" type="button" class="cancel">Cancelar</button>
        </div>
      </form>
    </div>

    <div v-if="imageToCrop" class="cropper-modal">
      <div class="cropper-container">
        <Cropper
          ref="cropper"
          class="cropper"
          :src="imageToCrop"
          :stencil-props="{
            aspectRatio: 400/400
          }"
          image-restriction="stencil"
        />
        <div class="cropper-actions">
          <button @click="cropImage" class="crop-button">Recortar y Aceptar</button>
          <button @click="closeCropper" class="cancel-button">Cancelar</button>
        </div>
      </div>
    </div>

    <div class="table-container">
      <h2>Lista de Productos</h2>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td data-label="Producto">{{ product.name }}</td>
            <td data-label="Precio">Bs. {{ product.price }}</td>
            <td data-label="Stock">{{ product.stock }}</td>
            <td data-label="Acciones">
              <button @click="editProduct(product)" class="edit">Editar</button>
              <button @click="deleteProduct(product.id)" class="delete">Borrar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'; // <-- AÑADIMOS 'watch'
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';


definePageMeta({
  layout: 'admin',
  middleware: 'auth'
});

const supabase = useSupabaseClient();
const cropper = ref(null); // Referencia al componente cropper
const imageToCrop = ref(null); // URL de la imagen que se va a recortar
const croppedImageBlob = ref(null); // El archivo de imagen ya recortado (Blob)
const imagePreview = ref(''); // URL para la vista previa de la imagen recortada
const products = ref([]);
const categories = ref([]);
const editingProduct = ref(null);
const isUploading = ref(false);
const selectedFile = ref(null);

const getInitialFormState = () => ({
  name: '',
  slug: '', // <-- AÑADIDO
  description: '',
  stock: 0,
  image_url: '',
  category_id: null,
  price: 0,
});

const form = ref(getInitialFormState());

// --- NUEVO: Observador para autogenerar el slug ---
watch(() => form.value.name, (newName) => {
  // Solo autogenera si no estamos editando un slug que ya existe
  // o si el campo de slug está vacío.
  if (!editingProduct.value || form.value.slug === '') {
    form.value.slug = slugify(newName);
  }
});


const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Reemplaza espacios con -
    .replace(/[^\w\-]+/g, '')       // Remueve caracteres inválidos
    .replace(/\-\-+/g, '-');        // Reemplaza múltiples - con uno solo
};
// --- FIN DEL BLOQUE NUEVO ---



// --- Lógica del Cropper ---
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imageToCrop.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const cropImage = () => {
  if (cropper.value) {
    const { canvas } = cropper.value.getResult();
    if (canvas) {
      canvas.toBlob(blob => {
        croppedImageBlob.value = blob;
        imagePreview.value = URL.createObjectURL(blob);
        closeCropper();
      }, 'image/png');
    }
  }
};

const closeCropper = () => {
  imageToCrop.value = null;
  const fileInput = document.getElementById('productImageInput');
  if (fileInput) fileInput.value = null;
};


// --- Lógica del Formulario (CRUD) ---
const fetchData = async () => {
  const { data: productData } = await supabase.from('products').select('*').order('name');
  products.value = productData;
  const { data: categoryData } = await supabase.from('categories').select('*').order('name');
  categories.value = categoryData;
};

const saveProduct = async () => {
  isUploading.value = true;
  
  if (croppedImageBlob.value) {
    const fileName = `${Date.now()}-product.png`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, croppedImageBlob.value);

    if (error) {
      console.error("Error al subir imagen:", error);
      isUploading.value = false;
      return;
    }
    const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(data.path);
    form.value.image_url = urlData.publicUrl;
  }

  if (!form.value.image_url && !editingProduct.value) {
    alert('Por favor, selecciona y recorta una imagen.');
    isUploading.value = false;
    return;
  }
  
  if (editingProduct.value) {
    await supabase.from('products').update(form.value).eq('id', editingProduct.value.id);
  } else {
    await supabase.from('products').insert([form.value]);
  }
  
  await fetchData();
  resetForm();
  isUploading.value = false;
};

const editProduct = (product) => {
  editingProduct.value = product;
  form.value = { ...product };
  imagePreview.value = product.image_url;
  croppedImageBlob.value = null; // Resetea la imagen recortada al editar
  window.scrollTo(0,0);
};

const resetForm = () => {
  editingProduct.value = null;
  croppedImageBlob.value = null;
  imagePreview.value = '';
  form.value = getInitialFormState();
  closeCropper();
};

const cancelEdit = () => {
  resetForm();
};

const deleteProduct = async (id) => {
  if (confirm('¿Estás seguro de que quieres borrar este producto?')) {
    await supabase.from('products').delete().eq('id', id);
    await fetchData();
  }
};

onMounted(fetchData);
</script>

<style scoped>


/* --- ESTILOS PARA LA VENTANA MODAL DEL CROPPER --- */
.cropper-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.cropper-container {
  width: 90%;
  max-width: 500px;
  background-color: #1e1e1e;
  border-radius: 12px;
  padding: 1.5rem;
}
.cropper {
  height: 400px;
  width: 100%;
}
.cropper-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}
.cropper-actions button {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}
.crop-button { background-color: #007bff; color: white; }
.cancel-button { background-color: #6c757d; color: white; }

/* ... (el resto de tus estilos del formulario no cambian) ... */

.image-preview { display: block; max-width: 200px; max-height: 200px; margin-top: 1rem; border-radius: 8px; border: 1px solid #555; }
.form-box { background-color: #1e1e1e; padding: 2rem; border-radius: 8px; margin-bottom: 2rem; }
form { display: flex; flex-direction: column; gap: 1rem; }
input, select, textarea { background-color: #333; border: 1px solid #555; color: #fff; padding: 10px; border-radius: 4px; font-family: inherit; font-size: 1rem; }
.form-actions { display: flex; gap: 1rem; }
button { padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; color: #fff; font-size: 1rem; }
button[type="submit"] { background-color: #007bff; }
button.cancel { background-color: #6c757d; }
.edit { background-color: #ffc107; color: #000; }
.delete { background-color: #dc3545; }
.table-container { margin-top: 2rem; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 1rem; border-bottom: 1px solid #333; text-align: left; }
td button { margin-right: 0.5rem; }

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