import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = { critical: '#ef4444', high: '#f97316', medium: '#3b82f6', low: '#22c55e' };

export default function RiskPieChart({ counts = {} }) {
  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-slate-500">No data yet</div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
          {data.map(entry => (
            <Cell key={entry.name} fill={COLORS[entry.name] || '#64748b'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend formatter={(v) => <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}
