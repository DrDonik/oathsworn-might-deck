export const nCr = (n: number, r: number) => {
    if (r > n) return 0;
    if (r === 0) return 1;
    if (r === n) return 1;
    if (r === 1) return n;

    let numerator = 1;
    let denominator = 1;
    const k = Math.min(r, n - r);

    for (let i = 0; i < k; i++) {
        numerator *= (n - i);
        denominator *= (i + 1);
    }

    return numerator / denominator;
};

/**
 * Calculate the probability of drawing k target cards from a deck of N cards,
 * where K of the N cards are the target cards.
 *
 * @param N number of cards in deck
 * @param n number of cards to draw
 * @param K number of target cards in deck
 * @param k number of target cards to draw
 * @returns
 */
export const hypergeometricProbability = (N: number, n: number, K: number, k: number): number => {
    // If drawing more cards than in deck, probability is 0
    if (n > N) {
        return 0;
    }

    // If there are not enough target cards in deck, probability is 0
    if (k > K) {
        return 0;
    }

    // If drawing less cards than target cards, probability is 0
    if (n < k) {
        return 0;
    }
    
    // If drawing all cards, probability is 1
    if (n === N && k === K) {
        return 1;
    }

    const favorableOutcomes = nCr(K, k) * nCr(N - K, n - k);
    const totalOutcomes = nCr(N, n);
    const probability = favorableOutcomes / totalOutcomes;
    return probability;
};

