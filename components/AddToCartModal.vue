<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-button" @click="$emit('close')">×</button>
      
      <div v-if="product" class="modal-product-details">
        <img :src="product.image_url" :alt="product.name" class="modal-product-image" />
        <div class="modal-product-info">
          <h2>{{ product.name }}</h2>
          <p class="modal-product-price">
            Bs. {{ formatCurrency(displayedPrice) }}
            <small v-if="isVenda"> por bulto (100 unidades)</small>
          </p>
          
          <!-- Stock General -->
          <p class="modal-stock" v-if="!hasVariations">
            Disponibles: {{ product.stock }} bultos
          </p>

          <!-- Sección de Variantes -->
          <div v-if="hasVariations" class="modal-variations-container">
            <h3 class="modal-variations-title">{{ variationTitle }}</h3>
            <div class="modal-references">
              <label 
                v-for="variation in product.product_variations" 
                :key="variation.id" 
                class="modal-reference-label"
                :class="{ 'selected': selectedReference === variation.id, 'out-of-stock': variation.stock === 0 }"
              >
                <input 
                  type="radio" 
                  :id="`modal-variation-${variation.id}`" 
                  :value="variation.id" 
                  v-model="selectedReference" 
                  :disabled="variation.stock === 0"
                  name="modal-product-variation"
                >
                <span>{{ variation.reference }}</span>
              </label>
            </div>
            <p v-if="selectedVariationStock !== null" class="modal-stock-indicator">
              Disponibles: {{ selectedVariationStock }} bultos
            </p>
          </div>

          <!-- Acciones -->
          <div class="modal-actions">
            <div class="modal-quantity-selector">
              <button @click="decreaseQuantity">-</button>
              <input type="number" v-model.number="quantity" min="1" :max="maxAvailableStock" readonly />
              <button @click="increaseQuantity">+</button>
            </div>

            <button 
              @click="handleAddToCart" 
              class="modal-add-to-cart-button" 
              :disabled="isAddToCartDisabled"
            >
              {{ addToCartText }}
            </button>
          </div>
          <p v-if="addedMessage" class="modal-added-feedback">{{ addedMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useCartStore } from '~/stores/cart';

const props = defineProps({
  product: Object,
});

const emit = defineEmits(['close', 'product-added']);

const cart = useCartStore();

const quantity = ref(1);
const addedMessage = ref('');
const selectedReference = ref(null); // Para guardar la variante seleccionada

// --- Propiedades Computadas para manejar la lógica de UI ---
const hasVariatedStock = computed(() => {
  return props.product && props.product.product_variations && props.product.product_variations.length > 0;
});

const hasVariations = computed(() => {
  return props.product && props.product.product_variations && props.product.product_variations.length > 0;
});

const variationTitle = computed(() => {
  if (!props.product || !props.product.category) return 'Seleccionar Opción';
  const categoryName = props.product.category.name.toLowerCase();
  if (categoryName.includes('fajas')) return 'Elige tu Talla';
  if (categoryName.includes('vendas')) return 'Elige la Medida';
  return 'Seleccionar Referencia';
});

const selectedVariationStock = computed(() => {
  if (!selectedReference.value || !hasVariations.value) return null;
  const variation = props.product.product_variations.find(v => v.id === selectedReference.value);
  return variation ? variation.stock : null;
});

// Detectar si el producto es una "venda"
const isVenda = computed(() => {
  if (!props.product) return false;
  const lowerName = props.product.name ? String(props.product.name).toLowerCase() : '';
  const lowerCategory = props.product.category && props.product.category.name ? String(props.product.category.name).toLowerCase() : '';
  // Las 'varizen' se venden por unidad, no por bulto
  const isVarizen = lowerName.includes('varizen') || lowerCategory.includes('varizen');
  return !isVarizen && (lowerName.includes('venda') || lowerCategory.includes('vendas'));
});

// Precio a mostrar en la UI: usa la variación seleccionada si existe,
// y si es "venda" multiplica por 100 para mostrar el precio por bulto.
const displayedPrice = computed(() => {
  let basePrice = 0;
  if (hasVariations.value && selectedReference.value) {
    const sel = props.product.product_variations.find(v => v.id === selectedReference.value);
    basePrice = sel ? Number(sel.price) || 0 : 0;
  } else if (props.product) {
    basePrice = Number(props.product.price) || 0;
  }
  return isVenda.value ? basePrice * 100 : basePrice;
});

const maxAvailableStock = computed(() => {
  if (hasVariations.value) {
    return selectedVariationStock.value || 0;
  } else {
    return props.product ? props.product.stock : 0;
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
  return typeof value === 'number' ? value.toFixed(2) : '0.00';
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
  if (!props.product || isAddToCartDisabled.value) return;

  let productToAdd = { ...props.product };
  let reference = null;
  let priceToUse = Number(props.product.price) || 0; // Default to main product price, ensure it's a number

  if (hasVariations.value) {
    const selectedVariation = props.product.product_variations.find(v => v.id === selectedReference.value);
    if (!selectedVariation) return; 
    reference = selectedVariation.reference;
    priceToUse = Number(selectedVariation.price) || 0; // Use variation price, ensure it's a number
    productToAdd.stock = selectedVariation.stock; 
    productToAdd.variation_id = selectedVariation.id; // Guardamos el ID de la variación
  } else {
    // Si no hay variaciones, el product_id es su propio variation_id
    productToAdd.variation_id = null;
  }

  // Pass the correct price to addToCart
  cart.addToCart(productToAdd, quantity.value, reference, priceToUse);
  
  const referenceText = reference ? ` (Ref: ${reference})` : '';
  addedMessage.value = `${quantity.value} bulto(s) de "${props.product.name}"${referenceText} añadido(s) al carrito.`
  
  // Emit event to parent to indicate product was added and close modal
  emit('product-added');
  setTimeout(() => { 
    addedMessage.value = '';
    emit('close');
  }, 1500);
};

// Observador para resetear la cantidad si cambia la selección
watch(selectedReference, () => {
  quantity.value = 1;
});

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background-color: var(--color-surface);
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 600px; /* Aumentado para mejor visualización */
  position: relative;
  border: 1px solid var(--color-border);
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 10;
}

.modal-product-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 8px;
  background-color: var(--color-background);
  flex-shrink: 0;
}

.modal-product-info {
  flex-grow: 1;
}

.modal-product-info h2 {
  margin-top: 0;
  font-size: 1.8rem;
  color: var(--color-text-primary);
}

.modal-product-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-success);
  margin-bottom: 1rem;
}

.modal-stock {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.modal-variations-container {
  margin-bottom: 1.5rem;
  background-color: var(--color-surface-soft);
  padding: 1rem;
  border-radius: 8px;
}

.modal-variations-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.8rem 0;
  color: var(--color-text-primary);
}

.modal-references {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.modal-reference-label {
  position: relative;
  cursor: pointer;
}

.modal-reference-label input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.modal-reference-label span {
  display: block;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: 15px;
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.modal-reference-label:hover span {
  border-color: var(--color-primary);
}

.modal-reference-label.selected span {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  font-weight: bold;
}

.modal-reference-label.out-of-stock span {
  background-color: #333;
  color: #777;
  text-decoration: line-through;
  cursor: not-allowed;
  border-color: #444;
}

.modal-stock-indicator {
  margin-top: 0.8rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-success);
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.modal-quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.modal-quantity-selector button {
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  border: none;
  width: 35px;
  height: 35px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.modal-quantity-selector button:hover {
  background-color: #444;
}

.modal-quantity-selector input {
  width: 50px;
  height: 35px;
  text-align: center;
  border: none;
  background-color: #1e1e1e;
  color: #fff;
  font-size: 1rem;
  -moz-appearance: textfield;
}

.modal-add-to-cart-button {
  background-color: var(--color-success);
  color: white;
  border: none;
  padding: 0 20px;
  height: 35px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  flex-grow: 1;
  transition: all 0.2s;
}
.modal-add-to-cart-button:hover {
  background-color: #0056b3;
  transform: scale(1.02);
}

.modal-add-to-cart-button:disabled {
  background-color: #555;
  cursor: not-allowed;
  transform: none;
}

.modal-added-feedback {
  margin-top: 1rem;
  color: var(--color-success);
  font-weight: 500;
  text-align: center;
}

@media (max-width: 600px) {
  .modal-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }
  .modal-product-image {
    width: 150px;
    height: 150px;
  }
  .modal-actions {
    flex-direction: column;
    width: 100%;
  }
  .modal-quantity-selector {
    width: 100%;
    justify-content: center;
  }
}
</style>