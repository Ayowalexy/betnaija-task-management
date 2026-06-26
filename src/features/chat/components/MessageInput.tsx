import { useState, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (content: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    autoResize();
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
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }

  return (
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
          title="Attach file (not available in demo)"
          onClick={() => {}}
        >
          <Paperclip size={16} />
        </button>
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
  );
}
