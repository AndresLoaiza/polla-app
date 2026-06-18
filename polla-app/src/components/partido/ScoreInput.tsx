import { Minus, Plus } from 'lucide-react';

export default function ScoreInput({ value, onChange, disabled, color }:
  { value: number | null; onChange: (n: number) => void; disabled?: boolean; color?: string }) {
  const vacio = value === null;
  return (
    <div className="flex items-center gap-2">
      <button aria-label="menos" disabled={disabled || vacio || value <= 0}
        onClick={() => { if (!vacio) onChange(value - 1); }}
        className="glass w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30">
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center text-2xl font-bold tabular-nums"
        style={{ color: vacio ? undefined : color }}>
        {vacio ? <span className="opacity-30">–</span> : value}
      </span>
      <button aria-label="mas" disabled={disabled}
        onClick={() => onChange(vacio ? 0 : value + 1)}
        className="glass w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
