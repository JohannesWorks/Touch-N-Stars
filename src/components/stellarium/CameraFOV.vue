<template>
  <div
    v-if="isVisible"
    class="fixed bg-black bg-opacity-90 p-4 rounded-lg shadow-lg text-white z-50"
    :style="modalPosition"
  >
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold">{{ $t('stellarium.cameraFOV.title') }}</h3>
      <button @click="closeModal" class="text-gray-400 hover:text-white">
        <XMarkIcon class="w-6 h-6" />
      </button>
    </div>

    <!-- FOV Preset Buttons -->
    <div class="grid grid-cols-2 gap-2 mb-4">
      <button
        v-for="preset in presets"
        :key="preset.name"
        @click="applyPreset(preset)"
        class="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm border border-cyan-600 transition-colors"
      >
        {{ preset.name }}
      </button>
    </div>

    <!-- Custom FOV Settings -->
    <div class="space-y-3">
      <div>
        <label class="block text-sm mb-1">{{ $t('stellarium.cameraFOV.width') }} (°)</label>
        <input
          v-model.number="width"
          type="number"
          min="0.5"
          max="120"
          step="0.5"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-600"
        />
      </div>

      <div>
        <label class="block text-sm mb-1">{{ $t('stellarium.cameraFOV.height') }} (°)</label>
        <input
          v-model.number="height"
          type="number"
          min="0.5"
          max="120"
          step="0.5"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-600"
        />
      </div>

      <div>
        <label class="block text-sm mb-1">{{ $t('stellarium.cameraFOV.label') }}</label>
        <input
          v-model="label"
          type="text"
          maxlength="50"
          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-600"
        />
      </div>

      <!-- Color Picker -->
      <div>
        <label class="block text-sm mb-1">{{ $t('stellarium.cameraFOV.color') }}</label>
        <div class="flex gap-2">
          <button
            v-for="color in colors"
            :key="color.name"
            @click="selectedColor = color"
            :class="[
              'w-10 h-10 rounded-lg border-2 transition-all',
              selectedColor === color ? 'border-white scale-110' : 'border-gray-600',
            ]"
            :style="{ backgroundColor: color.hex }"
          />
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-2 mt-4">
        <button
          @click="addFOV"
          class="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold transition-colors"
        >
          {{ activeFOV ? $t('stellarium.cameraFOV.update') : $t('stellarium.cameraFOV.add') }}
        </button>
        <button
          v-if="activeFOV"
          @click="removeFOV"
          class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
        >
          {{ $t('stellarium.cameraFOV.remove') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useStellariumStore } from '@/store/stellariumStore';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const stellariumStore = useStellariumStore();

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  position: {
    type: String,
    default: 'right',
  },
});

const emit = defineEmits(['close']);

// FOV Settings
const width = ref(15);
const height = ref(10);
const label = ref('Camera FOV');
const activeFOV = ref(null);

// Color presets
const colors = [
  { name: 'Blue', hex: '#4D9FFF', rgba: [0.3, 0.62, 1.0] },
  { name: 'Green', hex: '#50C878', rgba: [0.31, 0.78, 0.47] },
  { name: 'Red', hex: '#FF6B6B', rgba: [1.0, 0.42, 0.42] },
  { name: 'Yellow', hex: '#FFD93D', rgba: [1.0, 0.85, 0.24] },
  { name: 'Purple', hex: '#B565D8', rgba: [0.71, 0.4, 0.85] },
];
const selectedColor = ref(colors[0]);

// Camera/Lens presets
const presets = [
  { name: '50mm (FF)', width: 27, height: 18, label: '50mm Full Frame' },
  { name: '85mm (FF)', width: 16, height: 11, label: '85mm Full Frame' },
  { name: '200mm (FF)', width: 6.9, height: 4.6, label: '200mm Full Frame' },
  { name: '14mm (FF)', width: 81, height: 60, label: '14mm Wide Angle' },
  { name: '35mm (APS-C)', width: 26.5, height: 17.7, label: '35mm APS-C' },
  { name: '50mm (APS-C)', width: 18.7, height: 12.5, label: '50mm APS-C' },
];

// Modal position
const modalPosition = computed(() => {
  const baseStyle = { maxWidth: '320px' };

  if (props.position === 'right') {
    return { ...baseStyle, top: '60px', right: '10px' };
  } else if (props.position === 'left') {
    return { ...baseStyle, top: '60px', left: '10px' };
  } else {
    return { ...baseStyle, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }
});

// Constants
const DD2R = Math.PI / 180.0;

// Apply preset
const applyPreset = (preset) => {
  width.value = preset.width;
  height.value = preset.height;
  label.value = preset.label;
};

// Add or update FOV
const addFOV = () => {
  if (!stellariumStore.stel) {
    console.error('Stellarium not initialized');
    return;
  }

  try {
    // Remove existing FOV if any
    if (activeFOV.value) {
      stellariumStore.stel.core.remove(activeFOV.value);
      activeFOV.value = null;
    }

    // Get current view center position
    // Use a fixed position in the center of the sky (zenith by default)
    // User can adjust by moving the view before adding the FOV

    // Default to zenith position in observed frame
    // This creates a valid position vector [x, y, z, w] where w=0 means at infinity
    const pos = [0, 0, 1, 0]; // Pointing straight up (zenith)

    // Create camera FOV object
    const fov = stellariumStore.stel.createObj('camera_fov');

    // Set properties individually
    fov.pos = pos;
    fov.size = [width.value * DD2R, height.value * DD2R];
    fov.label = label.value;
    fov.color = [...selectedColor.value.rgba, 0.15]; // Add alpha for transparency
    fov.border_color = [...selectedColor.value.rgba, 0.8]; // Add alpha for border
    fov.frame = 2; // FRAME_OBSERVED (azimuthal frame)

    // Add to core as a child object
    stellariumStore.stel.core.add(fov);
    activeFOV.value = fov;

    console.log('Camera FOV added:', {
      width: width.value,
      height: height.value,
      label: label.value,
    });
  } catch (error) {
    console.error('Error creating camera FOV:', error);
  }
};

// Remove FOV
const removeFOV = () => {
  if (activeFOV.value && stellariumStore.stel) {
    stellariumStore.stel.core.remove(activeFOV.value);
    activeFOV.value = null;
    console.log('Camera FOV removed');
  }
};

// Close modal
const closeModal = () => {
  emit('close');
};

// Watch for Stellarium initialization
watch(
  () => stellariumStore.stel,
  (newStel) => {
    if (newStel) {
      console.log('Stellarium initialized, Camera FOV ready');
    }
  }
);
</script>

<style scoped>
/* Custom scrollbar for the modal */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  opacity: 1;
}
</style>
