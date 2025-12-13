import { Drawer, Box, Typography, Divider, List, ListItem, ListItemIcon, ListItemText, ListItemButton } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import GetAppIcon from '@mui/icons-material/GetApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useInstallPWA } from '@/hooks/useInstallPWA';
import { useSnackbar } from 'notistack';

interface MobileDrawerProps {
  open: boolean;
  activeTab: number;
  onClose: () => void;
  onSelectTab: (tab: number) => void;
  onOpenTemplate: () => void;
}

export const MobileDrawer = ({ open, activeTab, onClose, onSelectTab, onOpenTemplate }: MobileDrawerProps) => {
  const { isInstallable, isInstalled, handleInstall } = useInstallPWA();
  const { enqueueSnackbar } = useSnackbar();

  const handleTabSelect = (tab: number) => {
    onSelectTab(tab);
    onClose();
  };

  const handleTemplateClick = () => {
    onOpenTemplate();
    onClose();
  };

  const handleInstallClick = async () => {
    const success = await handleInstall();
    if (success) {
      enqueueSnackbar('¡App instalada correctamente!', { variant: 'success' });
      onClose();
    } else {
      enqueueSnackbar('No se pudo instalar la app', { variant: 'error' });
    }
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

        {/* Navegación */}
        <List dense>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleTabSelect(0)}
              selected={activeTab === 0}
            >
              <ListItemIcon>
                <ListAltIcon color={activeTab === 0 ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Gastos" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleTabSelect(1)}
              selected={activeTab === 1}
            >
              <ListItemIcon>
                <BarChartIcon color={activeTab === 1 ? 'primary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Análisis" />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Acciones */}
        <Box sx={{ px: 2, pb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            ACCIONES
          </Typography>
        </Box>
        <List dense>
          <ListItem disablePadding>
            <ListItemButton onClick={handleTemplateClick}>
              <ListItemIcon>
                <ContentCopyIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Aplicar Template" />
            </ListItemButton>
          </ListItem>

          {/* PWA Install Button */}
          {isInstallable && !isInstalled && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleInstallClick}>
                <ListItemIcon>
                  <GetAppIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Instalar App" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Installed Status */}
          {isInstalled && (
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primary="App Instalada"
                primaryTypographyProps={{ color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    </Drawer>
  );
};
