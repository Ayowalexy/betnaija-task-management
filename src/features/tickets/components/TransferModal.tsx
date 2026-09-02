import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/index';
import { useToast } from '@/hooks/useToast';
import { departmentsApi } from '@/api/departments';
import { ticketsApi } from '@/api/tickets';
import type { Department } from '@/types/index';
import styles from './TransferModal.module.css';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  currentDeptId: string;
}

const EMPTY_TRANSFER_FORM = { toDeptId: '', note: '' };

export function TransferModal({ isOpen, onClose, ticketId, currentDeptId }: TransferModalProps) {
  const [state, setState] = useState({ form: EMPTY_TRANSFER_FORM, submitting: false });
  const { form, submitting } = state;
  const [departments, setDepartments] = useState<Department[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    departmentsApi.list({ limit: 100 }).then((res) => setDepartments(res.data)).catch(() => {});
  }, [isOpen]);

  const otherDepts = departments.filter((d) => d.id !== currentDeptId);

  function handleClose() {
    setState({ form: EMPTY_TRANSFER_FORM, submitting: false });
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.toDeptId) return;
    setState((s) => ({ ...s, submitting: true }));
    try {
      await ticketsApi.transfer(ticketId, form.toDeptId, form.note);
      toast({ type: 'success', message: 'Ticket transferred successfully.' });
      handleClose();
      // The ticket usually no longer belongs to the department that granted access to whoever
      // just transferred it — re-fetching in place would 403/404 and flash "not found". Go back
      // to the list instead of staying on a page that may no longer be viewable.
      navigate('/tickets');
    } catch {
      toast({ type: 'error', message: 'Failed to transfer ticket.' });
    } finally {
      setState((s) => ({ ...s, submitting: false }));
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={submitting}>Cancel</Button>
      <Button type="submit" form="transfer-form" loading={submitting} disabled={!form.toDeptId}>Transfer</Button>
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
            value={form.toDeptId}
            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, toDeptId: e.target.value } }))}
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
            value={form.note}
            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, note: e.target.value } }))}
            placeholder="Reason for transfer (optional)…"
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}
