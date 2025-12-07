<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCartStore } from '~/stores/cart';

const cart = useCartStore();
onMounted(() => {
  // Normalizar el carrito al iniciar la aplicación (corregir items antiguos)
  if (cart && typeof cart.initCart === 'function') {
    cart.initCart();
  }
});
</script>