import { Box, IconButton, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MONTHS } from '@/utils';

interface MonthNavigatorProps {
  selectedMonth: number;
  selectedYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenDatePicker: (event: React.MouseEvent<HTMLElement>) => void;
  compact?: boolean;
}

export const MonthNavigator = ({
  selectedMonth,
  selectedYear,
  onPreviousMonth,
  onNextMonth,
  onOpenDatePicker,
  compact = false,
}: MonthNavigatorProps) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <IconButton
        onClick={onPreviousMonth}
        size="small"
        sx={{
          color: 'white',
          bgcolor: 'rgba(255, 255, 255, 0.15)',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
        }}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>

      <Box
        onClick={onOpenDatePicker}
        sx={{
          px: compact ? 1.5 : 2,
          py: 0.5,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          color: '#01579b',
          borderRadius: 1.5,
          minWidth: compact ? 120 : 150,
          textAlign: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            bgcolor: 'white',
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
          },
          transition: 'all 0.2s',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: compact ? '0.8rem' : '0.875rem' }}>
          {MONTHS[selectedMonth - 1]} {selectedYear}
        </Typography>
      </Box>

      <IconButton
        onClick={onNextMonth}
        size="small"
        sx={{
          color: 'white',
          bgcolor: 'rgba(255, 255, 255, 0.15)',
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
        }}
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
