import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (content: string, files?: File[]) => void;
  onTyping?: () => void;
}

export function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    autoResize();
    onTyping?.();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed, files.length ? files : undefined);
    setValue('');
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) setFiles((prev) => [...prev, ...picked]);
    e.target.value = '';
  }

  return (
    <div className={styles.wrapper}>
      {files.length > 0 && (
        <div className={styles.stagedFiles}>
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className={styles.stagedFileChip}>
              {f.name}
              <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} aria-label={`Remove ${f.name}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.textareaWrapper}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            type="button"
            className={styles.attachBtn}
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={16} />
          </button>
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleFilePick} />
        </div>
        <button
          type="button"
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!value.trim()}
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
