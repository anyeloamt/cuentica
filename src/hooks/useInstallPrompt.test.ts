import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useInstallPrompt } from './useInstallPrompt';

function createBeforeInstallPromptEvent(
  outcome: 'accepted' | 'dismissed' = 'accepted',
  overrides?: {
    prompt?: () => Promise<void>;
    userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
): Event {
  const event = new Event('beforeinstallprompt');
  const prompt = overrides?.prompt ?? vi.fn().mockResolvedValue(undefined);
  const userChoice =
    overrides?.userChoice ?? Promise.resolve({ outcome, platform: 'web' as const });

  Object.defineProperties(event, {
    prompt: {
      value: prompt,
      enumerable: true,
      configurable: true,
      writable: true,
    },
    userChoice: {
      value: userChoice,
      enumerable: true,
      configurable: true,
      writable: true,
    },
  });

  return event;
}

describe('useInstallPrompt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('captures beforeinstallprompt and becomes installable', () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = createBeforeInstallPromptEvent();
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalledTimes(1);
    expect(result.current.isInstallable).toBe(true);
    expect(result.current.isInstalled).toBe(false);
  });

  it('clears installability after accepted outcome', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = createBeforeInstallPromptEvent('accepted');

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(result.current.isInstallable).toBe(false);
  });

  it('keeps installability after dismissed outcome to allow retry', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = createBeforeInstallPromptEvent('dismissed');

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it('handles appinstalled event', () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = createBeforeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(event);
    });

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('logs prompt errors instead of failing silently', async () => {
    const error = new Error('prompt failed');
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useInstallPrompt());
    const event = createBeforeInstallPromptEvent('accepted', {
      prompt: vi.fn().mockRejectedValue(error),
    });

    act(() => {
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(result.current.isInstallable).toBe(true);
  });
});
