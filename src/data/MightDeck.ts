import MightCard from './MightCard';
import MightDice from './MightDice';
import { factorial } from './MathFunctions';

export default class MightDeck {
  dice: MightDice;
  private _deck: MightCard[];
  display: MightCard[];
  private _discard: MightCard[];
  deckAverage: number;
  deckEV: number;
  deckNoBlanksEV: number;
  discardAverage: number;
  discardEV: number;
  discardNoBlanksEV: number;

  constructor(dice: MightDice, deck?: MightCard[], display?: MightCard[], discard?: MightCard[]) {
    this.dice = dice;
    this._deck = deck
      ? [...deck]
      : [...dice.faces, ...dice.faces, ...dice.faces];
    this.display = display ? [...display] : [];
    this._discard = discard ? [...discard] : [];
    this.deckAverage = this.deck.length ? this.deck.reduce((sum, card) => sum + card.value, 0)/this.deck.length : 0;
    this.deckEV = this.deck.length ? MightDeck.calculateEV(this.deck) : 0
    this.deckNoBlanksEV = this.deck.length ? MightDeck.calculateNoBlanksEV(this.deck) : 0
    this.discardAverage = this.discard.length ? this.discard.reduce((sum, card) => sum + card.value, 0)/this.discard.length : 0;
    this.discardEV = this.discard.length ? MightDeck.calculateEV(this.discard) : 0;
    this.discardNoBlanksEV = this.discard.length ? MightDeck.calculateNoBlanksEV(this.discard) : 0
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

  discardDisplay() {
    this.discard = [ ...this.discard, ...this.display];
    this.display = [];
  }

  get size(): number {
    return this.deck.length + this.display.length + this.discard.length;
  }

  get blanks(): number {
    return this.deck.filter((v) => !v.value).length;
  }

  get crits(): number {
    return this.deck.filter((v) => v.critical).length;
  }

  get deck() {
    return this._deck;
  }

  set deck(cards: MightCard[]) {
    this._deck = cards;
    this.deckAverage = cards.length ? this.deck.reduce((sum, card) => sum + card.value, 0)/this.deck.length : this.discardAverage;
    this.deckEV = cards.length ? MightDeck.calculateEV(this.deck) : this.discardEV;
    this.deckNoBlanksEV = cards.length ? MightDeck.calculateNoBlanksEV(this.deck) : this.discardEV;
  }

  get discard() {
    return this._discard;
  }

  set discard(cards: MightCard[]) {
    this._discard = cards;
    this.discardAverage = cards.length ? this.discard.reduce((sum, card) => sum + card.value, 0)/this.discard.length : 0;
    this.discardEV = cards.length ?  MightDeck.calculateEV(this.discard) : 0;
    this.discardNoBlanksEV = cards.length ? MightDeck.calculateNoBlanksEV(this.discard) : 0;

    if (this.deck.length === 0) {
      this.deckAverage = this.discardAverage;
      this.deckEV = this.discardEV;
      this.deckNoBlanksEV = this.discardNoBlanksEV;
    }
  }


  static probZeroBlank(cards: { value: number }[], discards: { value: number }[], drawSize: number): number {
    const deckSize = cards.length;
    const blanksInDeck = cards.filter((card) => !card.value).length;

    if(drawSize <= deckSize && blanksInDeck === 0)
      return 1;

    if(drawSize >= deckSize && blanksInDeck !== 0)
      return 0;

    if (drawSize > deckSize) {
      // reaching this point, there is zero blank in the deck

      return MightDeck.probZeroBlank(discards, [], drawSize-deckSize);
    }

    // reaching this point, there are some blanks in the deck
    if(drawSize > deckSize-blanksInDeck)
      return 0;

    // drawsize <= decksize-blanksInDeck

    return factorial(deckSize-blanksInDeck)/factorial(deckSize-blanksInDeck-drawSize)*factorial(deckSize-drawSize)/factorial(deckSize);
  }

  static probOneBlank(cards: { value: number }[], discards: { value: number }[], drawSize: number): number {
    const deckSize = cards.length;
    const blanksInDeck = cards.filter((card) => !card.value).length;
    
    if (drawSize === 0)
      return 0;

    if(drawSize === deckSize)
      return blanksInDeck === 1 ? 1 : 0;
    
    if(drawSize >= deckSize && blanksInDeck > 1)
      return 0;

    if (drawSize > deckSize) {
      // reaching this point, there is 0 or 1 blank in the deck

      return blanksInDeck ? MightDeck.probZeroBlank(discards, [], drawSize-deckSize) : MightDeck.probOneBlank(discards, [], drawSize-deckSize);
    }

    if(drawSize > deckSize-blanksInDeck+1)
      return 0;
  
    return blanksInDeck*drawSize*factorial(deckSize - blanksInDeck)/factorial(deckSize-blanksInDeck-drawSize+1)*factorial(deckSize-drawSize)/factorial(deckSize);
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

  static calculateEV(cards: { value: number; critical: boolean }[]): number {
    let total = cards.reduce((sum, card) => sum + card.value, 0);
    const nCrits = cards.filter((card) => card.critical).length;

    if (cards.every(card => card.critical)) {
      return cards.length > 0 ? total : 0;
    }

    if (cards.some(card => card.critical)) {
      total += MightDeck.calculateAdjustedEv(cards)*nCrits;
    }

    return cards.length > 0 ? total / cards.length : 0;
  }

  static calculateNoBlanksEV(cards: { value: number; critical: boolean}[]): number {
    const nonBlankCards = cards.filter((card) => card.value !== 0);

    let total = nonBlankCards.reduce((sum, card) => sum + card.value, 0);
    const nCrits = nonBlankCards.filter((card) => card.critical).length;

    if (nonBlankCards.every(card => card.critical)) {
      return nonBlankCards.length > 0 ? total : 0;
    }

    if (nonBlankCards.some(card => card.critical)) {
      total += MightDeck.calculateAdjustedEv(cards)*nCrits;
    }

    return cards.length > 0 ? total / nonBlankCards.length : 0;
  }

  static calculateAdjustedEv(cards: { value: number; critical: boolean }[]): number {
    let totalAdjustedEv = 0;
    let remainingDeck = [...cards];

    let cardIndex = remainingDeck.findIndex(card => card.critical);

    remainingDeck = [...remainingDeck.slice(0, cardIndex), ...remainingDeck.slice(cardIndex + 1)];

    totalAdjustedEv += this.calculateEV(remainingDeck);

    return totalAdjustedEv;
  }

  static sort(cards: MightCard[]): MightCard[] {
    return [...cards].sort(MightCard.compare);
  }
}
