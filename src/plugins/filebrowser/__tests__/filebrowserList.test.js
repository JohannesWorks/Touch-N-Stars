import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildVisibleDirectories,
  buildVisibleFiles,
  isImageFile,
  isPreviewableFile,
  sortEntries,
} from '../composables/useFilebrowserList.js';

const FILES = [
  {
    name: 'M31_10.fits',
    path: '/img/M31_10.fits',
    size: 300,
    lastModified: '2026-01-03T00:00:00Z',
  },
  { name: 'M31_2.fits', path: '/img/M31_2.fits', size: 100, lastModified: '2026-01-01T00:00:00Z' },
  { name: 'notes.txt', path: '/img/notes.txt', size: 200, lastModified: '2026-01-02T00:00:00Z' },
];

const DIRECTORIES = [
  { name: 'Lights', path: '/img/Lights', lastModified: '2026-01-02T00:00:00Z' },
  { name: 'Darks', path: '/img/Darks', lastModified: '2026-01-05T00:00:00Z' },
];

const names = (entries) => entries.map((entry) => entry.name);

test('sorts names naturally so frame 2 comes before frame 10', () => {
  assert.deepEqual(names(sortEntries(FILES, 'name', 'asc')), [
    'M31_2.fits',
    'M31_10.fits',
    'notes.txt',
  ]);
});

test('reverses every sort key with the direction', () => {
  assert.deepEqual(names(sortEntries(FILES, 'size', 'asc')), [
    'M31_2.fits',
    'notes.txt',
    'M31_10.fits',
  ]);
  assert.deepEqual(names(sortEntries(FILES, 'size', 'desc')), [
    'M31_10.fits',
    'notes.txt',
    'M31_2.fits',
  ]);
  assert.deepEqual(names(sortEntries(FILES, 'modified', 'desc')), [
    'M31_10.fits',
    'notes.txt',
    'M31_2.fits',
  ]);
});

test('falls back to ascending names when the primary key is equal', () => {
  const sameSize = [
    { name: 'b.fits', size: 10 },
    { name: 'a.fits', size: 10 },
  ];
  assert.deepEqual(names(sortEntries(sameSize, 'size', 'asc')), ['a.fits', 'b.fits']);
  assert.deepEqual(names(sortEntries(sameSize, 'size', 'desc')), ['a.fits', 'b.fits']);
});

test('does not mutate the input array', () => {
  const input = [...FILES];
  sortEntries(input, 'size', 'desc');
  assert.deepEqual(names(input), names(FILES));
});

test('search matches case-insensitively on the name', () => {
  const result = buildVisibleFiles(FILES, { searchQuery: 'm31', sortKey: 'name', sortDir: 'asc' });
  assert.deepEqual(names(result), ['M31_2.fits', 'M31_10.fits']);

  assert.deepEqual(
    names(buildVisibleFiles(FILES, { searchQuery: '   ', sortKey: 'name', sortDir: 'asc' })),
    ['M31_2.fits', 'M31_10.fits', 'notes.txt']
  );
});

test('images-only combines with the search filter', () => {
  assert.deepEqual(
    names(
      buildVisibleFiles(FILES, {
        showImagesOnly: true,
        sortKey: 'name',
        sortDir: 'asc',
      })
    ),
    ['M31_2.fits', 'M31_10.fits']
  );

  assert.deepEqual(
    names(
      buildVisibleFiles(FILES, {
        showImagesOnly: true,
        searchQuery: 'notes',
        sortKey: 'name',
        sortDir: 'asc',
      })
    ),
    []
  );
});

test('directories fall back to name order when sorting by size', () => {
  assert.deepEqual(
    names(buildVisibleDirectories(DIRECTORIES, { sortKey: 'size', sortDir: 'asc' })),
    ['Darks', 'Lights']
  );
  assert.deepEqual(
    names(buildVisibleDirectories(DIRECTORIES, { sortKey: 'modified', sortDir: 'desc' })),
    ['Darks', 'Lights']
  );
});

test('recognises image and FITS extensions', () => {
  assert.equal(isImageFile('frame.FITS'), true);
  assert.equal(isImageFile('frame.png'), true);
  assert.equal(isImageFile('frame.txt'), false);
  assert.equal(isImageFile(''), false);
});

test('recognises XISF and raw extensions supported by the backend preview', () => {
  assert.equal(isImageFile('frame.xisf'), true);
  assert.equal(isImageFile('frame.cr2'), true);
  assert.equal(isImageFile('frame.nef'), true);
  assert.equal(isImageFile('frame.dng'), true);
  assert.equal(isImageFile('frame.fz'), true);
});

test('lists webp/bmp as images even though the backend cannot preview them', () => {
  assert.equal(isImageFile('frame.webp'), true);
  assert.equal(isImageFile('frame.bmp'), true);
  assert.equal(isPreviewableFile('frame.webp'), false);
  assert.equal(isPreviewableFile('frame.bmp'), false);
  assert.equal(isPreviewableFile('frame.fits'), true);
});
