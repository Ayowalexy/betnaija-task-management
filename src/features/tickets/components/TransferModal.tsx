import { useState, useEffect, type FormEvent } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/index';
import { useToast } from '../../../hooks/useToast';
import { departmentsApi } from '../../../api/departments';
import { ticketsApi } from '../../../api/tickets';
import type { Department } from '../../../types/index';
import styles from './TransferModal.module.css';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  currentDeptId: string;
  onRefresh: () => void;
}

export function TransferModal({ isOpen, onClose, ticketId, currentDeptId, onRefresh }: TransferModalProps) {
  const [toDeptId, setToDeptId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    departmentsApi.list({ limit: 100 }).then((res) => setDepartments(res.data)).catch(() => {});
  }, [isOpen]);

  const otherDepts = departments.filter((d) => d.id !== currentDeptId);

  function handleClose() {
    setToDeptId('');
    setNote('');
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!toDeptId) return;
    setLoading(true);
    try {
      await ticketsApi.transfer(ticketId, toDeptId, note);
      toast({ type: 'success', message: 'Ticket transferred successfully.' });
      handleClose();
      onRefresh();
    } catch {
      toast({ type: 'error', message: 'Failed to transfer ticket.' });
    } finally {
      setLoading(false);
    }
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
