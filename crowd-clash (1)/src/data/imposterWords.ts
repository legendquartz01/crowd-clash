export interface ImposterWordEntry {
  word: string;
  category: string;
}

export interface ImposterCategoryGroup {
  category: string;
  words: readonly string[];
}

/**
 * 162 distinct secret words across 9 varied categories (18 per category).
 */
export const IMPOSTER_WORD_GROUPS: readonly ImposterCategoryGroup[] = [
  {
    category: 'Food & Drinks',
    words: [
      'Pizza',
      'Sushi',
      'Tacos',
      'Ramen',
      'Croissant',
      'Pancakes',
      'Espresso',
      'Bubble Tea',
      'Guacamole',
      'Cheeseburger',
      'Ice Cream',
      'Popcorn',
      'Dumplings',
      'Lasagna',
      'Waffles',
      'Smoothie',
      'Pretzel',
      'Tiramisu',
    ],
  },
  {
    category: 'Places',
    words: [
      'Airport',
      'Hospital',
      'Library',
      'Beach',
      'Movie Theater',
      'Amusement Park',
      'Gym',
      'Museum',
      'Subway Station',
      'Coffee Shop',
      'Bowling Alley',
      'Aquarium',
      'Ski Resort',
      'Camping Site',
      'Supermarket',
      'Rooftop Bar',
      'Zoo',
      'Lighthouse',
    ],
  },
  {
    category: 'Movies & TV',
    words: [
      'Titanic',
      'Jurassic Park',
      'Inception',
      'Stranger Things',
      'The Matrix',
      'Toy Story',
      'Harry Potter',
      'Star Wars',
      'Breaking Bad',
      'Avatar',
      'The Office',
      'Spider-Man',
      'Frozen',
      'Squid Game',
      'Shrek',
      'Interstellar',
      'Game of Thrones',
      'Finding Nemo',
    ],
  },
  {
    category: 'Tech & Apps',
    words: [
      'Instagram',
      'Spotify',
      'YouTube',
      'ChatGPT',
      'TikTok',
      'Uber',
      'Netflix',
      'Google Maps',
      'AirPods',
      'Smartwatch',
      'Bluetooth',
      'Wi-Fi Router',
      'Discord',
      'Drone',
      'VR Headset',
      'Power Bank',
      'QR Code',
      'WhatsApp',
    ],
  },
  {
    category: 'Sports',
    words: [
      'Basketball',
      'Soccer',
      'Tennis',
      'Baseball',
      'Swimming',
      'Boxing',
      'Skateboarding',
      'Surfing',
      'Volleyball',
      'Golf',
      'Archery',
      'Table Tennis',
      'Ice Hockey',
      'Snowboarding',
      'Rock Climbing',
      'Badminton',
      'Gymnastics',
      'Formula 1',
    ],
  },
  {
    category: 'Everyday Objects',
    words: [
      'Umbrella',
      'Toothbrush',
      'Backpack',
      'Sunglasses',
      'Alarm Clock',
      'Scissors',
      'Pillow',
      'Water Bottle',
      'Flashlight',
      'Keychain',
      'Mirror',
      'Headphones',
      'Suitcase',
      'Candle',
      'Stapler',
      'Wallet',
      'Coffee Mug',
      'Blanket',
    ],
  },
  {
    category: 'Animals',
    words: [
      'Penguin',
      'Dolphin',
      'Chameleon',
      'Kangaroo',
      'Octopus',
      'Flamingo',
      'Cheetah',
      'Elephant',
      'Koala',
      'Owl',
      'Panda',
      'Shark',
      'Giraffe',
      'Hedgehog',
      'Peacock',
      'Sloth',
      'Wolf',
      'Sea Turtle',
    ],
  },
  {
    category: 'Music & Pop Culture',
    words: [
      'Karaoke',
      'Electric Guitar',
      'Vinyl Record',
      'Music Festival',
      'DJ Booth',
      'Piano',
      'Taylor Swift',
      'Beyoncé',
      'The Beatles',
      'Podcast',
      'Anime',
      'Red Carpet',
      'Autograph',
      'Drum Set',
      'Cosplay',
      'Broadway',
      'Boy Band',
      'Grammy Award',
    ],
  },
  {
    category: 'Jobs',
    words: [
      'Firefighter',
      'Chef',
      'Astronaut',
      'Pilot',
      'Detective',
      'Dentist',
      'Barista',
      'Photographer',
      'Architect',
      'Lifeguard',
      'Magician',
      'Veterinarian',
      'DJ',
      'Surgeon',
      'Flight Attendant',
      'Software Engineer',
      'News Anchor',
      'Tour Guide',
    ],
  },
];

export const IMPOSTER_WORDS: readonly ImposterWordEntry[] = IMPOSTER_WORD_GROUPS.flatMap((group) =>
  group.words.map((word) => ({
    word,
    category: group.category,
  }))
);

/**
 * Picks a random word without repeating any word in `usedWords`.
 * Once the entire bank has been exhausted, resets history while still avoiding the previous word.
 */
export function pickNextImposterWord(usedWords: string[]): {
  entry: ImposterWordEntry;
  nextUsedWords: string[];
} {
  const usedSet = new Set(usedWords);
  let available = IMPOSTER_WORDS.filter((item) => !usedSet.has(item.word));
  let resetUsed = false;

  if (available.length === 0) {
    resetUsed = true;
    const lastWord = usedWords[usedWords.length - 1];
    available = IMPOSTER_WORDS.filter((item) => item.word !== lastWord);
  }

  const pick = available[Math.floor(Math.random() * available.length)] ?? IMPOSTER_WORDS[0];
  const nextUsedWords = resetUsed ? [pick.word] : [...usedWords, pick.word];

  return { entry: pick, nextUsedWords };
}
