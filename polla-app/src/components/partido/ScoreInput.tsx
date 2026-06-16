import { Minus, Plus } from 'lucide-react';

export default function ScoreInput({ value, onChange, disabled, color }:
  { value: number; onChange: (n: number) => void; disabled?: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button aria-label="menos" disabled={disabled || value <= 0}
        onClick={() => onChange(value - 1)}
        className="glass w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30">
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
      <button aria-label="mas" disabled={disabled}
        onClick={() => onChange(value + 1)}
        className="glass w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
