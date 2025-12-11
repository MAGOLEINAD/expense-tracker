import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
  IconButton,
  TextField,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import type { PaymentStatus } from '@/types';
import { PAYMENT_STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';

interface StatusColorsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (colors: Record<PaymentStatus, string>) => Promise<void>;
  currentColors: Record<PaymentStatus, string>;
}

// Paleta predefinida de colores bonitos
const PRESET_COLORS = [
  '#4caf50', // Green
  '#66bb6a', // Light Green
  '#81c784', // Lighter Green
  '#2196f3', // Blue
  '#42a5f5', // Light Blue
  '#64b5f6', // Lighter Blue
  '#ff9800', // Orange
  '#ffa726', // Light Orange
  '#ffb74d', // Lighter Orange
  '#f44336', // Red
  '#ef5350', // Light Red
  '#e57373', // Lighter Red
  '#7c3aed', // Purple
  '#9333ea', // Light Purple
  '#a855f7', // Lighter Purple
  '#06b6d4', // Cyan
  '#22d3ee', // Light Cyan
  '#67e8f9', // Lighter Cyan
  '#ec4899', // Pink
  '#f472b6', // Light Pink
  '#f9a8d4', // Lighter Pink
  '#eab308', // Yellow
  '#facc15', // Light Yellow
  '#fde047', // Lighter Yellow
  '#6b7280', // Gray
  '#9ca3af', // Light Gray
  '#d1d5db', // Lighter Gray
];

export const StatusColorsDialog = ({
  open,
  onClose,
  onSave,
  currentColors,
}: StatusColorsDialogProps) => {
  const [colors, setColors] = useState<Record<PaymentStatus, string>>(currentColors);
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | null>(null);
  const [customColor, setCustomColor] = useState('#000000');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setColors(currentColors);
      setSelectedStatus(null);
    }
  }, [open, currentColors]);

  const handlePresetColorClick = (color: string) => {
    if (selectedStatus) {
      setColors(prev => ({ ...prev, [selectedStatus]: color }));
    }
  };

  const handleCustomColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setCustomColor(color);
    if (selectedStatus) {
      setColors(prev => ({ ...prev, [selectedStatus]: color }));
    }
  };

  const handleResetToDefaults = () => {
    setColors(STATUS_COLORS);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(colors);
      onClose();
    } catch (error) {
      console.error('Error saving status colors:', error);
    } finally {
      setSaving(false);
    }
  };

  const statuses: PaymentStatus[] = ['pagado', 'bonificado', 'pendiente', 'pago anual', 'sin cargo'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Personalizar Colores de Estados</Typography>
          <Tooltip title="Restaurar colores por defecto" arrow>
            <IconButton size="small" onClick={handleResetToDefaults}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Lista de estados */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Selecciona un estado para cambiar su color:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
              {statuses.map((status) => (
                <Chip
                  key={status}
                  label={PAYMENT_STATUS_LABELS[status]}
                  onClick={() => setSelectedStatus(status)}
                  sx={{
                    bgcolor: colors[status],
                    color: '#fff',
                    fontWeight: 600,
                    border: selectedStatus === status ? '3px solid #000' : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.9,
                    },
                  }}
                  icon={selectedStatus === status ? <CheckIcon sx={{ color: '#fff !important' }} /> : undefined}
                />
              ))}
            </Stack>
          </Box>

          {selectedStatus && (
            <>
              {/* Paleta de colores predefinidos */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Colores predefinidos:
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
                    gap: 1,
                    mt: 2,
                  }}
                >
                  {PRESET_COLORS.map((color) => (
                    <Tooltip key={color} title={color} arrow>
                      <Box
                        onClick={() => handlePresetColorClick(color)}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: color,
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: colors[selectedStatus] === color ? '3px solid #000' : '2px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 2,
                          },
                        }}
                      >
                        {colors[selectedStatus] === color && (
                          <CheckIcon sx={{ color: '#fff', fontSize: 20 }} />
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Box>

              {/* Selector de color personalizado */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Color personalizado:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                  <TextField
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    sx={{
                      width: 80,
                      '& input': {
                        height: 40,
                        cursor: 'pointer',
                      },
                    }}
                  />
                  <TextField
                    value={customColor}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setCustomColor(value);
                        if (value.length === 7 && selectedStatus) {
                          setColors(prev => ({ ...prev, [selectedStatus]: value }));
                        }
                      }
                    }}
                    placeholder="#000000"
                    size="small"
                    sx={{ flexGrow: 1 }}
                  />
                </Box>
              </Box>

              {/* Preview del estado seleccionado */}
              <Box
                sx={{
                  p: 3,
                  bgcolor: 'action.hover',
                  borderRadius: 2,
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                  Vista previa:
                </Typography>
                <Chip
                  label={PAYMENT_STATUS_LABELS[selectedStatus]}
                  sx={{
                    bgcolor: colors[selectedStatus],
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    height: 36,
                    mt: 1,
                  }}
                />
              </Box>
            </>
          )}

          {!selectedStatus && (
            <Box
              sx={{
                p: 4,
                bgcolor: 'action.hover',
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Selecciona un estado para cambiar su color
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ px: 3, py: 1 }}
        >
          {saving ? 'Guardando...' : 'Guardar Colores'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
