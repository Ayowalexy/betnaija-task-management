import { useState } from 'react';
import type { Shift } from '../../../types/index';
import { Modal, Button } from '../../../components/ui/index';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (shift: Omit<Shift, 'id'>) => void;
  departmentId: string;
}

export function AddShiftModal({ isOpen, onClose, onAdd, departmentId }: AddShiftModalProps) {
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim() || !date || !startTime || !endTime) {
      setError('All fields are required.');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    onAdd({ userId: userId.trim(), departmentId, date, startTime, endTime });
    setUserId('');
    setDate('');
    setStartTime('09:00');
    setEndTime('17:00');
    setError('');
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--color-border-default)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-bg-subtle)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-sm)',
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-text-secondary)',
    marginBottom: 4,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Shift" footer={
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
        <Button variant="primary" type="submit" form="add-shift-form">Add Shift</Button>
      </div>
    }>
      <form id="add-shift-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Team Member (User ID)</label>
          {/* TODO: Replace with a user-picker once a users-by-department API is available */}
          <input
            style={inputStyle}
            type="text"
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Date</label>
          <input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Start Time</label>
            <input style={inputStyle} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle}>End Time</label>
            <input style={inputStyle} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>
        </div>
        {error && <p style={{ margin: 0, color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>{error}</p>}
      </form>
    </Modal>
  );
}
