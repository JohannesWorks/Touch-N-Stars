<template>
  <div class="container py-16 flex items-center justify-center">
    <div class="container max-w-md landscape:max-w-xl">
      <h5 class="text-xl text-center font-bold text-white mb-4">Weather Station</h5>
      <div
        class="mt-4 border border-gray-700 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 shadow-lg p-5"
      >
        <div class="text-white">
          <p>Temperature: {{ temperature }}°C</p>
          <p>Humidity: {{ humidity }}%</p>
          <p>Cloud Coverage: {{ cloudCoverage }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { apiStore } from '@/store/store';

const store = apiStore();
const temperature = ref(15);
const humidity = ref(65);
const cloudCoverage = ref(25);
</script>
