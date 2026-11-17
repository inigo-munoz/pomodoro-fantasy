// What a creature says when it is petted. An egg keeps the soft purr or chitter; a baby
// (level 2) has a little voice of its own, a young one (level 3) a lighter call, and an
// adult (level 4) its full voice. Asleep on a break, any creature only purrs or
// chitters, so a pet never startles.
const BABY_LEVEL = 2;
const GROWN_LEVEL = 3;
const BABY_VOICES = { cats: 'purr', unicorns: 'sparkle', wolves: 'whimper', dragons: 'squeak' };
const YOUNG_VOICES = { cats: 'meowYoung', unicorns: 'neighYoung', wolves: 'howlYoung', dragons: 'roar' };
const ADULT_VOICES = { cats: 'meow', unicorns: 'neigh', wolves: 'howl', dragons: 'growl' };

export const petSound = (family, level, resting) => {
  const soft = family === 'cats' ? 'purr' : 'chitter';
  if (resting || level < BABY_LEVEL) return soft;
  if (level < GROWN_LEVEL) return BABY_VOICES[family] ?? soft;
  const voices = level >= 4 ? ADULT_VOICES : YOUNG_VOICES;
  return voices[family] ?? soft;
};
