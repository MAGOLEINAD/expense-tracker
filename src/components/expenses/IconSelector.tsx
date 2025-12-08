import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  IconButton,
  Grid,
  InputAdornment,
  Typography,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import * as MuiIcons from '@mui/icons-material';

interface IconSelectorProps {
  open: boolean;
  selectedIcon?: string;
  onClose: () => void;
  onSelect: (iconName: string) => void;
}

// Lista de iconos populares para gastos
const POPULAR_ICONS = [
  'Home', 'DirectionsCar', 'LocalGasStation', 'Restaurant', 'ShoppingCart',
  'CreditCard', 'Payment', 'ReceiptLong', 'Phone', 'Wifi',
  'ElectricBolt', 'WaterDrop', 'LocalHospital', 'School', 'Pets',
  'FitnessCenter', 'LocalPharmacy', 'LocalGroceryStore', 'LocalBar', 'Fastfood',
  'LocalCafe', 'Movie', 'Theaters', 'MusicNote', 'SportsEsports',
  'FlightTakeoff', 'Hotel', 'BeachAccess', 'Spa', 'LocalLaundryService',
  'Build', 'Handyman', 'Plumbing', 'ElectricalServices', 'Cleaning',
  'ChildCare', 'PersonalVideo', 'Tv', 'Computer', 'PhoneAndroid',
  'Watch', 'Headphones', 'Camera', 'Print', 'MenuBook',
  'LocalLibrary', 'Work', 'Business', 'AccountBalance', 'Savings',
];

export const IconSelector = ({ open, selectedIcon, onClose, onSelect }: IconSelectorProps) => {
  const [search, setSearch] = useState('');

  // Filtrar iconos disponibles
  const availableIcons = useMemo(() => {
    const iconNames = Object.keys(MuiIcons).filter(
      (key) => key !== 'default' && !key.includes('Outlined') && !key.includes('TwoTone')
    );

    if (!search) {
      // Si no hay búsqueda, mostrar solo iconos populares
      return POPULAR_ICONS;
    }

    // Filtrar por búsqueda
    const searchLower = search.toLowerCase();
    return iconNames.filter((name) => name.toLowerCase().includes(searchLower)).slice(0, 100);
  }, [search]);

  const handleSelect = (iconName: string) => {
    onSelect(iconName);
    onClose();
    setSearch('');
  };

  const handleClose = () => {
    onClose();
    setSearch('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Seleccionar Icono</Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Buscar icono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          autoFocus
        />

        {!search && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Mostrando iconos populares. Usa el buscador para encontrar más.
          </Typography>
        )}

        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          <Grid container spacing={1}>
            {availableIcons.map((iconName) => {
              const IconComponent = (MuiIcons as any)[iconName];
              if (!IconComponent) return null;

              const isSelected = selectedIcon === iconName;

              return (
                <Grid item xs={3} sm={2} key={iconName}>
                  <Tooltip title={iconName} arrow>
                    <IconButton
                      onClick={() => handleSelect(iconName)}
                      sx={{
                        width: '100%',
                        height: 60,
                        border: isSelected ? '2px solid #2196f3' : '1px solid #e0e0e0',
                        borderRadius: 1,
                        bgcolor: isSelected ? '#e3f2fd' : 'transparent',
                        '&:hover': {
                          bgcolor: isSelected ? '#bbdefb' : '#f5f5f5',
                          borderColor: '#2196f3',
                        },
                      }}
                    >
                      <IconComponent sx={{ fontSize: 28, color: isSelected ? '#2196f3' : '#424242' }} />
                    </IconButton>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {availableIcons.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No se encontraron iconos que coincidan con "{search}"
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
