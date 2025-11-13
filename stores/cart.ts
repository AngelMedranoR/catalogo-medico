// stores/cart.ts
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
  }),
  getters: {
    // Getter para el número total de bultos
    totalItems: (state) => {
      return state.items.reduce((total, item) => total + item.quantity, 0)
    },
    // Getter para los items del carrito
    cartItems: (state) => state.items,

    // --- GETTER CORREGIDO Y AÑADIDO ---
    // Calcula el precio total multiplicando cantidad por precio de cada item
    totalPrice: (state) => {
      return state.items.reduce((total, item) => {
        // Asegurarnos de que el precio es un número
        const price = Number(item.price) || 0;
        return total + (item.quantity * price);
      }, 0);
    },
  },
  actions: {
    addToCart(product, quantity = 1, reference = null, itemPrice) {
      // Determine if this product is a 'venda' (bundle of 100 unidades)
      const lowerName = (product && product.name) ? String(product.name).toLowerCase() : '';
      const lowerCategory = (product && product.category && product.category.name) ? String(product.category.name).toLowerCase() : '';
      // Si el producto o la categoría contiene 'varizen', no se trata como bulto (se vende por unidad)
      const isVarizen = lowerName.includes('varizen') || lowerCategory.includes('varizen');
      const isVenda = !isVarizen && (lowerName.includes('venda') || lowerCategory.includes('vendas'));

      // If it's a "venda", the provided price is assumed to be unitario;
      // store the price per bulto (100 unidades) so totalPrice calculation remains simple.
      const priceToStore = isVenda ? (Number(itemPrice || 0) * 100) : (Number(itemPrice || 0));

      const existingItem = this.items.find(item => 
        item.product.id === product.id && item.reference === reference
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        this.items.push({ product, quantity, reference, price: priceToStore });
      }
    },
    removeFromCart(productId) {
      this.items = this.items.filter(item => item.product.id !== productId)
    },
    clearCart() {
      this.items = []
    },

    // --- ACCIONES AÑADIDAS ---
    increaseQuantity(productId) {
      const item = this.items.find(item => item.product.id === productId);
      if (item) {
        item.quantity++;
      }
    },
    decreaseQuantity(productId) {
      const item = this.items.find(item => item.product.id === productId);
      // Solo disminuimos si la cantidad es mayor a 1
      if (item && item.quantity > 1) {
        item.quantity--;
      }
    },
  },
})