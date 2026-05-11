<template>
  <div>
    <img v-if="imagetStore.imageData" :src="imagetStore.imageData" alt="Flat Image" />
    <FlatHistogram />
  </div>
</template>

<script setup>
import { useImagetStore } from '@/store/imageStore';
import FlatHistogram from './FlatHistogram.vue';

const imagetStore = useImagetStore();
</script>
