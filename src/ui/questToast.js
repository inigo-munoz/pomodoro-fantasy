// A short note that a quest was done and what it paid. Sound alone was not enough: with the
// sound off, coins went up with no reason shown. It sits over whatever screen is open, says
// itself to screen readers, and goes away by itself or at a tap. Titles come from the quest
// catalogue and are written as text, never as markup.
const SHOW_MS = 4000;

export const showQuestToast = (paid) => {
  if (!paid.length) return;
  document.querySelectorAll('.quest-toast').forEach((old) => old.remove());

  const toast = document.createElement('div');
  toast.className = 'quest-toast';
  toast.setAttribute('role', 'status');

  const heading = document.createElement('p');
  heading.className = 'quest-toast-title';
  heading.textContent = paid.length === 1 ? 'Quest done!' : `${paid.length} quests done!`;
  toast.appendChild(heading);

  for (const quest of paid) {
    const line = document.createElement('p');
    line.className = 'quest-toast-line';
    line.textContent = `${quest.title} +${quest.reward}`;
    toast.appendChild(line);
  }

  const close = () => toast.remove();
  toast.addEventListener('click', close);
  setTimeout(close, SHOW_MS);
  document.body.appendChild(toast);
};
