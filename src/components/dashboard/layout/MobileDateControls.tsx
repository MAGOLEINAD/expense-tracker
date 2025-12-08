import { Stack, IconButton, Box, Typography, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { MONTHS } from '@/utils';

interface MobileDateControlsProps {
  selectedMonth: number;
  selectedYear: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onOpenDatePicker: (event: React.MouseEvent<HTMLElement>) => void;
  onOpenExpenseDialog: () => void;
  onOpenTemplate: () => void;
}

export const MobileDateControls = ({
  selectedMonth,
  selectedYear,
  onPreviousMonth,
  onNextMonth,
  onOpenDatePicker,
  onOpenExpenseDialog,
  onOpenTemplate,
}: MobileDateControlsProps) => {
  return (
    <>
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          bgcolor: 'background.paper',
          p: 1,
          borderRadius: 2,
          mb: 1.5,
          boxShadow: 1,
        }}
      >
        <IconButton onClick={onPreviousMonth} size="small" color="primary">
          <ChevronLeftIcon />
        </IconButton>

        <Box
          onClick={onOpenDatePicker}
          sx={{
            px: 2,
            py: 0.5,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 1.5,
            minWidth: 140,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
            transition: 'background-color 0.2s',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {MONTHS[selectedMonth - 1]} {selectedYear}
          </Typography>
        </Box>

        <IconButton onClick={onNextMonth} size="small" color="primary">
          <ChevronRightIcon />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onOpenExpenseDialog}
          size="small"
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Nuevo
        </Button>
      </Stack>

      <Button
        variant="outlined"
        startIcon={<ContentCopyIcon />}
        onClick={onOpenTemplate}
        fullWidth
        size="small"
        sx={{ mb: 1.5, textTransform: 'none' }}
      >
        Aplicar Template
      </Button>
    </>
  );
};
