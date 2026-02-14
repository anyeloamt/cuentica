import { describe, it, expect } from 'vitest';

import type { Wallet, BudgetItem } from '../types';

import { CuenticaDB, db } from './db';

describe('CuenticaDB', () => {
  it('should create db instance correctly', () => {
    expect(db).toBeDefined();
    expect(db.name).toBe('cuentica');
  });

  it('should have wallets and budgetItems tables', () => {
    expect(db.wallets).toBeDefined();
    expect(db.budgetItems).toBeDefined();
  });

  it('should have schema version 1', () => {
    expect(db.verno).toBe(1);
  });

  it('should define wallet table with correct indexes', () => {
    const schema = db.tables[0].schema;
    expect(schema.name).toBe('wallets');
    expect(schema.primKey.name).toBe('id');
  });

  it('should define budgetItems table with correct indexes', () => {
    const schema = db.tables[1].schema;
    expect(schema.name).toBe('budgetItems');
    expect(schema.primKey.name).toBe('id');
  });

  it('should have walletId index on budgetItems table', () => {
    const budgetItemsSchema = db.tables[1].schema;
    const hasWalletIdIndex = budgetItemsSchema.indexes.some(
      (idx) => idx.name === 'walletId'
    );
    expect(hasWalletIdIndex).toBe(true);
  });

  it('should have syncStatus index on both tables', () => {
    const walletsSchema = db.tables[0].schema;
    const budgetItemsSchema = db.tables[1].schema;

    const walletsSyncIndex = walletsSchema.indexes.some(
      (idx) => idx.name === 'syncStatus'
    );
    const budgetItemsSyncIndex = budgetItemsSchema.indexes.some(
      (idx) => idx.name === 'syncStatus'
    );

    expect(walletsSyncIndex).toBe(true);
    expect(budgetItemsSyncIndex).toBe(true);
  });

  it('should be instance of CuenticaDB', () => {
    expect(db instanceof CuenticaDB).toBe(true);
  });

  it('should accept Wallet type with required fields', () => {
    const wallet: Wallet = {
      id: 'wallet-1',
      name: 'My Wallet',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(wallet.name).toBe('My Wallet');
  });

  it('should accept BudgetItem type with required fields', () => {
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
    expect(item.type).toBe('+');
    expect(item.amount).toBe(1000);
  });
});
