import Grid from '@mui/material/Grid2';
import { FC } from 'react';
import MightDeckOrganizer, {
  MightCardsSelection,
  defaultMightCardsSelection,
} from '../data/MightDeckOrganizer';
import { MightColor } from '../data/MightCard';
import CMigthDeck from './Deck';

export type CMightDecksProps = {
  type: 'encounter' | 'oathsworn';
  value?: MightDeckOrganizer;
  selected?: MightCardsSelection;
  onSelect?: (event: MightCardsSelection) => void;
  onResetDeck?: (color: keyof MightCardsSelection) => void;
};

const CMightDeckOrganizer: FC<CMightDecksProps> = ({
  type,
  value,
  selected = { ...defaultMightCardsSelection },
  onSelect,
  onResetDeck,
}) => {
  const inc = (type: MightColor) => {
    onSelect?.({
      ...selected,
      [type]: selected[type] + 1,
    });
  };

  const dec = (type: MightColor) => {
    if (selected[type] > 0) {
      onSelect?.({
        ...selected,
        [type]: selected[type] - 1,
      });
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 6, sm: 6, md: 3}}>
        <CMigthDeck
          type={type}
          value={value?.white}
          selected={selected?.white}
          onSelect={() => {
            inc('white');
          }}
          onDeselect={() => {
            dec('white');
          }}
          onReset={onResetDeck ? () => onResetDeck('white') : undefined}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 6, md: 3}}>
        <CMigthDeck
          type={type}
          value={value?.yellow}
          selected={selected?.yellow}
          onSelect={() => {
            inc('yellow');
          }}
          onDeselect={() => {
            dec('yellow');
          }}
          onReset={onResetDeck ? () => onResetDeck('yellow') : undefined}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 6, md: 3}}>
        <CMigthDeck
          type={type}
          value={value?.red}
          selected={selected?.red}
          onSelect={() => {
            inc('red');
          }}
          onDeselect={() => {
            dec('red');
          }}
          onReset={onResetDeck ? () => onResetDeck('red') : undefined}
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 6, md: 3}}>
        <CMigthDeck
          type={type}
          value={value?.black}
          selected={selected?.black}
          onSelect={() => {
            inc('black');
          }}
          onDeselect={() => {
            dec('black');
          }}
          onReset={onResetDeck ? () => onResetDeck('black') : undefined}
        />
      </Grid>
    </Grid>
  );
};

export default CMightDeckOrganizer;
