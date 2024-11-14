import { AppBar, Button, Toolbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CMightDeckOrganizer from './components/Organizer';
import { useAppState } from './data/AppState';
import CResultsBoard from './components/ResultsBoard';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    minHeight: '100vh',
    paddingTop: 48,
    paddingBottom: 48,
  },
  main: {},
  organizer: {},
  results: {},
}));

function App() {
  const app = useAppState();
  const classes = useStyles();
  const { isEncounter, encounterDeck, oathswornDeck, selections, drawResults } =
    app.state;
  const newCriticalHits = (drawResults[0] ?? []).filter((v) => v.critical).length;
  const hasSelections = selections.white > 0 || selections.yellow > 0 || selections.red > 0 || selections.black > 0;
  const showDrawCritical = !hasSelections && newCriticalHits > 0;

  return (
    <div className={classes.root}>
      <AppBar color="default">
        <Toolbar variant="dense" disableGutters>
          <div></div>
          <Button
            variant="text"
            color={isEncounter ? 'error' : 'inherit'}
            sx={{ flexGrow: 1, textAlign: 'center' }}
            onClick={app.actions.toggleDeck}
          >
            {isEncounter ? 'Encounter Deck' : 'Oathsworn Might Deck'}
          </Button>
          <div></div>
        </Toolbar>
      </AppBar>

      <Grid container padding={2} spacing={2} className={classes.main}>
        <Grid size={{ xs: 12, sm: 12, md: 12}}>
          <CMightDeckOrganizer
            type={isEncounter ? 'encounter' : 'oathsworn'}
            value={isEncounter ? encounterDeck : oathswornDeck}
            selected={selections}
            onSelect={app.actions.setSelections}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 12}}>
          <CResultsBoard values={drawResults} />
        </Grid>
      </Grid>

      <AppBar position="fixed" sx={{ top: 'auto', bottom: 0, height: 80 }} color="default">
        <Toolbar variant="dense" sx={{ gap: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            sx={{ flexGrow: 1 }}
            onClick={app.actions.resetSelections}
          >
            Reset
          </Button>
          {
            showDrawCritical ?
              <Button
                variant="outlined"
                color="primary"
                sx={{ flexGrow: 1 }}
                onClick={app.actions.confirmDrawCriticals}
              >
                Draw Critical{newCriticalHits > 1 ? 's' : ''} ({newCriticalHits})
              </Button> : <Button
                variant="outlined"
                color="primary"
                sx={{ flexGrow: 1 }}
                disabled={!hasSelections}
                onClick={app.actions.confirmDraw}
              >
                Draw
              </Button>
          }
          <Button
            variant="outlined"
            color="error"
            sx={{ flexGrow: 1 }}
            disabled={app.state.drawResults.length === 0 || hasSelections}
            onClick={app.actions.discardDrawResults}
          >
            Discard
          </Button>
        </Toolbar>
      </AppBar>
    </div>
  );
}

export default App;
