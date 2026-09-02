import { computed, ref } from 'vue';

// Matches the backend's supported-for-preview set (FilesystemController.SupportedImageExtensions):
// ordinary raster, FITS/XISF, and DSLR raw. Anything outside this list can still be listed and
// downloaded, it just has no server-rendered preview.
export const PREVIEW_FILE_EXTENSIONS = [
  'gif',
  'tif',
  'tiff',
  'jpg',
  'jpeg',
  'png',
  'xisf',
  'fit',
  'fits',
  'fts',
  'fz',
  'cr2',
  'cr3',
  'nef',
  'raf',
  'raw',
  'pef',
  'dng',
  'arw',
  'orf',
  'rw2',
];

// What the list counts as an image for the images-only filter. Browsers display webp/bmp fine,
// so hiding them from the listing would be wrong - NINA's BaseImageData.FromFile just has no
// case for them, which is why they are not preview candidates.
export const IMAGE_FILE_EXTENSIONS = [...PREVIEW_FILE_EXTENSIONS, 'webp', 'bmp'];

export const SORT_KEYS = ['name', 'modified', 'size'];

// numeric: true keeps M31_2 in front of M31_10, which is the normal case for a
// capture folder full of sequentially numbered frames.
const nameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

export function getFileExtension(name) {
  return String(name || '')
    .split('.')
    .pop()
    ?.toLowerCase();
}

export function isImageFile(name) {
  return IMAGE_FILE_EXTENSIONS.includes(getFileExtension(name));
}

export function isPreviewableFile(name) {
  return PREVIEW_FILE_EXTENSIONS.includes(getFileExtension(name));
}

function toTimestamp(value) {
  const time = Date.parse(value ?? '');
  return Number.isNaN(time) ? 0 : time;
}

function toSize(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function matchesSearch(name, searchQuery) {
  const needle = String(searchQuery || '')
    .trim()
    .toLowerCase();
  if (!needle) {
    return true;
  }

  return String(name || '')
    .toLowerCase()
    .includes(needle);
}

function compareEntries(a, b, sortKey) {
  if (sortKey === 'modified') {
    return toTimestamp(a?.lastModified) - toTimestamp(b?.lastModified);
  }

  if (sortKey === 'size') {
    return toSize(a?.size) - toSize(b?.size);
  }

  return nameCollator.compare(a?.name || '', b?.name || '');
}

export function sortEntries(entries, sortKey = 'name', sortDir = 'asc') {
  const factor = sortDir === 'desc' ? -1 : 1;

  return [...entries].sort((a, b) => {
    const primary = compareEntries(a, b, sortKey);
    if (primary !== 0) {
      return primary * factor;
    }

    // Equal size or timestamp: always fall back to ascending names so flipping the
    // direction does not reshuffle otherwise identical rows.
    return nameCollator.compare(a?.name || '', b?.name || '');
  });
}

export function buildVisibleDirectories(directories, { searchQuery, sortKey, sortDir } = {}) {
  const filtered = (directories || []).filter((entry) => matchesSearch(entry?.name, searchQuery));
  // Directories carry no size, so sorting them by it would be arbitrary.
  return sortEntries(filtered, sortKey === 'size' ? 'name' : sortKey, sortDir);
}

export function buildVisibleFiles(files, { searchQuery, sortKey, sortDir, showImagesOnly } = {}) {
  const filtered = (files || []).filter(
    (entry) =>
      matchesSearch(entry?.name, searchQuery) && (!showImagesOnly || isImageFile(entry?.name))
  );
  return sortEntries(filtered, sortKey, sortDir);
}

/**
 * Search, sort and images-only filtering for the file browser list.
 * Takes the raw browse response refs and derives what the list panel renders.
 */
export function useFilebrowserList(directories, files) {
  const searchQuery = ref('');
  const sortKey = ref('name');
  const sortDir = ref('asc');
  const showImagesOnly = ref(true);

  const visibleDirectories = computed(() =>
    buildVisibleDirectories(directories.value, {
      searchQuery: searchQuery.value,
      sortKey: sortKey.value,
      sortDir: sortDir.value,
    })
  );

  const visibleFiles = computed(() =>
    buildVisibleFiles(files.value, {
      searchQuery: searchQuery.value,
      sortKey: sortKey.value,
      sortDir: sortDir.value,
      showImagesOnly: showImagesOnly.value,
    })
  );

  const isFiltered = computed(
    () =>
      !!searchQuery.value.trim() ||
      visibleDirectories.value.length !== (directories.value?.length || 0) ||
      visibleFiles.value.length !== (files.value?.length || 0)
  );

  function toggleSortDir() {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  }

  function clearSearch() {
    searchQuery.value = '';
  }

  return {
    searchQuery,
    sortKey,
    sortDir,
    showImagesOnly,
    visibleDirectories,
    visibleFiles,
    isFiltered,
    toggleSortDir,
    clearSearch,
  };
}
