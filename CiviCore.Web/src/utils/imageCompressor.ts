export async function compressImage(file: File, maxDimension = 1200, quality = 0.8): Promise<File> {
  // If it's not an image (e.g. PDF or random file) or it's a GIF (canvas ruins animated gifs), just return the original
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  // If the file is already small (under 300KB), we might not need to compress, but we'll do it anyway 
  // to ensure dimensions are capped if they want to. Actually, let's just compress if it's over 300KB
  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and bounds
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file); // Fallback to original if canvas fails
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP for best compression, fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file); // Fallback
            }
            // Create a new File object
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file); // Fallback on error
    };
    reader.onerror = () => resolve(file); // Fallback on error
  });
}
