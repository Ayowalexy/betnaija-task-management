import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/index';
import { useTicketStore } from '../../../store/ticketStore';
import { useAuthStore } from '../../../store/authStore';
import { useToast } from '../../../hooks/useToast';
import { DEPARTMENTS } from '../../../mocks/departments';
import styles from './TransferModal.module.css';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  currentDeptId: string;
}

export function TransferModal({ isOpen, onClose, ticketId, currentDeptId }: TransferModalProps) {
  const [toDeptId, setToDeptId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const transferTicket = useTicketStore((s) => s.transferTicket);
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();

  const otherDepts = DEPARTMENTS.filter((d) => d.id !== currentDeptId);

  function handleClose() {
    setToDeptId('');
    setNote('');
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!toDeptId || !currentUser) return;
    setLoading(true);
    transferTicket(ticketId, toDeptId, note, currentUser.id);
    toast({ type: 'success', message: 'Ticket transferred successfully.' });
    setLoading(false);
    handleClose();
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
      <Button type="submit" form="transfer-form" loading={loading} disabled={!toDeptId}>Transfer</Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Transfer Ticket" size="sm" footer={footer}>
      <form id="transfer-form" onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-dept">Transfer to Department *</label>
          <select
            id="transfer-dept"
            className={styles.select}
            value={toDeptId}
            onChange={(e) => setToDeptId(e.target.value)}
            required
          >
            <option value="">Select department…</option>
            {otherDepts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="transfer-note">Transfer Note</label>
          <textarea
            id="transfer-note"
            className={styles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for transfer (optional)…"
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}
