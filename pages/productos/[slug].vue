<template>
  <div class="container">
    <div v-if="product" class="product-detail-layout">
      <div class="product-image-container">
        <img :src="product.image_url" :alt="product.name" />
      </div>

      <div class="product-info-container">
        <h1>{{ product.name }}</h1>
        <p class="price">Bs. {{ formatCurrency(product.price) }}</p>
        <p class="stock">Disponibles: {{ product.stock }} bultos</p>
        <p class="description">{{ product.description }}</p>

        <div class="actions">
          <div class="quantity-selector">
            <button @click="decreaseQuantity">-</button>
            <input type="number" v-model.number="quantity" min="1" :max="product.stock" readonly />
            <button @click="increaseQuantity(product.stock)">+</button>
          </div>

          <button @click="handleAddToCart" class="add-to-cart-button">
            Añadir al Carrito
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
import { useCartStore } from '~/stores/cart';
const route = useRoute();
const cart = useCartStore();
// CAMBIO: Ahora obtenemos el 'slug' de la ruta
const slug = route.params.slug;

const quantity = ref(1);
const addedMessage = ref('');

// --- Obtener datos del producto específico por SLUG ---
const supabase = useSupabaseClient();
const { data: product } = await useAsyncData(`product-${slug}`, async () => {
  const { data } = await supabase
    .from('products')
    .select('*')
    // CAMBIO: Buscamos por 'slug' en lugar de 'id'
    .eq('slug', slug)
    .single();
  return data;
});

// --- El resto de las funciones no cambian ---
const formatCurrency = (value) => {
  return typeof value === 'number' ? value.toFixed(2) : '0.00';
};
const decreaseQuantity = () => {
  if (quantity.value > 1) quantity.value--;
};
const increaseQuantity = (maxStock) => {
  if (quantity.value < maxStock) quantity.value++;
};
const handleAddToCart = () => {
  if (!product.value) return;
  cart.addToCart(product.value, quantity.value);
  addedMessage.value = `${quantity.value} bulto(s) de "${product.value.name}" añadido(s) al carrito.`;
  setTimeout(() => { addedMessage.value = ''; }, 3000);
};
</script>

<style scoped>
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
  align-items: center;
}

/* --- Columna de la Imagen --- */
.product-image-container img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: contain;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

/* --- Columna de Información --- */
.product-info-container .title {
  color: var(--color-text-primary);
  font-size: 2.8rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.price {
  font-size: 2.2rem;
  font-weight: bold;
  color: var(--color-success);
  margin: 0.5rem 0;
}

.stock {
  margin-bottom: 1.5rem;
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.divider {
  height: 1px;
  background-color: #333;
  margin: 2rem 0;
}

.description-title {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.description {
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin-bottom: 2.5rem;
  white-space: pre-wrap;
}

/* --- Área de Acciones --- */
.actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden; /* Para que los botones hereden el borde redondeado */
}

.quantity-selector button {
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  border: none;
  width: 45px;
  height: 45px;
  font-size: 1.8rem;
  cursor: pointer;
  transition: background-color 0.2s;
}
.quantity-selector button:hover {
  background-color: #444;
}

.quantity-selector input {
  width: 60px;
  height: 45px;
  text-align: center;
  border: none;
  background-color: #1e1e1e;
  color: #fff;
  font-size: 1.2rem;
  -moz-appearance: textfield;
}

.add-to-cart-button {
  background-color: var(--color-success);
  color: white;
  border: none;
  padding: 0 30px;
  height: 45px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  flex-grow: 1; /* Ocupa el espacio restante */
  transition: background-color 0.2s, transform 0.2s;
}
.add-to-cart-button:hover {
  background-color: #0056b3;
  transform: scale(1.02);
}

.added-feedback {
  margin-top: 1rem;
  color: #28a745;
  font-weight: 500;
}

/* --- Media Query para Móviles --- */
@media (max-width: 820px) {
  .product-detail-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .product-info-container .title {
    font-size: 2.2rem;
  }

  .price {
    font-size: 2rem;
  }
  
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .add-to-cart-button {
    flex-grow: 0; /* Resetea el crecimiento */
  }
}
</style>