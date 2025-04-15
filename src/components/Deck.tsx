import { Typography, Badge, Chip, Box, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FC } from 'react';
import MightDeck from '../data/MightDeck';
import CMightCard from './Card';

export type CMigthDeckProps = {
  type: 'encounter' | 'oathsworn';
  value?: MightDeck;
  selected?: number;
  onSelect?: () => void;
  onDeselect?: () => void;
  onReset?: () => void;
};

const CMigthDeck: FC<CMigthDeckProps> = ({
  type,
  value,
  selected = 0,
  onSelect,
  onDeselect,
  onReset,
}) => {
  return (
    <Grid container spacing={1}>
      <Grid size={12}>
        <Box sx={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <Chip
            label={value?.deck?.length ?? 0}
            color="secondary"
            sx={{
              position: 'absolute',
              bottom: '8px',  // Adjust this as needed
              left: '8px', // Adjust this as needed
              zIndex: 2
            }}
          />
          <CMightCard
            type={type}
            color={value?.dice?.color}
            value={value?.deck?.[0]}
            onClick={onSelect}
            onContextMenu={(e) => {
              e.preventDefault();
              if (selected > 0 && onDeselect) {
                onDeselect();
              }
            }}
          />
          <Badge color="primary" badgeContent={selected} sx={{ float: 'right' }} />
        </Box>
      </Grid>
      <Grid size={{ xs: 3, sm: 3, md: 3}}>
        <Typography>Blanks: {value?.nBlanks ?? 0}</Typography>
      </Grid>
      <Grid size={{ xs: 3, sm: 3, md: 3}}>
        <Typography>Crits: {value?.nCrits ?? 0}</Typography>
      </Grid>
      <Grid size={{ xs: 3, sm: 3, md: 3}}>
        <Typography>EV: {type === 'encounter' ? value?.deckAverage.toFixed(1) ?? 0 : value?.deckEV.toFixed(1) ?? 0}</Typography>
      </Grid>
      <Grid size={{ xs: 3, sm: 3, md: 3}} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {onReset && (
          <IconButton 
            size="small" 
            onClick={onReset} 
            aria-label="reset deck"
            color="primary"
          >
            ↻
          </IconButton>
        )}
      </Grid>
    </Grid>
  );
};

export default CMigthDeck;
