import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

const indexedDBMock = {
  databases: () => Promise.resolve([]),
  deleteDatabase: vi.fn(() => Promise.resolve()),
  open: vi.fn(),
};

Object.defineProperty(window, 'indexedDB', {
  value: indexedDBMock,
  writable: true,
});
