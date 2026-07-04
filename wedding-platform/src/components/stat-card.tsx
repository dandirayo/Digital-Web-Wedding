type StatCardProps = {
  label: string;
  value: string;
  helper: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-md border border-[#e0d4c7] bg-white p-5 shadow-[0_12px_34px_rgba(82,57,38,0.06)]">
      <div className="text-sm font-medium text-[#756a60]">{label}</div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-[#241f1a]">{value}</div>
      <div className="mt-2 text-sm text-[#9a6a3a]">{helper}</div>
    </div>
  );
}
