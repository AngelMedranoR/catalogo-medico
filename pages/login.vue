<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Acceso de Administrador</h1>
      <form @submit.prevent="handleLogin">
        <input type="email" v-model="email" placeholder="Correo electrónico" required />
        <input type="password" v-model="password" placeholder="Contraseña" required />
        <button type="submit">Iniciar Sesión</button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref('');
const password = ref('');
const errorMessage = ref(null);

const handleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
    // Si el login es exitoso, redirige al panel
    router.push('/admin');
  // dentro de la función handleLogin en pages/login.vue

} catch (error) {
  console.error('Error específico de Supabase:', error.message); // <-- AÑADE ESTA LÍNEA
  errorMessage.value = 'Correo o contraseña incorrectos.';
}
  
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}
.login-box {
  background-color: #1e1e1e;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #333;
  width: 350px;
  text-align: center;
}
input {
  width: 100%;
  padding: 10px;
  margin-bottom: 1rem;
  background-color: #333;
  border: 1px solid #555;
  color: #fff;
  border-radius: 4px;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  border: none;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}
.error {
  color: #ff4d4d;
  margin-top: 1rem;
}
</style>