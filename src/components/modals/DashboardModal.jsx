import { Modal } from "../ui/Modal";
import { StatCard } from "../ui";
import { getDashboardStats } from "../../utils/selectors";

export function DashboardModal({ open, onClose, todos, workspaces, now }) {
  const stats = getDashboardStats(todos, workspaces, now);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dashboard"
      maxWidth="max-w-[480px]"
      closeOnBackdrop
      showCloseButton
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total tasks" value={stats.total} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Completion" value={`${stats.completionRate}%`} />
        <StatCard label="Projects" value={stats.projects} />
        <StatCard label="Countdowns" value={stats.activeCountdowns} />
        <StatCard label="Due today" value={stats.dueToday} />
      </div>
    </Modal>
  );
}