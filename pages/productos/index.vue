<template>
  <div class="container">
    <AnimatedTitle 
      text-before="Todos"
      :words="[
        { text: 'Nuestros', color: '#007bff' },
        { text: 'Tus', color: '#42c58a' },
        { text: 'Los', color: '#DC143C' }
      ]"
      text-after="Productos"
    />

    <div class="filters">
      <button @click="selectedCategory = 'all'" :class="{ active: selectedCategory === 'all' }">Todos</button>
      <button v-for="category in categories" :key="category.id" @click="selectedCategory = category.id" :class="{ active: selectedCategory === category.id }">
        {{ category.name }}
      </button>
    </div>

    <div class="product-grid">
      <div v-for="product in filteredProducts" :key="product.id" class="product-card-container">
        <NuxtLink :to="`/productos/${product.slug}`" class="product-card-link">
          <div class="product-card">
            <div class="image-container">
              <img :src="product.image_url" :alt="product.name" />
            </div>
            <div class="card-content">
              <h2>{{ product.name }}</h2>
              <div class="stock">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" class="bi bi-box-seam" viewBox="0 0 16 16">
                  <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
                </svg>
                <span>Disponibles: {{ calculateTotalStock(product) }}</span>
              </div>
              <div class="price-action-row">
                <p class="price">{{ formatCurrency(product.price) }}$</p>
                <button class="quick-add-btn" @click.prevent="openAddToCartModal(product)" title="Añadir al carrito">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-cart-plus" viewBox="0 0 16 16">
                    <path d="M9 5.5a.5.5 0 0 0-1 0V7H6.5a.5.5 0 0 0 0 1H8v1.5a.5.5 0 0 0 1 0V8h1.5a.5.5 0 0 0 0-1H9V5.5z"/>
                    <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1H.5zm3.915 10L3.102 4h10.796l-1.313 7h-8.17zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>

    <AddToCartModal 
      v-if="showAddToCartModal" 
      :product="selectedProductForModal"
      @close="showAddToCartModal = false"
      @product-added="handleProductAdded"
    />
  </div>
</template>

<script setup>
import AnimatedTitle from '~/components/AnimatedTitle.vue';
import { useCartStore } from '~/stores/cart';
const cart = useCartStore();
const supabase = useSupabaseClient();
const products = ref([]);
const categories = ref([]);
const selectedCategory = ref('all');

const formatCurrency = (value) => (typeof value === 'number' ? value.toFixed(2) : '0.00');

const showAddToCartModal = ref(false);
const selectedProductForModal = ref(null);

const openAddToCartModal = (product) => {
  selectedProductForModal.value = product;
  showAddToCartModal.value = true;
};

const handleProductAdded = () => {
  showAddToCartModal.value = false;
  selectedProductForModal.value = null;
};

const { data: pageData } = await useAsyncData('products-page', async () => {
  const [productsRes, categoriesRes] = await Promise.all([
    supabase.from('products').select('*, product_variations(*)'),
    supabase.from('categories').select('*')
  ]);
  return { products: productsRes.data, categories: categoriesRes.data };
});
if (pageData.value) {
  products.value = pageData.value.products;
  categories.value = pageData.value.categories;
}
const filteredProducts = computed(() => {
  if (selectedCategory.value === 'all') return products.value;
  return products.value.filter(product => product.category_id === selectedCategory.value);
});

const calculateTotalStock = (product) => {
  if (product.product_variations && product.product_variations.length > 0) {
    return product.product_variations.reduce((sum, variation) => sum + variation.stock, 0);
  } else {
    return product.stock;
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 1rem auto;
  padding: 0 1rem;
}
.container > *:first-child {
  margin-bottom: 2rem;
}
.filters {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}
.filters button {
  background-color: #333;
  border: 1px solid #555;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
}
.filters button.active {
  background-color: #007bff;
  border-color: #007bff;
}
.product-grid { 
  display: grid; 
  grid-template-columns: repeat(2, 1fr); 
  gap: 1rem; 
}
.product-card-link {
  text-decoration: none;
  color: inherit;
}
.product-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); /* Sombra más suave */
}
.image-container {
  width: 100%;
  aspect-ratio: 1 / 1; 
  background-color: var(--color-background); /* Fondo gris claro */
}
.product-card img {
  width: 100%;
  height: 100%;
  object-fit: cover; 
}
.card-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.card-content h2 {
  color: var(--color-text-primary);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 0.5rem;
}
.stock {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}
.stock svg {
  flex-shrink: 0;
}
.price-action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto; 
}
.price {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--color-success);
  margin: 0;
}
.quick-add-btn {
  background-color: var(--color-primary);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.quick-add-btn:hover {
  background-color: #0056b3;
  transform: scale(1.1);
}
@media (min-width: 768px) {
  .container { padding: 0 2rem; }
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
    gap: 2rem;
  }
}
</style>