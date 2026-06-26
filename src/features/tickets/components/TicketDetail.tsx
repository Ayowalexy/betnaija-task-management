import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, ExternalLink, ArrowRightLeft, TrendingUp, CheckCircle2, XCircle, CreditCard, Pencil, Check, X } from 'lucide-react';
import type { TicketStatus } from '../../../types/index';
import { Button } from '../../../components/ui/index';
import { Avatar } from '../../../components/ui/index';
import { SLACountdown } from '../../../components/shared/SLACountdown';
import { EmptyState } from '../../../components/shared/EmptyState';
import { useTicketStore } from '../../../store/ticketStore';
import { useAuthStore } from '../../../store/authStore';
import { useModal } from '../../../hooks/useModal';
import { getDeptById } from '../../../mocks/departments';
import { getUserById } from '../../../mocks/users';
import { useTicketActions } from '../hooks/useTicketActions';
import { TicketStatusBadge } from './TicketStatusBadge';
import { TicketPriorityBadge } from './TicketPriorityBadge';
import { CommentThread } from './CommentThread';
import { TransferModal } from './TransferModal';
import { PaymentModal } from './PaymentModal';
import styles from './TicketDetail.module.css';

interface TicketDetailProps {
  ticketId: string;
}

export function TicketDetail({ ticketId }: TicketDetailProps) {
  const navigate = useNavigate();
  const tickets = useTicketStore((s) => s.tickets);
  const updateTicket = useTicketStore((s) => s.updateTicket);
  const currentUser = useAuthStore((s) => s.currentUser);
  const { acceptTicket, resolveTicket, closeTicket, escalateTicket } = useTicketActions();
  const transferModal = useModal();
  const paymentModal = useModal();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  const ticket = tickets.find((t) => t.id === ticketId);

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

  const dept = getDeptById(ticket.departmentId);
  const assignee = ticket.assigneeId ? getUserById(ticket.assigneeId) : null;
  const requestor = getUserById(ticket.requestorId);

  const role = currentUser?.role;
  const isAssignee = currentUser?.id === ticket.assigneeId;
  const isDeptHead = role === 'dept_head' && currentUser?.departmentId === ticket.departmentId;
  const isAdmin = role === 'root_admin';
  const isInDept = currentUser?.departmentId === ticket.departmentId;
  const isFinance = dept?.id === 'finance';

  const canAccept = ticket.status === 'open' && isInDept && !ticket.assigneeId;
  const canTransfer = isAssignee || isDeptHead || isAdmin;
  const canResolve = ticket.status === 'in_progress' && (isAssignee || isDeptHead);
  const canEscalate = isDeptHead && ticket.status === 'in_progress';
  const canClose = (isAdmin || isDeptHead) && ticket.status === 'resolved';
  const canInitiatePayment = isFinance && (isDeptHead || isAssignee) && ticket.status === 'resolved';

  function handleStatusChange(newStatus: TicketStatus) {
    // ticket is guaranteed non-null here (early return above handles null case)
    updateTicket(ticket!.id, { status: newStatus });
  }

  function startEditTitle() {
    setTitleDraft(ticket!.title);
    setEditingTitle(true);
  }

  function saveTitle() {
    if (titleDraft.trim()) updateTicket(ticket!.id, { title: titleDraft.trim() });
    setEditingTitle(false);
  }

  function cancelEditTitle() {
    setEditingTitle(false);
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
            {editingTitle ? (
              <div className={styles.titleEdit}>
                <input
                  className={styles.titleInput}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
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

          {/* Status/Priority/Dept row */}
          <div className={styles.badgeRow}>
            <TicketStatusBadge
              status={ticket.status}
              ticketId={ticket.id}
              onChange={canTransfer ? handleStatusChange : undefined}
              readOnly={!canTransfer}
            />
            <TicketPriorityBadge priority={ticket.priority} />
            {dept && (
              <span className={styles.deptBadge}>{dept.name}</span>
            )}
          </div>

          {/* SLA */}
          {dept && (
            <SLACountdown
              createdAt={ticket.createdAt}
              slaDurationMs={dept.sla.resolutionTimeMs}
              variant="bar"
            />
          )}

          {/* Meta grid */}
          <div className={styles.metaGrid}>
            <span className={styles.metaLabel}>Assignee</span>
            <span className={styles.metaValue}>
              {assignee ? (
                <span className={styles.userChip}>
                  <Avatar initials={assignee.avatarInitials} color={assignee.avatarColor} size="xs" name={assignee.name} />
                  {assignee.name}
                </span>
              ) : (
                <span className={styles.unassigned}>Unassigned</span>
              )}
            </span>
            <span className={styles.metaLabel}>Requestor</span>
            <span className={styles.metaValue}>
              {requestor ? (
                <span className={styles.userChip}>
                  <Avatar initials={requestor.avatarInitials} color={requestor.avatarColor} size="xs" name={requestor.name} />
                  <span>
                    <span className={styles.userName}>{requestor.name}</span>
                    <span className={styles.userEmail}>{requestor.email}</span>
                  </span>
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
                {ticket.transferHistory.map((tr) => {
                  const fromDept = getDeptById(tr.fromDeptId);
                  const toDept = getDeptById(tr.toDeptId);
                  const byUser = getUserById(tr.byUserId);
                  return (
                    <div key={tr.id} className={styles.transferEntry}>
                      <span className={styles.transferRoute}>
                        {fromDept?.name ?? tr.fromDeptId} → {toDept?.name ?? tr.toDeptId}
                      </span>
                      <span className={styles.transferMeta}>
                        by {byUser?.name ?? tr.byUserId} · {format(new Date(tr.timestamp), 'MMM d, HH:mm')}
                      </span>
                      {tr.note && <span className={styles.transferNote}>{tr.note}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className={styles.actionBar}>
            {canAccept && (
              <Button onClick={() => acceptTicket(ticket.id)}>Accept Ticket</Button>
            )}
            {canTransfer && (
              <Button variant="secondary" leftIcon={<ArrowRightLeft size={14} />} onClick={transferModal.open}>
                Transfer
              </Button>
            )}
            {canResolve && (
              <Button variant="secondary" leftIcon={<CheckCircle2 size={14} />} onClick={() => resolveTicket(ticket.id)}>
                Mark Resolved
              </Button>
            )}
            {canEscalate && (
              <Button variant="secondary" leftIcon={<TrendingUp size={14} />} onClick={() => escalateTicket(ticket.id)}>
                Escalate
              </Button>
            )}
            {canClose && (
              <Button variant="secondary" leftIcon={<XCircle size={14} />} onClick={() => closeTicket(ticket.id)}>
                Close Ticket
              </Button>
            )}
            {canInitiatePayment && (
              <Button leftIcon={<CreditCard size={14} />} onClick={paymentModal.open}>
                Initiate Payment
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
    </div>
  );
}
