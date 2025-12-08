import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';

interface CommentDialogProps {
  open: boolean;
  initialComment?: string;
  onClose: () => void;
  onSave: (comment: string) => void;
}

export const CommentDialog = ({ open, initialComment = '', onClose, onSave }: CommentDialogProps) => {
  const [comment, setComment] = useState(initialComment);

  useEffect(() => {
    setComment(initialComment);
  }, [initialComment, open]);

  const handleSave = () => {
    onSave(comment.trim());
    onClose();
  };

  const handleDelete = () => {
    onSave('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialComment ? 'Editar Comentario' : 'Agregar Comentario'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comentario"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe un comentario..."
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        {initialComment && (
          <Button onClick={handleDelete} color="error" sx={{ mr: 'auto' }}>
            Eliminar
          </Button>
        )}
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
