import { getRandomWords } from '../../server/words';

describe('getRandomWords', () => {
  it('should return 3 words', () => {
    const words = getRandomWords();

    expect(words).toHaveLength(3);
  });

  it('should return words with different difficulties', () => {
    const words = getRandomWords();
    const difficulties = words.map((w) => w.difficulty);

    expect(difficulties).toContain('easy');
    expect(difficulties).toContain('medium');
    expect(difficulties).toContain('hard');
  });

  it('should return correct point values for difficulties', () => {
    const words = getRandomWords();

    const easyWord = words.find((w) => w.difficulty === 'easy');
    const mediumWord = words.find((w) => w.difficulty === 'medium');
    const hardWord = words.find((w) => w.difficulty === 'hard');

    expect(easyWord?.points).toBe(10);
    expect(mediumWord?.points).toBe(50);
    expect(hardWord?.points).toBe(100);
  });

  it('should return valid word strings', () => {
    const words = getRandomWords();

    words.forEach((word) => {
      expect(word.text).toBeTruthy();
      expect(typeof word.text).toBe('string');
      expect(word.text.length).toBeGreaterThan(0);
    });
  });

  it('should return different words on multiple calls', () => {
    const words1 = getRandomWords();
    const words2 = getRandomWords();

    // Very unlikely to get the exact same 3 words
    const same = words1.every((w1, i) => w1.text === words2[i].text);
    expect(same).toBe(false);
  });
});
