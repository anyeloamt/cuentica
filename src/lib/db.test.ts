import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import type { Wallet, BudgetItem } from '../types';

import { db } from './db';

describe('CuenticaDB', () => {
  beforeEach(async () => {
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('schema and structure', () => {
    it('should have correct database name', () => {
      expect(db.name).toBe('cuentica');
    });

    it('should have schema version 1', () => {
      expect(db.verno).toBe(1);
    });

    it('should have wallets table', () => {
      expect(db.wallets).toBeDefined();
      const walletsTable = db.table('wallets');
      expect(walletsTable).toBeDefined();
    });

    it('should have budgetItems table', () => {
      expect(db.budgetItems).toBeDefined();
      const budgetItemsTable = db.table('budgetItems');
      expect(budgetItemsTable).toBeDefined();
    });

    it('should have walletId index on budgetItems', () => {
      const budgetItemsSchema = db.table('budgetItems').schema;
      const hasWalletIdIndex = budgetItemsSchema.indexes.some(
        (idx) => idx.name === 'walletId'
      );
      expect(hasWalletIdIndex).toBe(true);
    });

    it('should have syncStatus index on wallets', () => {
      const walletsSchema = db.table('wallets').schema;
      const hasSyncStatusIndex = walletsSchema.indexes.some(
        (idx) => idx.name === 'syncStatus'
      );
      expect(hasSyncStatusIndex).toBe(true);
    });

    it('should have syncStatus index on budgetItems', () => {
      const budgetItemsSchema = db.table('budgetItems').schema;
      const hasSyncStatusIndex = budgetItemsSchema.indexes.some(
        (idx) => idx.name === 'syncStatus'
      );
      expect(hasSyncStatusIndex).toBe(true);
    });
  });

  describe('wallet CRUD operations', () => {
    it('should add and retrieve a wallet', async () => {
      const wallet: Wallet = {
        id: 'wallet-1',
        name: 'My Wallet',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.wallets.add(wallet);
      const retrieved = await db.wallets.get('wallet-1');

      expect(retrieved).toEqual(wallet);
      expect(retrieved?.name).toBe('My Wallet');
      expect(retrieved?.order).toBe(1);
    });

    it('should update a wallet and persist changes', async () => {
      const wallet: Wallet = {
        id: 'wallet-1',
        name: 'Original Name',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.wallets.add(wallet);

      const updatedAt = Date.now();
      await db.wallets.update('wallet-1', {
        name: 'Updated Name',
        updatedAt,
      });

      const retrieved = await db.wallets.get('wallet-1');
      expect(retrieved?.name).toBe('Updated Name');
      expect(retrieved?.updatedAt).toBe(updatedAt);
      expect(retrieved?.order).toBe(1);
    });

    it('should soft-delete a wallet by setting deleted flag', async () => {
      const wallet: Wallet = {
        id: 'wallet-1',
        name: 'My Wallet',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.wallets.add(wallet);
      await db.wallets.update('wallet-1', { deleted: true, updatedAt: Date.now() });

      const retrieved = await db.wallets.get('wallet-1');
      expect(retrieved?.deleted).toBe(true);
    });

    it('should query wallets by syncStatus', async () => {
      const now = Date.now();
      const wallet1: Wallet = {
        id: 'wallet-1',
        name: 'Wallet 1',
        order: 1,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      };

      const wallet2: Wallet = {
        id: 'wallet-2',
        name: 'Wallet 2',
        order: 2,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'synced',
      };

      const wallet3: Wallet = {
        id: 'wallet-3',
        name: 'Wallet 3',
        order: 3,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      };

      await db.wallets.bulkAdd([wallet1, wallet2, wallet3]);

      const pendingWallets = await db.wallets
        .where('syncStatus')
        .equals('pending')
        .toArray();
      expect(pendingWallets).toHaveLength(2);
      expect(pendingWallets.map((w) => w.id)).toEqual(['wallet-1', 'wallet-3']);

      const syncedWallets = await db.wallets
        .where('syncStatus')
        .equals('synced')
        .toArray();
      expect(syncedWallets).toHaveLength(1);
      expect(syncedWallets[0].id).toBe('wallet-2');
    });
  });

  describe('budget item CRUD operations', () => {
    it('should add and retrieve a budget item', async () => {
      const item: BudgetItem = {
        id: 'item-1',
        walletId: 'wallet-1',
        order: 1,
        name: 'Salary',
        type: '+',
        amount: 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.budgetItems.add(item);
      const retrieved = await db.budgetItems.get('item-1');

      expect(retrieved).toEqual(item);
      expect(retrieved?.type).toBe('+');
      expect(retrieved?.amount).toBe(1000);
    });

    it('should update a budget item and persist changes', async () => {
      const item: BudgetItem = {
        id: 'item-1',
        walletId: 'wallet-1',
        order: 1,
        name: 'Salary',
        type: '+',
        amount: 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.budgetItems.add(item);

      const updatedAt = Date.now();
      await db.budgetItems.update('item-1', {
        amount: 1500,
        updatedAt,
      });

      const retrieved = await db.budgetItems.get('item-1');
      expect(retrieved?.amount).toBe(1500);
      expect(retrieved?.updatedAt).toBe(updatedAt);
      expect(retrieved?.type).toBe('+');
    });

    it('should soft-delete a budget item by setting deleted flag', async () => {
      const item: BudgetItem = {
        id: 'item-1',
        walletId: 'wallet-1',
        order: 1,
        name: 'Salary',
        type: '+',
        amount: 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.budgetItems.add(item);
      await db.budgetItems.update('item-1', { deleted: true, updatedAt: Date.now() });

      const retrieved = await db.budgetItems.get('item-1');
      expect(retrieved?.deleted).toBe(true);
    });
  });

  describe('budget item queries by index', () => {
    it('should query budget items by walletId', async () => {
      const now = Date.now();
      const item1: BudgetItem = {
        id: 'item-1',
        walletId: 'wallet-1',
        order: 1,
        name: 'Salary',
        type: '+',
        amount: 1000,
        createdAt: now,
        updatedAt: now,
      };

      const item2: BudgetItem = {
        id: 'item-2',
        walletId: 'wallet-1',
        order: 2,
        name: 'Rent',
        type: '-',
        amount: 500,
        createdAt: now,
        updatedAt: now,
      };

      const item3: BudgetItem = {
        id: 'item-3',
        walletId: 'wallet-2',
        order: 1,
        name: 'Other Income',
        type: '+',
        amount: 200,
        createdAt: now,
        updatedAt: now,
      };

      await db.budgetItems.bulkAdd([item1, item2, item3]);

      const wallet1Items = await db.budgetItems
        .where('walletId')
        .equals('wallet-1')
        .toArray();
      expect(wallet1Items).toHaveLength(2);
      expect(wallet1Items.map((i) => i.id)).toEqual(['item-1', 'item-2']);

      const wallet2Items = await db.budgetItems
        .where('walletId')
        .equals('wallet-2')
        .toArray();
      expect(wallet2Items).toHaveLength(1);
      expect(wallet2Items[0].id).toBe('item-3');
    });

    it('should query budget items by syncStatus', async () => {
      const now = Date.now();
      const item1: BudgetItem = {
        id: 'item-1',
        walletId: 'wallet-1',
        order: 1,
        name: 'Salary',
        type: '+',
        amount: 1000,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      };

      const item2: BudgetItem = {
        id: 'item-2',
        walletId: 'wallet-1',
        order: 2,
        name: 'Rent',
        type: '-',
        amount: 500,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'synced',
      };

      const item3: BudgetItem = {
        id: 'item-3',
        walletId: 'wallet-2',
        order: 1,
        name: 'Other Income',
        type: '+',
        amount: 200,
        createdAt: now,
        updatedAt: now,
        syncStatus: 'pending',
      };

      await db.budgetItems.bulkAdd([item1, item2, item3]);

      const pendingItems = await db.budgetItems
        .where('syncStatus')
        .equals('pending')
        .toArray();
      expect(pendingItems).toHaveLength(2);
      expect(pendingItems.map((i) => i.id)).toEqual(['item-1', 'item-3']);

      const syncedItems = await db.budgetItems
        .where('syncStatus')
        .equals('synced')
        .toArray();
      expect(syncedItems).toHaveLength(1);
      expect(syncedItems[0].id).toBe('item-2');
    });

    it('should query budget items by type', async () => {
      const now = Date.now();
      const income: BudgetItem = {
        id: 'item-1',
        walletId: 'wallet-1',
        order: 1,
        name: 'Salary',
        type: '+',
        amount: 1000,
        createdAt: now,
        updatedAt: now,
      };

      const expense: BudgetItem = {
        id: 'item-2',
        walletId: 'wallet-1',
        order: 2,
        name: 'Rent',
        type: '-',
        amount: 500,
        createdAt: now,
        updatedAt: now,
      };

      await db.budgetItems.bulkAdd([income, expense]);

      const incomeItems = await db.budgetItems.where('type').equals('+').toArray();
      expect(incomeItems).toHaveLength(1);
      expect(incomeItems[0].name).toBe('Salary');

      const expenseItems = await db.budgetItems.where('type').equals('-').toArray();
      expect(expenseItems).toHaveLength(1);
      expect(expenseItems[0].name).toBe('Rent');
    });
  });

  describe('database state isolation', () => {
    it('should have clean state in each test', async () => {
      const count1 = await db.wallets.count();
      expect(count1).toBe(0);

      await db.wallets.add({
        id: 'wallet-1',
        name: 'Test',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const count2 = await db.wallets.count();
      expect(count2).toBe(1);
    });

    it('should start with empty database in next test', async () => {
      const count = await db.wallets.count();
      expect(count).toBe(0);
    });
  });
});
