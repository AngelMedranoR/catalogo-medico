<template>
  <div v-if="slides && slides.length > 0" class="hero-slider">
    <ClientOnly>
      <Swiper
        :modules="[Autoplay]"
        :slides-per-view="1"
        :loop="true"
        :autoplay="{ delay: 5000, disableOnInteraction: false }"
      >
        <SwiperSlide v-for="slide in slides" :key="slide.id">
          <div class="slide-background" :style="{ backgroundImage: `url(${slide.image_url})` }"></div>
          <div class="slide-content">
            <div class="overlay"></div>
            <div class="title-container">
              <component :is="animationComponents[slide.animation_style]" :title="slide.title" />
            </div>
          </div>
        </SwiperSlide>
      </Swiper>
    </ClientOnly>
  </div>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue';
// Se importa únicamente el módulo que se está usando
import { Autoplay } from 'swiper/modules';
import 'swiper/css';

import StyleOne from './animations/StyleOne.vue';
import StyleTwo from './animations/StyleTwo.vue';
import StyleThree from './animations/StyleThree.vue';
import StyleFour from './animations/StyleFour.vue';
import StyleFive from './animations/StyleFive.vue';

const animationComponents = {
  style_one: StyleOne,
  style_two: StyleTwo,
  style_three: StyleThree,
  style_four: StyleFour,
  style_five: StyleFive,
};

const supabase = useSupabaseClient();

// Usando el método directo y robusto para obtener los datos
const { data: slides } = await useAsyncData('heroSlides', async () => {
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('order_index');
  if (error) {
    console.error('Error fetching slides:', error);
    return [];
  }
  return data;
});
</script>

<style scoped>
/* TUS ESTILOS SE MANTIENEN INTACTOS */
.hero-slider, .slide-content {
  height: 70vh;
  width: 100%;
  position: relative;
}

.slide-content {
  position: relative;
  display: flex;
  z-index: 10;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  color: #fff;
  text-align: center;
}

.slide-background {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

:deep(.swiper-slide) {
  position: relative;
  z-index: 2;
}

.overlay {
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.title-container {
  font-family: "Montserrat", sans-serif;
  font-weight: 900;
  font-size: 60px;
  color: #fff;
  text-transform: uppercase;
}

@media (max-width: 767px) {
  .title-container {
    font-size: 1.8rem;
    width: 90%;
    text-align: center;
    white-space: normal;
    overflow-wrap: break-word;
    word-break: break-word;
  }
}
</style>