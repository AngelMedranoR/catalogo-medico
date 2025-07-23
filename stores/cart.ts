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
        const price = Number(item.product.price) || 0;
        return total + (item.quantity * price);
      }, 0);
    },
  },
  actions: {
    addToCart(product, quantity = 1) {
      const existingItem = this.items.find(item => item.product.id === product.id)
      if (existingItem) {
        existingItem.quantity += quantity
      } else {
        this.items.push({ product, quantity })
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