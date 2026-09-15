import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db, prepareLocalUser } from './db';
import { fullSync, repairSync } from './sync';

vi.mock('./supabase', () => ({
  supabase: null,
}));

describe('sync without a Supabase client', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.open();
    await prepareLocalUser('user-1');
  });

  afterEach(async () => {
    await db.delete();
  });

  it('rejects full and repair sync instead of reporting success', async () => {
    await expect(fullSync('user-1')).rejects.toThrow('Supabase not configured');
    await expect(repairSync('user-1')).rejects.toThrow('Supabase not configured');
  });
});
