<template>
  <div class="flex flex-col gap-3">
    <!-- Collapsed: Pattern string + Preview -->
    <template v-if="!showTokens">
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-400">{{
          $t('components.settings.imageFile.preview')
        }}</label>
        <div
          class="bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 font-mono text-xs text-cyan-300 break-all"
        >
          {{ previewResult || '—' }}
        </div>
      </div>
    </template>

    <!-- Expanded: Chips + Token buttons -->
    <template v-else>
      <!-- Pattern Chips -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <label class="text-xs text-gray-400">{{
            $t('components.settings.imageFile.pattern')
          }}</label>
          <button @click="showHelp = true" class="text-blue-500 hover:text-gray-300 p-1">
            <InformationCircleIcon class="w-5 h-5" />
          </button>
        </div>
        <div
          class="flex flex-wrap items-center bg-gray-900/50 border border-gray-700/50 rounded-lg px-1 py-2 min-h-[40px]"
        >
          <template v-if="patternSegments.length === 0">
            <button
              @click="setInsertPos(0)"
              class="cursor-insert"
              :class="{ 'cursor-active': insertPos === 0 }"
            />
          </template>
          <template v-else>
            <template v-for="(segment, index) in patternSegments" :key="index">
              <button
                @click="setInsertPos(index)"
                class="cursor-insert"
                :class="{ 'cursor-active': insertPos === index }"
              />
              <div
                class="flex items-center rounded text-xs font-mono"
                :class="segmentClass(segment)"
              >
                <span class="px-1.5 py-0.5">{{ segmentLabel(segment) }}</span>
                <button
                  @click="removeSegment(index)"
                  class="px-1 py-0.5 hover:text-red-400 transition-colors opacity-60 hover:opacity-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </template>
            <button
              @click="setInsertPos(patternSegments.length)"
              class="cursor-insert"
              :class="{ 'cursor-active': insertPos === patternSegments.length }"
            />
          </template>
        </div>
      </div>

      <!-- Preview -->
      <div class="flex flex-col gap-1">
        <label class="text-xs text-gray-400">{{
          $t('components.settings.imageFile.preview')
        }}</label>
        <div
          class="bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2 font-mono text-xs text-cyan-300 break-all"
        >
          {{ previewResult || '—' }}
        </div>
      </div>
    </template>

    <!-- Toggle edit -->
    <button
      @click="showTokens = !showTokens"
      class="flex items-center justify-between w-full text-xs text-gray-400 hover:text-gray-200 transition-colors"
    >
      <span>{{ $t('components.settings.imageFile.editTokens') }}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': showTokens }"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div v-if="showTokens" class="flex flex-col gap-2">
      <div v-for="group in tokenGroups" :key="group.label" class="flex flex-col gap-1">
        <label class="text-xs text-gray-500">{{ $t(group.label) }}</label>
        <div class="flex flex-wrap gap-1">
          <button
            v-for="token in group.tokens"
            :key="token.key"
            @click="addSegment(token.key)"
            class="px-2 py-1 text-xs rounded bg-gray-700/80 hover:bg-gray-600 text-gray-200 border border-gray-600/50 transition-colors"
          >
            {{ token.display }}
          </button>
        </div>
      </div>

      <!-- Separator buttons -->
      <div class="flex flex-wrap gap-1 mt-1">
        <button
          @click="addSegment('\\')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          / {{ $t('components.settings.imageFile.folder') }}
        </button>
        <button
          @click="addSegment('_')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          _ {{ $t('components.settings.imageFile.separator') }}
        </button>
        <button
          @click="addSegment('-')"
          class="px-3 py-1 text-xs rounded bg-amber-900/60 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 transition-colors font-mono"
        >
          - {{ $t('components.settings.imageFile.separator') }}
        </button>
      </div>

      <!-- Free Text Input -->
      <div class="flex flex-col gap-1 mt-2">
        <label class="text-xs text-gray-500">{{
          $t('components.settings.imageFile.freeText') || 'Free Text'
        }}</label>
        <div class="flex gap-1">
          <input
            v-model="freeTextInput"
            type="text"
            @keyup.enter="addFreeText"
            placeholder="Enter text..."
            class="flex-1 px-2 py-1 text-xs rounded bg-gray-800 border border-gray-600/50 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          <button
            @click="addFreeText"
            :disabled="!freeTextInput.trim()"
            class="px-3 py-1 text-xs rounded bg-green-900/60 hover:bg-green-800/60 disabled:bg-gray-700/40 disabled:text-gray-500 text-green-200 border border-green-700/50 disabled:border-gray-600/50 transition-colors"
          >
            {{ $t('components.settings.imageFile.addText') || 'Add' }}
          </button>
        </div>
      </div>

      <!-- Save Button -->
      <button
        @click="savePattern"
        class="default-button-cyan w-full mt-1"
        :class="{ 'glow-green': saveSuccess }"
        :disabled="saving"
      >
        {{ $t('components.settings.save') }}
      </button>
    </div>

    <!-- Help Modal -->
    <div
      v-if="showHelp"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <div class="bg-gray-800 text-white p-4 m-4 rounded-lg max-w-xl max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-3">
          <h2 class="text-lg font-bold">
            {{ $t('components.settings.imageFile.help.title') }}
          </h2>
          <button @click="showHelp = false" class="text-white hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <div class="space-y-3 text-sm text-gray-300">
          <p>{{ $t('components.settings.imageFile.help.intro') }}</p>

          <div>
            <h3 class="text-cyan-400 font-semibold mb-1">
              {{ $t('components.settings.imageFile.help.tokensTitle') }}
            </h3>
            <p>{{ $t('components.settings.imageFile.help.tokensDesc') }}</p>
          </div>

          <div>
            <h3 class="text-amber-400 font-semibold mb-1">
              {{ $t('components.settings.imageFile.help.separatorsTitle') }}
            </h3>
            <p>{{ $t('components.settings.imageFile.help.separatorsDesc') }}</p>
          </div>

          <div>
            <h3 class="text-cyan-400 font-semibold mb-1">
              {{ $t('components.settings.imageFile.help.cursorTitle') }}
            </h3>
            <p>{{ $t('components.settings.imageFile.help.cursorDesc') }}</p>
          </div>

          <div>
            <h3 class="text-cyan-400 font-semibold mb-1">
              {{ $t('components.settings.imageFile.help.exampleTitle') }}
            </h3>
            <code class="block bg-gray-900 rounded px-3 py-2 text-xs text-cyan-300 break-all">
              $$DATEMINUS12$$\$$IMAGETYPE$$\$$DATETIME$$_$$FILTER$$_$$EXPOSURETIME$$s
            </code>
            <p class="mt-1 text-xs text-gray-400">
              {{ $t('components.settings.imageFile.help.exampleResult') }}
            </p>
            <code class="block bg-gray-900 rounded px-3 py-1 text-xs text-green-300 break-all">
              2024-01-15\LIGHT\2024-01-15_21-30-00_Ha_300s
            </code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { apiStore } from '@/store/store';
import apiService from '@/services/apiService';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const store = apiStore();
const saving = ref(false);
const saveSuccess = ref(false);
const insertPos = ref(null); // null = append at end
const showHelp = ref(false);
const showTokens = ref(false);
const freeTextInput = ref('');

const defaultPattern =
  '$$DATEMINUS12$$\\$$IMAGETYPE$$\\$$DATETIME$$_$$FILTER$$_$$SENSORTEMP$$_$$EXPOSURETIME$$s_$$FRAMENR$$';

// Segments array - each element is a raw string piece (token or literal text)
const patternSegments = ref([]);

// All known token keys for parsing
const allTokenKeys = [
  '$$FILTER$$',
  '$$DATE$$',
  '$$DATEUTC$$',
  '$$DATEMINUS12$$',
  '$$DATETIME$$',
  '$$TIME$$',
  '$$TIMEUTC$$',
  '$$MJD$$',
  '$$FRAMENR$$',
  '$$IMAGETYPE$$',
  '$$BINNING$$',
  '$$SENSORTEMP$$',
  '$$TEMPERATURESETPOINT$$',
  '$$EXPOSURETIME$$',
  '$$TARGETNAME$$',
  '$$GAIN$$',
  '$$OFFSET$$',
  '$$RMS$$',
  '$$RMSARCSEC$$',
  '$$PEAKRA$$',
  '$$PEAKRAARCSEC$$',
  '$$PEAKDEC$$',
  '$$PEAKDECARCSEC$$',
  '$$FOCUSERPOSITION$$',
  '$$FOCUSERTEMP$$',
  '$$APPLICATIONSTARTDATE$$',
  '$$HFR$$',
  '$$SQM$$',
  '$$READOUTMODE$$',
  '$$USBLIMIT$$',
  '$$CAMERA$$',
  '$$TELESCOPE$$',
  '$$ROTATORANGLE$$',
  '$$STARCOUNT$$',
  '$$SEQUENCETITLE$$',
];

// Display names for tokens
const tokenDisplayNames = {
  $$FILTER$$: 'Filter',
  $$DATE$$: 'Date',
  $$DATEUTC$$: 'Date UTC',
  $$DATEMINUS12$$: 'Session Date',
  $$DATETIME$$: 'Date+Time',
  $$TIME$$: 'Time',
  $$TIMEUTC$$: 'Time UTC',
  $$MJD$$: 'MJD',
  $$FRAMENR$$: 'Frame #',
  $$IMAGETYPE$$: 'Type',
  $$BINNING$$: 'Bin',
  $$SENSORTEMP$$: 'Temp',
  $$TEMPERATURESETPOINT$$: 'Temp Set',
  $$EXPOSURETIME$$: 'Exposure',
  $$TARGETNAME$$: 'Target',
  $$GAIN$$: 'Gain',
  $$OFFSET$$: 'Offset',
  $$RMS$$: 'RMS',
  $$RMSARCSEC$$: 'RMS"',
  $$PEAKRA$$: 'PeakRA',
  $$PEAKRAARCSEC$$: 'PeakRA"',
  $$PEAKDEC$$: 'PeakDec',
  $$PEAKDECARCSEC$$: 'PeakDec"',
  $$FOCUSERPOSITION$$: 'Focuser Pos',
  $$FOCUSERTEMP$$: 'Focuser Temp',
  $$APPLICATIONSTARTDATE$$: 'App Start',
  $$HFR$$: 'HFR',
  $$SQM$$: 'SQM',
  $$READOUTMODE$$: 'Readout',
  $$USBLIMIT$$: 'USB Limit',
  $$CAMERA$$: 'Camera',
  $$TELESCOPE$$: 'Telescope',
  $$ROTATORANGLE$$: 'Rotator',
  $$STARCOUNT$$: 'Stars',
  $$SEQUENCETITLE$$: 'Sequence',
};

const tokenGroups = [
  {
    label: 'components.settings.imageFile.groups.dateTime',
    tokens: [
      { key: '$$DATE$$', display: 'Date' },
      { key: '$$DATEUTC$$', display: 'Date UTC' },
      { key: '$$DATEMINUS12$$', display: 'Session Date' },
      { key: '$$DATETIME$$', display: 'Date+Time' },
      { key: '$$TIME$$', display: 'Time' },
      { key: '$$TIMEUTC$$', display: 'Time UTC' },
      { key: '$$MJD$$', display: 'MJD' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.image',
    tokens: [
      { key: '$$IMAGETYPE$$', display: 'Type' },
      { key: '$$FILTER$$', display: 'Filter' },
      { key: '$$FRAMENR$$', display: 'Frame #' },
      { key: '$$EXPOSURETIME$$', display: 'Exposure' },
      { key: '$$BINNING$$', display: 'Bin' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.camera',
    tokens: [
      { key: '$$SENSORTEMP$$', display: 'Temp' },
      { key: '$$TEMPERATURESETPOINT$$', display: 'Temp Set' },
      { key: '$$GAIN$$', display: 'Gain' },
      { key: '$$OFFSET$$', display: 'Offset' },
      { key: '$$READOUTMODE$$', display: 'Readout' },
      { key: '$$USBLIMIT$$', display: 'USB Limit' },
      { key: '$$CAMERA$$', display: 'Camera' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.guiding',
    tokens: [
      { key: '$$RMS$$', display: 'RMS' },
      { key: '$$RMSARCSEC$$', display: 'RMS"' },
      { key: '$$PEAKRA$$', display: 'PeakRA' },
      { key: '$$PEAKRAARCSEC$$', display: 'PeakRA"' },
      { key: '$$PEAKDEC$$', display: 'PeakDec' },
      { key: '$$PEAKDECARCSEC$$', display: 'PeakDec"' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.equipment',
    tokens: [
      { key: '$$FOCUSERPOSITION$$', display: 'Focuser Pos' },
      { key: '$$FOCUSERTEMP$$', display: 'Focuser Temp' },
      { key: '$$TELESCOPE$$', display: 'Telescope' },
      { key: '$$ROTATORANGLE$$', display: 'Rotator' },
    ],
  },
  {
    label: 'components.settings.imageFile.groups.other',
    tokens: [
      { key: '$$TARGETNAME$$', display: 'Target' },
      { key: '$$SEQUENCETITLE$$', display: 'Sequence' },
      { key: '$$APPLICATIONSTARTDATE$$', display: 'App Start' },
      { key: '$$HFR$$', display: 'HFR' },
      { key: '$$SQM$$', display: 'SQM' },
      { key: '$$STARCOUNT$$', display: 'Stars' },
    ],
  },
];

// prettier-ignore
const exampleValues = {
  '$$FILTER$$': 'Ha',
  '$$DATE$$': '2024-01-15',
  '$$DATEUTC$$': '2024-01-15',
  '$$DATEMINUS12$$': '2024-01-15',
  '$$DATETIME$$': '2024-01-15_21-30-00',
  '$$TIME$$': '21-30-00',
  '$$TIMEUTC$$': '20-30-00',
  '$$MJD$$': '60324',
  '$$FRAMENR$$': '0001',
  '$$IMAGETYPE$$': 'LIGHT',
  '$$BINNING$$': '1x1',
  '$$SENSORTEMP$$': '-10',
  '$$TEMPERATURESETPOINT$$': '-10',
  '$$EXPOSURETIME$$': '300',
  '$$TARGETNAME$$': 'M31',
  '$$GAIN$$': '100',
  '$$OFFSET$$': '10',
  '$$RMS$$': '0.45',
  '$$RMSARCSEC$$': '0.68',
  '$$PEAKRA$$': '0.32',
  '$$PEAKRAARCSEC$$': '0.48',
  '$$PEAKDEC$$': '0.28',
  '$$PEAKDECARCSEC$$': '0.42',
  '$$FOCUSERPOSITION$$': '12500',
  '$$FOCUSERTEMP$$': '5',
  '$$APPLICATIONSTARTDATE$$': '2024-01-15',
  '$$HFR$$': '2.1',
  '$$SQM$$': '20.5',
  '$$READOUTMODE$$': '0',
  '$$USBLIMIT$$': '40',
  '$$CAMERA$$': 'ZWO ASI294MC Pro',
  '$$TELESCOPE$$': 'RC8',
  '$$ROTATORANGLE$$': '45',
  '$$STARCOUNT$$': '142',
  '$$SEQUENCETITLE$$': 'M31_Session',
};

/**
 * Parse a pattern string into segments.
 * Splits on $$TOKEN$$ boundaries, keeping tokens and literal text as separate segments.
 */
function parsePattern(patternString) {
  const segments = [];
  if (!patternString) return segments;

  // Build regex that matches any $$TOKEN$$
  const tokenPattern = /(\$\$[A-Z]+\$\$)/;
  const parts = patternString.split(tokenPattern).filter((p) => p !== '');

  for (const part of parts) {
    if (allTokenKeys.includes(part)) {
      segments.push(part);
    } else {
      // Split literal text into individual characters so each separator is its own chip
      // But keep consecutive non-separator chars together as free text
      let buffer = '';
      for (const char of part) {
        if (char === '\\' || char === '_' || char === '-') {
          if (buffer) {
            segments.push(buffer);
            buffer = '';
          }
          segments.push(char);
        } else {
          buffer += char;
        }
      }
      if (buffer) {
        segments.push(buffer);
      }
    }
  }

  return segments;
}

/**
 * Build pattern string from segments
 */
function buildPattern() {
  return patternSegments.value.join('');
}

function isToken(segment) {
  return allTokenKeys.includes(segment);
}

function isSeparator(segment) {
  return segment === '\\' || segment === '_' || segment === '-';
}

function segmentLabel(segment) {
  if (isToken(segment)) return tokenDisplayNames[segment] || segment;
  if (segment === '\\') return '\\';
  return segment;
}

function segmentClass(segment) {
  if (isToken(segment)) {
    return 'bg-cyan-900/60 text-cyan-200 border border-cyan-700/50';
  }
  if (isSeparator(segment)) {
    return 'bg-amber-900/60 text-amber-200 border border-amber-700/50';
  }
  return 'bg-gray-700/60 text-gray-300 border border-gray-600/50';
}

function setInsertPos(index) {
  insertPos.value = index;
}

function addSegment(segment) {
  if (insertPos.value !== null && insertPos.value <= patternSegments.value.length) {
    patternSegments.value.splice(insertPos.value, 0, segment);
    insertPos.value = insertPos.value + 1;
  } else {
    patternSegments.value.push(segment);
    insertPos.value = patternSegments.value.length;
  }
}

function removeSegment(index) {
  patternSegments.value.splice(index, 1);
  // Adjust cursor if needed
  if (insertPos.value !== null && insertPos.value > index) {
    insertPos.value = insertPos.value - 1;
  }
}

function addFreeText() {
  const text = freeTextInput.value.trim();
  if (!text) return;
  addSegment(text);
  freeTextInput.value = '';
}

const patternString = computed(() => buildPattern());

const previewResult = computed(() => {
  const raw = patternString.value;
  if (!raw) return '';
  let result = raw;
  for (const [token, value] of Object.entries(exampleValues)) {
    result = result.replaceAll(token, value);
  }
  return result;
});

async function savePattern() {
  saving.value = true;
  saveSuccess.value = false;
  try {
    await apiService.profileChangeValue('ImageFileSettings-FilePattern', patternString.value);
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 1500);
  } catch (error) {
    console.error('[FilePatternBuilder] Error saving pattern:', error);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  const currentPattern = store.profileInfo.ImageFileSettings.FilePattern;
  const source = currentPattern || defaultPattern;
  patternSegments.value = parsePattern(source);
  insertPos.value = patternSegments.value.length;
});
</script>

<style scoped>
.cursor-insert {
  width: 12px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  padding: 0;
  flex-shrink: 0;
}

.cursor-insert::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 2px;
  bottom: 2px;
  width: 2px;
  border-radius: 1px;
  background: transparent;
  transform: translateX(-50%);
  transition: background 0.15s;
}

.cursor-insert:hover::after {
  background: rgba(107, 114, 128, 0.5);
}

.cursor-active::after {
  background: #06b6d4 !important;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
