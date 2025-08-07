<template>
  <div class="products-container">
    <h1 class="title">Gestión de Productos</h1>

    <!-- Formulario de Producto -->
    <div class="widget-card form-card">
      <h2 class="widget-title">{{ editingProduct ? 'Editar Producto' : 'Agregar Nuevo Producto' }}</h2>
      <form @submit.prevent="saveProduct">
        <div class="form-grid">
          <div class="form-group span-2">
            <label for="product-name">Nombre del Producto</label>
            <input id="product-name" type="text" v-model="form.name" required>
          </div>
          <div class="form-group">
            <label for="product-price">Precio Base ($)</label>
            <input id="product-price" type="number" step="0.01" v-model="form.price" :disabled="showVariationsSection" :required="!showVariationsSection">
            <small v-if="showVariationsSection">El precio se definirá por cada variante.</small>
          </div>
          <div class="form-group">
            <label for="product-category">Categoría</label>
            <select id="product-category" v-model="form.category_id" required>
              <option :value="null" disabled>Selecciona una</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="form-group span-2">
            <label for="product-slug">URL Amigable (Slug)</label>
            <input id="product-slug" type="text" v-model="form.slug" required>
          </div>
          <div class="form-group span-2">
            <label for="product-description">Descripción</label>
            <textarea id="product-description" v-model="form.description"></textarea>
          </div>
          <div class="form-group span-2">
            <label>Imagen del Producto</label>
            <div class="image-upload-area">
              <input id="productImageInput" type="file" @change="handleFileSelect" accept="image/*" class="file-input">
              <label for="productImageInput" class="file-label">
                <span class="icon">🖼️</span>
                <span>{{ imagePreview ? 'Cambiar Imagen' : 'Seleccionar Imagen' }}</span>
              </label>
              <img v-if="imagePreview" :src="imagePreview" alt="Vista previa" class="image-preview">
            </div>
          </div>
        </div>

        <!-- Sección de Variantes / Stock -->
        <div class="stock-section">
          <div v-if="showVariationsSection" class="variations-management">
            <h3 class="section-subtitle">{{ variationTitle }}</h3>
            <div v-if="isFajasCategory" class="predefined-variations">
              <button @click.prevent="addPredefinedVariation('S')">S</button>
              <button @click.prevent="addPredefinedVariation('M')">M</button>
              <button @click.prevent="addPredefinedVariation('L')">L</button>
              <button @click.prevent="addPredefinedVariation('XL')">XL</button>
            </div>
            <div class="add-variation-form">
              <input v-model="newVariation.reference" type="text" placeholder="Referencia" required>
              <input v-model.number="newVariation.stock" type="number" placeholder="Stock" required>
              <input v-model.number="newVariation.price" type="number" step="0.01" placeholder="Precio ($)" required>
              <button @click.prevent="addVariationWrapper" type="button" class="button-add">Agregar</button>
            </div>
            <ul v-if="variationsToShow.length > 0" class="variations-list">
              <li v-for="v in variationsToShow" :key="v.id">
                <span>{{ v.reference }}</span>
                <input type="number" v-model.number="v.stock" @change="editingProduct && updateVariation(v)">
                <input type="number" step="0.01" v-model.number="v.price" @change="editingProduct && updateVariation(v)">
                <button @click.prevent="deleteVariation(v.id)" class="delete-btn">🗑️</button>
              </li>
            </ul>
          </div>
          <div v-else class="form-group">
            <label for="product-stock">Stock General</label>
            <input id="product-stock" type="number" v-model="form.stock" required>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="button-primary" :disabled="isUploading">{{ isUploading ? 'Guardando...' : (editingProduct ? 'Actualizar' : 'Guardar') }}</button>
          <button v-if="editingProduct" @click="cancelEdit" type="button" class="button-secondary">Cancelar</button>
        </div>
      </form>
    </div>

    <!-- Modal de Recorte -->
    <div v-if="imageToCrop" class="cropper-modal">
      <div class="cropper-content">
        <h3 class="cropper-title">Recortar Imagen</h3>
        <Cropper ref="cropper" class="cropper" :src="imageToCrop" :stencil-props="{ aspectRatio: 1 }" image-restriction="stencil" />
        <div class="cropper-actions">
          <button @click="cropImage" class="button-primary">Aceptar</button>
          <button @click="closeCropper" class="button-secondary">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Lista de Productos -->
    <div class="widget-card list-card">
        <h2 class="widget-title">Productos Existentes</h2>
        <div v-if="products.length > 0" class="products-list">
          <div v-for="product in products" :key="product.id" class="product-item-card">
            <img :src="product.image_url || '/placeholder.png'" :alt="product.name" class="product-image">
            <div class="product-info">
              <h4 class="product-name">{{ product.name }}</h4>
              <p class="product-category">{{ product.categories?.name || 'Sin categoría' }}</p>
              <p class="product-price">${{ product.price }}</p>
              <div class="product-stock">
                <ul v-if="product.product_variations?.length">
                  <li v-for="v in product.product_variations" :key="v.id">{{ v.reference }}: <strong>{{ v.stock }}</strong> - ${{ v.price }}</li>
                </ul>
                <span v-else>Stock: <strong>{{ product.stock }}</strong></span>
              </div>
            </div>
            <div class="product-actions">
                <button @click="editProduct(product)" class="action-btn edit-btn">✏️ Editar</button>
                <button @click="deleteProduct(product.id)" class="action-btn delete-btn">🗑️ Borrar</button>
            </div>
          </div>
        </div>
        <p v-else class="empty-text">No hay productos registrados.</p>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const supabase = useSupabaseClient();
const cropper = ref(null);
const imageToCrop = ref(null);
const croppedImageBlob = ref(null);
const imagePreview = ref('');
const products = ref([]);
const categories = ref([]);
const editingProduct = ref(null);
const isUploading = ref(false);

const productVariations = ref([]);
const newProductVariations = ref([]);
const newVariation = reactive({ reference: '', stock: 0, price: 0 }); // Added price

const getInitialFormState = () => ({ name: '', slug: '', description: '', stock: 0, image_url: '', category_id: null, price: null });
const form = ref(getInitialFormState());

const selectedCategory = computed(() => categories.value.find(cat => cat.id === form.value.category_id));
const showVariationsSection = computed(() => selectedCategory.value?.name.toLowerCase().includes('vendas') || selectedCategory.value?.name.toLowerCase().includes('fajas'));
const variationTitle = computed(() => selectedCategory.value?.name.toLowerCase().includes('fajas') ? 'Gestionar Tallas' : 'Gestionar Variantes');
const isFajasCategory = computed(() => selectedCategory.value?.name.toLowerCase().includes('fajas'));
const variationsToShow = computed(() => editingProduct.value ? productVariations.value : newProductVariations.value);

watch(() => form.value.name, (newName) => {
  if (!editingProduct.value || !form.value.slug) {
    form.value.slug = newName.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
  }
});

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) imageToCrop.value = URL.createObjectURL(file);
};

const cropImage = () => {
  if (cropper.value) {
    cropper.value.getResult().canvas.toBlob(blob => {
      croppedImageBlob.value = blob;
      imagePreview.value = URL.createObjectURL(blob);
      closeCropper();
    }, 'image/png');
  }
};

const closeCropper = () => {
  imageToCrop.value = null;
  const fileInput = document.getElementById('productImageInput');
  if (fileInput) fileInput.value = null;
};

const fetchData = async () => {
  const { data: productData } = await supabase.from('products').select('*, categories(name), product_variations(*)').order('name');
  products.value = productData || [];
  const { data: categoryData } = await supabase.from('categories').select('*').order('name');
  categories.value = categoryData || [];
};

const saveProduct = async () => {
  isUploading.value = true;
  if (croppedImageBlob.value) {
    const fileName = `${Date.now()}-product.png`;
    const { data, error } = await supabase.storage.from('product-images').upload(fileName, croppedImageBlob.value);
    if (error) { console.error("Error uploading image:", error); isUploading.value = false; return; }
    form.value.image_url = supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl;
  }

  if (!form.value.image_url && !editingProduct.value) {
    alert('Por favor, selecciona una imagen.'); isUploading.value = false; return;
  }

  const productData = {
    name: form.value.name,
    slug: form.value.slug,
    description: form.value.description,
    stock: form.value.stock,
    image_url: form.value.image_url,
    category_id: form.value.category_id,
    price: form.value.price,
  };
  if (showVariationsSection.value) productData.stock = 0; // Set main stock to 0 if variations are used

  try {
    if (editingProduct.value) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.value.id);
      if (error) throw error;
    } else {
      const { data: newProduct, error } = await supabase.from('products').insert([productData]).select().single();
      if (error) throw error;
      if (newProductVariations.value.length > 0) {
        const varsToInsert = newProductVariations.value.map(v => ({ ...v, product_id: newProduct.id }));
        const { error: varError } = await supabase.from('product_variations').insert(varsToInsert);
        if (varError) throw varError;
      }
    }
    await fetchData();
    resetForm();
  } catch (error) {
    console.error('Error saving product:', error.message);
  } finally {
    isUploading.value = false;
  }
};

const editProduct = async (product) => {
  editingProduct.value = product;
  form.value = { ...product };
  imagePreview.value = product.image_url;
  croppedImageBlob.value = null;
  newProductVariations.value = [];

  if (showVariationsSection.value) {
    const { data, error } = await supabase.from('product_variations').select('*').eq('product_id', product.id).order('reference');
    productVariations.value = error ? [] : data;
  } else {
    productVariations.value = [];
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const resetForm = () => {
  editingProduct.value = null;
  croppedImageBlob.value = null;
  imagePreview.value = '';
  form.value = getInitialFormState();
  productVariatios.value = []; // Corrected typo
  newProductVariations.value = [];
  closeCropper();
};

const cancelEdit = () => resetForm();

const deleteProduct = async (id) => {
  if (confirm('¿Seguro que quieres borrar este producto?')) {
    await supabase.from('products').delete().eq('id', id);
    fetchData();
  }
};

const addVariation = async (variation) => {
  if (!variation.reference?.trim() || variation.stock === null || variation.price === null) return alert('Referencia, stock y precio son obligatorios.');
  if (editingProduct.value) {
    const { data, error } = await supabase.from('product_variations').insert([{ product_id: editingProduct.value.id, ...variation }]).select().single();
    if (!error) productVariations.value.push(data);
  } else {
    newProductVariations.value.push({ id: `temp-${Date.now()}`, ...variation });
  }
};

const addVariationWrapper = () => {
  addVariation(newVariation);
  newVariation.reference = '';
  newVariation.stock = 0;
  newVariation.price = 0; // Reset price
};

const updateVariation = async (v) => {
  await supabase.from('product_variations').update({ stock: v.stock, price: v.price }).eq('id', v.id);
};

const deleteVariation = async (id) => {
  if (editingProduct.value) {
    await supabase.from('product_variations').delete().eq('id', id);
    productVariations.value = productVariations.value.filter(v => v.id !== id);
  } else {
    newProductVariations.value = newProductVariations.value.filter(v => v.id !== id);
  }
};

const addPredefinedVariation = (size) => {
  if (variationsToShow.value.some(v => v.reference === size)) return;
  const variation = { reference: size, stock: 0, price: form.value.price || 0 }; // Use main product price as default
  if (editingProduct.value) addVariation(variation); else newProductVariations.value.push({ id: `temp-${Date.now()}`, ...variation });
};

onMounted(fetchData);
</script>

<style scoped>
/* --- Contenedor Principal --- */
.products-container { padding: 1rem; max-width: 1200px; margin: 0 auto; }
.title { font-size: 1.8rem; color: #fff; margin-bottom: 2rem; }

/* --- Tarjeta Contenedora --- */
.widget-card { background-color: #1e1e1e; border: 1px solid #333; border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; }
.widget-title { font-size: 1.2rem; margin: 0 0 1.5rem 0; color: #fff; border-bottom: 1px solid #333; padding-bottom: 1rem; }

/* --- Formulario --- */
.form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; color: #aaa; }
input, select, textarea { width: 100%; padding: 0.8rem; background-color: #2a2a2a; border: 1px solid #444; border-radius: 8px; color: #e0e0e0; font-size: 1rem; }
textarea { min-height: 100px; resize: vertical; }

/* --- Carga de Imagen --- */
.image-upload-area { display: flex; align-items: center; gap: 1rem; }
.file-input { width: 0; height: 0; opacity: 0; overflow: hidden; position: absolute; z-index: -1; }
.file-label { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.8rem 1.2rem; background-color: #444; color: #fff; border-radius: 8px; cursor: pointer; }
.image-preview { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 2px solid #444; }

/* --- Sección de Stock/Variantes --- */
.stock-section { background-color: #242424; padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem; }
.section-subtitle { font-size: 1.1rem; color: #00aaff; margin: 0 0 1rem 0; }
.predefined-variations { display: flex; gap: 0.5rem; margin-bottom: 1rem; flex-wrap: wrap; }
.predefined-variations button { background-color: #007bff; color: #fff; padding: 0.5rem 1rem; border-radius: 20px; border: none; cursor: pointer; }
.add-variation-form { display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 1rem; }
.add-variation-form input { margin-bottom: 0; } /* Override default form-group margin */
.button-add { background-color: #28a745; color: #fff; padding: 0.5rem 1rem; border-radius: 8px; border: none; cursor: pointer; }

.variations-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.variations-list li { display: flex; align-items: center; gap: 0.5rem; background-color: #2a2a2a; padding: 0.5rem; border-radius: 6px; }
.variations-list li span { flex-grow: 1; }
.variations-list li input { width: 80px; text-align: center; }
.delete-btn { background: none; border: none; color: #dc3545; font-size: 1.2rem; cursor: pointer; }

/* --- Acciones del Formulario --- */
.form-actions { display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end; }
.button-primary, .button-secondary { padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 500; }
.button-primary { background-color: #007bff; color: #fff; }
.button-secondary { background-color: #444; color: #ccc; }
.button-primary:disabled { background-color: #555; cursor: not-allowed; }

/* --- Modal de Recorte --- */
.cropper-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.cropper-content { background: #1e1e1e; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; }
.cropper-title { margin: 0 0 1.5rem 0; text-align: center; }
.cropper { height: 300px; }
.cropper-actions { display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem; }

/* --- Lista de Productos --- */
.products-list { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.product-item-card { background-color: #242424; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
.product-image { width: 100%; height: 180px; object-fit: cover; }
.product-info { padding: 1rem; flex-grow: 1; }
.product-name { margin: 0 0 0.25rem; font-size: 1.1rem; color: #fff; }
.product-category, .product-price { color: #aaa; margin: 0.25rem 0; }
.product-price { font-weight: bold; color: #5cb85c; }
.product-stock { margin-top: 1rem; font-size: 0.9rem; }
.product-stock ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; }
.product-stock li { background: #333; padding: 0.2rem 0.5rem; border-radius: 4px; }
.product-actions { display: flex; background: #333; padding: 0.5rem; }
.action-btn { flex-grow: 1; background: none; border: none; color: #fff; padding: 0.8rem; cursor: pointer; font-size: 0.9rem; }
.edit-btn { color: #ffc107; }
.delete-btn { color: #dc3545; }

/* --- Media Queries --- */
@media (min-width: 640px) {
  .form-grid { grid-template-columns: 1fr 1fr; }
  .form-group.span-2 { grid-column: span 2; }
  .products-list { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
}

@media (min-width: 992px) {
  .products-container { padding: 2rem; }
  .title { font-size: 2.2rem; }
}
</style>