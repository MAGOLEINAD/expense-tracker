import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Sube una imagen a Firebase Storage
 * @param file - Archivo de imagen a subir
 * @param userId - ID del usuario
 * @param expenseId - ID del gasto (opcional, si aún no existe)
 * @returns URL de descarga de la imagen
 */
export const uploadExpenseImage = async (
  file: File,
  userId: string,
  expenseId?: string
): Promise<string> => {
  try {
    // Generar un nombre único para el archivo
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const path = expenseId
      ? `expenses/${userId}/${expenseId}/${fileName}`
      : `expenses/${userId}/temp/${fileName}`;

    // Crear referencia al archivo en Storage
    const storageRef = ref(storage, path);

    // Subir el archivo
    await uploadBytes(storageRef, file);

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Elimina una imagen de Firebase Storage
 * @param imageUrl - URL de la imagen a eliminar
 */
export const deleteExpenseImage = async (imageUrl: string): Promise<void> => {
  try {
    // Crear referencia desde la URL
    const imageRef = ref(storage, imageUrl);

    // Eliminar el archivo
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * Valida que el archivo sea una imagen o PDF y no exceda el tamaño máximo
 * @param file - Archivo a validar
 * @param maxSizeMB - Tamaño máximo en MB (default: 10MB para PDFs, 5MB para imágenes)
 * @returns true si es válido, false si no
 */
export const validateImageFile = (file: File, maxSizeMB?: number): { valid: boolean; error?: string } => {
  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP) y PDFs.'
    };
  }

  // Validar tamaño (PDFs pueden ser más grandes)
  const isPDF = file.type === 'application/pdf';
  const defaultMaxSize = isPDF ? 10 : 5;
  const maxSize = maxSizeMB || defaultMaxSize;
  const maxSizeBytes = maxSize * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${maxSize}MB.`
    };
  }

  return { valid: true };
};
