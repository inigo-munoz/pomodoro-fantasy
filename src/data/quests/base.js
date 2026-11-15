// The base pack: the permanent ladder, data only. Every quest reads state the save already
// holds, and none ever expires, resets or runs out. `kind` names what is measured (see
// src/core/quests.js); `goal` is the amount that finishes it, and `null` means the goal comes
// from the catalogue (the last growth stage, or the number of families). `stage` is a stage
// index (1 baby, 2 young) or 'last'; `family` narrows a count to one family.
// The first nine ids shipped first and are kept exactly, so a save that already paid them is
// never paid again.

const blocks = (goal, title, reward, id = `blocks-${goal}`) => ({ id, title, reward, kind: 'blocks', goal });
const reached = (id, stage, goal, title, reward, family) =>
  ({ id, title, reward, kind: 'reached', stage, goal, ...(family ? { family } : {}) });

export const basePack = [
  // Blocks finished, ever.
  blocks(1, 'Your first block', 5),
  blocks(5, 'Five blocks', 10),
  blocks(10, 'Ten blocks', 15),
  blocks(25, 'Twenty-five blocks', 25),
  blocks(50, 'Fifty blocks', 40),
  blocks(75, 'Seventy-five blocks', 50),
  blocks(100, 'A hundred blocks', 75),
  blocks(150, 'A hundred and fifty blocks', 75),
  blocks(200, 'Two hundred blocks', 80),
  blocks(300, 'Three hundred blocks', 90),
  blocks(500, 'Five hundred blocks', 100),
  blocks(750, 'Seven hundred and fifty blocks', 110),
  blocks(1000, 'A thousand blocks', 120),
  blocks(1500, 'Fifteen hundred blocks', 130),
  blocks(2000, 'Two thousand blocks', 150),

  // The lair, decorations placed across every lair, and full rooms (all four spots filled).
  { id: 'lair-open',   title: 'Open the lair',          reward: 10, kind: 'lair',        goal: 1 },
  { id: 'decor-1',     title: 'Your first decoration',  reward: 10, kind: 'decorations', goal: 1 },
  { id: 'decor-5',  title: 'Five decorations',      reward: 10, kind: 'placed', goal: 5 },
  { id: 'decor-10', title: 'Ten decorations',       reward: 15, kind: 'placed', goal: 10 },
  { id: 'decor-20', title: 'Twenty decorations',    reward: 20, kind: 'placed', goal: 20 },
  { id: 'decor-40', title: 'Forty decorations',     reward: 30, kind: 'placed', goal: 40 },
  { id: 'decor-64', title: 'Every spot decorated',  reward: 50, kind: 'placed', goal: 64 },
  { id: 'room-full',   title: 'A room with everything', reward: 40, kind: 'fullRoom',    goal: 4 },
  { id: 'rooms-2',  title: 'Two full rooms',   reward: 30, kind: 'fullRooms', goal: 2 },
  { id: 'rooms-4',  title: 'Four full rooms',  reward: 40, kind: 'fullRooms', goal: 4 },
  { id: 'rooms-8',  title: 'Eight full rooms', reward: 60, kind: 'fullRooms', goal: 8 },
  { id: 'rooms-16', title: 'Every room full',  reward: 80, kind: 'fullRooms', goal: 16 },
  { id: 'room-dragons',  title: 'A full dragon room',  reward: 20, kind: 'fullRooms', goal: 1, family: 'dragons' },
  { id: 'room-cats',     title: 'A full cat room',     reward: 20, kind: 'fullRooms', goal: 1, family: 'cats' },
  { id: 'room-unicorns', title: 'A full unicorn room', reward: 20, kind: 'fullRooms', goal: 1, family: 'unicorns' },
  { id: 'room-wolves',   title: 'A full wolf room',    reward: 20, kind: 'fullRooms', goal: 1, family: 'wolves' },

  // Pets in the middle of a room, and treasures owned across every lair.
  { id: 'pets-1',  title: 'A first pet',         reward: 10, kind: 'pets', goal: 1 },
  { id: 'pets-4',  title: 'Four pets',           reward: 15, kind: 'pets', goal: 4 },
  { id: 'pets-8',  title: 'Eight pets',          reward: 25, kind: 'pets', goal: 8 },
  { id: 'pets-16', title: 'A pet in every room', reward: 40, kind: 'pets', goal: 16 },
  { id: 'owned-10',  title: 'Ten treasures',           reward: 10, kind: 'owned', goal: 10 },
  { id: 'owned-25',  title: 'Twenty-five treasures',   reward: 20, kind: 'owned', goal: 25 },
  { id: 'owned-50',  title: 'Fifty treasures',         reward: 30, kind: 'owned', goal: 50 },
  { id: 'owned-100', title: 'A hundred treasures',     reward: 50, kind: 'owned', goal: 100 },
  { id: 'owned-192', title: 'Every treasure, everywhere', reward: 80, kind: 'owned', goal: 192 },

  // Creatures that grew: dragon-grow is the first baby and dragon-full the first adult.
  { id: 'dragon-grow', title: 'A growing dragon',       reward: 20, kind: 'growing',     goal: 1 },
  reached('baby-2', 1, 2, 'Two little ones', 10),
  reached('baby-4', 1, 4, 'Four little ones', 15),
  reached('baby-8', 1, 8, 'Eight little ones', 20),
  reached('baby-12', 1, 12, 'Twelve little ones', 25),
  reached('baby-16', 1, 16, 'Sixteen little ones', 30),
  reached('young-1', 2, 1, 'A young creature', 15),
  reached('young-2', 2, 2, 'Two young creatures', 15),
  reached('young-4', 2, 4, 'Four young creatures', 20),
  reached('young-8', 2, 8, 'Eight young creatures', 25),
  reached('young-12', 2, 12, 'Twelve young creatures', 30),
  reached('young-16', 2, 16, 'Sixteen young creatures', 35),
  { id: 'dragon-full', title: 'A full-grown dragon',    reward: 50, kind: 'fullGrown',   goal: null },
  reached('adult-2', 'last', 2, 'Two grown-up creatures', 40),
  reached('adult-4', 'last', 4, 'Four grown-up creatures', 50),
  reached('adult-8', 'last', 8, 'Eight grown-up creatures', 60),
  reached('adult-12', 'last', 12, 'Twelve grown-up creatures', 70),
  reached('adult-16', 'last', 16, 'Every creature grown up', 90),

  // Families.
  reached('adult-dragons', 'last', 1, 'A grown-up dragon', 15, 'dragons'),
  reached('adult-cats', 'last', 1, 'A grown-up cat', 15, 'cats'),
  reached('adult-unicorns', 'last', 1, 'A grown-up unicorn', 15, 'unicorns'),
  reached('adult-wolves', 'last', 1, 'A grown-up wolf', 15, 'wolves'),
  reached('family-dragons', 'last', 4, 'Every dragon grown', 40, 'dragons'),
  reached('family-cats', 'last', 4, 'Every cat grown', 40, 'cats'),
  reached('family-unicorns', 'last', 4, 'Every unicorn grown', 40, 'unicorns'),
  reached('family-wolves', 'last', 4, 'Every wolf grown', 40, 'wolves'),
  { id: 'baby-every-family',  title: 'A little one in every family', reward: 15, kind: 'everyFamily', stage: 1, goal: null },
  { id: 'adult-every-family', title: 'A grown-up in every family',   reward: 50, kind: 'everyFamily', stage: 'last', goal: null },
];
