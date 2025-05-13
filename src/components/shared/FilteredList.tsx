import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilteredListProps<T> {
  items: T[];
  getTitle: (item: T) => string;
  getAuthor: (item: T) => string;
  getDate: (item: T) => Date;
  /** Optional: number of changes (e.g. commit summary lines) */
  getChangeCount?: (item: T) => number;
  /** show change count sort options (for commits) */
  showChangeSort?: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState: React.ReactNode;
}

type DateFilter = "all" | "7" | "14" | "30" | "before30";
type SortMode = "dateAsc" | "dateDesc" | "changesAsc" | "changesDesc";

export function FilteredList<T>({
  items,
  getTitle,
  getAuthor,
  getDate,
  getChangeCount = () => 0,
  showChangeSort = false,
  renderItem,
  emptyState,
}: FilteredListProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("dateDesc");

  const authors = useMemo(() => {
    const set = new Set(items.map(getAuthor));
    return ["all", ...Array.from(set)];
  }, [items, getAuthor]);

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    let arr = [...items];

    // filter by date
    if (dateFilter !== "all") {
      const cutoff =
        dateFilter === "before30"
          ? now.getTime() - 30 * 24 * 60 * 60 * 1000
          : now.getTime() - parseInt(dateFilter) * 24 * 60 * 60 * 1000;
      arr = arr.filter((item) => {
        const t = getDate(item).getTime();
        return dateFilter === "before30" ? t < cutoff : t >= cutoff;
      });
    }

    // filter by author
    if (selectedAuthor !== "all") {
      arr = arr.filter((item) => getAuthor(item) === selectedAuthor);
    }

    // search logic
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      const exact = arr.filter((i) => getTitle(i).toLowerCase() === term);
      const starts = arr.filter(
        (i) =>
          getTitle(i).toLowerCase().startsWith(term) &&
          getTitle(i).toLowerCase() !== term,
      );
      const partial = arr.filter((i) => {
        const t = getTitle(i).toLowerCase();
        return t.includes(term) && !t.startsWith(term) && t !== term;
      });
      const authorMatch = arr.filter((i) =>
        getAuthor(i).toLowerCase().includes(term),
      );
      arr = Array.from(
        new Set([...exact, ...starts, ...partial, ...authorMatch]),
      );
    }

    // sort
    return arr.sort((a, b) => {
      switch (sortMode) {
        case "dateAsc":
          return getDate(a).getTime() - getDate(b).getTime();
        case "dateDesc":
          return getDate(b).getTime() - getDate(a).getTime();
        case "changesAsc":
          return getChangeCount(a) - getChangeCount(b);
        case "changesDesc":
          return getChangeCount(b) - getChangeCount(a);
      }
    });
  }, [
    items,
    dateFilter,
    selectedAuthor,
    searchTerm,
    sortMode,
    getDate,
    getAuthor,
    getTitle,
    getChangeCount,
    now,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Author" />
          </SelectTrigger>
          <SelectContent>
            {authors.map((a) => (
              <SelectItem key={a} value={a}>
                {a === "all" ? "All Authors" : a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={dateFilter}
          onValueChange={setDateFilter as (value: DateFilter) => void}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="before30">Before 30 days</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortMode}
          onValueChange={setSortMode as (value: SortMode) => void}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dateDesc">Date (newest first)</SelectItem>
            <SelectItem value="dateAsc">Date (oldest first)</SelectItem>
            {showChangeSort && (
              <>
                <SelectItem value="changesDesc">
                  Changes (most first)
                </SelectItem>
                <SelectItem value="changesAsc">
                  Changes (least first)
                </SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="min-w-[200px] flex-1"
        />
      </div>
      <div className="space-y-2">
        {filtered.length > 0
          ? filtered.map((item, idx) => (
              <div key={getTitle(item) + getDate(item).toISOString()}>
                {renderItem(item, idx)}
              </div>
            ))
          : emptyState}
      </div>
    </div>
  );
}
