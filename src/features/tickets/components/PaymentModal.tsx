import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/index';
import { useToast } from '@/hooks/useToast';
import styles from './PaymentModal.module.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
}

const EMPTY_PAYMENT_FORM: { amount: string; description: string; method: 'bank_transfer' | 'paystack' } = {
  amount: '',
  description: '',
  method: 'bank_transfer',
};

export function PaymentModal({ isOpen, onClose, ticketId: _ticketId }: PaymentModalProps) {
  const [state, setState] = useState({ form: EMPTY_PAYMENT_FORM, submitting: false });
  const { form, submitting } = state;
  const { toast } = useToast();

  function handleClose() {
    setState({ form: EMPTY_PAYMENT_FORM, submitting: false });
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setState((s) => ({ ...s, submitting: true }));
    // Simulate async operation
    await new Promise<void>((res) => setTimeout(res, 800));
    toast({ type: 'success', message: 'Payment initiated successfully.' });
    setState((s) => ({ ...s, submitting: false }));
    handleClose();
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={submitting}>Cancel</Button>
      <Button type="submit" form="payment-form" loading={submitting} disabled={!form.amount || Number(form.amount) <= 0}>
        Initiate Payment
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Initiate Payment" size="sm" footer={footer}>
      <form id="payment-form" onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pay-amount">Amount (₦) *</label>
          <input
            id="pay-amount"
            type="number"
            className={styles.input}
            value={form.amount}
            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, amount: e.target.value } }))}
            placeholder="0.00"
            min="1"
            step="0.01"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pay-desc">Description</label>
          <textarea
            id="pay-desc"
            className={styles.textarea}
            value={form.description}
            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))}
            placeholder="Payment description…"
            rows={2}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Payment Method</label>
          <div className={styles.methodGroup}>
            <label className={styles.methodOption}>
              <input
                type="radio"
                name="method"
                value="bank_transfer"
                checked={form.method === 'bank_transfer'}
                onChange={() => setState((s) => ({ ...s, form: { ...s.form, method: 'bank_transfer' } }))}
              />
              Bank Transfer
            </label>
            <label className={styles.methodOption}>
              <input
                type="radio"
                name="method"
                value="paystack"
                checked={form.method === 'paystack'}
                onChange={() => setState((s) => ({ ...s, form: { ...s.form, method: 'paystack' } }))}
              />
              Paystack
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
