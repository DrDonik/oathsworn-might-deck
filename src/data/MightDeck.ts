import MightCard from './MightCard';
import MightDice from './MightDice';
import { hypergeometricProbability } from '../modules/math';

export default class MightDeck {
  dice: MightDice;
  private _deck: MightCard[] = [];
  display: MightCard[] = [];
  private _discard: MightCard[] = [];
  deckAverage: number = 0;
  deckEV: number = 0;
  discardAverage: number = 0;
  discardEV: number = 0;

  constructor(dice: MightDice, deck?: MightCard[], display?: MightCard[], discard?: MightCard[]) {
    this.dice = dice;
    this.deck = deck
      ? [...deck]
      : [...dice.faces, ...dice.faces, ...dice.faces];
    this.display = display ? [...display] : [];
    this.discard = discard ? [...discard] : [];
  }

  clone(): MightDeck {
    const dup = new MightDeck(this.dice.clone());
    dup.deck = this.deck.map((d) => d.clone());
    dup.display = this.display.map((d) => d.clone());
    dup.discard = this.discard.map((d) => d.clone());
    return dup;
  }

  shuffle(): MightDeck {
    // Use Fisher-Yates (Knuth) shuffle algorithm for unbiased shuffling
    for (let i = this.deck.length - 1; i > 0; i--) {
      // Pick a random index from 0 to i
      const j = Math.floor(Math.random() * (i + 1));
      // Swap elements at i and j
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    return this;
  }

  drawN(times: number = 1): MightCard[] {
    if (this.deck.length === 0) {
      this.deck = this.discard;
      this.discard = [];
      this.shuffle();
    }

    if (times <= this.deck.length) {
      const result = this.deck.splice(0, times);
      this.deck = [...this.deck];
      this.display = [...this.display, ...result];
      return result;
    }

    if (times <= this.deck.length + this.discard.length) {
      let result = [...this.deck];
      this.display = [...this.display, ...result];
      this.deck = this.discard;
      this.discard = [];
      this.shuffle();
      result.push(...this.drawN(times - result.length));
      return result;
    }

    // times > deck.length + discard.length
    const reshuffleCount = Math.floor(times / this.size);
    this.deck = this.deck.concat(this.discard); // TODO: need review, we should draw the deck item first
    this.discard = [];
    let result: MightCard[] = [];
    
    // Fix the bug: instead of concatenating result to itself (which doubles it each iteration),
    // we should add all cards from the deck for each complete reshuffle
    for (let i = 0; i < reshuffleCount; i++) {
      // Create a copy of all cards in the deck
      const allCards = this.deck.map(card => card.clone());
      // Add all cards to the result
      result = result.concat(allCards);
      // These cards have been "drawn" and should be displayed
      this.display = [...this.display, ...allCards];
    }
    
    this.shuffle();
    const remainder = times % this.size;
    const remaining = this.deck.splice(0, remainder);
    result = result.concat(remaining);
    this.discard = remaining;

    return result;
  }

  discardDisplay(cards?: MightCard[]): MightDeck {
    if (cards) {
      // Iterate over each card to discard and remove one matching instance from display
      const updatedDisplay = [...this.display];
      const movedToDiscard: MightCard[] = [];

      cards.forEach((cardToDiscard) => {
        // Find the index of the first matching card in display
        const index = updatedDisplay.findIndex(displayCard => !MightCard.compare(displayCard, cardToDiscard));
        if (index !== -1) {
          // Remove the matching card from display and move it to discard
          movedToDiscard.push(updatedDisplay.splice(index, 1)[0]);
        }
      });

      this.discard = [...this.discard, ...movedToDiscard];
      this.display = updatedDisplay;
    } else {
      if (this.deck.length === 0) {
        this.deck = [ ...this.discard, ...this.display];
        this.discard = []
        this.shuffle();
      } else {
        this.discard = [ ...this.discard, ...this.display];
      }
      this.display = [];
    }
    return this;
  }

  get size(): number {
    return this.deck.length + this.display.length + this.discard.length;
  }

  get nBlanks(): number {
    return this.deck.reduce((count, card) => !card.value ? count + 1 : count, 0);
  }

  get nDiscardedBlanks(): number {
    return this.discard.filter((v) => v.value === 0).length;
  }

  get nCrits(): number {
    return this.deck.reduce((count, card) => card.critical ? count + 1 : count, 0);
  }

  get deck(): MightCard[] {
    return this._deck;
  }

  set deck(cards: MightCard[]) {
    this._deck = cards;
    this.deckAverage = cards.length ? cards.reduce((sum, card) => sum + card.value, 0)/cards.length : this.discardAverage;
    
    if (cards.length === 0) {
      // If deck is empty, use discard values
      this.deckEV = this.discardEV;
    } else {
      this.deckEV = MightDeck.calculateEV(cards, 1, true, false);
    }
  }

  get nDiscardedCriticals(): number {
    return this.discard.filter((v) => v.critical).length;
  }

  get discard(): MightCard[] {
    return this._discard;
  }

  set discard(cards: MightCard[]) {
    this._discard = cards;
    this.discardAverage = cards.length ? cards.reduce((sum, card) => sum + card.value, 0)/cards.length : 0;
    
    if (cards.length === 0) {
      this.discardEV = 0;
    } else {
      this.discardEV = MightDeck.calculateEV(cards, 1, true, false);
    }

    // If main deck is empty, use discard values
    if (this.deck.length === 0) {
      this.deckAverage = this.discardAverage;
      this.deckEV = this.discardEV;
    }
  }

  zeroBlanksProbability(draws: number): number {
    if (draws > this.deck.length) {
      const drafFromDeck = this.deck.length;
      const drafFromDiscard = draws - drafFromDeck;
      return hypergeometricProbability(this.deck.length, drafFromDeck, this.nBlanks, 0) * hypergeometricProbability(this.discard.length, drafFromDiscard, this.nDiscardedBlanks, 0);
    }
    return hypergeometricProbability(this.deck.length, draws, this.nBlanks, 0);
  }

  exactlyOneBlankProbability(draws: number): number {
    if (draws > this.deck.length) {
      const drafFromDeck = this.deck.length;
      const drafFromDiscard = draws - drafFromDeck;
      return hypergeometricProbability(this.deck.length, drafFromDeck, this.nBlanks, 0) * hypergeometricProbability(this.discard.length, drafFromDiscard, this.nDiscardedBlanks, 1) +
        hypergeometricProbability(this.deck.length, drafFromDeck, this.nBlanks, 1) * hypergeometricProbability(this.discard.length, drafFromDiscard, this.nDiscardedBlanks, 0);
    }
    return hypergeometricProbability(this.deck.length, draws, this.nBlanks, 1);
  }

  toString(): string {
    const summarize = (cards: MightCard[]) =>
      Object.entries(
        cards.reduce(
          (p, c) => {
            const key = c.toString();
            p[key] = p[key] ?? 0;
            p[key]++;
            return p;
          },
          {} as { [key: string]: number },
        ),
      )
        .map(([dice, count]) => `${dice}x${count}`)
        .join(' ');
    return `Deck(${this.deck.length}):
${summarize(MightDeck.sort(this.deck))}
Discard(${this.discard.length}):
${summarize(MightDeck.sort(this.discard))}`;
  }

  /**
   * Calculates the expected value (EV) of drawing a certain number of cards from a deck.
   * 
   * @param cards - Array of cards with their values and critical status.
   * @param draws - Number of cards to draw.
   * @param considerBlanks - Whether to consider blank cards in the calculation.
   * @param oneBlankDrawn - Whether a blank card has already been drawn.
   * @param numberedCardsDrawn - Number of numbered cards already drawn.
   * @returns {number} The expected value of the draws.
   */
  static calculateEV(
    cards: { value: number; critical: boolean }[],
    draws: number,
    considerBlanks: boolean,
    oneBlankDrawn: boolean = false,
    numberedCardsDrawn: number = 0,
  ): number {
    if (draws === 0) {
      return 0;
    }
    
    // Make a copy of the deck to work with
    let remainingDeck = [...cards];

    if (!considerBlanks) {
      // blanks are considered elsewhere, remove them from the deck
      remainingDeck = remainingDeck.filter(card => card.value !== 0);
    } else if (oneBlankDrawn) {
      // one blank card has already been drawn, remove it from the deck
      const blankIndex = remainingDeck.findIndex(card => card.value === 0);
      if (blankIndex >= 0) { remainingDeck.splice(blankIndex, 1); }
    }

    if (remainingDeck.length === 0 || draws === 0) {
      return 0;
    }
    
    // If drawing more cards than available, adjust draws
    const actualDraws = Math.min(draws, remainingDeck.length);
    
    // Count criticals
    const nCrits = remainingDeck.reduce((count, card) => card.critical ? count + 1 : count, 0);
    
    // If no criticals, simple calculation
    if (nCrits === 0) {
      const avgValue = remainingDeck.reduce((sum, card) => sum + card.value, 0) / remainingDeck.length;
      return avgValue * actualDraws;
    }
    
    // For critical cards calculations
    let totalEV = 0;
    
    // Calculate probability and EV for each possible number of critical cards drawn
    for (let critDrawCount = 0; critDrawCount <= Math.min(nCrits, actualDraws); critDrawCount++) {
      // Probability of drawing exactly critDrawCount critical cards
      const probCritDrawCount = hypergeometricProbability(
        remainingDeck.length, actualDraws, nCrits, critDrawCount
      );
      
      // Calculate base EV for the non-critical cards in the initial draw
      const nonCritCards = remainingDeck.filter(card => !card.critical);
      const nonCritCardCount = Math.max(0, actualDraws - critDrawCount);
      
      // Average value of non-critical cards
      let nonCritAvg = 0;
      if (nonCritCards.length > 0) {
        const numberedCards = nonCritCards.filter(card => card.value !== 0);
        const nNumberedCards = numberedCards.length;
        const numberedCardsSum = numberedCards.reduce((sum, card) => sum + card.value, 0) / nNumberedCards;
        const nBlankCards = nonCritCards.filter(card => card.value === 0).length;
        nonCritAvg = numberedCardsSum * (nNumberedCards - numberedCardsDrawn) / (nNumberedCards - numberedCardsDrawn + nBlankCards); 
      }
      
      // Critical cards drawn
      const critCards = remainingDeck.filter(card => card.critical);
      const critAvg = critCards.length > 0
        ? critCards.reduce((sum, card) => sum + card.value, 0) / critCards.length
        : 0;
      
      // Base EV for this scenario
      let scenarioEV = (nonCritCardCount * nonCritAvg) + (critDrawCount * critAvg);
      
      // Add bonus draws from crits
      if (critDrawCount > 0) {
        // Remove the drawn criticals from deck for bonus draws
        let deckForBonusDraws = [...cards];
        // Remove criticals that were drawn
        for (let i = 0; i < critDrawCount; i++) {
          const critIndex = deckForBonusDraws.findIndex(card => card.critical);
          if (critIndex >= 0) deckForBonusDraws.splice(critIndex, 1);
        }
        
        // Calculate bonus EV separately for each critical drawn
        const bonusEV = critDrawCount > 0 
          ? MightDeck.calculateEV(deckForBonusDraws, critDrawCount, true, oneBlankDrawn, numberedCardsDrawn + draws - critDrawCount)
          : 0;
        
        scenarioEV += bonusEV;
      }
      
      // Add weighted scenario EV to total
      totalEV += probCritDrawCount * scenarioEV;
    }
    
    return totalEV;
  }

  static sort(cards: MightCard[]): MightCard[] {
    return [...cards].sort(MightCard.compare);
  }
}
