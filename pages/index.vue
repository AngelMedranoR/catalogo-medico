<template>
  <div>
    <HeroSlider />

    <section class="featured-products">
      <h2>Nuestros Productos Destacados</h2>
      <div class="featured-grid">
        <div 
          v-for="product in products" 
          :key="product.id"
          class="product-card"
        >
          <NuxtLink :to="`/productos/${product.slug}`" class="product-main-link">
            <div class="image-container">
              <img :src="product.image_url" :alt="product.name" />
              <div class="hover-overlay">
                <span>Ver Detalles</span>
              </div>
            </div>
            <div class="card-content">
              <h3>{{ product.name }}</h3>
            </div>
          </NuxtLink>
          
          <div class="price-action-row">
            <p class="price">{{ formatCurrency(product.price) }}$</p>
            <button class="quick-add-btn" @click="quickAddToCart(product)" title="Añadir al carrito">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M9 5.5a.5.5 0 0 0-1 0V7H6.5a.5.5 0 0 0 0 1H8v1.5a.5.5 0 0 0 1 0V8h1.5a.5.5 0 0 0 0-1H9V5.5z"/>
                <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.401 1.607 1.498 7.985A.5.5 0 0 0 4 12h1a2 2 0 1 0 0 4 2 2 0 0 0 0-4h7a2 2 0 1 0 0 4 2 2 0 0 0 0-4h1a.5.5 0 0 0 .491-.408l1.5-8A.5.5 0 0 0 14.5 3H2.89l-.405-1.621A.5.5 0 0 0 2 1H.5zm3.915 10L3.102 4h10.796l-1.313 7h-8.17zM6 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm7 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import HeroSlider from '~/components/HeroSlider.vue';
import { useCartStore } from '~/stores/cart';
const cart = useCartStore();

const supabase = useSupabaseClient();
const products = ref([]);

const formatCurrency = (value) => (typeof value === 'number' ? value.toFixed(2) : '0.00');

const quickAddToCart = (product) => {
  cart.addToCart(product, 1);
  alert(`${product.name} ha sido añadido al carrito.`);
};

const { data } = await useAsyncData('featuredProducts', async () => {
  const { data } = await supabase
    .from('products')
    // Se ha eliminado 'tags' de la consulta
    .select('id, name, slug, image_url, price, stock')
    .limit(8);
  return data;
});

if (data.value) {
  products.value = data.value;
}
</script>

<style scoped>
.featured-products {
  max-width: 1200px;
  margin: 4rem auto;
  padding: 0 1rem;
}

.featured-products h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  font-weight: 700;
}

.featured-grid {
  display: grid;
  /* Por defecto, 2 columnas en móvil */
  grid-template-columns: repeat(2, 1fr); 
  gap: 1.5rem;
}

.product-card {
  background-color: var(--color-surface);
  border: 2px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.product-main-link {
  text-decoration: none;
  color: inherit;
}

.image-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background-color: var(--color-background);
}

.product-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover img {
  transform: scale(1.1);
}

.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.product-card:hover .hover-overlay {
  opacity: 1;
}

.card-content {
  padding: 1rem 1rem 0; /* Menos padding abajo */
  flex-grow: 1;
}

.card-content h3 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  color: var(--color-text-primary);
}


.price-action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem 1rem;
}

.price {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--color-success);
}

.quick-add-btn {
  background-color: #007bff;
  border: none;
  background-color: var(--color-primary);
  width: 36px;
  height: 36px;
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
  .featured-products {
    padding: 0 2rem;
  }
  .featured-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
    gap: 2rem;
  }
}
</style>