import type { OpusLabel } from "@/database/schemas/opus_labels";
import type { OpusPriority } from "@/database/schemas/opus_priorities";
import type { OpusStatus } from "@/database/schemas/opus_statuses";
import type { BoardAssignee, BoardTask } from "@/utils/opusDbActions";

export type DomainMeta = {
  statuses: OpusStatus[];
  priorities: OpusPriority[];
  labels: OpusLabel[];
  members: BoardAssignee[];
};

export type { BoardAssignee, BoardTask };

export type FormValues = {
  title: string;
  description: string;
  statusId: string;
  priorityId: string; // "" = No priority
  dueDate: Date | null;
  assigneeIds: string[];
  labelIds: string[];
  links: { url: string; label: string }[];
};
