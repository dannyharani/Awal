export interface AssaghenWord {
  word: string;
  slug: string;
  tifinagh: string;
  meaning: string;
}

export interface AssaghenGroup {
  category: string;
  tier: 1 | 2 | 3 | 4;
  items: AssaghenWord[];
}

export interface AssaghenPuzzle {
  id: string;
  title: string;
  groups: AssaghenGroup[];
}

export interface AnagamWordEntry {
  word: string;
  slug: string;
  tifinagh: string;
  meaning: string;
}

export interface AnagamPuzzle {
  id: string;
  title: string;
  center: string;
  outer: string[];
  /** Built-in offline fallback word list (server API validates the full 18.4k DB too) */
  seedWords: AnagamWordEntry[];
}

export interface CrosswordClue {
  num: number;
  word: string;
  slug: string;
  tifinagh: string;
  clue: string;
  row: number;
  col: number;
}

export interface AgemmayMiniPuzzle {
  id: string;
  title: string;
  grid: string[]; // 5 strings of length 5, '#' for black cells
  across: CrosswordClue[];
  down: CrosswordClue[];
}

export const ASSAGHEN_PUZZLES: AssaghenPuzzle[] = [
  {
    id: 'tamazgha-foundations',
    title: 'Tamazɣa Foundations',
    groups: [
      {
        tier: 1,
        category: 'Earth & Sky Elements',
        items: [
          { word: 'Aman', slug: 'aman', tifinagh: 'ⴰⵎⴰⵏ', meaning: 'water' },
          { word: 'Adrar', slug: 'adrar', tifinagh: 'ⴰⴷⵔⴰⵔ', meaning: 'mountain' },
          { word: 'Tafukt', slug: 'tafukt', tifinagh: 'ⵜⴰⴼⵓⴽⵜ', meaning: 'sun' },
          { word: 'Asif', slug: 'asif', tifinagh: 'ⴰⵙⵉⴼ', meaning: 'river' }
        ]
      },
      {
        tier: 2,
        category: 'Parts of the Body',
        items: [
          { word: 'Afus', slug: 'afus', tifinagh: 'ⴰⴼⵓⵙ', meaning: 'hand' },
          { word: 'Aḍaṛ', slug: 'aḍaṛ', tifinagh: 'ⴰⴹⴰⵕ', meaning: 'foot, leg' },
          { word: 'Ixf', slug: 'ixf', tifinagh: 'ⵉⵅⴼ', meaning: 'head' },
          { word: 'Imi', slug: 'imi', tifinagh: 'ⵉⵎⵉ', meaning: 'mouth' }
        ]
      },
      {
        tier: 3,
        category: 'Family & Kinship',
        items: [
          { word: 'Baba', slug: 'baba', tifinagh: 'ⴱⴰⴱⴰ', meaning: 'father' },
          { word: 'Gma', slug: 'gma', tifinagh: 'ⴳⵎⴰ', meaning: 'my brother' },
          { word: 'Ultma', slug: 'ultma', tifinagh: 'ⵓⵍⵜⵎⴰ', meaning: 'my sister' },
          { word: 'Memmi', slug: 'memmi', tifinagh: 'ⵎⴻⵎⵎⵉ', meaning: 'my son' }
        ]
      },
      {
        tier: 4,
        category: 'Words Featured Across Asafu',
        items: [
          { word: 'Asafu', slug: 'asafu', tifinagh: 'ⴰⵙⴰⴼⵓ', meaning: 'lit torch / firebrand' },
          { word: 'Awal', slug: 'awal', tifinagh: 'ⴰⵡⴰⵍ', meaning: 'speech, language' },
          { word: 'Adlis', slug: 'adlis', tifinagh: 'ⴰⴷⵍⵉⵙ', meaning: 'book, manual' },
          { word: 'Azul', slug: 'azul', tifinagh: 'ⴰⵣⵓⵍ', meaning: 'hello, peace' }
        ]
      }
    ]
  },
  {
    id: 'daily-life-tamazight',
    title: 'Everyday Tamaziɣt',
    groups: [
      {
        tier: 1,
        category: 'Traditional Kitchen & Table',
        items: [
          { word: 'Abaw', slug: 'abaw', tifinagh: 'ⴰⴱⴰⵡ', meaning: 'broad bean' },
          { word: 'Udi', slug: 'udi', tifinagh: 'ⵓⴷⵉ', meaning: 'salted butter' },
          { word: 'Amud', slug: 'amud', tifinagh: 'ⴰⵎⵓⴷ', meaning: 'seeds' },
          { word: 'Afan', slug: 'afan', tifinagh: 'ⴰⴼⴰⵏ', meaning: 'clay baking dish' }
        ]
      },
      {
        tier: 2,
        category: 'Wildlife & Creatures',
        items: [
          { word: 'Ifis', slug: 'ifis', tifinagh: 'ⵉⴼⵉⵙ', meaning: 'hyena' },
          { word: 'Agḍiḍ', slug: 'agḍiḍ', tifinagh: 'ⴰⴳⴹⵉⴹ', meaning: 'bird' },
          { word: 'Amcic', slug: 'amcic', tifinagh: 'ⴰⵎⵛⵉⵛ', meaning: 'cat' },
          { word: 'Gaga', slug: 'gaga', tifinagh: 'ⴳⴰⴳⴰ', meaning: 'whale' }
        ]
      },
      {
        tier: 3,
        category: 'Home & Places',
        items: [
          { word: 'Axxam', slug: 'axxam', tifinagh: 'ⴰⵅⵅⴰⵎ', meaning: 'room / home' },
          { word: 'Taddart', slug: 'taddart', tifinagh: 'ⵜⴰⴷⴷⴰⵔⵜ', meaning: 'house / village' },
          { word: 'Tamurt', slug: 'tamurt', tifinagh: 'ⵜⴰⵎⵓⵔⵜ', meaning: 'land, homeland' },
          { word: 'Abrid', slug: 'abrid', tifinagh: 'ⴰⴱⵔⵉⴷ', meaning: 'road, path' }
        ]
      },
      {
        tier: 4,
        category: 'Night Sky & Time',
        items: [
          { word: 'Ayyur', slug: 'ayyur', tifinagh: 'ⴰⵢⵢⵓⵔ', meaning: 'moon, month' },
          { word: 'Itri', slug: 'itri', tifinagh: 'ⵉⵜⵔⵉ', meaning: 'star' },
          { word: 'Ussan', slug: 'ussan', tifinagh: 'ⵓⵙⵙⴰⵏ', meaning: 'days' },
          { word: 'Akal', slug: 'akal', tifinagh: 'ⴰⴽⴰⵍ', meaning: 'earth, ground' }
        ]
      }
    ]
  }
];

export const ANAGAM_PUZZLES: AnagamPuzzle[] = [
  {
    id: 'wheel-a-dgmnru',
    title: 'Root Wheel · Aman & Adrar',
    center: 'a',
    outer: ['d', 'g', 'm', 'n', 'r', 'u'],
    seedWords: [
      { word: 'aman', slug: 'aman', tifinagh: 'ⴰⵎⴰⵏ', meaning: 'water' },
      { word: 'adrar', slug: 'adrar', tifinagh: 'ⴰⴷⵔⴰⵔ', meaning: 'mountain' },
      { word: 'amud', slug: 'amud', tifinagh: 'ⴰⵎⵓⴷ', meaning: 'seeds' },
      { word: 'anagam', slug: 'anagam', tifinagh: 'ⴰⵏⴰⴳⴰⵎ', meaning: 'water-drawer / seeker' },
      { word: 'amgar', slug: 'amgar', tifinagh: 'ⴰⵎⴳⴰⵔ', meaning: 'harvest / sickle' },
      { word: 'anrar', slug: 'anrar', tifinagh: 'ⴰⵏⵔⴰⵔ', meaning: 'threshing floor' },
      { word: 'amnar', slug: 'amnar', tifinagh: 'ⴰⵎⵏⴰⵔ', meaning: 'lintel / threshold' },
      { word: 'agmar', slug: 'agmar', tifinagh: 'ⴰⴳⵎⴰⵔ', meaning: 'stallion / horse' },
      { word: 'admar', slug: 'admar', tifinagh: 'ⴰⴷⵎⴰⵔ', meaning: 'chest, hillside' },
      { word: 'agra', slug: 'agra', tifinagh: 'ⴰⴳⵔⴰ', meaning: 'bucket, tub' },
      { word: 'agar', slug: 'agar', tifinagh: 'ⴰⴳⴰⵔ', meaning: 'to exceed / remain' },
      { word: 'madar', slug: 'madar', tifinagh: 'ⵎⴰⴷⴰⵔ', meaning: 'axis' },
      { word: 'marr', slug: 'marr', tifinagh: 'ⵎⴰⵔⵔ', meaning: 'to pass, cross' },
      { word: 'adar', slug: 'adar', tifinagh: 'ⴰⴷⴰⵔ', meaning: 'to lower, stoop' }
    ]
  },
  {
    id: 'wheel-a-gmnruz',
    title: 'Root Wheel · Z-M-G Family',
    center: 'a',
    outer: ['g', 'm', 'n', 'r', 'u', 'z'],
    seedWords: [
      { word: 'aman', slug: 'aman', tifinagh: 'ⴰⵎⴰⵏ', meaning: 'water' },
      { word: 'anagam', slug: 'anagam', tifinagh: 'ⴰⵏⴰⴳⴰⵎ', meaning: 'person who draws water' },
      { word: 'amgun', slug: 'amgun', tifinagh: 'ⴰⵎⴳⵓⵏ', meaning: 'sleeping fetus / dormant' },
      { word: 'anzar', slug: 'anzar', tifinagh: 'ⴰⵏⵣⴰⵔ', meaning: 'rain' },
      { word: 'azar', slug: 'azar', tifinagh: 'ⴰⵣⴰⵔ', meaning: 'fig / root hair' },
      { word: 'azag', slug: 'azag', tifinagh: 'ⴰⵣⴰⴳ', meaning: 'mane' },
      { word: 'agmar', slug: 'agmar', tifinagh: 'ⴰⴳⵎⴰⵔ', meaning: 'horse' },
      { word: 'azgr', slug: 'azgr', tifinagh: 'ⴰⵣⴳⵔ', meaning: 'ox, bull' },
      { word: 'arram', slug: 'arram', tifinagh: 'ⴰⵔⵔⴰⵎ', meaning: 'attempt, trial' },
      { word: 'agaraz', slug: 'agaraz', tifinagh: 'ⴰⴳⴰⵔⴰⵣ', meaning: 'pleasing' },
      { word: 'marr', slug: 'marr', tifinagh: 'ⵎⴰⵔⵔ', meaning: 'to pass' }
    ]
  }
];

export const AGEMMAY_MINI_PUZZLES: AgemmayMiniPuzzle[] = [
  {
    id: 'mini-1-aman-abaw',
    title: 'Agemmay Mini · Aman & Adraz',
    grid: ['#abaw', 'abrda', 'mrurd', 'arras', 'nziz#'],
    across: [
      { num: 1, word: 'abaw', slug: 'abaw', tifinagh: 'ⴰⴱⴰⵡ', clue: 'Broad bean (fava)', row: 0, col: 1 },
      { num: 5, word: 'abrda', slug: 'abrda', tifinagh: 'ⴰⴱⵔⴷⴰ', clue: 'Desert sand', row: 1, col: 0 },
      { num: 6, word: 'mrurd', slug: 'mrurd', tifinagh: 'ⵎⵔⵓⵔⴷ', clue: 'To crawl on the ground', row: 2, col: 0 },
      { num: 7, word: 'arras', slug: 'arras', tifinagh: 'ⴰⵔⵔⴰⵙ', clue: 'Cleaning, sweeping', row: 3, col: 0 },
      { num: 8, word: 'nziz', slug: 'nziz', tifinagh: 'ⵏⵣⵉⵣ', clue: 'Hum, buzzing sound', row: 4, col: 0 }
    ],
    down: [
      { num: 1, word: 'abrrz', slug: 'abrrz', tifinagh: 'ⴰⴱⵔⵔⵣ', clue: 'Act of blowing horns', row: 0, col: 1 },
      { num: 2, word: 'bruri', slug: 'bruri', tifinagh: 'ⴱⵔⵓⵔⵉ', clue: 'To form lumps', row: 0, col: 2 },
      { num: 3, word: 'adraz', slug: 'adraz', tifinagh: 'ⴰⴷⵔⴰⵣ', clue: 'Traditional dance', row: 0, col: 3 },
      { num: 4, word: 'wads', slug: 'wads', tifinagh: 'ⵡⴰⴷⵙ', clue: 'To move towards', row: 0, col: 4 },
      { num: 5, word: 'aman', slug: 'aman', tifinagh: 'ⴰⵎⴰⵏ', clue: 'Water (essential liquid)', row: 1, col: 0 }
    ]
  },
  {
    id: 'mini-2-baba-dadda',
    title: 'Agemmay Mini · Baba & Dadda',
    grid: ['#baba', 'andad', 'dadda', 'adadr', 'smmu#'],
    across: [
      { num: 1, word: 'baba', slug: 'baba', tifinagh: 'ⴱⴰⴱⴰ', clue: 'My father', row: 0, col: 1 },
      { num: 5, word: 'andad', slug: 'andad', tifinagh: 'ⴰⵏⴷⴰⴷ', clue: 'Cap, capsule', row: 1, col: 0 },
      { num: 6, word: 'dadda', slug: 'dadda', tifinagh: 'ⴷⴰⴷⴷⴰ', clue: 'Grandfather / elder brother', row: 2, col: 0 },
      { num: 7, word: 'adadr', slug: 'adadr', tifinagh: 'ⴰⴷⴰⴷⵔ', clue: 'Drinking in large gulps', row: 3, col: 0 },
      { num: 8, word: 'smmu', slug: 'smmu', tifinagh: 'ⵙⵎⵎⵓ', clue: 'To name', row: 4, col: 0 }
    ],
    down: [
      { num: 1, word: 'bnadm', slug: 'bnadm', tifinagh: 'ⴱⵏⴰⴷⵎ', clue: 'Human being, person', row: 0, col: 1 },
      { num: 2, word: 'addam', slug: 'addam', tifinagh: 'ⴰⴷⴷⴰⵎ', clue: 'Act of biting', row: 0, col: 2 },
      { num: 3, word: 'baddu', slug: 'baddu', tifinagh: 'ⴱⴰⴷⴷⵓ', clue: 'Traditional slipper', row: 0, col: 3 },
      { num: 4, word: 'adar', slug: 'adar', tifinagh: 'ⴰⴷⴰⵔ', clue: 'To lower, stoop', row: 0, col: 4 },
      { num: 5, word: 'adas', slug: 'adas', tifinagh: 'ⴰⴷⴰⵙ', clue: 'Proximity, closeness', row: 1, col: 0 }
    ]
  }
];
