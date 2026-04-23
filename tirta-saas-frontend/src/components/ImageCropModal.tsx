import React, { useCallback, useRef, useState } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropModalProps {
  /** Blob URL or data URL of the image to crop */
  src: string;
  /** Desired output filename (without extension) */
  filename?: string;
  /** Fixed aspect ratio — omit for free crop */
  aspect?: number;
  /** Called with the cropped File when user confirms */
  onConfirm: (file: File) => void;
  /** Called when user cancels */
  onCancel: () => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

const ImageCropModal: React.FC<ImageCropModalProps> = ({
  src,
  filename = 'cropped',
  aspect,
  onConfirm,
  onCancel,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [saving, setSaving] = useState(false);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      if (aspect) {
        setCrop(centerAspectCrop(naturalWidth, naturalHeight, aspect));
      } else {
        // Free crop — default to 90% of image
        setCrop(
          centerCrop(
            { unit: '%', width: 90, height: 90 },
            naturalWidth,
            naturalHeight,
          ),
        );
      }
    },
    [aspect],
  );

  const handleConfirm = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !completedCrop || completedCrop.width === 0) return;

    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(
        img,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );

      if (!blob) return;

      const file = new File([blob], `${filename}.png`, { type: 'image/png' });
      onConfirm(file);
    } finally {
      setSaving(false);
    }
  }, [completedCrop, filename, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col max-w-lg w-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900 text-sm">Crop Gambar</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Crop area */}
        <div className="overflow-auto flex-1 flex items-center justify-center bg-gray-100 p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={40}
            minHeight={40}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Pratinjau crop"
              className="max-w-full max-h-[50vh] object-contain"
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 text-center px-4 pt-2">
          Seret area seleksi untuk menyesuaikan crop. Sudut biru untuk mengubah ukuran.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={!completedCrop || completedCrop.width === 0 || saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Memproses...' : 'Gunakan Gambar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
