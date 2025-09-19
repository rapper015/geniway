/**
 * Image compression utility functions
 */

/**
 * Compress an image file to reduce its size
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width in pixels (default: 1920)
 * @param {number} maxHeight - Maximum height in pixels (default: 1080)
 * @param {number} quality - Compression quality 0-1 (default: 0.8)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Please select an image file.'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Convert a file to base64 string
 * @param {File|Blob} file - The file to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Human readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @param {number} maxSize - Maximum file size in bytes (default: 5MB)
 * @returns {Object} - Validation result
 */
export const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  const result = {
    isValid: true,
    error: null
  };

  if (!file) {
    result.isValid = false;
    result.error = 'No file selected';
    return result;
  }

  if (!file.type.startsWith('image/')) {
    result.isValid = false;
    result.error = 'Please select a valid image file';
    return result;
  }

  if (file.size > maxSize) {
    result.isValid = false;
    result.error = `File size must be less than ${formatFileSize(maxSize)}`;
    return result;
  }

  return result;
};

/**
 * Process and compress an image file for upload
 * @param {File} file - The image file to process
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processed image data
 */
export const processImageForUpload = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.7,
    maxSize = 5 * 1024 * 1024
  } = options;

  // Validate file
  const validation = validateImageFile(file, maxSize);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Compress image
  const compressedBlob = await compressImage(file, maxWidth, maxHeight, quality);
  
  // Convert to base64
  const base64 = await fileToBase64(compressedBlob);

  return {
    base64,
    compressedSize: compressedBlob.size,
    originalSize: file.size,
    fileName: file.name,
    fileType: file.type,
    compressionRatio: ((file.size - compressedBlob.size) / file.size * 100).toFixed(1)
  };
};
