<template>
    <div v-if="!store.sequenceIsLoaded" class="text-red-500">
        <p>Keine Sequenz geladen</p>
    </div>
    <div v-else class="flex items-center justify-center w-full">
        <div class="flex flex-col gap-1 sm:flex-row sm:space-x-4 ">
            <button class="default-button-cyan min-w-40" @click="startSequence">
                Starte Sequenz
            </button>
            <button class="default-button-orange min-w-40" @click="stopSequence">
                Stoppe Sequenz
            </button>
            <button class="default-button-red min-w-40" @click="resetSequence">
                Reset Sequenz
            </button>
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import apiService from '@/services/apiService';
import { apiStore } from '@/store/store'

// Initialisiere Stores
const store = apiStore()

async function startSequence() {
    try {
        const data = apiService.sequenceAction("start");
        console.log("Antwort:", data);
    } catch (error) {
        console.log("Fehler:", error);
    }
}

async function stopSequence() {
    try {
        const data = apiService.sequenceAction("stop");
        console.log("Antwort:", data);
    } catch (error) {
        console.log("Fehler:", error);
    }
}

async function resetSequence() {
    try {
        const data = apiService.sequenceAction("reset");
        console.log("Antwort:", data);
    } catch (error) {
        console.log("Fehler:", error);
    }
}

onMounted(async () => {

});
</script>
