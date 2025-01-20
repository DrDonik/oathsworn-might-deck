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
  deckNoBlanksEV: number = 0;
  discardAverage: number = 0;
  discardEV: number = 0;
  discardNoBlanksEV: number = 0;

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
    this.deck.sort(() => (Math.random() >= 0.5 ? 1 : -1));
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
    for (let i = 0; i < reshuffleCount; i++) {
      result = result.concat(result);
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
    this.deckNoBlanksEV = cards.length ? MightDeck.calculateNoBlanksEV(cards) : this.discardNoBlanksEV;
    this.deckEV = cards.length ? this.deckNoBlanksEV*this.zeroBlanksProbability(1) : this.discardEV;
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
    this.discardNoBlanksEV = cards.length ? MightDeck.calculateNoBlanksEV(cards) : 0;
    this.discardEV = cards.length ?  this.discardNoBlanksEV*this.zeroBlanksProbability(1) : 0;

    if (this.deck.length === 0) {
      this.deckAverage = this.discardAverage;
      this.deckEV = this.discardEV;
      this.deckNoBlanksEV = this.discardNoBlanksEV;
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
   * @param nCritsDrawn - Number of critical cards already drawn.
   * @param oneBlankDrawn - Whether a blank card has already been drawn.
   * @returns {number} The expected value of the draws.
   */
  static calculateEV(
    cards: { value: number; critical: boolean }[],
    draws: number,
    considerBlanks: boolean,
    nCritsDrawn: number = 0,
    oneBlankDrawn: boolean = false
  ): number {
    if (draws === 0) {
      return 0;
    }
    
    let remainingDeck = [...cards];

    if (!considerBlanks) {
      // blanks are considered elsewhere, remove them from the deck
      remainingDeck = remainingDeck.filter(card => card.value !== 0);
    } else {
      if (oneBlankDrawn) {
        // one blank card has already been drawn, remove it from the deck
        const blankIndex = remainingDeck.findIndex(card => card.value === 0);
        if (blankIndex >= 0) { remainingDeck.splice(blankIndex, 1); }
      }  
    }

    if (remainingDeck.length === 0) {
       // no cards left to draw from
      return 0;
    }
  
    console.log('remainingDeck', remainingDeck);
    const nCrits = remainingDeck.reduce((count, card) => card.critical ? count + 1 : count, 0) - nCritsDrawn;

    if (nCrits === 0) {
      // no critical cards left in the deck
      return remainingDeck.reduce((sum, card) => sum + card.value, 0) / remainingDeck.length * draws;
    }

    // Calculate the base EV from non-blank cards
    const remainingDeckNoCrits = remainingDeck.filter(card => !card.critical);
    const nonCritEv = remainingDeckNoCrits.reduce((sum, card) => sum + card.value, 0) / remainingDeckNoCrits.length;
    const critCard = remainingDeck.find(card => card.critical);
    const critValue = critCard ? critCard.value : 0;
  
    let adjustedEV = 0;
    // Add the adjusted EV from critical chains
    for (let critDrawCount = 0; critDrawCount <= nCrits && critDrawCount <= draws; critDrawCount++) {
      const probCritDrawCount = hypergeometricProbability(remainingDeck.length - nCritsDrawn, draws, nCrits, critDrawCount);

      if (critDrawCount > 0 && probCritDrawCount > 0) {
        adjustedEV += probCritDrawCount * (critDrawCount * (critValue + MightDeck.calculateEV(cards, critDrawCount, true, critDrawCount + nCritsDrawn, oneBlankDrawn)) + (draws - critDrawCount) * nonCritEv);
      } else {
        adjustedEV += probCritDrawCount * (draws  * nonCritEv);
      }
    }

    return adjustedEV;
  }

  static calculateNoBlanksEV(cards: { value: number; critical: boolean }[]): number {
    const nonBlankCards = cards.filter((card) => card.value !== 0);
  
    if (nonBlankCards.length === 0) {
      return 0; // No cards to draw from
    }
  
    // Calculate the base EV from non-blank cards
    const baseEV = nonBlankCards.reduce((sum, card) => sum + card.value, 0);
  
    // If all cards are critical, the EV becomes infinite theoretically.
    if (nonBlankCards.every(card => card.critical)) {
      return baseEV; // Simplify for edge cases
    }
  
    // Add the adjusted EV from critical chains
    const criticalAdjustedEV = cards.some(card => card.critical) ? MightDeck.calculateAdjustedEv(cards) : 0;
  
    return (baseEV + criticalAdjustedEV) / nonBlankCards.length;
  }
  
  static calculateAdjustedEv(cards: { value: number; critical: boolean }[]): number {
  
    const remainingDeck = [...cards];
    const nCrits = remainingDeck.reduce((count, card) => card.critical ? count + 1 : count, 0);

    let adjustedEV = 0;

    for (let i = 0; i < nCrits; i++) {
      const cardIndex = remainingDeck.findIndex(card => card.critical);
      remainingDeck.splice(cardIndex, 1);
      adjustedEV += remainingDeck.reduce((sum, card) => sum + card.value, 0) / remainingDeck.length;
    }

    return adjustedEV;
  }

  static sort(cards: MightCard[]): MightCard[] {
    return [...cards].sort(MightCard.compare);
  }
}
