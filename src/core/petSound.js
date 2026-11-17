// What a creature says when it is petted. Eggs and babies keep the soft purr or chitter; from
// the young stage on (level 3) each family has its own voice, and dragons deepen theirs when
// fully grown. Asleep on a break, any creature only purrs or chitters, so a pet never startles.
const GROWN_LEVEL = 3;
const VOICES = { cats: 'meow', unicorns: 'neigh', wolves: 'howl' };

export const petSound = (family, level, resting) => {
  const soft = family === 'cats' ? 'purr' : 'chitter';
  if (resting || level < GROWN_LEVEL) return soft;
  if (family === 'dragons') return level >= 4 ? 'growl' : 'roar';
  return VOICES[family] ?? soft;
};
