// A pill with an arrow in a disc, not a line of text: on the painted backdrops a text link
// was easy to miss. Colours come from the theme (--back-btn on --card), so it follows every
// world. The arrow is decorative; the button is named "Back" for screen readers.
const ARROW = '<svg viewBox="0 0 24 24" width="20" height="20" focusable="false">'
  + '<path d="M15 5 8 12l7 7" fill="none" stroke="currentColor" stroke-width="3" '
  + 'stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const backButton = (onBack) => {
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-btn';
  back.setAttribute('aria-label', 'Back');
  back.innerHTML = `<span class="back-icon" aria-hidden="true">${ARROW}</span><span class="back-label">Back</span>`;
  back.addEventListener('click', onBack);
  return back;
};
