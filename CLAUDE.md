# Oathsworn Might Deck - Dev Reference
Oathsworn Might Deck is a digital implementation in typescript for drawing cards while playing the boardgame "Oathsworn: Into the Deepwood". It serves as a replacement of the physical "Might Decks".

There are four different "Might Decks" in the game. Each "Might Deck" has a specific colour (in the order of increasing "might": white, yellow, red, or black) and consists of 18 cards. Out of these cards, 6 cards are "blanks", with a value of 0, and three cards are "criticals", with the highest value in the specific "Might Deck". Additionally to having the highest value, the "criticals" also allow an additional card to be drawn from the "Might Deck". The other 9 cards in the deck are numbered cards of different values, 3 cards per each value.

A card draw ("Might Check") consists of the following steps in order:
1. The player decides on how many cards shall be drawn from each "Might Deck".
2. The app reveals all the selected cards.
3. If there are criticals, the player decides whether or not to draw the corresponding amount of additional cards from the respective might decks.
4. Optional: The player can decide to redraw one or more revealed cards. If the player chooses to do so, the selected card is discarded and a new card from the draw pile of the same coloured deck is revealed instead (potentially turning a miss into a hit, see step 5).
5. If, after redraws (see step 4), there are two or more blanks in total in the initially revealed cards, but NOT taking into account additional card draws from criticals, the "Might Check" is considered a "miss". Otherwise, the check is considered a "hit" with a strength equal to all numbers from the revealed cards added up.
6. If, at any point during steps 2, 3, or 4, the draw pile from a "Might Deck" runs out of cards when a card should be drawn from it, the discard pile of the respective deck is immediately shuffled and forms the new draw pile.
7. After the "Might Check" is resolved, all revealed cards are discarded to the respective discard pile.

The App has the following two purposes:
1. Handle the card manipulation for all the steps described above.
2. Displaying, upon selecting the number of cards to be drawn, the expected hit chance and the expected value.
 a) The hit chance shall be calculated and displayed
 b) The conditional expected value shall be calculated and displayed: i.e., the expected strength of the "Might Check" in case of a "hit".

## Build & Test Commands
- Start dev server: `bun run start`
- Run all tests: `bun run test`
- Run specific test: `bun run test -- -t "test name pattern"`
- Run tests in watch mode: `bun run run test:watch`
- Build for production: `bun run build`
- Deploy to GitHub Pages: `bun run deploy`

## Code Style & Conventions
- **TypeScript**: Strict typing enabled, use explicit return types
- **Formatting**: Prettier with single quotes (`'`)
- **Component Structure**: Functional components with FC type, props interface defined
- **State Management**: Use React hooks for state, with typed states
- **Naming**:
  - Classes: PascalCase (e.g., `MightCard`)
  - Interfaces/Types: PascalCase, prefixed with 'I' for interfaces
  - Props: ComponentNameProps (e.g., `CMightCardProps`)
  - Files: PascalCase for components/classes, camelCase for utilities
- **CSS**: Material-UI with makeStyles pattern for component styling
- **Testing**: Jest with React Testing Library, tests in same directory as implementation