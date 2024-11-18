import MightCard from './MightCard';
import MightDice from './MightDice';
import { factorial } from './MathFunctions';

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
      this.discard = [ ...this.discard, ...this.display.filter(card => cards.includes(card))];
      this.display = [...this.display.filter(card => !cards.includes(card))];
    } else {
      this.discard = [ ...this.discard, ...this.display];
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
    this.deckEV = cards.length ? this.deckNoBlanksEV*MightDeck.probZeroBlank(cards, this.discard, 1) : this.discardEV;
  }

  get discard(): MightCard[] {
    return this._discard;
  }

  set discard(cards: MightCard[]) {
    this._discard = cards;
    this.discardAverage = cards.length ? cards.reduce((sum, card) => sum + card.value, 0)/cards.length : 0;
    this.discardNoBlanksEV = cards.length ? MightDeck.calculateNoBlanksEV(cards) : 0;
    this.discardEV = cards.length ?  this.discardNoBlanksEV*MightDeck.probZeroBlank(cards, [], 1) : 0;

    if (this.deck.length === 0) {
      this.deckAverage = this.discardAverage;
      this.deckEV = this.discardEV;
      this.deckNoBlanksEV = this.discardNoBlanksEV;
    }
  }


  static probZeroBlank(cards: { value: number }[], discards: { value: number }[], drawSize: number): number {
    const deckSize = cards.length;
    const blanksInDeck = cards.reduce((count, card) => !card.value ? count + 1 : count, 0);

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
    const nBlanks = cards.reduce((count, card) => !card.value ? count + 1 : count, 0);
    
    if (drawSize === 0)
      return 0;

    if(drawSize === deckSize)
      return nBlanks === 1 ? 1 : 0;
    
    if(drawSize >= deckSize && nBlanks > 1)
      return 0;

    if (drawSize > deckSize) {
      // reaching this point, there is 0 or 1 blank in the deck

      return nBlanks ? MightDeck.probZeroBlank(discards, [], drawSize-deckSize) : MightDeck.probOneBlank(discards, [], drawSize-deckSize);
    }

    if(drawSize > deckSize-nBlanks+1)
      return 0;
  
    return nBlanks*drawSize*factorial(deckSize - nBlanks)/factorial(deckSize-nBlanks-drawSize+1)*factorial(deckSize-drawSize)/factorial(deckSize);
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

  static calculateNoBlanksEV(cards: { value: number; critical: boolean}[]): number {
    const nonBlankCards = cards.filter((card) => card.value !== 0);

    let total = nonBlankCards.reduce((sum, card) => sum + card.value, 0);

    if (nonBlankCards.every(card => card.critical)) {
      return nonBlankCards.length > 0 ? total : 0;
    }

    if (nonBlankCards.some(card => card.critical)) {
      total += MightDeck.calculateAdjustedEv(cards);
    }

    return cards.length > 0 ? total / nonBlankCards.length : 0;
  }

  static calculateAdjustedEv(cards: { value: number; critical: boolean }[]): number {
    let remainingDeck = [...cards]
    let adjustedEV = 0

    while (remainingDeck.some(card => card.critical)) {
      const cardIndex = remainingDeck.findIndex(card => card.critical);
      remainingDeck.splice(cardIndex, 1);

      adjustedEV += remainingDeck.reduce((sum, card) => sum + card.value, 0)/remainingDeck.length
    }

    return adjustedEV;
  }

  static sort(cards: MightCard[]): MightCard[] {
    return [...cards].sort(MightCard.compare);
  }
}
