<template>
  <div class="container">
    <div v-if="cart.totalItems > 0" class="cart-layout">
      <div class="order-summary">
        <div class="cart-header">
          <span class="cart-icon">🛒</span>
          <h1>Resumen del Pedido</h1>
        </div>
        <div v-for="item in cart.cartItems" :key="item.product.id" class="cart-item">
          <img :src="item.product.image_url" :alt="item.product.name" class="item-image" />
          <div class="item-details">
            <p class="item-name">{{ item.product.name }}</p>
            <p class="item-price">Bs. {{ formatCurrency(item.product.price) }}</p>
          </div>
          <div class="quantity-selector">
            <button @click="cart.decreaseQuantity(item.product.id)">-</button>
            <span>{{ item.quantity }}</span>
            <button @click="cart.increaseQuantity(item.product.id)">+</button>
          </div>
          <p class="item-total">Bs. {{ formatCurrency(item.product.price * item.quantity) }}</p>
          <button @click="cart.removeFromCart(item.product.id)" class="remove-button">×</button>
        </div>
      </div>
      
      <div class="checkout-summary">
        <h2>Total del Carrito</h2>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>Bs. {{ formatCurrency(cart.totalPrice) }}</span>
        </div>
        <div class="summary-row total-row">
          <span>Total:</span>
          <span>Bs. {{ formatCurrency(cart.totalPrice) }}</span>
        </div>
        <button @click="showCheckoutModal = true" class="checkout-button">
          Proceder con el pedido
        </button>
      </div>
    </div>
    
    <div v-else class="empty-cart">
      <h2>Tu carrito está vacío.</h2>
      <NuxtLink to="/productos" class="shop-link">Ir a la tienda</NuxtLink>
    </div>

    <CheckoutModal 
      v-if="showCheckoutModal" 
      @close="showCheckoutModal = false"
      @submit-order="sendOrderToWhatsApp"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCartStore } from '~/stores/cart';
import CheckoutModal from '~/components/CheckoutModal.vue'; // Importa el nuevo componente

const cart = useCartStore();
const showCheckoutModal = ref(false);

const formatCurrency = (value) => (typeof value === 'number' ? value.toFixed(2) : '0.00');

const sendOrderToWhatsApp = (customerInfo) => {
  const phoneNumber = '584148545150'; // <-- IMPORTANTE: Reemplaza con tu número
  let message = `*¡Nuevo Pedido de Gaventex!* 🛍️\n\n`;
  message += `*--- Resumen del Pedido ---*\n`;

  cart.cartItems.forEach(item => {
    message += `• ${item.product.name} (x${item.quantity}) - Bs. ${formatCurrency(item.product.price * item.quantity)}\n`;
  });
  
  message += `\n*Total del Pedido: Bs. ${formatCurrency(cart.totalPrice)}*\n\n`;
  message += `*--- Datos del Cliente ---*\n`;
  message += `*Nombre:* ${customerInfo.firstName} ${customerInfo.lastName}\n`;
  message += `*Cédula:* ${customerInfo.cedula}\n`;
  message += `*Teléfono:* ${customerInfo.phone}\n`;
  message += `*Método de Entrega:* ${customerInfo.deliveryMethod}\n`;
  message += `*Método de Pago:* ${customerInfo.paymentMethod}\n\n`;
  message += `¡Gracias!`;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  
  window.open(whatsappUrl, '_blank');
  
  // Limpiar el carrito y cerrar el modal después de enviar
  cart.clearCart();
  showCheckoutModal.value = false;
};

// Asegúrate de que tu store de Pinia tenga estos métodos
// (addToCart, removeFromCart, clearCart, decreaseQuantity, increaseQuantity)
// y el getter totalPrice.
</script>

<style scoped>
.container { 
  max-width: 1200px; 
  margin: 2rem auto; 
  padding: 0 1rem; 
}

.cart-layout { 
  display: grid; 
  grid-template-columns: 2fr 1fr; 
  gap: 2rem; 
  align-items: flex-start; 
}

.order-summary, .checkout-summary { 
  background-color: var(--color-surface);
  padding: 2rem; 
  border-radius: 12px; 
  border: 1px solid var(--color-border);
}

.cart-header { 
  display: flex; 
  align-items: center; 
  gap: 1rem; 
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem; 
  margin-bottom: 1rem; 
}

.cart-icon { font-size: 2rem; }
h1, h2 { margin: 0; color: var(--color-text-primary); }

.cart-item { 
  display: grid; 
  /* Estructura simplificada: Imagen | Información | Botón de borrar */
  grid-template-columns: auto 1fr auto; 
  align-items: center; 
  gap: 1rem; 
  padding: 1.5rem 0; 
  border-bottom: 1px solid var(--color-border);
}

.item-image { 
  width: 80px; 
  height: 80px; 
  object-fit: cover; 
  border-radius: 8px; 
}

.item-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  height: 100%;
}

.info-top .item-name { 
  font-weight: bold; 
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.info-top .item-price { 
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.info-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-selector { 
  display: flex; 
  align-items: center; 
  gap: 0.8rem; 
}

.quantity-selector button { 
  width: 30px; 
  height: 30px; 
  border-radius: 50%; 
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text-secondary);
  cursor: pointer; 
}

.item-total {
  font-weight: bold;
}

.remove-button { 
  background: none; 
  border: none; 
  color: var(--color-text-secondary);
  font-size: 1.5rem; 
  cursor: pointer; 
  padding: 0.5rem;
}

.summary-row { 
  display: flex; 
  justify-content: space-between; 
  margin-bottom: 1rem; 
  color: var(--color-text-secondary); /* CAMBIO */
}

.total-row { 
  font-weight: bold; 
  font-size: 1.2rem; 
  border-top: 1px solid var(--color-border); /* CAMBIO */
  padding-top: 1rem; 
  color: var(--color-text-primary); /* CAMBIO */
}

.checkout-button { 
  width: 100%; 
  padding: 12px; 
  background-color: var(--color-primary); /* CAMBIO */
  color: #fff; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 1.1rem; 
  margin-top: 1rem; 
}

.empty-cart { 
  text-align: center; 
  padding: 4rem; 
}

.shop-link { 
  background-color: var(--color-primary); /* CAMBIO */
  color: #fff; 
  padding: 1rem 2rem; 
  border-radius: 8px; 
  text-decoration: none; 
}

@media (max-width: 900px) {
  .cart-layout { grid-template-columns: 1fr; }
}

/* LA CLAVE: Media Query para móviles pequeños */
@media (max-width: 600px) {
  .cart-item {
    grid-template-columns: auto 1fr; /* Imagen | (Info y Botón de borrar) */
    gap: 0.8rem;
  }
  .remove-button {
    grid-column: 2; /* Mueve el botón de borrar a la segunda columna */
    justify-self: end; /* Lo alinea a la derecha */
    padding-top: 0;
  }
  .info-bottom {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>