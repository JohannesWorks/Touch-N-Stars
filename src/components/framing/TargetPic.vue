<template>
  <div class="container flex items-center justify-center">
    <div class="container max-w-md">
      <img
        class="rounded-md"
        v-if="targetPic"
        :src="targetPic"
        alt="Bild konnte nicht geladen werden"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import apiService from '@/services/apiService';
import { useFramingStore } from '@/store/framingStore';

const framingStore = useFramingStore();
const targetPic = ref(null);

async function getTargetPic() {
  try {
    const ra = framingStore.RAangle;
    const dec = framingStore.DECangle;
    const useCache = framingStore.useNinaCache;
    console.log('Bild wird abgerufen', 'RA: ', ra, 'DEC: ', useCache);
    if (targetPic.value) {
      URL.revokeObjectURL(targetPic.value);
    }
    targetPic.value = await apiService.searchTargetPic(200, 200, 2, ra, dec, useCache);
    console.log('Load TargestPic');
  } catch (error) {
    console.error('Fehler beim Abrufen des Bildes:', error);
  }
}

function loadImage() {
  getTargetPic();
}

// Beobachte Änderungen an RAangleString und DECangleString
watch(() => framingStore.RAangle, loadImage);
watch(() => framingStore.DECangle, loadImage);

// Lade das Bild beim Mounten der Komponente
onMounted(() => {
  loadImage();
});
</script>

<style scoped></style>
