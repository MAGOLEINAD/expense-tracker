import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Stack,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Typography,
  Alert,
  Tooltip,
  useMediaQuery,
  useTheme,
  Chip,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import type { Expense, Currency, PaymentStatus, UserCategory } from '@/types';
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABELS, isCreditCard, uploadExpenseImage, validateImageFile, deleteExpenseImage } from '@/utils';
import { format } from 'date-fns';
import { IconSelector } from './IconSelector';
import { ImageViewerDialog } from '../common/ImageViewerDialog';
import * as MuiIcons from '@mui/icons-material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useAuth } from '@/contexts/AuthContext';

interface ExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (expense: Partial<Expense>) => void;
  expense?: Expense | null;
  selectedMonth: number;
  selectedYear: number;
  categories: UserCategory[];
  onOpenCategoryManager?: () => void;
  usdRate?: number;
}

const statusOptions: { value: PaymentStatus; label: string }[] = PAYMENT_STATUSES.map((status) => ({
  value: status,
  label: PAYMENT_STATUS_LABELS[status],
}));

export const ExpenseDialog = ({
  open,
  onClose,
  onSave,
  expense,
  selectedMonth,
  selectedYear,
  categories,
  onOpenCategoryManager,
  usdRate = 1200,
}: ExpenseDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const defaultCategory = categories.length > 0 ? categories[0].id! : '';

  const [formData, setFormData] = useState<Partial<Expense>>({
    item: '',
    vto: format(new Date(), 'yyyy-MM-dd'),
    fechaPago: format(new Date(), 'yyyy-MM-dd'),
    importe: 0,
    currency: 'ARS',
    pagadoPor: '',
    status: 'pendiente',
    category: defaultCategory,
    month: selectedMonth,
    year: selectedYear,
  });

  const [iconSelectorOpen, setIconSelectorOpen] = useState(false);
  const [importeText, setImporteText] = useState('0');

  // Estados para TCs
  const [cardTotalARS, setCardTotalARS] = useState(0);
  const [cardTotalUSD, setCardTotalUSD] = useState(0);
  const [cardUSDRate, setCardUSDRate] = useState(usdRate);
  const [cardTax, setCardTax] = useState(0);

  // Estados de texto para TCs (manejo de punto decimal como coma)
  const [cardTotalARSText, setCardTotalARSText] = useState('0');
  const [cardTotalUSDText, setCardTotalUSDText] = useState('0');
  const [cardUSDRateText, setCardUSDRateText] = useState(String(usdRate));
  const [cardTaxText, setCardTaxText] = useState('0');

  // Estados para imágenes adjuntas
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);
  const [uploadedInSession, setUploadedInSession] = useState<string[]>([]); // URLs subidas en esta sesión

  const isTC = formData.item ? isCreditCard({ ...formData, id: expense?.id } as Expense) : false;

  useEffect(() => {
    if (expense) {
      const today = format(new Date(), 'yyyy-MM-dd');
      setFormData({
        ...expense,
        vto: expense.vto && expense.vto !== '' ? expense.vto : today,
        fechaPago: expense.fechaPago && expense.fechaPago !== '' ? expense.fechaPago : today,
      });
      setImporteText(String(expense.importe || 0).replace('.', ','));

      const arsValue = expense.cardTotalARS || 0;
      const usdValue = expense.cardTotalUSD || 0;
      const rateValue = expense.cardUSDRate || usdRate;
      const taxValue = expense.cardTax || 0;

      setCardTotalARS(arsValue);
      setCardTotalUSD(usdValue);
      setCardUSDRate(rateValue);
      setCardTax(taxValue);

      // Inicializar estados de texto con comas
      setCardTotalARSText(String(arsValue).replace('.', ','));
      setCardTotalUSDText(String(usdValue).replace('.', ','));
      setCardUSDRateText(String(rateValue).replace('.', ','));
      setCardTaxText(String(taxValue).replace('.', ','));

      // Cargar attachments si existen
      setAttachments(expense.attachments || []);
      setImageError(null);
    } else {
      const newDefaultCategory = categories.length > 0 ? categories[0].id! : '';
      setFormData({
        item: '',
        vto: format(new Date(), 'yyyy-MM-dd'),
        fechaPago: format(new Date(), 'yyyy-MM-dd'),
        importe: 0,
        currency: 'ARS',
        pagadoPor: '',
        status: 'pendiente',
        category: newDefaultCategory,
        month: selectedMonth,
        year: selectedYear,
      });
      setImporteText('0');
      setCardTotalARS(0);
      setCardTotalUSD(0);
      setCardUSDRate(usdRate);
      setCardTax(0);
      setCardTotalARSText('0');
      setCardTotalUSDText('0');
      setCardUSDRateText(String(usdRate).replace('.', ','));
      setCardTaxText('0');
      setAttachments([]);
      setImageError(null);
      setUploadedInSession([]); // Resetear archivos subidos en sesión
    }
  }, [expense, selectedMonth, selectedYear, categories, usdRate]);

  const handleSelectIcon = (iconName: string) => {
    setFormData({ ...formData, icon: iconName });
  };

  const isPDF = (url: string) => {
    // Decodificar la URL para detectar .pdf en el path
    const decodedUrl = decodeURIComponent(url);
    return decodedUrl.toLowerCase().includes('.pdf') ||
           decodedUrl.includes('application/pdf') ||
           url.includes('%2Fpdf') ||
           url.includes('.pdf');
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      // Decodificar la URL
      const decodedUrl = decodeURIComponent(url);

      // Extraer el path del archivo (después de /o/ y antes de ?)
      const matches = decodedUrl.match(/\/o\/(.+?)(\?|$)/);
      if (matches && matches[1]) {
        const fullPath = matches[1];
        // Obtener solo el nombre del archivo (última parte después de /)
        const fileName = fullPath.split('/').pop() || '';

        // Remover el timestamp al inicio (formato: 1234567890_NombreArchivo.ext)
        const withoutTimestamp = fileName.replace(/^\d+_/, '');

        return withoutTimestamp || 'Archivo';
      }

      return 'Archivo';
    } catch (error) {
      return 'Archivo';
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setImageError(null);

    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Error al validar la imagen');
      return;
    }

    setUploadingImage(true);
    try {
      // Subir imagen a Firebase Storage
      const imageUrl = await uploadExpenseImage(file, user.uid, expense?.id);

      // Agregar URL a la lista de attachments
      setAttachments(prev => [...prev, imageUrl]);

      // Trackear que esta URL fue subida en esta sesión (para limpiar si se cancela)
      setUploadedInSession(prev => [...prev, imageUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageError('Error al subir la imagen. Por favor, intenta de nuevo.');
    } finally {
      setUploadingImage(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      // Intentar eliminar de Firebase Storage
      await deleteExpenseImage(imageUrl);
    } catch (error: any) {
      // Si el archivo no existe (ya fue borrado manualmente), no es un error real
      if (error?.code === 'storage/object-not-found') {
        console.log('Archivo ya no existe en Storage, removiendo solo la referencia');
      } else {
        // Si es otro tipo de error, mostrarlo
        console.error('Error removing image:', error);
        setImageError('Error al eliminar la imagen');
        return; // Salir sin remover de la lista si hubo un error real
      }
    }

    // Eliminar de la lista local (tanto si se eliminó como si ya no existía)
    setAttachments(prev => prev.filter(url => url !== imageUrl));

    // Eliminar de uploadedInSession también
    setUploadedInSession(prev => prev.filter(url => url !== imageUrl));
  };

  const SelectedIconComponent = formData.icon ? (MuiIcons as any)[formData.icon] : null;

  const handleSubmit = () => {
    const cleanedData: Partial<Expense> = {};
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof Partial<Expense>];
      if (value !== undefined) {
        (cleanedData as any)[key] = value;
      }
    });

    if (isTC) {
      cleanedData.cardTotalARS = cardTotalARS;
      cleanedData.cardTotalUSD = cardTotalUSD;
      cleanedData.cardUSDRate = cardUSDRate;
      cleanedData.cardTax = cardTax;

      // Calcular el Total Final según la moneda
      let cardFinalTotal: number;
      if (formData.currency === 'USD') {
        // Para TC en USD: convertir todo a USD y restar impuesto en USD
        cardFinalTotal = cardTotalUSD + (cardTotalARS / cardUSDRate) - (cardTax / cardUSDRate);
      } else {
        // Para TC en ARS: convertir todo a ARS y restar impuesto en ARS
        cardFinalTotal = cardTotalARS + (cardTotalUSD * cardUSDRate) - cardTax;
      }
      cleanedData.importe = cardFinalTotal;
    }

    // Incluir attachments (o null si está vacío para eliminar el campo en Firestore)
    if (attachments.length > 0) {
      cleanedData.attachments = attachments;
    } else if (expense?.attachments) {
      // Si el gasto tenía attachments antes pero ahora está vacío, eliminarlos explícitamente
      // Usar null (no undefined) para que deleteField() se active en useExpenses
      cleanedData.attachments = null as any;
    }

    // Limpiar la lista de archivos subidos en esta sesión (ya se guardaron)
    setUploadedInSession([]);

    onSave(cleanedData);
    onClose();
  };

  const handleCancel = async () => {
    // Si hay archivos subidos en esta sesión, eliminarlos de Storage
    if (uploadedInSession.length > 0) {
      try {
        await Promise.all(
          uploadedInSession.map(url => deleteExpenseImage(url))
        );
      } catch (error) {
        console.error('Error cleaning up uploaded files:', error);
      }
    }

    // Limpiar estados y cerrar
    setUploadedInSession([]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          ...(isMobile ? { borderRadius: 0 } : {}),
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, pr: isMobile ? 6 : 3, position: 'relative' }}>
        {expense ? 'Editar Gasto' : 'Nuevo Gasto'}

        {isMobile && (
          <IconButton
            aria-label="Cerrar"
            onClick={handleCancel}
            edge="end"
            sx={{
              position: 'absolute',
              right: 18,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Categoría"
            value={formData.category}
            onChange={(e) => {
              if (e.target.value === '__add_new__') {
                onOpenCategoryManager?.();
              } else {
                setFormData({ ...formData, category: e.target.value });
              }
            }}
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
            {onOpenCategoryManager && (
              <MenuItem value="__add_new__" sx={{ color: 'primary.main', fontWeight: 600 }}>
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Agregar nueva categoría" />
              </MenuItem>
            )}
          </TextField>

          {/* Bloque: Item + Icono + Color + PagadoPor + Moneda (TC) */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
            {/* Item + icon tools */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, width: '100%' }}>
              <TextField
                fullWidth
                label="Item"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                InputProps={{
                  startAdornment: SelectedIconComponent && (
                    <InputAdornment position="start">
                      <SelectedIconComponent sx={{ color: formData.iconColor || '#2196f3' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton onClick={() => setIconSelectorOpen(true)} color="primary" sx={{ flexShrink: 0 }}>
                <SearchIcon />
              </IconButton>
              {formData.icon && (
                <TextField
                  type="color"
                  value={formData.iconColor || '#2196f3'}
                  onChange={(e) => setFormData({ ...formData, iconColor: e.target.value })}
                  sx={{ width: 72, flexShrink: 0 }}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            </Stack>

            {/* Pagado por + Moneda (solo TC) */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flex: 1, width: '100%' }}>
              <TextField
                fullWidth
                label="Pagado Por"
                value={formData.pagadoPor}
                onChange={(e) => setFormData({ ...formData, pagadoPor: e.target.value })}
              />

              {isTC && (
                <TextField
                  select
                  label="Moneda"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                  sx={{
                    width: { xs: '100%', sm: 140 },
                    flexShrink: 0,
                  }}
                >
                  <MenuItem value="ARS">$ ARS</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                </TextField>
              )}
            </Stack>
          </Stack>

          {/* Bloque: fechas + estado */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              type="date"
              label="Vencimiento"
              value={formData.vto}
              onChange={(e) => setFormData({ ...formData, vto: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="date"
              label="Fecha de Pago"
              value={formData.fechaPago}
              onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              fullWidth
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PaymentStatus })}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {isTC ? (
            <>
              <Alert severity="info" sx={{ mb: 1 }}>
                Para gastos de TC, el importe se calcula automáticamente. Use el icono de "Detalle" en la tabla para
                asociar gastos.
              </Alert>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' },
                  gap: 2,
                }}
              >
                <TextField
                  label="Total ARS"
                  type="text"
                  value={cardTotalARSText}
                  onChange={(e) => {
                    let value = e.target.value;
                    value = value.replace(/\./g, ',');
                    if (value === '' || value === '-' || /^-?\d*,?\d{0,2}$/.test(value)) {
                      setCardTotalARSText(value);
                      const numValue = value.replace(',', '.');
                      const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                      if (!isNaN(num)) {
                        setCardTotalARS(num);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  inputProps={{ inputMode: 'decimal' }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
                  }}
                />
                <TextField
                  label="Total USD"
                  type="text"
                  value={cardTotalUSDText}
                  onChange={(e) => {
                    let value = e.target.value;
                    value = value.replace(/\./g, ',');
                    if (value === '' || value === '-' || /^-?\d*,?\d{0,2}$/.test(value)) {
                      setCardTotalUSDText(value);
                      const numValue = value.replace(',', '.');
                      const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                      if (!isNaN(num)) {
                        setCardTotalUSD(num);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  inputProps={{ inputMode: 'decimal' }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>USD</Typography>,
                  }}
                />

                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    label="Cotización USD"
                    type="text"
                    fullWidth
                    value={cardUSDRateText}
                    onChange={(e) => {
                      let value = e.target.value;
                      value = value.replace(/\./g, ',');
                      if (value === '' || value === '-' || /^-?\d*,?\d{0,2}$/.test(value)) {
                        setCardUSDRateText(value);
                        const numValue = value.replace(',', '.');
                        const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                        if (!isNaN(num)) {
                          setCardUSDRate(num);
                        }
                      }
                    }}
                    onFocus={(e) => e.target.select()}
                    inputProps={{ inputMode: 'decimal' }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
                    }}
                  />
                  <Tooltip title="Recargar cotización de la API" arrow>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setCardUSDRate(usdRate);
                        setCardUSDRateText(String(usdRate).replace('.', ','));
                      }}
                      color="primary"
                      sx={{ flexShrink: 0, mt: 0.5 }}
                    >
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <TextField
                  label="Impuesto (Db.rg 5617 30%)"
                  type="text"
                  value={cardTaxText}
                  onChange={(e) => {
                    let value = e.target.value;
                    value = value.replace(/\./g, ',');
                    if (value === '' || value === '-' || /^-?\d*,?\d{0,2}$/.test(value)) {
                      setCardTaxText(value);
                      const numValue = value.replace(',', '.');
                      const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                      if (!isNaN(num)) {
                        setCardTax(num);
                      }
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  inputProps={{ inputMode: 'decimal' }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography>,
                  }}
                />
              </Box>

              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Final de la TC:
                </Typography>
                {formData.currency === 'USD' ? (
                  <>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      USD {(cardTotalUSD + (cardTotalARS / cardUSDRate) - (cardTax / cardUSDRate)).toLocaleString('es-AR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Equivalente: $ {((cardTotalUSD + (cardTotalARS / cardUSDRate) - (cardTax / cardUSDRate)) * cardUSDRate).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    $ {(cardTotalARS + (cardTotalUSD * cardUSDRate) - cardTax).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  El importe final se calculará restando los gastos asociados y el impuesto.
                </Typography>
              </Box>
            </>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Importe"
                value={importeText}
                onChange={(e) => {
                  let value = e.target.value;
                  value = value.replace(/\./g, ',');
                  if (value === '' || value === '-' || /^-?\d*,?\d*$/.test(value)) {
                    setImporteText(value);
                    const numValue = value.replace(',', '.');
                    const num = numValue === '' || numValue === '-' ? 0 : parseFloat(numValue);
                    if (!isNaN(num)) {
                      setFormData({ ...formData, importe: num });
                    }
                  }
                }}
                inputProps={{ inputMode: 'decimal' }}
              />
              <TextField
                select
                fullWidth
                label="Moneda"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
              >
                <MenuItem value="ARS">$ ARS</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Stack>
          )}

          <TextField
            fullWidth
            type="number"
            label="Deuda pendiente (opcional)"
            value={formData.debt || ''}
            onChange={(e) => setFormData({ ...formData, debt: e.target.value ? Number(e.target.value) : undefined })}
            inputProps={{ step: '0.01', min: 0 }}
            helperText="Ingresa el monto que aún debes de este gasto"
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comentario (opcional)"
            value={formData.comment || ''}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value || undefined })}
            placeholder="Agrega un comentario sobre este gasto..."
          />

          {/* Sección de adjuntar archivos */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Adjuntar comprobantes (Imágenes o PDFs)
            </Typography>

            {imageError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setImageError(null)}>
                {imageError}
              </Alert>
            )}

            {/* Botón para subir archivo */}
            <Button
              variant="outlined"
              component="label"
              startIcon={uploadingImage ? <CircularProgress size={20} /> : <AttachFileIcon />}
              disabled={uploadingImage}
              fullWidth={isMobile}
              sx={{ mb: 2 }}
            >
              {uploadingImage ? 'Subiendo archivo...' : 'Subir archivo'}
              <input
                type="file"
                hidden
                accept="image/*,application/pdf"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
            </Button>

            {/* Mostrar archivos adjuntos */}
            {attachments.length > 0 && (
              <Stack spacing={1}>
                {attachments.map((url, index) => {
                  const isFilePDF = isPDF(url);
                  return (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      {isFilePDF ? (
                        <PictureAsPdfIcon color="error" />
                      ) : (
                        <ImageIcon color="primary" />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => {
                          setViewerImageIndex(index);
                          setImageViewerOpen(true);
                        }}
                        title={getFileNameFromUrl(url)}
                      >
                        {getFileNameFromUrl(url)}
                      </Typography>
                    <Chip
                      label="Ver"
                      size="small"
                      onClick={() => {
                        setViewerImageIndex(index);
                        setImageViewerOpen(true);
                      }}
                      sx={{ cursor: 'pointer' }}
                    />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveImage(url)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: isMobile ? 2 : 2 }}>
        <Button onClick={handleCancel} fullWidth={isMobile}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" fullWidth={isMobile}>
          Guardar
        </Button>
      </DialogActions>

      <IconSelector
        open={iconSelectorOpen}
        selectedIcon={formData.icon}
        onClose={() => setIconSelectorOpen(false)}
        onSelect={handleSelectIcon}
      />

      <ImageViewerDialog
        open={imageViewerOpen}
        images={attachments}
        initialIndex={viewerImageIndex}
        onClose={() => setImageViewerOpen(false)}
      />
    </Dialog>
  );
};
