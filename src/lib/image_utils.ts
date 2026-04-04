/**
 * Image Processing Utility 🖼️
 * Optimizes Base64 strings for storage and performance.
 */

export async function compressImage(
  dataUrl: string, 
  maxWidth: number = 800, 
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // 1. Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // 2. Draw and compress
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context is null"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with specified quality
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = (err) => reject(err);
  });
}
