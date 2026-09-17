import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function TrendLineChart({ trend = [] }) {
  if (!trend.length) return (
    <div className="flex items-center justify-center h-48 text-slate-500">No trend data yet</div>
  );
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={trend} margin={{ top: 4, right: 12, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
        <Line type="monotone" dataKey="apps" stroke="#3b82f6" strokeWidth={2} dot={false} name="Apps found" />
        <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Critical" />
        <Line type="monotone" dataKey="high" stroke="#f97316" strokeWidth={1.5} dot={false} name="High" />
      </LineChart>
    </ResponsiveContainer>
  );
}
