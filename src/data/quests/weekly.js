// The weekly pool. Every Monday three of these are drawn, one per tier, and they stay for that
// week only; the same quest can come back in a later week, never in the week straight after.
// Data only: the rules live in src/core/weekly.js. Goals are sized for a child doing about 20
// blocks a week, and rewards average about 12 coins a quest (easy ~7, medium ~12, hard ~19).
//
// Kinds, all counted over the current Monday-to-Sunday week:
//   weekBlocks   blocks finished          weekMinutes  minutes of focus
//   weekDays     days with any block      weekBestDay  blocks in the best single day
//   weekFoods    foods bought             weekItems    pieces of furniture bought
export const weeklyPool = [
  // Easy
  { id: 'wk-blocks-3', title: 'Three blocks', kind: 'weekBlocks', goal: 3, reward: 6, tier: 'easy' },
  { id: 'wk-blocks-4', title: 'Four blocks', kind: 'weekBlocks', goal: 4, reward: 7, tier: 'easy' },
  { id: 'wk-blocks-5', title: 'Five blocks', kind: 'weekBlocks', goal: 5, reward: 8, tier: 'easy' },
  { id: 'wk-minutes-60', title: 'An hour of focus', kind: 'weekMinutes', goal: 60, reward: 7, tier: 'easy' },
  { id: 'wk-days-2', title: 'Study on two days', kind: 'weekDays', goal: 2, reward: 6, tier: 'easy' },
  { id: 'wk-days-3', title: 'Study on three days', kind: 'weekDays', goal: 3, reward: 8, tier: 'easy' },
  { id: 'wk-best-2', title: 'A two-block day', kind: 'weekBestDay', goal: 2, reward: 6, tier: 'easy' },
  { id: 'wk-best-3', title: 'A three-block day', kind: 'weekBestDay', goal: 3, reward: 7, tier: 'easy' },
  { id: 'wk-foods-1', title: 'A treat for your creature', kind: 'weekFoods', goal: 1, reward: 6, tier: 'easy' },
  { id: 'wk-foods-2', title: 'Two treats', kind: 'weekFoods', goal: 2, reward: 7, tier: 'easy' },
  { id: 'wk-items-1', title: 'Something new for the lair', kind: 'weekItems', goal: 1, reward: 8, tier: 'easy' },

  // Medium
  { id: 'wk-blocks-8', title: 'Eight blocks', kind: 'weekBlocks', goal: 8, reward: 11, tier: 'medium' },
  { id: 'wk-blocks-10', title: 'Ten blocks', kind: 'weekBlocks', goal: 10, reward: 12, tier: 'medium' },
  { id: 'wk-blocks-12', title: 'Twelve blocks', kind: 'weekBlocks', goal: 12, reward: 13, tier: 'medium' },
  { id: 'wk-minutes-120', title: 'Two hours of focus', kind: 'weekMinutes', goal: 120, reward: 12, tier: 'medium' },
  { id: 'wk-minutes-180', title: 'Three hours of focus', kind: 'weekMinutes', goal: 180, reward: 18, tier: 'hard' },
  { id: 'wk-days-4', title: 'Study on four days', kind: 'weekDays', goal: 4, reward: 12, tier: 'medium' },
  { id: 'wk-best-4', title: 'A four-block day', kind: 'weekBestDay', goal: 4, reward: 11, tier: 'medium' },
  { id: 'wk-best-5', title: 'A five-block day', kind: 'weekBestDay', goal: 5, reward: 13, tier: 'medium' },
  { id: 'wk-foods-3', title: 'Three treats', kind: 'weekFoods', goal: 3, reward: 11, tier: 'medium' },
  { id: 'wk-foods-4', title: 'A feast of four treats', kind: 'weekFoods', goal: 4, reward: 12, tier: 'medium' },
  { id: 'wk-items-2', title: 'Two new things for the lair', kind: 'weekItems', goal: 2, reward: 13, tier: 'medium' },
  { id: 'wk-blocks-6', title: 'Six blocks', kind: 'weekBlocks', goal: 6, reward: 11, tier: 'medium' },

  // Hard
  { id: 'wk-blocks-15', title: 'Fifteen blocks', kind: 'weekBlocks', goal: 15, reward: 18, tier: 'hard' },
  { id: 'wk-blocks-18', title: 'Eighteen blocks', kind: 'weekBlocks', goal: 18, reward: 19, tier: 'hard' },
  { id: 'wk-blocks-20', title: 'Twenty blocks', kind: 'weekBlocks', goal: 20, reward: 20, tier: 'hard' },
  { id: 'wk-days-5', title: 'Study on five days', kind: 'weekDays', goal: 5, reward: 18, tier: 'hard' },
  { id: 'wk-days-6', title: 'Study on six days', kind: 'weekDays', goal: 6, reward: 20, tier: 'hard' },
  { id: 'wk-best-6', title: 'A six-block day', kind: 'weekBestDay', goal: 6, reward: 18, tier: 'hard' },
  { id: 'wk-best-7', title: 'A seven-block day', kind: 'weekBestDay', goal: 7, reward: 19, tier: 'hard' },
  { id: 'wk-foods-6', title: 'A banquet of six treats', kind: 'weekFoods', goal: 6, reward: 18, tier: 'hard' },
  { id: 'wk-items-3', title: 'Three new things for the lair', kind: 'weekItems', goal: 3, reward: 19, tier: 'hard' },
  { id: 'wk-blocks-16', title: 'Sixteen blocks', kind: 'weekBlocks', goal: 16, reward: 18, tier: 'hard' },
];
