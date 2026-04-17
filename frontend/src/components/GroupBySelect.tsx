import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useBoardView } from "@/state/boardView";
import type { GroupBy } from "../types";

const OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "column", label: "Column" },
  { value: "priority", label: "Priority" },
  { value: "assignee", label: "Assignee" },
];

export function GroupBySelect() {
  const { groupBy, setGroupBy } = useBoardView();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[rgb(var(--muted-foreground))] whitespace-nowrap">
        Group by
      </span>
      <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
        <SelectTrigger className="h-8 w-32 text-sm" aria-label="Group cards by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
