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
    // Calcula el precio total teniendo en cuenta que las 'vendas'
    // (excepto las 'varizen') se venden: primer bulto = 50 unidades,
    // luego bultos de 100 unidades. `item.price` se almacena como precio por unidad.
    totalPrice: (state) => {
      return state.items.reduce((total, item) => {
        const unitPrice = Number(item.price) || 0;

        // Detectar si es venda (excluyendo varizen)
        const lowerName = (item.product && item.product.name) ? String(item.product.name).toLowerCase() : '';
        const lowerCategory = (item.product && item.product.category && item.product.category.name) ? String(item.product.category.name).toLowerCase() : '';
        const isVarizen = lowerName.includes('varizen') || lowerCategory.includes('varizen');
        const isVenda = !isVarizen && (lowerName.includes('venda') || lowerCategory.includes('vendas'));

        if (isVenda) {
          const qty = Number(item.quantity) || 0;
          if (qty <= 0) return total;
          const firstPack100 = item.firstPackIs100 === true;
          if (firstPack100) {
            const totalUnits = qty * 100;
            return total + (totalUnits * unitPrice);
          }
          // Unidades totales: primer bulto 50, luego (qty-1)*100
          const totalUnits = 50 + Math.max(0, qty - 1) * 100;
          return total + (totalUnits * unitPrice);
        }

        // Productos normales: quantity representa unidades/bultos según la lógica previa
        return total + (Number(item.quantity) * unitPrice);
      }, 0);
    },
  },
  actions: {
    addToCart(product, quantity = 1, reference = null, itemPrice, firstPackIs100 = false) {
      // Determine if this product is a 'venda' (bundle of 100 unidades)
      const lowerName = (product && product.name) ? String(product.name).toLowerCase() : '';
      const lowerCategory = (product && product.category && product.category.name) ? String(product.category.name).toLowerCase() : '';
      // Si el producto o la categoría contiene 'varizen', no se trata como bulto (se vende por unidad)
      const isVarizen = lowerName.includes('varizen') || lowerCategory.includes('varizen');
      const isVenda = !isVarizen && (lowerName.includes('venda') || lowerCategory.includes('vendas'));

      // Store the price as unit price (price per unidad). totalPrice will
      // compute bulto sizes for vendas (first 50, then 100s).
      const priceToStore = Number(itemPrice || 0);

      const existingItem = this.items.find(item => 
        item.product.id === product.id && item.reference === reference
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        // Actualizar la opción de primer bulto si se pasa explícitamente
        if (typeof firstPackIs100 === 'boolean') existingItem.firstPackIs100 = firstPackIs100;
      } else {
        this.items.push({ product, quantity, reference, price: priceToStore, firstPackIs100 });
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