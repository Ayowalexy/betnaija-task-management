import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ExternalLink, ArrowRightLeft, TrendingUp, CheckCircle2, XCircle, CreditCard, Pencil, Check, X, Paperclip, Ban } from 'lucide-react';
import { Modal } from '@/components/ui/index';
import type { Ticket, TicketStatus } from '@/types/index';
import { Button } from '@/components/ui/index';
import { Avatar } from '@/components/ui/index';
import { SLACountdown } from '@/components/shared/SLACountdown';
import { EmptyState } from '@/components/shared/EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useModal } from '@/hooks/useModal';
import { useToast } from '@/hooks/useToast';
import { ticketsApi } from '@/api/tickets';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { CommentThread } from './CommentThread';
import { TransferModal } from './TransferModal';
import { PaymentModal } from './PaymentModal';
import styles from './TicketDetail.module.css';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TicketDetailProps {
  ticket: Ticket;
  onRefresh: () => void;
}

export function TicketDetail({ ticket, onRefresh }: TicketDetailProps) {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { toast } = useToast();
  const transferModal = useModal();
  const paymentModal = useModal();
  const rejectModal = useModal();
  const [titleEdit, setTitleEdit] = useState({ editing: false, draft: '' });
  const [reject, setReject] = useState({ note: '', submitting: false });

  if (!ticket) {
    return (
      <div className={styles.notFound}>
        <EmptyState title="Ticket not found" description="This ticket doesn't exist or has been deleted." />
        <Button variant="ghost" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/tickets')}>
          Back to Tickets
        </Button>
      </div>
    );
  }

  const role = currentUser?.role;
  const isAssignee = currentUser?.id === ticket.assigneeId;
  const isDeptHead = role === 'dept_head' && currentUser?.departmentId === ticket.departmentId;
  const isAdmin = role === 'root_admin';
  const isInDept = currentUser?.departmentId === ticket.departmentId;
  const isFinance = ticket.departmentName?.toLowerCase().includes('finance') ?? false;

  const canAccept = ticket.status === 'open' && isInDept && !ticket.assigneeId;
  const canTransfer = isAssignee || isDeptHead || isAdmin;
  const canResolve = ticket.status === 'in_progress' && (isAssignee || isDeptHead);
  const canEscalate = isDeptHead && ticket.status === 'in_progress';
  const canClose = (isAdmin || isDeptHead) && ticket.status === 'resolved';
  const canInitiatePayment = isFinance && (isDeptHead || isAssignee) && ticket.status === 'resolved';
  const canReject = (isDeptHead || isAssignee || isAdmin) && ['open', 'in_progress'].includes(ticket.status);

  async function handleStatusChange(_newStatus: TicketStatus) {
    // Status changes are handled via dedicated action buttons (accept/resolve/close/escalate)
    // This is left as a no-op since direct status change via badge is no longer supported without an API mapping
  }

  function startEditTitle() {
    setTitleEdit({ editing: true, draft: ticket.title });
  }

  async function saveTitle() {
    if (titleEdit.draft.trim()) {
      try {
        await ticketsApi.update(ticket.id, { title: titleEdit.draft.trim() });
        toast({ type: 'success', message: 'Title updated.' });
        onRefresh();
      } catch {
        toast({ type: 'error', message: 'Failed to update title.' });
      }
    }
    setTitleEdit((s) => ({ ...s, editing: false }));
  }

  function cancelEditTitle() {
    setTitleEdit((s) => ({ ...s, editing: false }));
  }

  async function handleAccept() {
    if (!currentUser) return;
    try {
      await ticketsApi.assign(ticket.id, currentUser.id);
      toast({ type: 'success', message: 'Ticket accepted and assigned to you.' });
      onRefresh();
    } catch {
      toast({ type: 'error', message: 'Failed to accept ticket.' });
    }
  }

  async function handleResolve() {
    try {
      await ticketsApi.resolve(ticket.id, '');
      toast({ type: 'success', message: 'Ticket marked as resolved.' });
      onRefresh();
    } catch {
      toast({ type: 'error', message: 'Failed to resolve ticket.' });
    }
  }

  async function handleEscalate() {
    try {
      await ticketsApi.escalate(ticket.id, '');
      toast({ type: 'success', message: 'Ticket escalated.' });
      onRefresh();
    } catch {
      toast({ type: 'error', message: 'Failed to escalate ticket.' });
    }
  }

  async function handleClose() {
    try {
      await ticketsApi.close(ticket.id);
      toast({ type: 'success', message: 'Ticket closed.' });
      onRefresh();
    } catch {
      toast({ type: 'error', message: 'Failed to close ticket.' });
    }
  }

  async function handleReject() {
    setReject((s) => ({ ...s, submitting: true }));
    try {
      await ticketsApi.reject(ticket.id, reject.note.trim());
      toast({ type: 'success', message: 'Ticket rejected.' });
      rejectModal.close();
      setReject((s) => ({ ...s, note: '' }));
      onRefresh();
    } catch {
      toast({ type: 'error', message: 'Failed to reject ticket.' });
    } finally {
      setReject((s) => ({ ...s, submitting: false }));
    }
  }

  const canEditTitle = isAssignee || isDeptHead || isAdmin;

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/tickets')}>
          <ArrowLeft size={14} aria-hidden="true" />
          Tickets
        </button>
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>#{ticket.id.toUpperCase()}</span>
      </div>

      <div className={styles.layout}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          {/* Title */}
          <div className={styles.titleRow}>
            {titleEdit.editing ? (
              <div className={styles.titleEdit}>
                <input
                  className={styles.titleInput}
                  value={titleEdit.draft}
                  onChange={(e) => setTitleEdit((s) => ({ ...s, draft: e.target.value }))}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') cancelEditTitle(); }}
                />
                <button type="button" className={styles.titleAction} onClick={saveTitle} aria-label="Save title"><Check size={14} /></button>
                <button type="button" className={styles.titleAction} onClick={cancelEditTitle} aria-label="Cancel edit"><X size={14} /></button>
              </div>
            ) : (
              <>
                <h1 className={styles.title}>{ticket.title}</h1>
                {canEditTitle && (
                  <button type="button" className={styles.editTitleBtn} onClick={startEditTitle} aria-label="Edit title">
                    <Pencil size={14} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Description */}
          <div className={styles.description}>
            {ticket.description.split('\n').map((para, i) => (
              <p key={i} className={styles.descPara}>{para}</p>
            ))}
          </div>

          {/* Rejection note */}
          {ticket.status === 'rejected' && ticket.rejectionNote && (
            <div className={styles.rejectionNote}>
              <Ban size={15} className={styles.rejectionIcon} aria-hidden="true" />
              <div>
                <span className={styles.rejectionLabel}>Rejected</span>
                <p className={styles.rejectionText}>{ticket.rejectionNote}</p>
              </div>
            </div>
          )}
          {ticket.status === 'rejected' && !ticket.rejectionNote && (
            <div className={styles.rejectionNote}>
              <Ban size={15} className={styles.rejectionIcon} aria-hidden="true" />
              <span className={styles.rejectionLabel}>This ticket was rejected.</span>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Attachments</h4>
              <div className={styles.attachmentList}>
                {ticket.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.attachmentItem}
                    download={a.name}
                  >
                    <Paperclip size={13} className={styles.attachIcon} aria-hidden="true" />
                    <span className={styles.attachName}>{a.name}</span>
                    {a.sizeBytes > 0 && (
                      <span className={styles.attachSize}>{formatBytes(a.sizeBytes)}</span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status/Priority/Dept row */}
          <div className={styles.badgeRow}>
            <TicketStatusBadge
              status={ticket.status}
              ticketId={ticket.id}
              onChange={canTransfer ? handleStatusChange : undefined}
              readOnly={!canTransfer}
            />
            <TicketPriorityBadge priority={ticket.priority} />
            {ticket.departmentName && (
              <span className={styles.deptBadge}>{ticket.departmentName}</span>
            )}
          </div>

          {/* SLA */}
          {ticket.slaResolutionDeadline && (
            <SLACountdown deadline={ticket.slaResolutionDeadline} createdAt={ticket.createdAt} variant="bar" />
          )}

          {/* Meta grid */}
          <div className={styles.metaGrid}>
            <span className={styles.metaLabel}>Assignee</span>
            <span className={styles.metaValue}>
              {ticket.assigneeName ? (
                <span className={styles.userChip}>
                  <Avatar
                    initials={ticket.assigneeInitials ?? ticket.assigneeName.slice(0, 2).toUpperCase()}
                    color={ticket.assigneeColor ?? '#4F6EF7'}
                    size="xs"
                    name={ticket.assigneeName}
                  />
                  {ticket.assigneeName}
                </span>
              ) : (
                <span className={styles.unassigned}>Unassigned</span>
              )}
            </span>
            <span className={styles.metaLabel}>Requestor</span>
            <span className={styles.metaValue}>
              {ticket.requestor ? (
                <span className={styles.userChip}>
                  <Avatar
                    initials={ticket.requestor.avatarInitials}
                    color={ticket.requestor.avatarColor}
                    size="xs"
                    name={ticket.requestor.name}
                  />
                  <span className={styles.requestorDetails}>
                    <span className={styles.userName}>{ticket.requestor.name}</span>
                    <span className={styles.requestorMeta}>{ticket.requestor.email}</span>
                    {ticket.requestor.departmentName && (
                      <span className={styles.requestorMeta}>{ticket.requestor.departmentName}</span>
                    )}
                  </span>
                </span>
              ) : ticket.requestorName ? (
                <span className={styles.userChip}>
                  <Avatar
                    initials={ticket.requestorInitials ?? ticket.requestorName.slice(0, 2).toUpperCase()}
                    color='#4F6EF7'
                    size="xs"
                    name={ticket.requestorName}
                  />
                  <span className={styles.userName}>{ticket.requestorName}</span>
                </span>
              ) : '—'}
            </span>
            <span className={styles.metaLabel}>Created</span>
            <span className={styles.metaValue}>{format(new Date(ticket.createdAt), 'MMM d, yyyy · HH:mm')}</span>
            {ticket.resolvedAt && (
              <>
                <span className={styles.metaLabel}>Resolved</span>
                <span className={styles.metaValue}>{format(new Date(ticket.resolvedAt), 'MMM d, yyyy · HH:mm')}</span>
              </>
            )}
            {ticket.closedAt && (
              <>
                <span className={styles.metaLabel}>Closed</span>
                <span className={styles.metaValue}>{format(new Date(ticket.closedAt), 'MMM d, yyyy · HH:mm')}</span>
              </>
            )}
          </div>

          {/* Linked tickets */}
          {ticket.linkedTicketIds.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Linked Tickets</h4>
              <div className={styles.linkedChips}>
                {ticket.linkedTicketIds.map((id) => (
                  <button key={id} type="button" className={styles.linkedChip} onClick={() => navigate(`/tickets/${id}`)}>
                    <ExternalLink size={11} aria-hidden="true" />
                    #{id.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transfer history */}
          {ticket.transferHistory.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Transfer History</h4>
              <div className={styles.transferList}>
                {ticket.transferHistory.map((tr) => (
                  <div key={tr.id} className={styles.transferEntry}>
                    <span className={styles.transferRoute}>
                      {tr.fromDeptName ?? 'Unknown department'} → {tr.toDeptName ?? 'Unknown department'}
                    </span>
                    <span className={styles.transferMeta}>
                      by {tr.byUserName ?? 'Unknown user'} · {format(new Date(tr.timestamp), 'MMM d, HH:mm')}
                    </span>
                    {tr.note && <span className={styles.transferNote}>{tr.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className={styles.actionBar}>
            {canAccept && (
              <Button onClick={handleAccept}>Accept Ticket</Button>
            )}
            {canTransfer && (
              <Button variant="secondary" leftIcon={<ArrowRightLeft size={14} />} onClick={transferModal.open}>
                Transfer
              </Button>
            )}
            {canResolve && (
              <Button variant="secondary" leftIcon={<CheckCircle2 size={14} />} onClick={handleResolve}>
                Mark Resolved
              </Button>
            )}
            {canEscalate && (
              <Button variant="secondary" leftIcon={<TrendingUp size={14} />} onClick={handleEscalate}>
                Escalate
              </Button>
            )}
            {canClose && (
              <Button variant="secondary" leftIcon={<XCircle size={14} />} onClick={handleClose}>
                Close Ticket
              </Button>
            )}
            {canInitiatePayment && (
              <Button leftIcon={<CreditCard size={14} />} onClick={paymentModal.open}>
                Initiate Payment
              </Button>
            )}
            {canReject && (
              <Button variant="danger" leftIcon={<Ban size={14} />} onClick={rejectModal.open}>
                Reject
              </Button>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <CommentThread ticketId={ticket.id} comments={ticket.comments} />
        </div>
      </div>

      <TransferModal
        isOpen={transferModal.isOpen}
        onClose={transferModal.close}
        ticketId={ticket.id}
        currentDeptId={ticket.departmentId}
      />
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={paymentModal.close}
        ticketId={ticket.id}
      />

      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => { rejectModal.close(); setReject((s) => ({ ...s, note: '' })); }}
        title="Reject Ticket"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { rejectModal.close(); setReject((s) => ({ ...s, note: '' })); }} disabled={reject.submitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} loading={reject.submitting}>
              Confirm Rejection
            </Button>
          </>
        }
      >
        <p className={styles.rejectModalHint}>
          Provide a reason for rejecting this ticket. The requestor will be notified by email.
        </p>
        <textarea
          className={styles.rejectNoteInput}
          placeholder="Enter rejection reason…"
          value={reject.note}
          onChange={(e) => setReject((s) => ({ ...s, note: e.target.value }))}
          rows={4}
          autoFocus
        />
      </Modal>
    </div>
  );
}
