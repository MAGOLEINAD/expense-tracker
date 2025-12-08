import { Button } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListAltIcon from '@mui/icons-material/ListAlt';

interface TabSwitcherProps {
  activeTab: number;
  onToggle: () => void;
}

export const TabSwitcher = ({ activeTab, onToggle }: TabSwitcherProps) => {
  return (
    <Button
      variant="contained"
      startIcon={activeTab === 0 ? <BarChartIcon fontSize="small" /> : <ListAltIcon fontSize="small" />}
      onClick={onToggle}
      size="small"
      sx={{
        textTransform: 'none',
        color: 'white',
        fontWeight: 600,
        bgcolor: 'rgba(255, 255, 255, 0.2)',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.3)',
        },
        boxShadow: 'none',
      }}
    >
      {activeTab === 0 ? 'Análisis' : 'Gastos'}
    </Button>
  );
};
