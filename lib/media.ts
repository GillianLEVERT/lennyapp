// Utilitaires média côté navigateur : compression d'image et lecture de blob.
// On stocke les médias en dataURL dans Firestore (aucune infra Storage à gérer),
// donc on compresse agressivement pour rester très en dessous de la limite de doc.

// Charge un fichier image en HTMLImageElement (révoque l'URL objet ensuite).
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(event);
    };
    image.src = url;
  });
}

// Recadre en carré (cover) et réexporte en JPEG dataURL compressé.
export async function compressImage(
  file: File,
  size = 256,
  quality = 0.82
): Promise<string> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas non supporté");
  }

  const scale = Math.max(size / image.width, size / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(
    image,
    (size - drawWidth) / 2,
    (size - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  return canvas.toDataURL("image/jpeg", quality);
}

// Lit un Blob (enregistrement audio) en dataURL base64.
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
