import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
}

export const CategoryManager = ({ open, onClose }: CategoryManagerProps) => {
  const { user } = useAuth();
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories(
    user?.uid
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveEdit = async () => {
    if (editingId && editingName.trim()) {
      try {
        await updateCategory(editingId, editingName.trim());
        setEditingId(null);
        setEditingName('');
      } catch (error) {
        alert('Error al actualizar categoría');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        if (error instanceof Error) {
          alert(error.message);
        }
      }
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        await addCategory(newCategoryName.trim());
        setNewCategoryName('');
        setIsAdding(false);
      } catch (error) {
        alert('Error al agregar categoría');
      }
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Gestionar Categorías</DialogTitle>
      <DialogContent>
        <List>
          {categories.map((category) => (
            <ListItem
              key={category.id}
              secondaryAction={
                editingId === category.id ? (
                  <Box display="flex" gap={1}>
                    <Button size="small" onClick={handleSaveEdit}>
                      Guardar
                    </Button>
                    <Button size="small" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => handleStartEdit(category.id!, category.name)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => handleDelete(category.id!)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )
              }
            >
              {editingId === category.id ? (
                <TextField
                  fullWidth
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
              ) : (
                <ListItemText primary={category.name} />
              )}
            </ListItem>
          ))}
        </List>

        {isAdding ? (
          <Box display="flex" gap={1} mt={2}>
            <TextField
              fullWidth
              label="Nombre de la nueva categoría"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewCategoryName('');
                }
              }}
            />
            <Button onClick={handleAddCategory}>Agregar</Button>
            <Button
              onClick={() => {
                setIsAdding(false);
                setNewCategoryName('');
              }}
            >
              Cancelar
            </Button>
          </Box>
        ) : (
          <Button
            startIcon={<AddIcon />}
            onClick={() => setIsAdding(true)}
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
          >
            Agregar nueva categoría
          </Button>
        )}

        {categories.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            No tienes categorías. Agrega una para comenzar.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};
