<template>
  <div class="container">
    <div v-if="product" class="product-detail-layout">
      <div class="product-image-container">
        <div class="product-badges-container">
          <span v-for="(badge, index) in getProductBadges(product.name)" :key="badge"
                :class="['product-badge', 'badge-' + badge.toLowerCase().replace(/\s/g, '-')]"
                :style="{ top: (index * 2.5) + 'rem' }">
            {{ badge }}
          </span>
        </div>
        <Swiper
          v-if="productImages.length > 0"
          :modules="[Navigation, Pagination]"
          :navigation="true"
          :pagination="{ clickable: true }"
          class="product-swiper"
        >
          <SwiperSlide v-for="(img, idx) in productImages" :key="idx">
            <img :src="img" :alt="product.name + ' imagen ' + (idx+1)" />
          </SwiperSlide>
        </Swiper>
      </div>
      <div class="product-info-container">
        <h1>{{ product.name }}</h1>
        <p class="price">{{ formatCurrency(displayPrice) }}$</p>
        
        <!-- Stock General -->
        <p class="stock" v-if="!hasVariations">
          Disponibles: {{ isFajasCategory ? product.stock + ' unidades' : product.stock + ' bultos' }}
        </p>

        <p class="description">{{ product.description }}</p>

        <!-- Sección de Variantes -->
        <div class="variations-container">
          <h3 class="variations-title">{{ variationTitle }}</h3>
          <div class="references">
            <label 
              v-for="variation in (Array.isArray(product.product_variations) ? product.product_variations : [])" 
              :key="variation.id" 
              class="reference-label"
              :class="{ 'selected': selectedReference === variation.id, 'out-of-stock': variation.stock === 0 }"
            >
              <input 
                type="radio" 
                :id="variation.id" 
                :value="variation.id" 
                v-model="selectedReference" 
                :disabled="variation.stock === 0"
                name="product-variation"
              >
              <span>{{ variation.reference }}</span>
            </label>
          </div>
          <p v-if="selectedVariationStock !== null" class="stock-indicator">
            {{ isFajasCategory ? `Disponible: ${selectedVariationStock} unidad${selectedVariationStock === 1 ? '' : 'es'}` : `Disponibles: ${selectedVariationStock} bultos` }}
          </p>
        </div>

        <!-- Acciones -->
        <div class="actions">
          <div class="quantity-selector">
            <button @click="decreaseQuantity">-</button>
            <input type="number" v-model.number="quantity" min="1" :max="maxAvailableStock" readonly />
            <button @click="increaseQuantity">+</button>
          </div>

          <button 
            @click="handleAddToCart" 
            class="add-to-cart-button" 
            :disabled="isAddToCartDisabled"
          >
            {{ addToCartText }}
          </button>
        </div>
        <p v-if="addedMessage" class="added-feedback">{{ addedMessage }}</p>
      </div>
    </div>
    <div v-else class="loading-state">
      <p>Cargando producto...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useCartStore } from '~/stores/cart';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const route = useRoute();
const cart = useCartStore();
const slug = route.params.slug;

const quantity = ref(1);
const addedMessage = ref('');
const selectedReference = ref(null); // Para guardar la variante seleccionada

// --- Obtener datos del producto y sus variantes ---
const supabase = useSupabaseClient();
const { data: product } = await useAsyncData(`product-${slug}`, async () => {
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name), product_variations(*)') // Incluimos variantes y categoría
    .eq('slug', slug)
    .single();
  if (data && Array.isArray(data.product_variations)) {
    data.product_variations = [...data.product_variations].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return data;
});

// --- Propiedades Computadas para manejar la lógica de UI ---
const productImages = computed(() => {
  if (!product.value) return [];
  const imgs = [product.value.image_url, product.value.image_url_2, product.value.image_url_3];
  return imgs.filter(Boolean);
});

const hasVariations = computed(() => {
  return product.value && Array.isArray(product.value.product_variations) && product.value.product_variations.length > 0;
});

const isFajasCategory = computed(() => {
  return product.value && product.value.category && product.value.category.name.toLowerCase().includes('faja');
});

const variationTitle = computed(() => {
  if (!product.value || !product.value.category) return 'Seleccionar Opción';
  const categoryName = product.value.category.name.toLowerCase();
  if (categoryName.includes('fajas')) return 'Elige tu Talla';
  if (categoryName.includes('vendas')) return 'Elige la Medida';
  return 'Seleccionar Referencia';
});

const selectedVariation = computed(() => {
  if (!selectedReference.value || !hasVariations.value) return null;
  return Array.isArray(product.value?.product_variations)
    ? product.value.product_variations.find(v => v.id === selectedReference.value)
    : null;
});

const selectedVariationStock = computed(() => {
  return selectedVariation.value ? selectedVariation.value.stock : null;
});

const displayPrice = computed(() => {
  if (hasVariations.value && selectedVariation.value) {
    return selectedVariation.value.price; // Muestra el precio de la variante seleccionada
  } else if (product.value) {
    return product.value.price; // Muestra el precio base del producto
  }
  return 0; // Default
});

const maxAvailableStock = computed(() => {
  if (hasVariations.value) {
    return selectedVariationStock.value || 0;
  } else {
    return product.value ? product.value.stock : 0;
  }
});

const isAddToCartDisabled = computed(() => {
  if (hasVariations.value) {
    return !selectedReference.value || maxAvailableStock.value === 0;
  }
  return maxAvailableStock.value === 0;
});

const addToCartText = computed(() => {
  if (hasVariations.value && !selectedReference.value) {
    return 'Selecciona una opción';
  }
  if (maxAvailableStock.value === 0) {
    return 'Agotado';
  }
  return 'Añadir al Carrito';
});

// --- Funciones de Interacción ---
const formatCurrency = (value) => {
  return typeof value === 'number' ? `${value.toFixed(2)}` : '$0.00';
};

const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--;
};

const increaseQuantity = () => {
  if (quantity.value < maxAvailableStock.value) {
    quantity.value++;
  }
};

const handleAddToCart = () => {
  if (!product.value || isAddToCartDisabled.value) return;

  let productToAdd = { ...product.value };
  let reference = null;
  let priceToUse = Number(product.value.price) || 0; // Default to main product price, ensure it's a number

  if (hasVariations.value) {
    const selectedVar = selectedVariation.value; // Use the computed property
    if (!selectedVar) return; 
    reference = selectedVar.reference;
    priceToUse = Number(selectedVar.price) || 0; // Use variation price, ensure it's a number
    productToAdd.stock = selectedVar.stock; 
    productToAdd.variation_id = selectedVar.id; 
  } else {
    productToAdd.variation_id = null;
  }

  // Pass the correct price to addToCart
  cart.addToCart(productToAdd, quantity.value, reference, priceToUse);
  
  const referenceText = reference ? ` (Ref: ${reference})` : '';
  if (isFajasCategory.value) {
    addedMessage.value = `${quantity.value} unidad(es) de "${product.value.name}"${referenceText} añadida(s) al carrito.`
  } else {
    addedMessage.value = `${quantity.value} bulto(s) de "${product.value.name}"${referenceText} añadido(s) al carrito.`
  }
  setTimeout(() => { addedMessage.value = ''; }, 3500);
};

// Observador para resetear la cantidad si cambia la selección
watch(selectedReference, () => {
  quantity.value = 1;
});

const { getProductBadges } = useProductBadges();
</script>

<style scoped>
/* Mostrar varias imágenes */
.product-swiper {
  width: 100%;
  max-width: 320px;
  height: auto;
  margin: 0 auto;
}
.product-swiper img {
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #eee;
}

/* --- ESTILOS MEJORADOS Y RESPONSIVE --- */
.container {
  max-width: 1200px;
  margin: 4rem auto;
  padding: 0 2rem;
}

.loading-state {
  text-align: center;
  font-size: 1.5rem;
  color: #888;
}

.product-detail-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 4rem; /* Mayor espaciado */
  align-items: flex-start; /* Alinea al inicio para que no se estire */
  padding: 2rem; /* Añadir padding al layout principal */
  background-color: var(--color-surface); /* Fondo para el layout */
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); /* Sombra suave */
  width: 100%; /* Ensure it takes full width */
  margin: 0 auto; /* Center it within its parent */
}

/* --- Columna de la Imagen --- */
.product-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--color-background); /* Fondo claro para la imagen */
  border-radius: 12px;
  padding: 1rem;
}

.product-image-container img {
  width: 100%;
  max-height: 400px; /* Limitar altura de la imagen */
  object-fit: contain;
  border-radius: 8px;
}

/* --- Columna de Información --- */
.product-info-container h1 {
  color: var(--color-text-primary);
  font-size: 2.8rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.price {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--color-success);
  margin: 0.5rem 0 1.5rem 0; /* Más espacio debajo del precio */
}

.stock {
  margin-bottom: 1.5rem;
  color: var(--color-text-secondary);
  font-size: 1rem;
  font-weight: 500;
}

.description {
  line-height: 1.8; /* Mayor interlineado para legibilidad */
  color: var(--color-text-secondary);
  margin-bottom: 2.5rem;
  white-space: pre-wrap;
}

/* --- Sección de Variantes --- */
.variations-container {
  margin-bottom: 2rem;
  background-color: var(--color-background); /* Fondo más claro para variantes */
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.variations-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 1.2rem 0;
  color: var(--color-text-primary);
}

.references {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.reference-label {
  position: relative;
  cursor: pointer;
  user-select: none; /* Evitar selección de texto */
}

.reference-label input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.reference-label span {
  display: block;
  padding: 0.7rem 1.4rem; /* Aumentar padding */
  border: 2px solid var(--color-border); /* Borde más pronunciado */
  border-radius: 25px; /* Más redondeado */
  background-color: var(--color-surface);
  color: var(--color-text-primary); /* Color de texto más oscuro */
  transition: all 0.3s ease; /* Transición más suave */
  font-weight: 600;
  font-size: 1.05rem;
}

.reference-label:hover span {
  border-color: var(--color-primary);
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.3); /* Sombra al pasar el ratón */
}

.reference-label.selected span {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  font-weight: bold;
  transform: translateY(-2px); /* Pequeño efecto al seleccionar */
  box-shadow: 0 4px 10px rgba(0, 123, 255, 0.4); /* Sombra al seleccionar */
}

.reference-label.out-of-stock span {
  background-color: #e9ecef; /* Gris claro */
  color: #adb5bd; /* Gris más claro */
  text-decoration: line-through;
  cursor: not-allowed;
  border-color: #ced4da;
  box-shadow: none;
}

.stock-indicator {
  margin-top: 1.2rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-success);
}


/* --- Área de Acciones --- */
.actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-top: 3rem; /* Más espacio arriba */
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 2px solid var(--color-border); /* Borde más grueso */
  border-radius: 10px;
  overflow: hidden;
}

.quantity-selector button {
  background-color: var(--color-background); /* Fondo más claro */
  color: var(--color-text-primary);
  border: none;
  width: 50px; /* Más ancho */
  height: 50px; /* Más alto */
  font-size: 2rem; /* Más grande */
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}
.quantity-selector button:hover {
  background-color: var(--color-primary);
  color: white;
}

.quantity-selector input {
  width: 70px; /* Más ancho */
  height: 50px;
  text-align: center;
  border: none;
  background-color: var(--color-surface); /* Fondo del input */
  color: var(--color-text-primary);
  font-size: 1.5rem; /* Más grande */
  -moz-appearance: textfield;
}

.add-to-cart-button {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 0 35px; /* Más padding */
  height: 50px; /* Más alto */
  border-radius: 10px;
  cursor: pointer;
  font-size: 1.1rem; /* Más grande */
  font-weight: bold;
  flex-grow: 1;
  transition: all 0.3s ease;
  text-transform: uppercase; /* Mayúsculas */
  letter-spacing: 0.5px; /* Espaciado entre letras */
}
.add-to-cart-button:hover {
  background-color: #0056b3;
  transform: translateY(-2px); /* Efecto hover */
  box-shadow: 0 6px 15px rgba(0, 123, 255, 0.3); /* Sombra al hover */
}

.add-to-cart-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.added-feedback {
  margin-top: 1.5rem;
  color: var(--color-success);
  font-weight: 600;
  text-align: center;
  font-size: 1.1rem;
}

/* --- Media Query para Móviles --- */
@media (max-width: 910px) {
  .container {
    padding: 0 2rem; 
    margin: 4rem -2em;
  }
  .product-detail-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 1.5rem;
  }

  .product-image-container {
    padding: 0.5rem;
  }

  .product-info-container h1 {
    font-size: 2.2rem;
    text-align: center;
  }

  .price {
    font-size: 2rem;
    text-align: center;
  }
  
  .description {
    margin-bottom: 2rem;
  }

  .variations-container {
    padding: 1rem;
  }

  .variations-title {
    font-size: 1.1rem;
    text-align: center;
  }

  .references {
    justify-content: center;
  }

  .reference-label span {
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
  }

  .stock-indicator {
    text-align: center;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .quantity-selector {
    width: 100%;
    justify-content: center;
  }

  .add-to-cart-button {
    flex-grow: 0; /* Resetea el crecimiento */
    width: 100%;
  }

  .added-feedback {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .product-info-container h1 {
    font-size: 1.8rem;
  }

  .price {
    font-size: 1.8rem;
  }

  .quantity-selector button {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }

  .quantity-selector input {
    width: 50px;
    height: 40px;
    font-size: 1.2rem;
  }

  .add-to-cart-button {
    height: 40px;
    font-size: 0.9rem;
    padding: 0 20px;
  }
}
</style>