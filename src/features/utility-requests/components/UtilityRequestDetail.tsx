import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2, XCircle, Ban, Pencil, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/index.js';
import { Avatar } from '@/components/ui/index.js';
import { Badge } from '@/components/ui/index.js';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { DataTable } from '@/components/shared/DataTable.js';
import type { Column } from '@/components/shared/DataTable.js';
import { useUtilityRequestStore } from '@/store/utilityRequestStore.js';
import { useAuthStore } from '@/store/authStore.js';
import { useModal } from '@/hooks/useModal.js';
import { useToast } from '@/hooks/useToast.js';
import { getDeptById } from '@/mocks/departments.js';
import { getUserById } from '@/mocks/users.js';
import { getUtilityById } from '@/mocks/utilities.js';
import { useUtilityRequestActions } from '../hooks/useUtilityRequestActions.js';
import { STATUS_LABELS, getUtilityRequestStatusVariant } from '../types.js';
import { UtilityRequestCommentThread } from './UtilityRequestCommentThread.js';
import { RejectRequestModal } from './RejectRequestModal.js';
import { EditUtilityRequestModal } from './EditUtilityRequestModal.js';
import type { UtilityRequestLogEntry } from '@/types/index.js';
import styles from './UtilityRequestDetail.module.css';

interface UtilityRequestDetailProps {
  requestId: string;
}

const LOG_ACTION_LABELS: Record<UtilityRequestLogEntry['action'], string> = {
  created: 'Created',
  updated: 'Updated',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export function UtilityRequestDetail({ requestId }: UtilityRequestDetailProps) {
  const navigate = useNavigate();
  const requests = useUtilityRequestStore((s) => s.requests);
  const updateRequest = useUtilityRequestStore((s) => s.updateRequest);
  const addLogEntry = useUtilityRequestStore((s) => s.addLogEntry);
  const currentUser = useAuthStore((s) => s.currentUser);
  const { approveRequest, rejectRequest, cancelRequest, completeRequest } = useUtilityRequestActions();
  const { toast } = useToast();
  const rejectModal = useModal();
  const editModal = useModal();

  const request = requests.find((r) => r.id === requestId);

  if (!request) {
    return (
      <div className={styles.notFound}>
        <EmptyState title="Request not found" description="This utility request doesn't exist or has been deleted." />
        <Button variant="ghost" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/utility-requests')}>
          Back to Utility Requests
        </Button>
      </div>
    );
  }

  const utility = getUtilityById(request.utilityId);
  const option = utility?.options.find((o) => o.id === request.utilityOptionId);
  const dept = getDeptById(request.departmentId);
  const requestor = getUserById(request.requestorId);

  const role = currentUser?.role;
  const isRequestor = currentUser?.id === request.requestorId;
  const isDeptHead = role === 'dept_head' && currentUser?.departmentId === request.departmentId;
  const isAdmin = role === 'root_admin';
  const isApprover = isDeptHead || isAdmin;

  const canApprove = isApprover && request.status === 'pending';
  const canReject = isApprover && request.status === 'pending';
  const canComplete = isApprover && request.status === 'approved';
  const canCancel = isRequestor && (request.status === 'pending' || request.status === 'approved');
  const canEdit = isRequestor && (request.status === 'pending' || request.status === 'approved');

  function handleReject(reason: string): void {
    rejectRequest(request!.id, reason);
  }

  function handleSaveEdit(data: { utilityOptionId: string; date: string; startTime: string; endTime: string; details: string }): void {
    if (!currentUser) return;
    updateRequest(request!.id, data);
    addLogEntry(request!.id, {
      id: `url-${request!.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      action: 'updated',
      note: 'Request details updated by requester.',
    });
    toast({ type: 'success', message: 'Request updated.' });
  }

  const logColumns: Column<UtilityRequestLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      width: '170px',
      sortable: true,
      render: (entry) => (
        <span className={styles.logTime}>{format(new Date(entry.timestamp), 'MMM d, yyyy · HH:mm')}</span>
      ),
    },
    {
      key: 'actor',
      header: 'By',
      width: '160px',
      render: (entry) => {
        const actor = getUserById(entry.actorId);
        return <span className={styles.logActor}>{actor?.name ?? entry.actorId}</span>;
      },
    },
    {
      key: 'action',
      header: 'Action',
      width: '130px',
      render: (entry) => <span className={styles.logAction}>{LOG_ACTION_LABELS[entry.action]}</span>,
    },
    {
      key: 'note',
      header: 'Note',
      render: (entry) => <span className={styles.logNote}>{entry.note ?? '—'}</span>,
    },
  ];

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/utility-requests')}>
          <ArrowLeft size={14} aria-hidden="true" />
          Utility Requests
        </button>
        <span className={styles.breadSep}>/</span>
        <span className={styles.breadCurrent}>#{request.id.toUpperCase()}</span>
      </div>

      <div className={styles.layout}>
        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{utility?.name ?? request.utilityId}</h1>
            {canEdit && (
              <button type="button" className={styles.editBtn} onClick={editModal.open} aria-label="Edit request">
                <Pencil size={14} />
              </button>
            )}
          </div>

          <div className={styles.badgeRow}>
            <Badge variant={getUtilityRequestStatusVariant(request.status)} dot>
              {STATUS_LABELS[request.status]}
            </Badge>
            {option && <span className={styles.optionBadge}>{option.name}</span>}
            {dept && <span className={styles.deptBadge}>{dept.name}</span>}
          </div>

          {request.status === 'rejected' && request.rejectionReason && (
            <div className={styles.rejectionNotice}>
              <strong>Rejection reason:</strong> {request.rejectionReason}
            </div>
          )}

          <div className={styles.description}>
            {request.details.split('\n').map((para, i) => (
              <p key={i} className={styles.descPara}>{para}</p>
            ))}
          </div>

          {/* Meta grid */}
          <div className={styles.metaGrid}>
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
            <span className={styles.metaLabel}>Date</span>
            <span className={styles.metaValue}>{format(new Date(request.date), 'EEEE, MMM d, yyyy')}</span>
            <span className={styles.metaLabel}>Time</span>
            <span className={styles.metaValue}>{request.startTime} – {request.endTime}</span>
            <span className={styles.metaLabel}>Requested</span>
            <span className={styles.metaValue}>{format(new Date(request.createdAt), 'MMM d, yyyy · HH:mm')}</span>
          </div>

          {/* Action bar */}
          <div className={styles.actionBar}>
            {canApprove && (
              <Button leftIcon={<CheckCircle2 size={14} />} onClick={() => approveRequest(request.id)}>
                Approve
              </Button>
            )}
            {canReject && (
              <Button variant="secondary" leftIcon={<XCircle size={14} />} onClick={rejectModal.open}>
                Reject
              </Button>
            )}
            {canComplete && (
              <Button variant="secondary" leftIcon={<PackageCheck size={14} />} onClick={() => completeRequest(request.id)}>
                Mark Completed
              </Button>
            )}
            {canCancel && (
              <Button variant="ghost" leftIcon={<Ban size={14} />} onClick={() => cancelRequest(request.id)}>
                Cancel Request
              </Button>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <UtilityRequestCommentThread requestId={request.id} comments={request.comments} />
        </div>
      </div>

      {/* Activity Log */}
      <div className={styles.logSection}>
        <h3 className={styles.logTitle}>Activity Log</h3>
        <DataTable
          columns={logColumns}
          data={[...request.log].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )}
          keyExtractor={(entry) => entry.id}
          pageSize={10}
          emptyState={<EmptyState title="No activity yet" description="Updates to this request will show up here." />}
        />
      </div>

      <RejectRequestModal isOpen={rejectModal.isOpen} onClose={rejectModal.close} onReject={handleReject} />
      <EditUtilityRequestModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        request={request}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
