import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ImageDropzoneProps {
  value?: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  folder?: string;
  label?: string;
  hint?: string;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  value,
  onChange,
  multiple = false,
  folder = 'products',
  label,
  hint = 'Drag & drop image files here or click to browse (JPG, PNG, WebP up to 15MB)'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Normalize images to array
  const images: string[] = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === 'string' && value.trim()
    ? [value.trim()]
    : [];

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) {
        setError('Please select valid image files (JPG, PNG, WebP, AVIF).');
        return;
      }

      setError(null);
      setIsUploading(true);
      const newUrls: string[] = [];

      const { data: { session } } = await supabase.auth.getSession();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length} to Cloudflare R2...`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: {
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
            },
            body: formData
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to upload image');
          }

          newUrls.push(data.url);
        } catch (err: any) {
          console.error('Upload failed:', err);
          setError(`Upload error for "${file.name}": ${err?.message || 'Upload failed'}`);
        }
      }

      setIsUploading(false);
      setUploadProgress('');

      if (newUrls.length > 0) {
        if (multiple) {
          onChange([...images, ...newUrls]);
        } else {
          onChange(newUrls[0]);
        }
      }
    },
    [folder, multiple, onChange, images]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    if (multiple) {
      const updated = images.filter((_, idx) => idx !== indexToRemove);
      onChange(updated);
    } else {
      onChange('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && (
        <label
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
            color: '#5b4130'
          }}
        >
          {label}
        </label>
      )}

      {/* Drop Zone Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#D49E58' : 'rgba(118,89,65,0.35)'}`,
          backgroundColor: isDragging ? 'rgba(212,158,88,0.08)' : 'rgba(240,226,206,0.45)',
          padding: '24px 20px',
          textAlign: 'center',
          borderRadius: '4px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          style={{ display: 'none' }}
          disabled={isUploading}
          onChange={(e) => {
            if (e.target.files?.length) {
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />

        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#765941' }}>
            <Loader2 style={{ width: '28px', height: '28px', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{uploadProgress}</span>
          </div>
        ) : (
          <>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'rgba(118,89,65,0.12)',
                display: 'grid',
                placeItems: 'center',
                color: '#765941'
              }}
            >
              <Upload style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#19120C' }}>
                Drop image here or <span style={{ color: '#765941', textDecoration: 'underline' }}>browse</span>
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#806957' }}>{hint}</p>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#b91c1c',
            fontSize: '12px',
            backgroundColor: '#fee2e2',
            padding: '8px 12px',
            borderRadius: '4px'
          }}
        >
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Image Thumbnails Gallery */}
      {images.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: '10px',
            marginTop: '8px'
          }}
        >
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              style={{
                position: 'relative',
                width: '100%',
                height: '80px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: '1px solid rgba(118,89,65,0.25)',
                backgroundColor: '#19120C'
              }}
            >
              <img
                src={url}
                alt={`Uploaded asset ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/slat.webp';
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                title="Remove image"
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(25,18,12,0.85)',
                  color: '#fff',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X style={{ width: '13px', height: '13px' }} />
              </button>
              {idx === 0 && !multiple && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '2px',
                    backgroundColor: 'rgba(212,158,88,0.92)',
                    color: '#19120C',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '2px',
                    textTransform: 'uppercase'
                  }}
                >
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
