import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  severity?: 'error' | 'warning' | 'info' | 'question';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const getIcon = (severity: 'error' | 'warning' | 'info' | 'question') => {
  switch (severity) {
    case 'error':
      return <ErrorOutlineIcon sx={{ fontSize: 48, color: 'error.main' }} />;
    case 'warning':
      return <WarningAmberIcon sx={{ fontSize: 48, color: 'warning.main' }} />;
    case 'info':
      return <InfoOutlinedIcon sx={{ fontSize: 48, color: 'info.main' }} />;
    case 'question':
      return <HelpOutlineIcon sx={{ fontSize: 48, color: 'primary.main' }} />;
  }
};

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  severity = 'question',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        elevation: 8,
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {getIcon(severity)}
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <CircularProgress size={48} />
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Eliminando...
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          color="inherit"
          sx={{ minWidth: 100 }}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={severity === 'error' || severity === 'warning' ? 'error' : 'primary'}
          sx={{ minWidth: 100 }}
          autoFocus
          disabled={loading}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
