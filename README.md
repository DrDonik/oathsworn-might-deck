# Oathsworn Might Deck Tool

Web app to replace the physical might decks with a digital version when playing the boardgame "Oathsworn: Into the Deepwood".
[The entire front end has been coded by killalau](https://github.com/killalau/oathsworn-might-deck). DrDonik added the statistics.

Features of this digital implementation:
- managing card draws and deck reshuffling
- Displaying for each individual deck
  - the remaining cards, blanks and crits
  - the Expected Value for the next card drawn from this deck (this value includes the potential additional card draws from Crits)
- Displaying for any combination of cards to be drawn from the four decks,
  - the probability for a hit
  - the Expected Hit Value, i.e., the expected damage in case of a hit (this value includes the potential additional card draws from Crits)
  - the Expected Value, including misses

[Demo link (DrDonik's version with full statistics)](https://drdonik.github.io/oathsworn-might-deck/)

[Demo link (killalau's version with Hit Chance and Deck Quality indicators)](https://killalau.github.io/oathsworn-might-deck/)

## Development

In the project directory, you can run:

```bash
bun run start
bun run test
bun run build
bun run deploy
```
