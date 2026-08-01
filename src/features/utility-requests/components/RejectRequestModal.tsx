import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../../components/ui/index.js';
import { Button } from '../../../components/ui/index.js';
import { Textarea } from '../../../components/ui/index.js';
import { rejectUtilityRequestSchema } from '../schemas.js';
import type { RejectUtilityRequestFormData } from '../schemas.js';

interface RejectRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
}

export function RejectRequestModal({ isOpen, onClose, onReject }: RejectRequestModalProps): ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectUtilityRequestFormData>({
    resolver: zodResolver(rejectUtilityRequestSchema),
    defaultValues: { reason: '' },
  });

  function handleClose(): void {
    reset();
    onClose();
  }

  function onSubmit(data: RejectUtilityRequestFormData): void {
    onReject(data.reason);
    handleClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reject Request"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" form="reject-request-form">
            Reject Request
          </Button>
        </>
      }
    >
      <form id="reject-request-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Textarea
          label="Reason for rejection"
          placeholder="Let the requester know why this can't be approved…"
          rows={4}
          error={errors.reason?.message}
          {...register('reason')}
        />
      </form>
    </Modal>
  );
}
