import { Popover, Box, Typography, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { MONTHS } from '@/utils';

interface DatePickerPopoverProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  selectedMonth: number;
  selectedYear: number;
  onClose: () => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  availableYears?: number[];
}

export const DatePickerPopover = ({
  open,
  anchorEl,
  selectedMonth,
  selectedYear,
  onClose,
  onMonthChange,
  onYearChange,
  availableYears = [2023, 2024, 2025, 2026, 2027],
}: DatePickerPopoverProps) => {
  const handleMonthChange = (month: number) => {
    onMonthChange(month);
    onClose();
  };

  const handleYearChange = (year: number) => {
    onYearChange(year);
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Box sx={{ p: 2, minWidth: 280 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block', color: 'text.secondary' }}>
          Seleccionar fecha
        </Typography>
        <Stack spacing={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>Mes</InputLabel>
            <Select
              value={selectedMonth}
              label="Mes"
              onChange={(e) => handleMonthChange(Number(e.target.value))}
            >
              {MONTHS.map((month, index) => (
                <MenuItem key={month} value={index + 1}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth>
            <InputLabel>Año</InputLabel>
            <Select
              value={selectedYear}
              label="Año"
              onChange={(e) => handleYearChange(Number(e.target.value))}
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Box>
    </Popover>
  );
};
