export default function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold text-gray-600 uppercase block">{label}</label>
      {children}
    </div>
  );
}
