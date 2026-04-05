import { useState } from "react";
import { Filter, ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export type SortField = "stars" | "forks" | "updated" | "name";
export type SortOrder = "asc" | "desc";

interface RepoFiltersProps {
  languages: string[];
  selectedLanguage: string | null;
  onLanguageChange: (lang: string | null) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  selectedLicense: string | null;
  onLicenseChange: (license: string | null) => void;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "stars", label: "⭐ Stars" },
  { field: "forks", label: "🍴 Forks" },
  { field: "updated", label: "📅 Ngày cập nhật" },
  { field: "name", label: "🔤 Tên" },
];

const RepoFilters = ({
  languages,
  selectedLanguage,
  onLanguageChange,
  sortField,
  sortOrder,
  onSortChange,
  selectedLicense,
  onLicenseChange,
}: RepoFiltersProps) => {
  const currentSort = SORT_OPTIONS.find((s) => s.field === sortField);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Language filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border/60">
            <Filter className="w-3 h-3" />
            {selectedLanguage || "Ngôn ngữ"}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-60 overflow-y-auto">
          <DropdownMenuLabel className="text-xs">Ngôn ngữ lập trình</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onLanguageChange(null)}>
            <span className={!selectedLanguage ? "font-bold text-primary" : ""}>Tất cả</span>
          </DropdownMenuItem>
          {languages.map((lang) => (
            <DropdownMenuItem key={lang} onClick={() => onLanguageChange(lang)}>
              <span className={selectedLanguage === lang ? "font-bold text-primary" : ""}>{lang}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs border-border/60">
            <ArrowUpDown className="w-3 h-3" />
            {currentSort?.label || "Sắp xếp"}
            <span className="text-[10px] text-muted-foreground">{sortOrder === "desc" ? "↓" : "↑"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-xs">Sắp xếp theo</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_OPTIONS.map((opt) => (
            <DropdownMenuItem
              key={opt.field}
              onClick={() => {
                if (sortField === opt.field) {
                  onSortChange(opt.field, sortOrder === "desc" ? "asc" : "desc");
                } else {
                  onSortChange(opt.field, "desc");
                }
              }}
            >
              <span className={sortField === opt.field ? "font-bold text-primary" : ""}>
                {opt.label}
                {sortField === opt.field && (sortOrder === "desc" ? " ↓" : " ↑")}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active filters badges */}
      {(selectedLanguage || selectedLicense) && (
        <div className="flex gap-1">
          {selectedLanguage && (
            <button
              onClick={() => onLanguageChange(null)}
              className="px-2 py-0.5 text-[10px] rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
            >
              {selectedLanguage} ✕
            </button>
          )}
          {selectedLicense && (
            <button
              onClick={() => onLicenseChange(null)}
              className="px-2 py-0.5 text-[10px] rounded-full bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
            >
              {selectedLicense} ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RepoFilters;
