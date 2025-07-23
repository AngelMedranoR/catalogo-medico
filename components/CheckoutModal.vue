<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-button" @click="$emit('close')">×</button>
      
      <div v-if="step === 1">
        <h2>Completa tus Datos</h2>
        <form @submit.prevent="goToConfirmation">
          <div class="form-group">
            <label>Método de Entrega</label>
            <select v-model="formData.deliveryMethod" required>
              <option disabled value="">Selecciona una opción</option>
              <option>Envío Nacional</option>
              <option>Delivery</option>
              <option>Retiro en Tienda</option>
            </select>
          </div>
          <div class="form-group">
            <label>Nombre y Apellido</label>
            <div class="inline-inputs">
              <input type="text" v-model="formData.firstName" placeholder="Nombre" required />
              <input type="text" v-model="formData.lastName" placeholder="Apellido" required />
            </div>
          </div>
          <div class="form-group">
            <label>Cédula y Teléfono</label>
            <div class="inline-inputs">
              <input type="text" v-model="formData.cedula" placeholder="Cédula de Identidad" required />
              <input type="tel" v-model="formData.phone" placeholder="Teléfono" required />
            </div>
          </div>
          <div class="form-group">
            <label>Método de Pago</label>
            <select v-model="formData.paymentMethod" required>
              <option disabled value="">Selecciona una opción</option>
              <option>Zelle</option>
              <option>Pago Móvil</option>
              <option>Divisas (Efectivo)</option>
              <option>Binance</option>
            </select>
          </div>
          <button type="submit" class="submit-button">Continuar a Confirmación</button>
        </form>
      </div>

      <div v-if="step === 2">
        <h2>Confirma tu Pedido</h2>

        <div class="order-details">
          <h4>Productos en tu pedido:</h4>
          <div v-for="item in cart.cartItems" :key="item.product.id" class="product-row">
            <span>{{ item.product.name }} (x{{ item.quantity }})</span>
            <span>Bs. {{ formatCurrency(item.product.price * item.quantity) }}</span>
          </div>
          <div class="product-row total">
            <span>Total Productos:</span>
            <span>Bs. {{ formatCurrency(cart.totalPrice) }}</span>
          </div>
        </div>

        <h4>Tus datos de envío:</h4>
        <div class="confirmation-summary">
          <p><strong>Entrega:</strong> {{ formData.deliveryMethod }}</p>
          <p><strong>Nombre:</strong> {{ formData.firstName }} {{ formData.lastName }}</p>
          <p><strong>Cédula:</strong> {{ formData.cedula }}</p>
          <p><strong>Teléfono:</strong> {{ formData.phone }}</p>
          <p><strong>Pago:</strong> {{ formData.paymentMethod }}</p>
        </div>
        <div class="confirmation-actions">
          <button @click="step = 1" class="back-button">Volver y Editar</button>
          <button @click="submitOrder" class="submit-button">Confirmar y Enviar por WhatsApp</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useCartStore } from '~/stores/cart';

const emit = defineEmits(['close', 'submit-order']);
const cart = useCartStore();
const step = ref(1);

const formData = reactive({
  deliveryMethod: '',
  firstName: '',
  lastName: '',
  cedula: '',
  phone: '',
  paymentMethod: '',
});

const goToConfirmation = () => {
  step.value = 2;
};

const submitOrder = () => {
  emit('submit-order', formData);
};

const formatCurrency = (value) => (typeof value === 'number' ? value.toFixed(2) : '0.00');
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* CAMBIO */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.modal-content {
  background-color: var(--color-surface); /* CAMBIO */
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  position: relative;
  border: 1px solid var(--color-border); /* CAMBIO */
}
.close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: var(--color-text-secondary); /* CAMBIO */
  font-size: 1.5rem;
  cursor: pointer;
}
h2, h4 {
  margin-top: 0;
  text-align: center;
  color: var(--color-text-primary); /* CAMBIO */
}
h4 {
  margin-top: 1.5rem;
  color: var(--color-text-secondary); /* CAMBIO */
  border-bottom: 1px solid var(--color-border); /* CAMBIO */
  padding-bottom: 0.5rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary); /* CAMBIO */
}
input, select {
  width: 100%;
  padding: 10px;
  background-color: #fff; /* CAMBIO */
  border: 1px solid var(--color-border); /* CAMBIO */
  color: var(--color-text-primary); /* CAMBIO */
  border-radius: 8px;
  font-size: 1rem;
}
.inline-inputs {
  display: flex;
  gap: 1rem;
}
.order-details {
  background-color: var(--color-background); /* CAMBIO */
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--color-border);
}
.product-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: var(--color-text-secondary); /* CAMBIO */
}
.product-row span:last-child {
  font-weight: 500;
  color: var(--color-text-primary); /* CAMBIO */
}
.product-row.total {
  font-weight: bold;
  font-size: 1.1rem;
  border-top: 1px solid var(--color-border); /* CAMBIO */
  margin-top: 0.5rem;
  color: var(--color-text-primary); /* CAMBIO */
}
.confirmation-summary p {
  background-color: var(--color-background); /* CAMBIO */
  border: 1px solid var(--color-border);
  padding: 0.8rem;
  border-radius: 8px;
  margin: 0.5rem 0;
  display: flex;
  justify-content: space-between;
}
.confirmation-summary p strong {
  color: var(--color-text-secondary); /* CAMBIO */
}
.confirmation-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
.submit-button {
  width: 100%;
  padding: 12px;
  background-color: var(--color-primary); /* CAMBIO */
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
}
.back-button {
  flex-grow: 1;
  padding: 12px;
  background-color: var(--color-text-secondary); /* CAMBIO */
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
}
</style>