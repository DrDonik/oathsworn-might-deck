import { Chip, Typography, colors, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { makeStyles } from '@mui/styles';
import { FC } from 'react';
import { useAppState } from '../data/AppState';
import MightCard from '../data/MightCard';
import CMightCard from './Card';
import MightDeck from '../data/MightDeck';

export type CResultsBoardProps = {
  values: MightCard[][];
};

const useStyles = makeStyles((theme) => ({
  root: {},
  results: {
    background: colors.grey[200],
    padding: 8,
    borderRadius: 8,
    minHeight: '50vh',
  },
}));

const CResultsBoard: FC<CResultsBoardProps> = ({ values }) => {
  const app = useAppState();
  const classes = useStyles();
  const damage = values.flat().reduce((p, c) => p + c.value, 0);
  const criticalHits = values.flat().filter((v) => v.critical).length;
  const blanks = values.filter((_, index) => !app.state.critBonusRows.includes(app.state.drawResults.length - index)).flat().filter((v) => !v.value).length;
  const missed = !app.state.isEncounter && blanks >= 2;

  const colors = ["black", "red", "yellow", "white"] as const;
  let ev = 0;
  let evCorrected = 0;
  let hitChance = 0;

  if (app.state.isEncounter) {
    // For encounter mode, we simply calculate the average value without considering blanks/hits
    ev = colors.reduce((sum, color) => {
      const { deck, deckAverage, discardAverage } = app.state.encounterDeck[color];
      const selectedCount = app.state.selections[color];
      
      // If no cards selected for this color, skip
      if (selectedCount === 0) return sum;
      
      // Calculate expected value for each deck color
      let colorEV = 0;
      
      if (selectedCount <= deck.length) {
        // All cards come from main deck
        colorEV = selectedCount*deckAverage;
      } else {
        // Cards come from both main deck and discard
        const fromDeck = deck.length;
        const fromDiscard = selectedCount - fromDeck;
        
        colorEV = fromDeck*deckAverage + fromDiscard*discardAverage;
      }
      
      return sum + colorEV;
    }, 0);
    
    // In encounter mode, hit chance is always 100% and expected values are the same
    hitChance = 1;
    evCorrected = ev;
    
  } else {
    // For Oathsworn mode, we need to consider hit rules (0 or 1 blanks)
    const deck = app.state.oathswornDeck;
    
    // Check if any cards are being drawn at all
    const totalSelections = colors.reduce((sum, color) => sum + app.state.selections[color], 0);
    
    // Calculate all possible combinations of blank draws across decks
    // Each scenario represents a possible distribution of blanks across decks
    const scenarios = [
      // Scenario 1: 0 blanks in all decks
      { blanks: 0, probability: totalSelections === 0 ? 1 : 0, ev: 0 },
      
      // Scenarios 2-5: 1 blank in exactly one deck
      ...colors.map(blankColor => ({
        blanks: 1,
        color: blankColor,
        probability: 0,
        ev: 0
      }))
    ];
    
    // Calculate probability of 0 blanks across all decks
    if (totalSelections > 0) { // Only calculate if cards are actually selected
      scenarios[0].probability = colors.reduce((prob, color) => {
        const selectedCount = app.state.selections[color];
        // If no cards selected for this color, doesn't affect probability
        if (selectedCount === 0) return prob;
        
        return prob * deck[color].zeroBlanksProbability(selectedCount);
      }, 1);
    } // else we keep the initial probability of 1 set above
    
    // Calculate EV for scenario with 0 blanks
    scenarios[0].ev = colors.reduce((total, color) => {
      const selectedCount = app.state.selections[color];
      if (selectedCount === 0) return total;
      
      const { deck, discard } = app.state.oathswornDeck[color];
      
      // Calculate EV based on draws from main deck and possibly discard
      let colorEV = 0;
      if (selectedCount <= deck.length) {
        colorEV = MightDeck.calculateEV(deck, selectedCount, false);
      } else {
        const fromDeck = deck.length;
        const fromDiscard = selectedCount - fromDeck;
        colorEV = MightDeck.calculateEV(deck, fromDeck, false) + 
                 MightDeck.calculateEV(discard, fromDiscard, false);
      }
      
      return total + colorEV;
    }, 0);
    
    // Calculate probabilities and EVs for 1-blank scenarios
    if (totalSelections > 0) { // Only calculate if cards are actually selected
      for (let i = 1; i <= 4; i++) {
        const scenario = scenarios[i] as { blanks: number; color: typeof colors[number]; probability: number; ev: number };
        const blankColor = scenario.color;
        
        // Calculate probability: P(1 blank in this color) * P(0 blanks in all others)
        let probability = 1;
        let hasSelections = false;
        
        colors.forEach(color => {
          const selectedCount = app.state.selections[color];
          if (selectedCount === 0) return; // Skip colors with no selections
          
          hasSelections = true;
          
          if (color === blankColor) {
            // This is where the single blank should be
            probability *= deck[color].exactlyOneBlankProbability(selectedCount);
          } else {
            // All other decks should have zero blanks
            probability *= deck[color].zeroBlanksProbability(selectedCount);
          }
        });
        
        // If blankColor has no selections, this scenario is impossible
        if (!hasSelections || app.state.selections[blankColor] === 0) {
          probability = 0;
        }
        
        scenario.probability = probability;
        
        // Calculate expected value for this scenario
        let scenarioEV = 0;
        
        if (probability > 0) {
          colors.forEach(color => {
            const selectedCount = app.state.selections[color];
            if (selectedCount === 0) return; // Skip colors with no selections
            
            const { deck: colorDeck, discard } = app.state.oathswornDeck[color];
            
            if (color === blankColor) {
              // This deck has exactly one blank
              // For the deck with one blank, reduce selection by 1 and flag oneBlankDrawn
              const adjustedCount = Math.max(0, selectedCount - 1);

              if (selectedCount <= colorDeck.length) {
                scenarioEV += MightDeck.calculateEV(colorDeck, adjustedCount, false, true);
              } else {
                const fromDeck = colorDeck.length;
                // Does the blank come from the deck or the discard?
                const blankInDeck = colorDeck.some(card => card.value === 0);
                const fromDiscard = blankInDeck ? adjustedCount - fromDeck + 1 : adjustedCount - fromDeck;
                scenarioEV += MightDeck.calculateEV(colorDeck, fromDeck, false, blankInDeck) + 
                            MightDeck.calculateEV(discard, fromDiscard, false, !blankInDeck);
              }
            } else {
              // All other decks have zero blanks
              if (selectedCount <= deck.length) {
                scenarioEV += MightDeck.calculateEV(deck, selectedCount, false);
              } else {
                const fromDeck = deck.length;
                const fromDiscard = selectedCount - fromDeck;
                scenarioEV += MightDeck.calculateEV(deck, fromDeck, false) + 
                            MightDeck.calculateEV(discard, fromDiscard, false);
              }
            }
          })
        } // else scenarioEV remains 0 as initialized
        
        scenario.ev = scenarioEV;
      }
    } // else all 1-blank scenarios have 0 probability and 0 EV as initialized
    
    console.log('Scenario Probabilities:', scenarios.map(s => s.probability));
    console.log('Scenario EVs:', scenarios.map(s => s.ev));

    // Calculate hit chance (sum of probabilities for 0 or 1 blank)
    // These scenarios represent mutually exclusive events that result in a hit
    // The sum should not exceed 1.0 (100%)
    hitChance = Math.min(1.0, scenarios.reduce((sum, s) => sum + s.probability, 0));
    
    // Calculate expected values
    evCorrected = scenarios.reduce((sum, s) => sum + (s.probability * s.ev), 0);
    
    // Expected value given a hit (for display as "Expected Hit Value")
    ev = hitChance > 0 ? evCorrected / hitChance : 0;
  }

  return (
    <Grid container spacing={1}>
      <Grid size={12} container>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
          <Tooltip title="The damage you can expect in case of a hit."><Typography>Expected Hit Value: {ev.toFixed(1)}</Typography></Tooltip>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
          {!app.state.isEncounter ? <Tooltip title="The chance for a hit."><Typography>Hit Chance: {(hitChance*100).toFixed(0)}%</Typography></Tooltip> : '' }
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
        {!app.state.isEncounter ? <Tooltip title="The expected value, including hits and misses. Maximise this number for the best outcome on average."><Typography>Expected Value: {(evCorrected).toFixed(1)}</Typography></Tooltip> : '' }
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
        </Grid>
      </Grid>
      <Grid size={12} container>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
          <Typography>Damage: {damage}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
          <Typography>Critical Hits: {criticalHits}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
          <Typography>Blanks: {blanks}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
          {missed && <Chip color="error" label="Missed" size="small" />}
        </Grid>
      </Grid>
      <Grid size={12} className={classes.results}>
        <Grid container spacing={1}>
          {values.map((row, i) =>
            row.map((v, j) => (
              <Grid size={{ xs: 6, sm: 6, md: 3}} key={`${i}-${j}`}>
                <CMightCard
                  color={v.color}
                  new={i === 0}
                  critBonus={app.state.critBonusRows.includes(app.state.drawResults.length - i)}
                  front
                  type={app.state.isEncounter ? 'encounter' : 'oathsworn'}
                  value={v}
                  selected={app.state.drawResultsSelections[i]?.[j]}
                  onClick={() => app.actions.toggleDrawResultSelection(i, j)}
                />
              </Grid>
            ))
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CResultsBoard;
