// Human-in-the-loop prompt asking the user to approve or reject a
// pending agent action before it executes (e.g. a destructive or
// high-impact tool call). Pairs with ApprovalStatus once resolved.

interface ConfirmationCardProps {
  action: string;
  description?: string;
  onApprove: () => void;
  onReject: () => void;
}

export default function ConfirmationCard({
  action,
  description,
  onApprove,
  onReject,
}: ConfirmationCardProps) {
  return (
    <div className="confirmation-card">
      <div className="confirmation-header">
        <span className="confirmation-icon">⚠️</span>
        <strong>{action}</strong>
      </div>
      {description && <p className="confirmation-desc">{description}</p>}
      <div className="confirmation-actions">
        <button className="btn-approve" onClick={onApprove}>
          Approve
        </button>
        <button className="btn-reject" onClick={onReject}>
          Reject
        </button>
      </div>
    </div>
  );
}
