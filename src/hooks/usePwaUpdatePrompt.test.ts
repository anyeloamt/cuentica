import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePwaUpdatePrompt } from './usePwaUpdatePrompt';

const pwaRegisterMock = vi.hoisted(() => {
  const state = {
    offlineReady: false,
    needRefresh: false,
    setOfflineReady: vi.fn((value: boolean) => {
      state.offlineReady = value;
    }),
    setNeedRefresh: vi.fn((value: boolean) => {
      state.needRefresh = value;
    }),
    updateServiceWorker: vi
      .fn<[reloadPage?: boolean], Promise<void>>()
      .mockResolvedValue(undefined),
  };

  return state;
});

vi.mock('virtual:pwa-register/react', () => {
  return {
    useRegisterSW: () => ({
      offlineReady: [
        pwaRegisterMock.offlineReady,
        pwaRegisterMock.setOfflineReady,
      ] as const,
      needRefresh: [pwaRegisterMock.needRefresh, pwaRegisterMock.setNeedRefresh] as const,
      updateServiceWorker: pwaRegisterMock.updateServiceWorker,
    }),
  };
});

describe('usePwaUpdatePrompt', () => {
  beforeEach(() => {
    pwaRegisterMock.offlineReady = false;
    pwaRegisterMock.needRefresh = false;
    pwaRegisterMock.setOfflineReady.mockClear();
    pwaRegisterMock.setNeedRefresh.mockClear();
    pwaRegisterMock.updateServiceWorker.mockReset();
    pwaRegisterMock.updateServiceWorker.mockResolvedValue(undefined);
    vi.restoreAllMocks();
  });

  it('returns offlineReady=false and needRefresh=false initially', () => {
    const { result } = renderHook(() => usePwaUpdatePrompt());

    expect(result.current.offlineReady).toBe(false);
    expect(result.current.needRefresh).toBe(false);
  });

  it('exposes offlineReady when it becomes true', () => {
    const { result, rerender } = renderHook(() => usePwaUpdatePrompt());

    pwaRegisterMock.offlineReady = true;
    rerender();

    expect(result.current.offlineReady).toBe(true);
  });

  it('exposes needRefresh when it becomes true', () => {
    const { result, rerender } = renderHook(() => usePwaUpdatePrompt());

    pwaRegisterMock.needRefresh = true;
    rerender();

    expect(result.current.needRefresh).toBe(true);
  });

  it('calls SW update function and handles errors', async () => {
    const { result } = renderHook(() => usePwaUpdatePrompt());

    await act(async () => {
      await result.current.updateServiceWorker();
    });

    expect(pwaRegisterMock.updateServiceWorker).toHaveBeenCalledTimes(1);
    expect(pwaRegisterMock.updateServiceWorker).toHaveBeenCalledWith(true);

    const error = new Error('update failed');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    pwaRegisterMock.updateServiceWorker.mockRejectedValueOnce(error);

    await act(async () => {
      await result.current.updateServiceWorker();
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it('dismiss resets offlineReady and needRefresh to false', () => {
    pwaRegisterMock.offlineReady = true;
    pwaRegisterMock.needRefresh = true;
    const { result, rerender } = renderHook(() => usePwaUpdatePrompt());

    act(() => {
      result.current.dismiss();
    });

    expect(pwaRegisterMock.setOfflineReady).toHaveBeenCalledWith(false);
    expect(pwaRegisterMock.setNeedRefresh).toHaveBeenCalledWith(false);

    rerender();

    expect(result.current.offlineReady).toBe(false);
    expect(result.current.needRefresh).toBe(false);
  });
});
