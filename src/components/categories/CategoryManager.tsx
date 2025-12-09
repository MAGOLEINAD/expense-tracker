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
  Alert,
  ListItemIcon,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { IconSelector } from '@/components/expenses/IconSelector';
import * as MuiIcons from '@mui/icons-material';

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
}

export const CategoryManager = ({ open, onClose }: CategoryManagerProps) => {
  const { user } = useAuth();
  const { categories, loading, addCategory, updateCategory, deleteCategory, updateCategoryIcon } = useCategories(
    user?.uid
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [expenseCount, setExpenseCount] = useState(0);
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);
  const [editingIconCategoryId, setEditingIconCategoryId] = useState<string | null>(null);

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

  const handleDelete = async (id: string, name: string) => {
    try {
      // Intentar borrar sin cascada para verificar si hay gastos
      await deleteCategory(id, false);
    } catch (error) {
      if (error instanceof Error) {
        // Si hay gastos asociados, mostrar diálogo de confirmación
        const match = error.message.match(/(\d+) gasto/);
        if (match) {
          const count = parseInt(match[1]);
          setExpenseCount(count);
          setCategoryToDelete({ id, name });
          setDeleteDialogOpen(true);
        } else {
          alert(error.message);
        }
      }
    }
  };

  const confirmCascadeDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id, true);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setExpenseCount(0);
    } catch (error) {
      alert('Error al eliminar la categoría');
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
    setExpenseCount(0);
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

  const handleOpenIconSelector = (categoryId: string) => {
    setEditingIconCategoryId(categoryId);
    setIconSelectorOpen(true);
  };

  const handleSelectIcon = async (iconName: string) => {
    if (editingIconCategoryId) {
      try {
        await updateCategoryIcon(editingIconCategoryId, iconName);
        setIconSelectorOpen(false);
        setEditingIconCategoryId(null);
      } catch (error) {
        alert('Error al actualizar el icono');
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
                editingId !== category.id && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenIconSelector(category.id!)}
                      title="Seleccionar icono"
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleStartEdit(category.id!, category.name)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(category.id!, category.name)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )
              }
            >
              {editingId === category.id ? (
                <Box sx={{ display: 'flex', gap: 1, width: '100%', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    size="small"
                  />
                  <Button size="small" variant="contained" onClick={handleSaveEdit} sx={{ whiteSpace: 'nowrap' }}>
                    Guardar
                  </Button>
                  <Button size="small" onClick={handleCancelEdit} sx={{ whiteSpace: 'nowrap' }}>
                    Cancelar
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {category.icon && (() => {
                    const IconComponent = (MuiIcons as any)[category.icon];
                    return IconComponent ? (
                      <ListItemIcon sx={{ minWidth: 'auto' }}>
                        <IconComponent sx={{ color: 'primary.main' }} />
                      </ListItemIcon>
                    ) : null;
                  })()}
                  <ListItemText primary={category.name} />
                </Box>
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
      
        <Box sx={{ flexGrow: 1 }} />
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>

      {/* Selector de iconos */}
      <IconSelector
        open={iconSelectorOpen}
        selectedIcon={categories.find(c => c.id === editingIconCategoryId)?.icon}
        onClose={() => {
          setIconSelectorOpen(false);
          setEditingIconCategoryId(null);
        }}
        onSelect={handleSelectIcon}
      />

      {/* Diálogo de confirmación de borrado en cascada */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            La categoría <strong>{categoryToDelete?.name}</strong> tiene <strong>{expenseCount}</strong> gasto(s) asociado(s).
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Si eliminas esta categoría, también se eliminarán <strong>todos los gastos</strong> asociados a ella.
            Esta acción no se puede deshacer.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 600 }}>
            ¿Estás seguro de que deseas continuar?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} color="inherit">
            Cancelar
          </Button>
          <Button onClick={confirmCascadeDelete} color="error" variant="contained">
            Eliminar categoría y {expenseCount} gasto(s)
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
