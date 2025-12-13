import { Stack, IconButton, Chip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { MONTHS } from '@/utils';

interface MobileDateControlsProps {
  selectedMonth: number;
  selectedYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenDatePicker: (event: React.MouseEvent<HTMLElement>) => void;
}

export const MobileDateControls = ({
  selectedMonth,
  selectedYear,
  onPreviousMonth,
  onNextMonth,
  onOpenDatePicker,
}: MobileDateControlsProps) => {
  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{
        bgcolor: 'background.paper',
        py: 1,
        px: 1.5,
        borderRadius: 3,
        mb: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <IconButton
        onClick={onPreviousMonth}
        size="small"
        sx={{
          color: 'primary.main',
          '&:hover': { bgcolor: 'primary.lighter' }
        }}
      >
        <ChevronLeftIcon />
      </IconButton>

      <Chip
        icon={<CalendarMonthIcon sx={{ fontSize: 18 }} />}
        label={
          <Typography variant="body2" fontWeight={600}>
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </Typography>
        }
        onClick={onOpenDatePicker}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          px: 1.5,
          height: 36,
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
          '& .MuiChip-icon': {
            color: 'white',
          },
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(2, 136, 209, 0.3)',
        }}
      />

      <IconButton
        onClick={onNextMonth}
        size="small"
        sx={{
          color: 'primary.main',
          '&:hover': { bgcolor: 'primary.lighter' }
        }}
      >
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  );
};
