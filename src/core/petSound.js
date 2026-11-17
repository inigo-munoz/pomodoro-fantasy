// What a creature says when it is petted. An egg keeps the soft purr or chitter; a baby
// (level 2) has a little voice of its own, a grown one (level 3 on) its full voice, and
// dragons deepen theirs when fully grown. Asleep on a break, any creature only purrs or
// chitters, so a pet never startles.
const BABY_LEVEL = 2;
const GROWN_LEVEL = 3;
const BABY_VOICES = { cats: 'purr', unicorns: 'sparkle', wolves: 'whimper', dragons: 'squeak' };
const VOICES = { cats: 'meow', unicorns: 'neigh', wolves: 'howl' };

export const petSound = (family, level, resting) => {
  const soft = family === 'cats' ? 'purr' : 'chitter';
  if (resting || level < BABY_LEVEL) return soft;
  if (level < GROWN_LEVEL) return BABY_VOICES[family] ?? soft;
  if (family === 'dragons') return level >= 4 ? 'growl' : 'roar';
  return VOICES[family] ?? soft;
};
