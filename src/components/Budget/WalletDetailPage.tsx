import { useParams } from 'react-router-dom';

import { useBudgetItems } from '../../hooks/useBudgetItems';

import { BudgetTable } from './BudgetTable';

export function WalletDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const walletId = id ?? '';

  const { items, addItems, trimEmptyRows, updateItem, deleteItem, restoreItem } =
    useBudgetItems(walletId);

  return (
    <div className="h-full flex flex-col">
      <BudgetTable
        items={items}
        onAddItems={addItems}
        onTrimRows={trimEmptyRows}
        onUpdateItem={updateItem}
        onDeleteItem={deleteItem}
        onRestoreItem={restoreItem}
      />
    </div>
  );
}
