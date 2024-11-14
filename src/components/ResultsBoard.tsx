import { Chip, Typography, colors } from '@mui/material';
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
  const blanks = values.flat().filter((v) => !v.value).length;
  const missed = !app.state.isEncounter && blanks >= 2;

  const colors = ["black", "red", "yellow", "white"] as const;
  let ev = 0;
  let evCorrected = 0;
  let hitChance = 1;

  if (app.state.isEncounter) {

    ev = colors.reduce((sum, color) => {
      const { deckAverage, discardAverage } = app.state.encounterDeck[color];
      const deckSize = app.state.encounterDeck[color].deck.length;
      const selectedCount = app.state.selections[color];
    
      const deckContribution = Math.min(selectedCount, deckSize) * deckAverage;
      const discardContribution = Math.max(selectedCount - deckSize, 0) * discardAverage;

      return sum + deckContribution + discardContribution;
    }, 0);

  } else {

    // Precompute probabilities of zero and one blanks for each color.
    const probZeroBlankSingleDeck = colors.reduce((acc, color) => {
      acc[color] = MightDeck.probZeroBlank(app.state.oathswornDeck[color].deck, app.state.oathswornDeck[color].discard, app.state.selections[color]);
      return acc;
    }, {} as Record<typeof colors[number], number>);
    const probOneBlankSingleDeck = colors.reduce((acc, color) => {
      acc[color] = MightDeck.probOneBlank(app.state.oathswornDeck[color].deck, app.state.oathswornDeck[color].discard, app.state.selections[color]);
      return acc;
    }, {} as Record<typeof colors[number], number>);
    
    // Calculate probabilities of zero blank across all color decks.
    hitChance = colors.reduce(
      (prob, color) => prob * probZeroBlankSingleDeck[color],
      1
    )

    // Calculate expected values of zero blank across all color decks.
    evCorrected = hitChance*colors.reduce(
      (ev, color) => {
        const { deck, deckAverage, discardNoBlanksEV, nCrits , deckNoBlanksEV} = app.state.oathswornDeck[color];
        const deckSize = deck.length;
        const selectedCount = app.state.selections[color];
      
        const deckContribution = deckSize > selectedCount && deckSize - selectedCount >= nCrits
        ? selectedCount * deckNoBlanksEV
        : deckSize * deckAverage;
    
        const discardContribution = deckSize > selectedCount
        ? Math.max(nCrits - (deckSize - selectedCount), 0) * discardNoBlanksEV
        : (selectedCount - deckSize + nCrits) * discardNoBlanksEV;
        
        return ev + deckContribution + discardContribution;
      }, 0);
    
    // Calculate probabilities of exactly one blank across all color decks.
    const probOneBlank = colors.map((excludedColor) =>
      colors
        .filter((color) => color !== excludedColor)
        .reduce(
          (prob, color) => prob * probZeroBlankSingleDeck[color],
          1
        ) * probOneBlankSingleDeck[excludedColor]
    );

    // Calculate expected values of exactly one blank across all color decks.
    const evOneBlank = colors.map((excludedColor) => {
      const { deck, deckAverage, discardNoBlanksEV, nCrits , deckNoBlanksEV} = app.state.oathswornDeck[excludedColor];
      const deckSize = deck.length;
      const selectedCount = app.state.selections[excludedColor];
    
      const deckContribution = deckSize > selectedCount && deckSize - selectedCount >= nCrits
      ? (selectedCount-1) * deckNoBlanksEV
      : deckSize * deckAverage;
  
      const discardContribution = deckSize > selectedCount
      ? Math.max(nCrits - (deckSize - selectedCount), 0) * discardNoBlanksEV
      : (selectedCount - deckSize + nCrits) * discardNoBlanksEV;
      
      return colors
        .filter((color) => color !== excludedColor)
        .reduce(
          (prob, color) => prob * probZeroBlankSingleDeck[color],
          1
        ) * probOneBlankSingleDeck[excludedColor]
        * (colors
        .filter((color) => color !== excludedColor)
        .reduce(
          (ev, color) => {
            const { deck, deckAverage, discardNoBlanksEV, nCrits , deckNoBlanksEV} = app.state.oathswornDeck[color];
            const deckSize = deck.length;
            const selectedCount = app.state.selections[color];
          
            const deckContribution = deckSize > selectedCount && deckSize - selectedCount >= nCrits
            ? selectedCount * deckNoBlanksEV
            : deckSize * deckAverage;
        
            const discardContribution = deckSize > selectedCount
            ? Math.max(nCrits - (deckSize - selectedCount), 0) * discardNoBlanksEV
            : (selectedCount - deckSize + nCrits) * discardNoBlanksEV;
            
            return ev + deckContribution + discardContribution;          
          }, 0
        ) + deckContribution + discardContribution)
      }
    );

    // Sum up all the probabilities for exactly one blank.
    hitChance += probOneBlank.reduce((sum, value) => sum + value, 0);
    evCorrected += evOneBlank.reduce((sum, value) => sum + value, 0);

    ev = hitChance ? evCorrected / hitChance: 0;

  }

  return (
    <Grid container spacing={1}>
      <Grid size={12} container>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
          <Typography>Expected Hit Value: {ev.toFixed(1)}</Typography>
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
          {!app.state.isEncounter ? <Typography>Hit Chance: {(hitChance*100).toFixed(0)}%</Typography> : '' }
        </Grid>
        <Grid size={{ xs: 6, sm: 6, md: 3}}>
        {!app.state.isEncounter ? <Typography>Expected Value: {(evCorrected).toFixed(1)}</Typography> : '' }
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
                  front
                  type={app.state.isEncounter ? 'encounter' : 'oathsworn'}
                  value={v}
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
