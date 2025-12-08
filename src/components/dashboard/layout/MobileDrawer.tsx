import { Drawer, Box, Typography, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';

interface MobileDrawerProps {
  open: boolean;
  activeTab: number;
  onClose: () => void;
  onSelectTab: (tab: number) => void;
}

export const MobileDrawer = ({ open, activeTab, onClose, onSelectTab }: MobileDrawerProps) => {
  const handleTabSelect = (tab: number) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 250, pt: 1 }}>
        <Box sx={{ px: 2, pb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Menú
          </Typography>
        </Box>
        <Divider />
        <List dense>
          <ListItem
            component="div"
            onClick={() => handleTabSelect(0)}
            sx={{ cursor: 'pointer' }}
          >
            <ListItemIcon>
              <ListAltIcon color={activeTab === 0 ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Gastos" />
          </ListItem>
          <ListItem
            component="div"
            onClick={() => handleTabSelect(1)}
            sx={{ cursor: 'pointer' }}
          >
            <ListItemIcon>
              <BarChartIcon color={activeTab === 1 ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Análisis" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};
