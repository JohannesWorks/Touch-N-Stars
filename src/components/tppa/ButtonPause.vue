<template>
  <button class="default-button-cyan p-1" @click="pausResume">
    <PauseIcon class="w-full h-full" v-show="!tppaStore.isPause" />
    <PlayIcon class="w-full h-full" v-show="tppaStore.isPause" />
  </button>
</template>
<script setup>
import websocketService from '@/services/websocketTppa';
import { useTppaStore } from '@/store/tppaStore';
import { PauseIcon, PlayIcon } from '@heroicons/vue/24/outline';

const tppaStore = useTppaStore();

async function pausResume() {
  if (tppaStore.isPause) {
    //websocketService.sendMessage('resume-alignment');
    websocketService.sendMessage(
      JSON.stringify({
        Action: 'resume-alignment',
      })
    );
    console.log('Press resume');
    tppaStore.isPause = false;
  } else {
    //websocketService.sendMessage('pause-alignment');
    websocketService.sendMessage(
      JSON.stringify({
        Action: 'pause-alignment',
      })
    );
    tppaStore.isPause = true;
    console.log('Press Pause');
  }
}
</script>
