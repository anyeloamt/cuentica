export function downloadPdf(blob: Blob, walletName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${walletName}-budget.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function sharePdf(blob: Blob, walletName: string): Promise<boolean> {
  const filename = `${walletName}-budget.pdf`;
  const file = new File([blob], filename, { type: 'application/pdf' });

  const data = {
    files: [file],
    title: walletName,
    text: `Budget for ${walletName}`,
  };

  if (navigator.canShare?.(data)) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return false;
      }
      console.error('Share failed:', error);
    }
  }

  downloadPdf(blob, walletName);
  return false;
}
