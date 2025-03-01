export type MightColor = 'white' | 'yellow' | 'red' | 'black';

export default class MightCard {
  value: number;
  critical: boolean;
  color: MightColor;

  constructor(
    value: number,
    critical: boolean = false,
    color: MightColor = 'white',
  ) {
    this.value = value;
    this.critical = critical;
    this.color = color;
  }

  clone(): MightCard {
    return new MightCard(this.value, this.critical, this.color);
  }

  toString(): string {
    return this.critical ? `{${this.value}}` : `[${this.value}]`;
  }

  static compare(a: MightCard, b: MightCard): number {
    const COLORS = ['white', 'yellow', 'red', 'black'];
    const colorDiff = COLORS.indexOf(a.color) - COLORS.indexOf(b.color);
    if (colorDiff !== 0) return colorDiff > 0 ? 1 : -1;

    const diff = a.value - b.value;
    if (diff !== 0) return diff;
    return a.critical && !b.critical ? 1 : !a.critical && b.critical ? -1 : 0;
  }
}
