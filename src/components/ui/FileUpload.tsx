import React from 'react';
import { UploadCloud, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast.js';
import styles from './FileUpload.module.css';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUpload({
  onFilesSelected,
  accept,
  multiple = false,
  maxSizeMB = 10,
  label,
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [dragActive, setDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const maxBytes = maxSizeMB * 1024 * 1024;

  const processFiles = React.useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const arr = Array.from(incoming);
      const valid: File[] = [];
      for (const file of arr) {
        if (file.size > maxBytes) {
          toast({
            type: 'error',
            message: `"${file.name}" exceeds the ${maxSizeMB} MB limit.`,
          });
        } else {
          valid.push(file);
        }
      }
      if (valid.length === 0) return;
      const updated = multiple ? [...files, ...valid] : valid.slice(0, 1);
      setFiles(updated);
      onFilesSelected(updated);
    },
    [files, maxBytes, maxSizeMB, multiple, onFilesSelected, toast]
  );

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    // Reset so same file can be re-selected
    e.target.value = '';
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesSelected(updated);
  }

  const dropzoneCls = [
    styles.dropzone,
    dragActive ? styles.dropzoneActive : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.wrapper}>
      {label && <p className={styles.label}>{label}</p>}

      <div
        className={dropzoneCls}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload files"
      >
        <input
          ref={inputRef}
          type="file"
          className={styles.hiddenInput}
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          tabIndex={-1}
          aria-hidden="true"
        />
        <span className={styles.uploadIcon}>
          <UploadCloud size={28} />
        </span>
        <p className={styles.dropzoneTitle}>
          {dragActive ? 'Drop files here' : 'Click or drag files to upload'}
        </p>
        <p className={styles.dropzoneHint}>
          {accept ? `Accepted: ${accept} · ` : ''}Max {maxSizeMB} MB per file
        </p>
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className={styles.chip}>
              <span className={styles.chipName}>{file.name}</span>
              <span className={styles.chipSize}>{formatBytes(file.size)}</span>
              <button
                type="button"
                className={styles.chipRemove}
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                aria-label={`Remove ${file.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
