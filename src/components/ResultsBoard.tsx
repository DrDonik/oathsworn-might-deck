import { Chip, Grid, Typography, colors } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FC } from 'react';
import { useAppState } from '../data/AppState';
import MightCard from '../data/MightCard';
import CMightCard from './Card';
import { hitChance } from '../data/MathFunctions';

export type CResultsBoardProps = {
  values: MightCard[];
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
  const damage = values.reduce((p, c) => p + c.value, 0);
  const criticalHits = values.filter((v) => v.critical).length;
  const blanks = values.filter((v) => !v.value).length;
  const missed = !app.state.isEncounter && blanks >= 2;
  const evOS = (app.state.oathswornDeck.black.ev*app.state.selections.black+app.state.oathswornDeck.red.ev*app.state.selections.red+app.state.oathswornDeck.yellow.ev*app.state.selections.yellow+app.state.oathswornDeck.white.ev*app.state.selections.white);
  const evE = (app.state.encounterDeck.black.ev*app.state.selections.black+app.state.encounterDeck.red.ev*app.state.selections.red+app.state.encounterDeck.yellow.ev*app.state.selections.yellow+app.state.encounterDeck.white.ev*app.state.selections.white);
  const hitChanceWhite = hitChance(app.state.oathswornDeck.white.deck.length, app.state.oathswornDeck.white.blanks, app.state.selections.white);

  return (
    <Grid container spacing={1}>
      <Grid item xs={12} container>
        <Grid item xs={6} sm={3}>
          <Typography>Expected Value: {app.state.isEncounter ? evE.toFixed(1) : evOS.toFixed(1)}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography>Hit Chance: {app.state.isEncounter ? 100 : (hitChanceWhite*100).toFixed(0)}%</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography>Corrected EV: {app.state.isEncounter ? evE.toFixed(1) : (evOS*hitChanceWhite).toFixed(1)}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
        </Grid>
      </Grid>
      <Grid item xs={12} container>
        <Grid item xs={6} sm={3}>
          <Typography>Damage: {damage}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography>Critical Hits: {criticalHits}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography>Blanks: {blanks}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          {missed && <Chip color="error" label="Missed" size="small" />}
        </Grid>
      </Grid>
      <Grid item xs={12} className={classes.results}>
        <Grid container spacing={1}>
          {values.map((v, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <CMightCard
                color={v.color}
                front
                type={app.state.isEncounter ? 'encounter' : 'oathsworn'}
                value={v}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default CResultsBoard;
