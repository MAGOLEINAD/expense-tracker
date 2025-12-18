import { Dialog, DialogContent, DialogTitle, IconButton, Box, Typography, Stack, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { useState, useEffect } from 'react';

interface ImageViewerDialogProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
  onImageError?: (imageUrl: string) => void; // Callback cuando una imagen falla al cargar
}

export const ImageViewerDialog = ({ open, onClose, images, initialIndex = 0, onImageError }: ImageViewerDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoading, setImageLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Detectar si el archivo actual es un PDF
  const isPDF = (url: string) => {
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.toLowerCase().includes('.pdf') ||
           decodedUrl.includes('application/pdf') ||
           url.includes('%2Fpdf') ||
           url.includes('.pdf');
  };

  const currentIsPDF = images[currentIndex] ? isPDF(images[currentIndex]) : false;

  // Resetear loading y error cada vez que cambia la imagen
  useEffect(() => {
    setImageLoading(true);
    setHasError(false);
  }, [currentIndex, images]);

  // Resetear índice cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setImageLoading(true);
    }
  }, [open, initialIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleClose = () => {
    setCurrentIndex(initialIndex);
    setImageLoading(true);
    onClose();
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setHasError(true);
    // Notificar al componente padre que esta imagen tiene error
    if (onImageError && images[currentIndex]) {
      onImageError(images[currentIndex]);
    }
  };

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1, pr: 6, position: 'relative' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {currentIsPDF ? 'PDF' : 'Imagen'} {currentIndex + 1} de {images.length}
          </Typography>
          <IconButton
            aria-label="Cerrar"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: currentIsPDF ? '#525659' : '#000' }}>
        {/* Loader mientras se carga el archivo */}
        {imageLoading && !hasError && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
            }}
          >
            <CircularProgress size={60} sx={{ color: 'white' }} />
          </Box>
        )}

        {/* Mensaje de error si el archivo no se puede cargar */}
        {hasError && (
          <Box sx={{ textAlign: 'center', color: 'white', p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ⚠️ Archivo no disponible
            </Typography>
            <Typography variant="body2" color="error.light">
              Este archivo fue eliminado o no está disponible.
            </Typography>
          </Box>
        )}

        {/* Mostrar PDF o Imagen según el tipo */}
        {!hasError && (
          currentIsPDF ? (
            // Visor de PDF
            <Box
              component="iframe"
              src={images[currentIndex]}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sx={{
                width: '100%',
                height: '70vh',
                border: 'none',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
          ) : (
            // Visor de imagen
            <Box
              component="img"
              src={images[currentIndex]}
              alt={`Imagen ${currentIndex + 1}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out',
              }}
            />
          )
        )}

        {/* Controles de navegación (solo si hay más de una imagen) */}
        {images.length > 1 && !imageLoading && (
          <>
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <NavigateBeforeIcon />
            </IconButton>

            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
              }}
            >
              <NavigateNextIcon />
            </IconButton>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
