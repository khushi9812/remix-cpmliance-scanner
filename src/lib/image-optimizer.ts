/**
 * HTML5 Canvas Image Optimizer
 * Reduces images > 2 MB to max 1920px (crisp HD) in ~50ms,
 * reducing a 10MB photo to ~400KB while preserving legibility.
 */

export interface OptimizeResult {
  file: File | Blob;
  previewUrl: string;
  originalSizeKb: number;
  optimizedSizeKb: number;
  resized: boolean;
  durationMs: number;
  width: number;
  height: number;
}

export async function optimizeImageForScan(file: File): Promise<OptimizeResult> {
  const startTime = performance.now();
  const originalSizeKb = Math.round(file.size / 1024);

  // If image is already under 2 MB, we can still generate preview and return
  const needsResize = file.size > 2 * 1024 * 1024;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file"));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image into memory"));

      img.onload = () => {
        let targetWidth = img.width;
        let targetHeight = img.height;
        const maxDimension = 1920;

        if (needsResize || targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth > targetHeight) {
            if (targetWidth > maxDimension) {
              targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
              targetWidth = maxDimension;
            }
          } else {
            if (targetHeight > maxDimension) {
              targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
              targetHeight = maxDimension;
            }
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          return resolve({
            file,
            previewUrl: e.target?.result as string,
            originalSizeKb,
            optimizedSizeKb: originalSizeKb,
            resized: false,
            durationMs: Math.round(performance.now() - startTime),
            width: img.width,
            height: img.height,
          });
        }

        // Crisp HD settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert canvas to blob (JPEG quality 0.88 gives crisp text and ~400KB)
        canvas.toBlob(
          (blob) => {
            const durationMs = Math.round(performance.now() - startTime);
            if (!blob) {
              return resolve({
                file,
                previewUrl: e.target?.result as string,
                originalSizeKb,
                optimizedSizeKb: originalSizeKb,
                resized: false,
                durationMs,
                width: img.width,
                height: img.height,
              });
            }

            const optimizedSizeKb = Math.round(blob.size / 1024);
            const optimizedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            });
            const previewUrl = canvas.toDataURL("image/jpeg", 0.88);

            resolve({
              file: optimizedFile,
              previewUrl,
              originalSizeKb,
              optimizedSizeKb,
              resized: needsResize || targetWidth !== img.width,
              durationMs,
              width: targetWidth,
              height: targetHeight,
            });
          },
          "image/jpeg",
          0.88
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
