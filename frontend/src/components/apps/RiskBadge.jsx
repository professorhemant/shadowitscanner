const styles = {
  critical: 'bg-red-500/20 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  low: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

export default function RiskBadge({ level }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${styles[level] || styles.low}`}>
      {level}
    </span>
  );
}
