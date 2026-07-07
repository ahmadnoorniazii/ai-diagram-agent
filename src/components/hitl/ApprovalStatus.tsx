// Human-in-the-loop indicator shown after a user has responded to a
// ConfirmationCard, reflecting whether the requested agent action was
// approved, rejected, or is still awaiting a decision.

interface ApprovalStatusProps {
  status: "pending" | "approved" | "rejected";
  action: string;
}

export default function ApprovalStatus({
  status,
  action,
}: ApprovalStatusProps) {
  // Icon/label/class per status, keyed for a simple lookup below.
  const statusConfig = {
    pending: { icon: "⏳", label: "Pending approval", className: "pending" },
    approved: { icon: "✓", label: "Approved", className: "approved" },
    rejected: { icon: "✗", label: "Rejected", className: "rejected" },
  };

  const config = statusConfig[status];

  return (
    <div className={`approval-status ${config.className}`}>
      <span className="approval-icon">{config.icon}</span>
      <span className="approval-action">{action}</span>
      <span className="approval-label">{config.label}</span>
    </div>
  );
}
