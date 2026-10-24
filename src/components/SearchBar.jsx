import { Search } from "lucide-react";
export function SearchBar({ value, onChange, placeholder = "Search notes...", large = false }) {
  return (
    <div
      className={`flex w-full items-center gap-2 rounded-xl border border-input bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring ${large ? "px-5 py-4" : "px-4 py-2.5"}`}
    >
      <Search className={`shrink-0 text-muted-foreground ${large ? "h-5 w-5" : "h-4 w-4"}`} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground ${large ? "text-base" : "text-sm"}`}
      />
    </div>
  );
}
