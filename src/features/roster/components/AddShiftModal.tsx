import { useState, useEffect } from 'react';
import type { Shift, User } from '@/types/index';
import { Modal, Button, Select } from '@/components/ui/index';
import { usersApi } from '@/api/users';

interface AddShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (shift: Omit<Shift, 'id'>) => void;
  departmentId: string;
}

const EMPTY_SHIFT_FORM = { userId: '', date: '', startTime: '09:00', endTime: '17:00', error: '' };

export function AddShiftModal({ isOpen, onClose, onAdd, departmentId }: AddShiftModalProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [form, setForm] = useState(EMPTY_SHIFT_FORM);
  const { userId, date, startTime, endTime, error } = form;

  useEffect(() => {
    if (!isOpen) return;
    void usersApi.list({ departmentId, limit: 200 }).then((res) => setMembers(res.data));
  }, [isOpen, departmentId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !date || !startTime || !endTime) {
      setForm((f) => ({ ...f, error: 'All fields are required.' }));
      return;
    }
    if (startTime >= endTime) {
      setForm((f) => ({ ...f, error: 'End time must be after start time.' }));
      return;
    }
    onAdd({ userId, departmentId, date, startTime, endTime });
    setForm(EMPTY_SHIFT_FORM);
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
        <Select
          label="Team Member"
          placeholder="Select a team member"
          value={userId}
          onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
          options={members.map((m) => ({ value: m.id, label: m.name }))}
        />
        <div>
          <label style={labelStyle}>Date</label>
          <input style={inputStyle} type="date" value={date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Start Time</label>
            <input style={inputStyle} type="time" value={startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} required />
          </div>
          <div>
            <label style={labelStyle}>End Time</label>
            <input style={inputStyle} type="time" value={endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} required />
          </div>
        </div>
        {error && <p style={{ margin: 0, color: 'var(--color-error)', fontSize: 'var(--font-size-xs)' }}>{error}</p>}
      </form>
    </Modal>
  );
}
