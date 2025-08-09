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
            <div v-if="isFajasMultiusosCategory" class="predefined-variations">
                <button @click.prevent="addPredefinedVariation('Talla Única')">Talla Única</button>
                <button @click.prevent="addPredefinedVariation('Post-parto')">Post-parto</button>
                <button @click.prevent="addPredefinedVariation('Moldeadora')">Moldeadora</button>
                <button @click.prevent="addPredefinedVariation('Post-quirúrgica')">Post-quirúrgica</button>
            </div>
            <div v-if="isVarizenCategory" class="predefined-variations">
              <button @click.prevent="addPredefinedVariation('5cm')">5cm</button>
              <button @click.prevent="addPredefinedVariation('10cm')">10cm</button>
              <button @click.prevent="addPredefinedVariation('15cm')">15cm</button>
              <button @click.prevent="addPredefinedVariation('20cm')">20cm</button>
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
const showVariationsSection = computed(() => 
  selectedCategory.value?.name.toLowerCase().includes('vendas') || 
  selectedCategory.value?.name.toLowerCase().includes('fajas') ||
  selectedCategory.value?.name.toLowerCase().includes('varizen')
);
const variationTitle = computed(() => {
  const categoryName = selectedCategory.value?.name.toLowerCase();
  if (categoryName.includes('fajas multiusos')) return 'Gestionar Referencias';
  if (categoryName.includes('fajas')) return 'Gestionar Tallas';
  if (categoryName.includes('vendas') || categoryName.includes('varizen')) return 'Gestionar Medidas';
  return 'Gestionar Variantes';
});
const isFajasMultiusosCategory = computed(() => selectedCategory.value?.name.toLowerCase().includes('fajas multiusos'));
const isFajasCategory = computed(() => {
    const name = selectedCategory.value?.name.toLowerCase();
    return name && name.includes('fajas') && !name.includes('fajas multiusos');
});
const isVarizenCategory = computed(() => selectedCategory.value?.name.toLowerCase().includes('varizen'));
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
/* --- Fondo general y contenedor --- */
.products-container {
    background: linear-gradient(135deg, #23272f 0%, #181c22 100%);
  padding: 1.2rem;
  max-width: 1500px;
  margin: 0 auto;
}

.title {
  font-size: 2rem;
  color: #e6eaf3;
  margin-bottom: 2.2rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* --- Tarjetas y widgets --- */
.widget-card {
  background: rgba(34, 38, 46, 0.98);
  border: 1px solid #23272f;
  border-radius: 18px;
  padding: 2rem 1.5rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 2px 16px 0 rgba(0,0,0,0.10);
  transition: box-shadow 0.2s;
}
.widget-card:hover {
  box-shadow: 0 4px 32px 0 rgba(0,0,0,0.18);
}
.widget-title {
  font-size: 1.3rem;
  margin: 0 0 1.5rem 0;
  color: #e6eaf3;
  border-bottom: 1px solid #23272f;
  padding-bottom: 1rem;
  font-weight: 600;
}

/* --- Formulario --- */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.2rem;
  width: 100%;
  box-sizing: border-box;
}
.form-group {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #b6bedc;
  font-weight: 500;
}
input, select, textarea {
  width: 100%;
  min-width: 0;
  padding: 0.9rem 1rem;
  background: #23272f;
  border: 1.5px solid #353b48;
  border-radius: 10px;
  color: #e6eaf3;
  font-size: 1rem;
  transition: border 0.2s;
  box-sizing: border-box;
}
input:focus, select:focus, textarea:focus {
  border-color: #4f8cff;
  outline: none;
}
textarea {
  min-height: 110px;
  resize: vertical;
}

/* --- Carga de Imagen --- */
.image-upload-area {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
}
.file-input {
  width: 0; height: 0; opacity: 0; overflow: hidden; position: absolute; z-index: -1;
}
.file-label {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.9rem 1.3rem;
  background: #353b48;
  color: #e6eaf3;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.2s;
}
.file-label:hover {
  background: #4f8cff;
  color: #fff;
}
.image-preview {
  width: 90px;
  height: 90px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid #353b48;
}

/* --- Sección de Stock/Variantes --- */
.stock-section {
  background: #23272f;
  padding: 1.5rem 1rem;
  border-radius: 10px;
  margin-top: 1.5rem;
  box-shadow: 0 1px 8px 0 rgba(0,0,0,0.08);
}
.section-subtitle {
  font-size: 1.08rem;
  color: #4f8cff;
  margin: 0 0 1rem 0;
  font-weight: 600;
}
.predefined-variations {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.predefined-variations button {
  background: #4f8cff;
  color: #fff;
  padding: 0.5rem 1.1rem;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.predefined-variations button:hover {
  background: #3570c9;
}
.add-variation-form {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.add-variation-form input { margin-bottom: 0; }
.button-add {
  background: #28a745;
  color: #fff;
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.button-add:hover {
  background: #218838;
}

.variations-list {
  list-style: none;
  padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 0.5rem;
}
.variations-list li {
  display: flex; align-items: center; gap: 0.5rem;
  background: #23272f;
  padding: 0.5rem;
  border-radius: 7px;
  box-shadow: 0 1px 4px 0 rgba(0,0,0,0.07);
}
.variations-list li span { flex-grow: 1; }
.variations-list li input { width: 80px; text-align: center; }
.delete-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s;
}
.delete-btn:hover { color: #ff5a5a; }

/* --- Acciones del Formulario --- */
.form-actions {
  display: flex;
  gap: 1.2rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.button-primary, .button-secondary {
  padding: 0.9rem 1.7rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.05rem;
  font-weight: 600;
  transition: background 0.2s;
}
.button-primary {
  background: #4f8cff;
  color: #fff;
}
.button-primary:disabled {
  background: #3a4666;
  cursor: not-allowed;
}
.button-primary:hover:not(:disabled) {
  background: #3570c9;
}
.button-secondary {
  background: #353b48;
  color: #b6bedc;
}
.button-secondary:hover {
  background: #23272f;
  color: #fff;
}

/* --- Modal de Recorte --- */
.cropper-modal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(24,28,34,0.92);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.cropper-content {
  background: #23272f;
  padding: 2rem;
  border-radius: 16px;
  width: 95%; max-width: 500px;
  box-shadow: 0 2px 24px 0 rgba(0,0,0,0.18);
}
.cropper-title {
  margin: 0 0 1.5rem 0;
  text-align: center;
  color: #e6eaf3;
}
.cropper { height: 300px; }
.cropper-actions {
  display: flex; justify-content: center; gap: 1.2rem; margin-top: 1.5rem;
}

/* --- Lista de Productos --- */
.products-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.2rem;
}
.product-item-card {
  background: rgba(34, 38, 46, 0.98);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 8px 0 rgba(0,0,0,0.10);
  transition: box-shadow 0.2s;
}
.product-item-card:hover {
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.18);
}
.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: #23272f;
}
.product-info {
  padding: 1.1rem 1rem 0.7rem 1rem;
  flex-grow: 1;
}
.product-name {
  margin: 0 0 0.25rem;
  font-size: 1.13rem;
  color: #e6eaf3;
  font-weight: 600;
}
.product-category, .product-price {
  color: #b6bedc;
  margin: 0.25rem 0;
}
.product-price {
  font-weight: bold;
  color: #4f8cff;
}
.product-stock {
  margin-top: 1rem;
  font-size: 0.97rem;
}
.product-stock ul {
  list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.product-stock li {
  background: #353b48;
  padding: 0.2rem 0.7rem;
  border-radius: 5px;
  color: #e6eaf3;
}
.product-actions {
  display: flex;
  background: #23272f;
  padding: 0.7rem;
  gap: 0.7rem;
}
.action-btn {
  flex-grow: 1;
  background: none;
  border: none;
  color: #e6eaf3;
  padding: 0.8rem;
  cursor: pointer;
  font-size: 0.98rem;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}
.edit-btn { color: #ffc107; }
.edit-btn:hover { background: #353b48; color: #fff; }
.delete-btn { color: #dc3545; }
.delete-btn:hover { background: #353b48; color: #ff5a5a; }

/* --- Responsive --- */
@media (min-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

    .main-content {
    padding: 1.2rem;
    width: 100%;
  }

  .form-group.span-2 {
    grid-column: span 2;
  }
  .products-list {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  .widget-card {
    padding: 2.2rem 2.5rem;
  }
}

@media (max-width: 599px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1.1rem;
  }

  .main-content {
    padding: 1.2rem;
    width: 100%;
  }

  .form-group, .form-group.span-2 {
    grid-column: span 1 !important;
    width: 100%;
    min-width: 0;
  }
  .widget-card {
    padding: 1.2rem 0.5rem;
  }
}
@media (min-width: 992px) {
  .products-container { padding: 2.5rem; }
  .title { font-size: 2.3rem; }
  .form-grid { gap: 1.7rem; }
  .products-list { gap: 1.7rem; }
    .main-content {
    padding: 1.2rem;
    width: 100%;
  }
}
</style>