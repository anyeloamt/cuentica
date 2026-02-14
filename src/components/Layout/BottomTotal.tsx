export function BottomTotal(): JSX.Element {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-[60px] bg-bg-primary border-t border-border flex items-center justify-between px-4 z-0"
      data-testid="bottom-total"
    >
      <span className="text-text-secondary font-medium">Total</span>
      <span className="text-xl font-bold text-text-primary">$0.00</span>
    </div>
  );
}
