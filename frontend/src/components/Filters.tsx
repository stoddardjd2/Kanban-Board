import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useBoardView } from "@/state/boardView";
import { isFilterActive } from "@/lib/filter";
import type { Priority } from "../types";

export function Filters() {
  const { filter, setFilter, resetFilter } = useBoardView();
  const active = isFilterActive(filter);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setFilter({ query: "" });
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setFilter]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[rgb(var(--muted-foreground))] pointer-events-none" />
        <Input
          ref={searchRef}
          placeholder='Search… ("/" to focus)'
          value={filter.query}
          onChange={(e) => setFilter({ query: e.target.value })}
          className="pl-8 h-8 text-sm"
          aria-label="Search cards"
        />
        {filter.query && (
          <button
            onClick={() => setFilter({ query: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
            aria-label="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Priority filter */}
      <Select
        value={filter.priority || "all"}
        onValueChange={(v) =>
          setFilter({ priority: v === "all" ? "" : (v as Priority) })
        }
      >
        <SelectTrigger className="h-8 w-36 text-sm" aria-label="Filter by priority">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priorities</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="URGENT">Urgent</SelectItem>
        </SelectContent>
      </Select>

      {/* Assignee filter */}
      <Input
        placeholder="Assignee…"
        value={filter.assignee}
        onChange={(e) => setFilter({ assignee: e.target.value })}
        className="h-8 w-32 text-sm"
        aria-label="Filter by assignee"
      />

      {/* Active filter badge + clear */}
      {active && (
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilter}
            className="h-7 px-2 text-xs text-[rgb(var(--muted-foreground))]"
            aria-label="Clear all filters"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
