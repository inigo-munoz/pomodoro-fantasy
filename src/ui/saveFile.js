// Hand a text file to the person. Where the device can share files (Android), the share sheet
// opens, so the backup can go straight to Google Drive, an email or a chat; elsewhere it is
// downloaded. A share that is cancelled is not an error. Resolves to 'shared', 'cancelled'
// or 'downloaded', so the screen can confirm it.
export const saveFile = async (name, text) => {
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
};
