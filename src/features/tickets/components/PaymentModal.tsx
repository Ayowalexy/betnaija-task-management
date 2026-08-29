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

export function PaymentModal({ isOpen, onClose, ticketId: _ticketId }: PaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<'bank_transfer' | 'paystack'>('bank_transfer');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  function handleClose() {
    setAmount('');
    setDescription('');
    setMethod('bank_transfer');
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    // Simulate async operation
    await new Promise<void>((res) => setTimeout(res, 800));
    toast({ type: 'success', message: 'Payment initiated successfully.' });
    setLoading(false);
    handleClose();
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
      <Button type="submit" form="payment-form" loading={loading} disabled={!amount || Number(amount) <= 0}>
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
                checked={method === 'bank_transfer'}
                onChange={() => setMethod('bank_transfer')}
              />
              Bank Transfer
            </label>
            <label className={styles.methodOption}>
              <input
                type="radio"
                name="method"
                value="paystack"
                checked={method === 'paystack'}
                onChange={() => setMethod('paystack')}
              />
              Paystack
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
