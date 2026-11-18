// Gift codes: a word handed out by hand (to testers, to the first players) that gives coins
// once per game. The repository is public, so only each code's SHA-256 hash ships: the word is
// never written anywhere in the project, not in comments and not in tests (a test checks it).
// The save keeps the ids of the codes already used.
export const giftCodes = [
  { id: 'launch-2026', hash: '984111eff8571c156bab547ad5b975a8fa013ae15ca326b9a8db42111ebd7efd', coins: 100 },
];

// Case and spaces do not matter: "ab 12", " Ab12 " and "AB12" are the same code.
export const normalizeCode = (input) =>
  String(input ?? '').normalize('NFKC').replace(/\s+/g, '').toUpperCase();

export const sha256 = async (text) => {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

// The gift a typed code stands for, or null. Async (Web Crypto), so the caller applies it to
// the game as it is AFTER the wait: a timer tick may have changed it in between.
export const findGiftCode = async (input, codes = giftCodes) => {
  const code = normalizeCode(input);
  if (!code) return null;
  try {
    const hash = await sha256(code);
    return codes.find((c) => c.hash === hash) ?? null;
  } catch {
    return null;
  }
};

// { status: 'gift' | 'used', coins?, state }. 'used' hands back the same state object.
export const applyGift = (state, gift) => {
  const used = state.giftCodes ?? [];
  if (used.includes(gift.id)) return { status: 'used', state };
  return {
    status: 'gift',
    coins: gift.coins,
    state: { ...state, coins: (state.coins ?? 0) + gift.coins, giftCodes: [...used, gift.id] },
  };
};
