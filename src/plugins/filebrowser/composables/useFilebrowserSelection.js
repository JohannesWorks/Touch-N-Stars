import { computed, ref } from 'vue';

/**
 * Selection state for the file browser list.
 *
 * The list is selection driven: tapping a file row toggles it, the sticky action
 * bar acts on whatever is selected. Entries are kept by path together with their
 * type so the action bar can work without looking anything up again.
 */
export function useFilebrowserSelection() {
  const selectedEntries = ref(new Map());

  const selectionCount = computed(() => selectedEntries.value.size);
  const selectedList = computed(() => Array.from(selectedEntries.value.values()));

  const singleSelection = computed(() =>
    selectedEntries.value.size === 1 ? selectedList.value[0] : null
  );

  const selectedFiles = computed(() =>
    selectedList.value.filter((entry) => entry.entryType === 'file')
  );

  const selectedDirectories = computed(() =>
    selectedList.value.filter((entry) => entry.entryType === 'directory')
  );

  function isSelected(path) {
    return selectedEntries.value.has(path);
  }

  function setEntries(entries) {
    selectedEntries.value = new Map(entries.map((entry) => [entry.path, entry]));
  }

  function toggle(entry, entryType) {
    if (!entry?.path) {
      return;
    }

    const next = new Map(selectedEntries.value);
    if (next.has(entry.path)) {
      next.delete(entry.path);
    } else {
      next.set(entry.path, { ...entry, entryType });
    }
    selectedEntries.value = next;
  }

  function selectOnly(entry, entryType) {
    if (!entry?.path) {
      clear();
      return;
    }

    setEntries([{ ...entry, entryType }]);
  }

  function selectAll(directories, files) {
    setEntries([
      ...directories.map((entry) => ({ ...entry, entryType: 'directory' })),
      ...files.map((entry) => ({ ...entry, entryType: 'file' })),
    ]);
  }

  function clear() {
    if (selectedEntries.value.size) {
      selectedEntries.value = new Map();
    }
  }

  return {
    selectedEntries,
    selectedList,
    selectedFiles,
    selectedDirectories,
    selectionCount,
    singleSelection,
    isSelected,
    toggle,
    selectOnly,
    selectAll,
    clear,
  };
}
