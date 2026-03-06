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
          <div class="form-group row-price">
            <div class="price-input-group">
              <label for="product-price">Precio Base ($)</label>
              <input id="product-price" type="number" step="0.01" v-model="form.price" :disabled="showVariationsSection" :required="!showVariationsSection">
            </div>
            <div class="price-input-group">
              <label for="product-discount">Precio de Oferta ($) <small>(Opcional)</small></label>
              <input id="product-discount" type="number" step="0.01" v-model="form.discount_price" :disabled="showVariationsSection" placeholder="Dejar vacío si no hay oferta">
            </div>
          </div>
          <small class="variation-warning" v-if="showVariationsSection">El precio y oferta se definirán por cada variante debajo.</small>
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
            <label>Imágenes del Producto (máx. 3)</label>
            <div class="image-upload-area">
              <div v-for="i in 3" :key="i" class="multi-image-upload">
                <input :id="`productImageInput${i}`" type="file" @change="e => handleFileSelect(e, i)" accept="image/*" class="file-input">
                <label :for="`productImageInput${i}`" class="file-label">
                  <span class="icon">🖼️</span>
                  <span>{{ imagePreviews[i-1] ? 'Cambiar Imagen' : `Seleccionar Imagen ${i}` }}</span>
                </label>
                <img v-if="imagePreviews[i-1]" :src="imagePreviews[i-1]" alt="Vista previa" class="image-preview">
              </div>
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
            <div v-if="isInmovilizadorCategory" class="predefined-variations">
                <button @click.prevent="addPredefinedVariation('S')">S</button>
                <button @click.prevent="addPredefinedVariation('M')">M</button>
                <button @click.prevent="addPredefinedVariation('L')">L</button>
                <button @click.prevent="addPredefinedVariation('XL')">XL</button>
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
              <input v-model.number="newVariation.discount_price" type="number" step="0.01" placeholder="Oferta ($)">
              <button @click.prevent="addVariationWrapper" type="button" class="button-add">Agregar</button>
            </div>
            <ul v-if="variationsToShow.length > 0" class="variations-list" @dragover.prevent @drop="onDropVariation">
<li v-for="(v, idx) in variationsToShow" :key="v.id" draggable="true"
    @dragstart="onDragStartVariation(idx)"
    @dragover.prevent
    :class="{ 'dragging': draggingVariationIdx === idx }"
    @touchstart="onTouchStartVariation(idx)"
    @touchmove="onTouchMoveVariation"
    @touchend="onTouchEndVariation">
                <span>{{ v.reference }}</span>
                <input type="number" v-model.number="v.stock" placeholder="Stock" @change="editingProduct ? updateVariation(v) : null">
                <input type="number" step="0.01" v-model.number="v.price" placeholder="Precio" @change="editingProduct ? updateVariation(v) : syncBasePrice()">
                <input type="number" step="0.01" v-model.number="v.discount_price" placeholder="Oferta" @change="editingProduct ? updateVariation(v) : syncBasePrice()">
                <button @click.prevent="deleteVariation(v.id)" class="delete-btn">🗑️</button>
                <span v-if="draggingVariationIdx === idx" style="opacity:0.5;">(Arrastrando)</span>
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
    <div v-if="imageToCrop.some(img => img) && croppingIndex !== null && imageToCrop[croppingIndex]" class="cropper-modal">
      <div class="cropper-content">
        <h3 class="cropper-title">Recortar Imagen</h3>
        <Cropper ref="cropper" class="cropper" :src="imageToCrop[croppingIndex]" :stencil-props="{ aspectRatio: 1 }" image-restriction="stencil" />
        <div class="cropper-actions">
          <button @click="cropImage" class="button-primary">Aceptar</button>
          <button @click="closeCropper" class="button-secondary">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Lista de Productos -->
    <div class="widget-card list-card">
        <div class="list-header">
          <h2 class="widget-title">Productos Existentes</h2>
          <div class="search-box">
            <input type="search" v-model="searchQuery" placeholder="Buscar producto por nombre o categoría...">
          </div>
        </div>
        <div v-if="filteredProducts.length > 0" class="products-list">
          <div v-for="product in filteredProducts" :key="product.id" class="product-item-card">
            <img :src="product.image_url || '/placeholder.png'" :alt="product.name" class="product-image">
            <div class="product-info">
              <h4 class="product-name">{{ product.name }}</h4>
              <p class="product-category">{{ product.categories?.name || 'Sin categoría' }}</p>
              <div class="product-price-container">
                <p class="product-price" :class="{ 'has-discount': product.discount_price }">${{ product.price }}</p>
                <p v-if="product.discount_price" class="product-discount-price">${{ product.discount_price }}</p>
              </div>
              <div class="product-stock">
                <ul v-if="product.product_variations?.length">
                  <li v-for="v in product.product_variations" :key="v.id">
                    {{ v.reference }}: <strong>{{ v.stock }}</strong> - <span :class="{ 'strike': v.discount_price }">${{ v.price }}</span> <span v-if="v.discount_price" class="sale-price">${{ v.discount_price }}</span>
                  </li>
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
import { useToast } from 'vue-toastification';

const toast = useToast();

// Soporte touch básico para drag and drop en móviles
let touchStartIdx = null;
let touchOverIdx = null;
const onTouchStartVariation = (idx) => {
  touchStartIdx = idx;
};
const onTouchMoveVariation = (e) => {
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target) return;
  const li = target.closest('li');
  if (!li) return;
  const parent = li.parentNode;
  touchOverIdx = Array.from(parent.children).indexOf(li);
};
const onTouchEndVariation = () => {
  if (touchStartIdx !== null && touchOverIdx !== null && touchStartIdx !== touchOverIdx) {
    const arr = variationsToShow.value;
    const moved = arr.splice(touchStartIdx, 1)[0];
    arr.splice(touchOverIdx, 0, moved);
    if (editingProduct.value) {
      arr.forEach(async (v, i) => {
        if (v.order !== i) {
          v.order = i;
          await supabase.from('product_variations').update({ order: i }).eq('id', v.id);
        }
      });
    }
  }
  touchStartIdx = null;
  touchOverIdx = null;
};

// Drag and drop para variantes
const draggingVariationIdx = ref(null);
const onDragStartVariation = (idx) => {
  draggingVariationIdx.value = idx;
};
const onDropVariation = (e) => {
  if (draggingVariationIdx.value === null) return;
  const target = e.target.closest('li');
  if (!target) return;
  const targetIdx = Array.from(target.parentNode.children).indexOf(target);
  if (targetIdx === draggingVariationIdx.value) {
    draggingVariationIdx.value = null;
    return;
  }
  // Reordenar en el array
  const arr = variationsToShow.value;
  const moved = arr.splice(draggingVariationIdx.value, 1)[0];
  arr.splice(targetIdx, 0, moved);
  // Actualizar el campo order en la base de datos si está editando
  if (editingProduct.value) {
    arr.forEach(async (v, i) => {
      if (v.order !== i) {
        v.order = i;
        await supabase.from('product_variations').update({ order: i }).eq('id', v.id);
      }
    });
  }
  draggingVariationIdx.value = null;
};
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

definePageMeta({ layout: 'admin', middleware: 'auth' });

const supabase = useSupabaseClient();
const cropper = ref(null);
const imageToCrop = ref([null, null, null]);
const croppedImageBlob = ref([null, null, null]);
const imagePreviews = ref(['', '', '']);
const croppingIndex = ref(null);
const products = ref([]);
const searchQuery = ref('');
const categories = ref([]);
const editingProduct = ref(null);
const isUploading = ref(false);

const productVariations = ref([]);
const newProductVariations = ref([]);
const newVariation = reactive({ reference: '', stock: 0, price: 0, discount_price: null });

const getInitialFormState = () => ({ name: '', slug: '', description: '', stock: 0, image_url: '', category_id: null, price: null, discount_price: null });
const form = ref(getInitialFormState());

const selectedCategory = computed(() => categories.value.find(cat => cat.id === form.value.category_id));
const showVariationsSection = computed(() => 
  selectedCategory.value?.name.toLowerCase().includes('vendas') || 
  selectedCategory.value?.name.toLowerCase().includes('fajas') ||
  selectedCategory.value?.name.toLowerCase().includes('varizen') ||
  selectedCategory.value?.name.toLowerCase().includes('inmovilizador')
);
const variationTitle = computed(() => {
  const categoryName = selectedCategory.value?.name.toLowerCase();
  if (categoryName.includes('fajas multiusos')) return 'Gestionar Referencias';
  if (categoryName.includes('fajas') || categoryName.includes('inmovilizador')) return 'Gestionar Tallas';
  if (categoryName.includes('vendas') || categoryName.includes('varizen')) return 'Gestionar Medidas';
  return 'Gestionar Variantes';
});

const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value;
  const lowerQuery = searchQuery.value.toLowerCase();
  return products.value.filter(p => p.name.toLowerCase().includes(lowerQuery) || p.categories?.name?.toLowerCase().includes(lowerQuery));
});

const isFajasMultiusosCategory = computed(() => selectedCategory.value?.name.toLowerCase().includes('fajas multiusos'));
const isFajasCategory = computed(() => {
    const name = selectedCategory.value?.name.toLowerCase();
    return name && name.includes('fajas') && !name.includes('fajas multiusos');
});
const isInmovilizadorCategory = computed(() => selectedCategory.value?.name.toLowerCase().includes('inmovilizador'));
const isVarizenCategory = computed(() => selectedCategory.value?.name.toLowerCase().includes('varizen'));
const variationsToShow = computed(() => editingProduct.value ? productVariations.value : newProductVariations.value);

watch(() => form.value.name, (newName) => {
  if (!editingProduct.value || !form.value.slug) {
    form.value.slug = newName.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
  }
});

const handleFileSelect = (event, idx) => {
  const file = event.target.files[0];
  if (file) {
    imageToCrop.value[idx-1] = URL.createObjectURL(file);
    croppingIndex.value = idx-1;
  }
};

const cropImage = () => {
  if (cropper.value && croppingIndex.value !== null) {
    cropper.value.getResult().canvas.toBlob(blob => {
      croppedImageBlob.value[croppingIndex.value] = blob;
      imagePreviews.value[croppingIndex.value] = URL.createObjectURL(blob);
      closeCropper();
    }, 'image/png');
  }
};

const closeCropper = () => {
  if (croppingIndex.value !== null) {
    imageToCrop.value[croppingIndex.value] = null;
    const fileInput = document.getElementById(`productImageInput${croppingIndex.value+1}`);
    if (fileInput) fileInput.value = null;
    croppingIndex.value = null;
  }
};

const fetchData = async () => {
  const { data: productData } = await supabase.from('products').select('*, categories(name), product_variations(*)').order('name');
  products.value = productData || [];
  const { data: categoryData } = await supabase.from('categories').select('*').order('name');
  categories.value = categoryData || [];
};

const saveProduct = async () => {
  isUploading.value = true;
  // Subir imágenes (máx 3)
  for (let i = 0; i < 3; i++) {
    if (croppedImageBlob.value[i]) {
      const fileName = `${Date.now()}-product-${i+1}.png`;
      const { data, error } = await supabase.storage.from('product-images').upload(fileName, croppedImageBlob.value[i]);
      if (error) { console.error("Error uploading image:", error); isUploading.value = false; return; }
      form.value[`image_url${i === 0 ? '' : '_' + (i+1)}`] = supabase.storage.from('product-images').getPublicUrl(data.path).data.publicUrl;
    }
  }

  if (!form.value.image_url && !editingProduct.value) {
    toast.error('Por favor, selecciona al menos una imagen.'); 
    isUploading.value = false; 
    return;
  }

  const productData = {
    name: form.value.name,
    slug: form.value.slug,
    description: form.value.description,
    stock: form.value.stock,
    image_url: form.value.image_url,
    image_url_2: form.value.image_url_2 || null,
    image_url_3: form.value.image_url_3 || null,
    category_id: form.value.category_id,
    price: form.value.price,
    discount_price: form.value.discount_price || null,
  };
  if (showVariationsSection.value) {
    productData.stock = 0; // Set main stock to 0 if variations are used
    const vars = editingProduct.value ? productVariations.value : newProductVariations.value;
    if (vars.length > 0) {
      productData.price = Math.min(...vars.map(v => Number(v.price) || 0));
      const hasDiscountedVars = vars.filter(v => typeof v.discount_price === 'number' && v.discount_price > 0);
      productData.discount_price = hasDiscountedVars.length > 0 ? Math.min(...hasDiscountedVars.map(v => Number(v.discount_price))) : null;
    } else {
      productData.price = 0;
      productData.discount_price = null;
    }
  }

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
    toast.success(editingProduct.value ? 'Producto actualizado correctamente' : 'Producto creado exitosamente');
  } catch (error) {
    console.error('Error saving product:', error.message);
    toast.error('Ocurrió un error al guardar el producto');
  } finally {
    isUploading.value = false;
  }
};

const editProduct = async (product) => {
  editingProduct.value = product;
  form.value = { ...product };
  imagePreviews.value = [product.image_url || '', product.image_url_2 || '', product.image_url_3 || ''];
  croppedImageBlob.value = [null, null, null];
  newProductVariations.value = [];

  if (showVariationsSection.value) {
  const { data, error } = await supabase.from('product_variations').select('*').eq('product_id', product.id).order('order', { ascending: true });
  productVariations.value = error ? [] : data;
  } else {
    productVariations.value = [];
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const resetForm = () => {
  editingProduct.value = null;
  croppedImageBlob.value = [null, null, null];
  imagePreviews.value = ['', '', ''];
  form.value = getInitialFormState();
  productVariatios.value = []; // Corrected typo
  newProductVariations.value = [];
  closeCropper();
};

const cancelEdit = () => resetForm();

const deleteProduct = async (id) => {
  if (confirm('¿Seguro que quieres borrar este producto?')) {
    await supabase.from('products').delete().eq('id', id);
    toast.success('Producto eliminado del sistema');
    fetchData();
  }
};

const syncBasePrice = async () => {
  const vars = editingProduct.value ? productVariations.value : newProductVariations.value;
  const minPrice = vars.length > 0 ? Math.min(...vars.map(v => Number(v.price) || 0)) : 0;
  
  const discountedVars = vars.filter(v => typeof v.discount_price === 'number' && v.discount_price > 0);
  const minDiscountPrice = discountedVars.length > 0 ? Math.min(...discountedVars.map(v => Number(v.discount_price))) : null;

  form.value.price = minPrice;
  form.value.discount_price = minDiscountPrice;

  if (editingProduct.value) {
    await supabase.from('products').update({ price: minPrice, discount_price: minDiscountPrice }).eq('id', editingProduct.value.id);
    
    // Auto-update price visually in the list
    const pIndex = products.value.findIndex(p => p.id === editingProduct.value.id);
    if (pIndex !== -1) {
      products.value[pIndex].price = minPrice;
      products.value[pIndex].discount_price = minDiscountPrice;
    }
  }
};

const addVariation = async (variation) => {
  if (!variation.reference?.trim() || variation.stock === null || variation.price === null) {
    toast.warning('Referencia, stock y precio son obligatorios.');
    return;
  }
  const payloadToInsert = { ...variation, discount_price: variation.discount_price || null };
  if (editingProduct.value) {
    const { data, error } = await supabase.from('product_variations').insert([{ product_id: editingProduct.value.id, ...payloadToInsert }]).select().single();
    if (!error) {
      productVariations.value.push(data);
      await syncBasePrice();
    }
  } else {
    newProductVariations.value.push({ id: `temp-${Date.now()}`, ...payloadToInsert });
    syncBasePrice();
  }
};

const addVariationWrapper = () => {
  addVariation(newVariation);
  newVariation.reference = '';
  newVariation.stock = 0;
  newVariation.price = 0; // Reset price
  newVariation.discount_price = null;
};

const updateVariation = async (v) => {
  await supabase.from('product_variations').update({ stock: v.stock, price: v.price, discount_price: v.discount_price || null }).eq('id', v.id);
  await syncBasePrice();
};

const deleteVariation = async (id) => {
  if (editingProduct.value) {
    await supabase.from('product_variations').delete().eq('id', id);
    productVariations.value = productVariations.value.filter(v => v.id !== id);
    await syncBasePrice();
  } else {
    newProductVariations.value = newProductVariations.value.filter(v => v.id !== id);
    syncBasePrice();
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
/* --- Layout General --- */
.products-container {
  padding: 1.5rem;
  background-color: var(--bg-main);
  color: var(--text-body);
  max-width: 1400px;
  margin: 0 auto;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.title {
  font-size: 2rem;
  color: var(--text-primary);
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* --- Tarjetas y widgets --- */
.widget-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 2rem 1.5rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 4px 6px var(--shadow-color);
  transition: box-shadow 0.2s, background-color 0.3s, border-color 0.3s;
}
.widget-card:hover {
  box-shadow: 0 8px 15px var(--shadow-color);
}
.widget-title {
  font-size: 1.3rem;
  margin: 0 0 1.5rem 0;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
  font-weight: 600;
}

/* --- Ajustes del input doble del Formulario --- */
.row-price {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.row-price .price-input-group label {
  white-space: nowrap;
}
.variation-warning {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-top: -0.5rem;
}
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
  color: var(--text-secondary);
  font-weight: 500;
}
input, select, textarea {
  width: 100%;
  min-width: 0;
  padding: 0.9rem 1rem;
  background: var(--bg-hover);
  border: 1.5px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-body);
  font-size: 1rem;
  transition: border 0.2s, background-color 0.3s, color 0.3s;
  box-sizing: border-box;
}
input:focus, select:focus, textarea:focus {
  border-color: #3b82f6;
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
  background: var(--border-color);
  color: var(--text-body);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background 0.2s;
}
.file-label:hover {
  background: #3b82f6;
  color: #fff;
}
.image-preview {
  width: 90px;
  height: 90px;
  border-radius: 10px;
  object-fit: cover;
  border: 2px solid var(--border-color);
}

/* --- Sección de Stock/Variantes --- */
.stock-section {
  background: var(--bg-hover);
  padding: 1.5rem 1rem;
  border-radius: 10px;
  margin-top: 1.5rem;
  border: 1px solid var(--border-color);
  overflow-x: auto;
}
.section-subtitle {
  font-size: 1.08rem;
  color: #3b82f6;
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
  background: #3b82f6;
  color: #fff;
  padding: 0.5rem 1.1rem;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}
.predefined-variations button:hover {
  background: #2563eb;
}
.add-variation-form {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) 80px 100px 100px auto;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.add-variation-form input { margin-bottom: 0; min-width: 0; width: 100%; }
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
  min-width: max-content;
}
.variations-list li {
  display: grid;
  grid-template-columns: minmax(100px, 1fr) 80px 100px 100px auto;
  align-items: center; gap: 0.5rem;
  background: var(--bg-card);
  padding: 0.5rem;
  border-radius: 7px;
  border: 1px solid var(--border-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
}
.variations-list li span { font-weight: 500; font-size: 0.95rem; }
.variations-list li input { min-width: 60px; width: 100%; text-align: center; }
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
  background: #3b82f6;
  color: #fff;
}
.button-primary:disabled {
  background: var(--border-color);
  cursor: not-allowed;
}
.button-primary:hover:not(:disabled) {
  background: #2563eb;
}
.button-secondary {
  background: var(--border-color);
  color: var(--text-body);
}
.button-secondary:hover {
  background: var(--text-secondary);
  color: #fff;
}

/* --- Modal de Recorte --- */
.cropper-modal {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.cropper-content {
  background: var(--bg-card);
  padding: 2rem;
  border-radius: 16px;
  width: 95%; max-width: 500px;
  box-shadow: 0 4px 24px 0 var(--shadow-color);
}
.cropper-title {
  margin: 0 0 1.5rem 0;
  text-align: center;
  color: var(--text-primary);
}
.cropper { height: 300px; }
.cropper-actions {
  display: flex; justify-content: center; gap: 1.2rem; margin-top: 1.5rem;
}

/* --- Lista de Productos --- */
.list-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.search-box input {
  width: 100%;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-card);
  color: var(--text-body);
}
.search-box input:focus {
  background-color: var(--bg-hover);
  border-color: #3b82f6;
  outline: none;
}

.products-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.2rem;
}
.product-item-card {
  background: var(--bg-card);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 4px 6px var(--shadow-color);
  border: 1px solid var(--border-color);
  transition: box-shadow 0.2s, transform 0.2s, background-color 0.3s, border-color 0.3s;
}
.product-item-card:hover {
  box-shadow: 0 8px 15px var(--shadow-color);
  transform: translateY(-2px);
}
.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: var(--bg-hover);
}
.product-info {
  padding: 1.1rem 1rem 0.7rem 1rem;
  flex-grow: 1;
}
.product-name {
  margin: 0 0 0.25rem;
  font-size: 1.13rem;
  color: var(--text-primary);
  font-weight: 600;
}
.product-category, .product-price {
  color: var(--text-secondary);
  margin: 0.25rem 0;
}
.product-price-container {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0.25rem 0;
}
.product-price.has-discount {
  text-decoration: line-through;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: normal;
}
.product-discount-price {
  font-weight: bold;
  color: #3b82f6;
  margin: 0;
}
.product-price {
  font-weight: bold;
  color: #3b82f6;
  margin: 0;
}
.strike {
  text-decoration: line-through;
  opacity: 0.7;
  font-size: 0.9em;
}
.sale-price {
  color: #3b82f6;
  font-weight: bold;
}
.product-stock {
  margin-top: 1rem;
  font-size: 0.97rem;
}
.product-stock ul {
  list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem;
}
.product-stock li {
  background: var(--bg-hover);
  padding: 0.2rem 0.7rem;
  border-radius: 5px;
  border: 1px solid var(--border-color);
  color: var(--text-body);
}
.product-actions {
  display: flex;
  background: var(--bg-hover);
  padding: 0.7rem;
  gap: 0.7rem;
  border-top: 1px solid var(--border-color);
}
.action-btn {
  flex-grow: 1;
  background: none;
  border: none;
  color: var(--text-secondary);
  padding: 0.8rem;
  cursor: pointer;
  font-size: 0.98rem;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
}
.edit-btn { color: #f59e0b; }
.edit-btn:hover { background: var(--border-color); color: #b45309; }
.delete-btn { color: #ef4444; }
.delete-btn:hover { background: var(--border-color); color: #b91c1c; }

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
  .row-price {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .widget-card {
    padding: 1.2rem 0.5rem;
  }
  .stock-section { padding: 1rem 0.5rem; }
  .add-variation-form {
    grid-template-columns: 1fr;
  }
  .variations-list {
    min-width: 100%;
  }
  .variations-list li {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    padding: 1rem;
    gap: 0.8rem;
  }
  .variations-list li span { 
    grid-column: span 2; 
    border-bottom: 1px solid var(--border-color); 
    padding-bottom: 0.5rem; 
    font-size: 1.05rem;
  }
  .delete-btn {
    grid-column: span 2;
    background: rgba(220, 53, 69, 0.1);
    border-radius: 6px;
    padding: 0.5rem;
    margin-top: 0.5rem;
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