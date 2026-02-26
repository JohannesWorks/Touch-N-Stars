<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="(filter, index) in sortedFilters"
      :key="index"
      class="p-4 border border-gray-700 rounded-lg bg-gray-800/50"
    >
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold text-base text-cyan-400">
          {{ $t('components.filterwheel.settings.FilterWheelFilters.Position') }}
          {{ filter.Position + 1 }}
        </h3>
        <RemoveFilter :filterId="getOriginalIndex(filter)" />
      </div>
      <SetFilterName
        v-model="filter.Name"
        :settingKey="`FilterWheelSettings-FilterWheelFilters-${getOriginalIndex(filter)}-Name`"
        class="mb-3"
      />
      <SettingInput
        labelKey="components.filterwheel.settings.FilterWheelFilters.FocusOffset"
        :settingKey="`FilterWheelSettings-FilterWheelFilters-${getOriginalIndex(filter)}-FocusOffset`"
        :modelValue="filter.FocusOffset"
        :max="999999"
        :min="-999999"
        class="mb-3"
      />
      <SettingInput
        labelKey="components.filterwheel.settings.FilterWheelFilters.AutoFocusExposureTime"
        :settingKey="`FilterWheelSettings-FilterWheelFilters-${getOriginalIndex(filter)}-AutoFocusExposureTime`"
        :modelValue="filter.AutoFocusExposureTime"
        :modelDefaultValue="store.profileInfo.FocuserSettings.AutoFocusExposureTime"
        :min="0"
      />
    </div>
    <AddNewFilter />
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { apiStore } from '@/store/store';
import SettingInput from '@/components/helpers/settings/UpdatePorfileNumber.vue';
import SetFilterName from './SetFilterName.vue';
import AddNewFilter from './AddNewFilter.vue';
import RemoveFilter from './RemoveFilter.vue';

const store = apiStore();

// Sortiere Filter nach Position
const sortedFilters = computed(() => {
  const filters = store.profileInfo?.FilterWheelSettings?.FilterWheelFilters;
  if (!filters || !Array.isArray(filters)) return [];
  return [...filters].sort((a, b) => a.Position - b.Position);
});

// Finde den ursprünglichen Index des Filters im Array
const getOriginalIndex = (filter) => {
  const filters = store.profileInfo?.FilterWheelSettings?.FilterWheelFilters;
  if (!filters) return 0;
  return filters.findIndex((f) => f.Position === filter.Position && f.Name === filter.Name);
};
</script>
