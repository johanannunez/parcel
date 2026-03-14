interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

export default function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="flex flex-col gap-1 w-full sm:w-auto sm:min-w-[140px]">
      <span className="text-[10px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase font-[family-name:var(--font-heading)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full appearance-none
          px-3 py-2 pr-8 text-sm
          bg-[var(--bg)] text-[var(--text-primary)]
          border border-[var(--border)] rounded-[var(--radius-md)]
          font-[family-name:var(--font-body)]
          transition-[border-color,box-shadow] duration-200
          hover:border-[var(--brand-bright)]
          focus:outline-none focus:border-[var(--brand-bright)]
          focus:ring-2 focus:ring-[var(--brand-bright)]/20
          cursor-pointer
          bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%238A8F98%22%20d%3D%22M3%204.5L6%207.5L9%204.5%22%2F%3E%3C%2Fsvg%3E')]
          bg-[length:12px] bg-[right_8px_center] bg-no-repeat
        "
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
