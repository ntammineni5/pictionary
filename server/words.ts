import { Word, Difficulty } from '../types';

const wordsByDifficulty: Record<Difficulty, string[]> = {
  easy: [
    'cat', 'dog', 'sun', 'moon', 'star', 'tree', 'house', 'car', 'boat', 'fish',
    'bird', 'ball', 'book', 'chair', 'table', 'door', 'window', 'flower', 'apple', 'banana',
    'hat', 'shoe', 'cup', 'plate', 'key', 'watch', 'phone', 'lamp', 'bed', 'clock'
  ],
  medium: [
    'elephant', 'butterfly', 'mountain', 'rainbow', 'castle', 'dragon', 'guitar', 'umbrella',
    'lighthouse', 'volcano', 'penguin', 'kangaroo', 'dinosaur', 'astronaut', 'telescope',
    'pyramid', 'waterfall', 'submarine', 'helicopter', 'lighthouse', 'campfire', 'snowman',
    'surfboard', 'skateboard', 'basketball', 'playground', 'television', 'refrigerator'
  ],
  hard: [
    'architecture', 'kaleidoscope', 'metamorphosis', 'photosynthesis', 'constellation',
    'expedition', 'silhouette', 'equilibrium', 'renaissance', 'phenomenon', 'constellation',
    'infrastructure', 'synchronization', 'transparency', 'biodiversity', 'contemplation',
    'acceleration', 'cryptocurrency', 'deforestation', 'globalization', 'sustainability'
  ]
};

const difficultyPoints: Record<Difficulty, number> = {
  easy: 10,
  medium: 50,
  hard: 100
};

export function getRandomWords(): Word[] {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
  return difficulties.map(difficulty => {
    const words = wordsByDifficulty[difficulty];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    return {
      text: randomWord,
      difficulty,
      points: difficultyPoints[difficulty]
    };
  });
}
