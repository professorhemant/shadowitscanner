const cards = [
  { level: 'critical', label: 'Critical', color: 'border-red-500', textColor: 'text-red-400' },
  { level: 'high', label: 'High', color: 'border-orange-500', textColor: 'text-orange-400' },
  { level: 'medium', label: 'Medium', color: 'border-blue-500', textColor: 'text-blue-400' },
  { level: 'low', label: 'Low', color: 'border-green-500', textColor: 'text-green-400' },
];

export default function RiskSummaryCards({ counts = {}, total = 0 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.level} className={`bg-surface-card rounded-xl p-5 border-l-4 ${c.color}`}>
          <div className={`text-3xl font-bold ${c.textColor}`}>{counts[c.level] ?? 0}</div>
          <div className="text-sm text-slate-400 mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
