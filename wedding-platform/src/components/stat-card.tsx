type StatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-[#e0d4c7] bg-white p-4 sm:p-5">
      <div className="text-sm font-medium text-[#756a60]">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-[#241f1a] sm:text-3xl">{value}</div>
      <div className="mt-2 text-xs leading-5 text-[#756a60] sm:text-sm">{helper}</div>
    </div>
  );
}
