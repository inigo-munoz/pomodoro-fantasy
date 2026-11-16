// The small tag on the family or creature already in play, so the child sees at a glance
// which one is hers; it replaces a coloured outline that read as a selection, not ownership.
export const currentBadge = () => {
  const badge = document.createElement('span');
  badge.className = 'current-badge';
  badge.textContent = 'Yours';
  return badge;
};
