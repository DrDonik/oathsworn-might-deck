import MightCard from './MightCard';
import MightDeck from './MightDeck';
import { BlackDice, RedDice, WhiteDice, YellowDice } from './MightDice';

const toleratedRelativeError = 0.05;

describe('MightDeck', () => {
  describe('.sort()', () => {
    it('sort cards based on values and critical', () => {
      expect(
        MightDeck.sort([
          new MightCard(3),
          new MightCard(2),
          new MightCard(3, true),
          new MightCard(1),
          new MightCard(0),
          new MightCard(0),
        ]),
      ).toEqual([
        new MightCard(0),
        new MightCard(0),
        new MightCard(1),
        new MightCard(2),
        new MightCard(3),
        new MightCard(3, true),
      ]);
    });
  });

  describe('.toString()', () => {
    it('displays the deck and discard pile', () => {
      const whiteDeck = new MightDeck(new WhiteDice());
      const yellowDeck = new MightDeck(new YellowDice());
      const redDeck = new MightDeck(new RedDice());
      const blackDeck = new MightDeck(new BlackDice());
      expect(whiteDeck.toString()).toEqual(`Deck(18):
[0]x6 [1]x6 [2]x3 {2}x3
Discard(0):
`);
      expect(yellowDeck.toString()).toEqual(`Deck(18):
[0]x6 [1]x3 [2]x3 [3]x3 {3}x3
Discard(0):
`);
      expect(redDeck.toString()).toEqual(`Deck(18):
[0]x6 [2]x3 [3]x6 {4}x3
Discard(0):
`);
      expect(blackDeck.toString()).toEqual(`Deck(18):
[0]x6 [3]x6 [4]x3 {5}x3
Discard(0):
`);
    });
  });

  describe('.shuffle()', () => {
    it('shuffles the deck', () => {
      const deck = new MightDeck(new WhiteDice());
      const originalDeck = [...deck.deck];
      const originalDeckContent = deck.toString();

      deck.shuffle();
      expect(deck.size).toEqual(18);
      expect(deck.deck.length).toEqual(18);
      expect(deck.deck).not.toEqual(originalDeck);
      expect(deck.toString()).toEqual(originalDeckContent);
    });
  });

  describe('.drawN', () => {
    it('draws from the top deck and adds to the display', () => {
      const deck = new MightDeck(new WhiteDice(), [
        new MightCard(0),
        new MightCard(1),
        new MightCard(2),
        new MightCard(3)
      ]);
      const result = deck.drawN(2);
      expect(result).toHaveLength(2);
      expect(result).toEqual([new MightCard(0), new MightCard(1)]);
      expect(deck.deck).toEqual([new MightCard(2), new MightCard(3)]);
      expect(deck.display).toEqual([new MightCard(0), new MightCard(1)]);
      expect(deck.discard).toEqual([]);
    });
  });

  describe('.discardDisplay', () => {
    it('discards the display to the discard pile', () => {
      const deck = new MightDeck(new WhiteDice(), [
        new MightCard(0),
        new MightCard(1),
        new MightCard(2),
        new MightCard(3)
      ]);
      const result = deck.drawN(2);
      deck.discardDisplay();
      expect(result).toHaveLength(2);
      expect(result).toEqual([new MightCard(0), new MightCard(1)]);
      expect(deck.deck).toEqual([new MightCard(2), new MightCard(3)]);
      expect(deck.display).toEqual([]);
      expect(deck.discard).toEqual([new MightCard(0), new MightCard(1)]);
    })
  });

  describe('not enough card from deck', () => {
    it('also draws from discard pile', () => {
      const deck = new MightDeck(new WhiteDice(), 
        [new MightCard(0), new MightCard(1)],
        [new MightCard(2)],
        [new MightCard(3), new MightCard(4)]
      );
      const result = deck.drawN(3);
      expect(result).toHaveLength(3);
      expect(deck.deck).toHaveLength(1);
      expect(deck.display).toHaveLength(4);
      expect(deck.display).toEqual(expect.arrayContaining([new MightCard(0), new MightCard(1), new MightCard(2)]));
      expect(deck.discard).toHaveLength(0);
      expect(MightDeck.sort([...deck.deck, ...deck.display, ...deck.discard])).toEqual([
        new MightCard(0),
        new MightCard(1),
        new MightCard(2),
        new MightCard(3),
        new MightCard(4)
      ]);
    });
  });

  describe('.deckEV', () => {
    it('returns the expected value of the next drawn card', () => {
      const deck = new MightDeck(new WhiteDice(), [
        new MightCard(0),
        new MightCard(1),
        new MightCard(2),
      ]);
      expect(deck.deckEV).toEqual(1);
    });
    it('returns the expected value of the next drawn card, including crits', () => {
      const deck = new MightDeck(new WhiteDice(), [
        new MightCard(0),
        new MightCard(1),
        new MightCard(2, true)
      ]);
      expect(Math.abs(7/6-deck.deckEV)/deck.deckEV).toBeLessThanOrEqual(toleratedRelativeError);
    });
    it('returns the expected value of the next drawn card, being the sum if there are only crits', () => {
      const deck = new MightDeck(new WhiteDice(), [
        new MightCard(2, true),
        new MightCard(2, true),
        new MightCard(2, true)
      ]);
      expect(deck.deckEV).toEqual(6);
    });
    it('returns the expected value of the next drawn card, being the sum if there are only crits', () => {
      const deck = new MightDeck(new WhiteDice(), [
        new MightCard(0, false),
        new MightCard(1, false),
        new MightCard(2, false),
        new MightCard(2, false),
        new MightCard(2, true)
      ]);
      expect(Math.abs(1.65-deck.deckEV)/deck.deckEV).toBeLessThanOrEqual(toleratedRelativeError);
    });
  });

  describe('.reset()', () => {
    it('should move all cards from discard to deck, empty discard, keep display unchanged, and update stats', () => {
      const dice = new WhiteDice(); // Using WhiteDice as an example

      // Define card instances using the MightCard constructor (value, critical, color)
      // Cloned for safety to ensure original card objects are not modified if setters/methods do that.
      const cardDeck1 = new MightCard(1, false, 'white').clone();
      const cardDeck2 = new MightCard(2, false, 'white').clone();
      const cardDiscard1 = new MightCard(3, true, 'white').clone(); // Critical card
      const cardDiscard2 = new MightCard(0, false, 'white').clone(); // Blank card
      const cardDisplay1 = new MightCard(5, false, 'white').clone();
      const cardDisplay2 = new MightCard(6, true, 'white').clone();

      const initialDeckCards = [cardDeck1, cardDeck2];
      const initialDiscardCards = [cardDiscard1, cardDiscard2];
      const initialDisplayCards = [cardDisplay1, cardDisplay2];

      // Create and setup the deck
      const deck = new MightDeck(dice);
      deck.deck = [...initialDeckCards];       // Uses setter, calculates initial deck stats
      deck.discard = [...initialDiscardCards]; // Uses setter, calculates initial discard stats
      deck.display = [...initialDisplayCards]; // Direct assignment, display has no specific stats on MightDeck

      // Store the expected state of cards that should be in the deck after reset
      const expectedCardsInDeckAfterReset = [...initialDeckCards, ...initialDiscardCards];

      // Store a deep copy of the display pile for later comparison
      const displayBeforeReset = initialDisplayCards.map(card => card.clone());

      // Calculate expected stats for the deck after reset
      // Create a temporary deck and set its cards to the expected combined deck to get these values
      const tempStatDeck = new MightDeck(dice);
      tempStatDeck.deck = [...expectedCardsInDeckAfterReset]; // This uses the setter, calculating EV and Average
      const expectedDeckEV = tempStatDeck.deckEV;
      const expectedDeckAverage = tempStatDeck.deckAverage;

      // Call the reset method
      deck.reset();

      // 1. Assert that all cards originally in _deck and _discard are now in _deck
      // We sort both arrays to compare contents regardless of order (due to shuffle)
      expect(MightDeck.sort([...deck.deck])).toEqual(MightDeck.sort(expectedCardsInDeckAfterReset));
      expect(deck.deck.length).toBe(expectedCardsInDeckAfterReset.length);

      // 2. Assert that _discard is empty
      expect(deck.discard.length).toBe(0);
      // Assert that discard stats are reset
      expect(deck.discardEV).toBe(0);
      expect(deck.discardAverage).toBe(0);

      // 3. Assert that the display pile remains unchanged
      // This checks for both content and order.
      expect(deck.display).toEqual(displayBeforeReset);
      expect(deck.display.length).toBe(displayBeforeReset.length);


      // 4. Assert that deck's statistical properties are updated correctly
      expect(deck.deckEV).toBeCloseTo(expectedDeckEV, 5); // Using toBeCloseTo for floating point comparisons
      expect(deck.deckAverage).toBeCloseTo(expectedDeckAverage, 5);

      // 5. Assert that _deck has been shuffled
      // The prompt de-emphasized a strong shuffle check. The primary confirmation is that
      // `shuffle()` is called internally by `reset()`. Verifying the deck's contents and
      // stats (as done above) ensures the main functionality.
      // If `expectedCardsInDeckAfterReset` was, e.g., `[cardDeck1, cardDeck2, cardDiscard1, cardDiscard2]`,
      // and `deck.deck` after reset was not equal to this specific order (but contained the same cards),
      // it would indicate shuffling. However, this depends on the initial order and deck size.
      // For this test, we rely on the `shuffle` method itself being tested elsewhere and trust its invocation.
    });
  });
});
