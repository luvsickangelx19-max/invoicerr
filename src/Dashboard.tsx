import { Check, FileText, CircleDollarSign, Archive, Receipt, ChevronRight } from 'lucide-react';
import { money } from './lib';
import { type AnyDoc, type ModuleKey, docTotal } from './types';

type Props = {
  invoices: AnyDoc[];
  dps: AnyDoc[];
  refunds: AnyDoc[];
  onNavigate: (k: ModuleKey) => void;
};

export function Dashboard({ invoices, dps, refunds, onNavigate }: Props) {
  const totalDP = dps.reduce((s, d) => s + docTotal(d), 0);
  const totalRefund = refunds.reduce((s, d) => s + docTotal(d), 0);
  const lunas = invoices.filter((i) => i.status === 'LUNAS').length;
  const belum = invoices.filter((i) => i.status !== 'LUNAS').length;

  return (
    <div className="workspace">
      <section className="workspace-head">
        <div><p className="eyebrow">SELAMAT DATANG</p><h2>Ringkasan Kerja</h2><p className="muted">Pantau dokumen Rencang Resik dalam satu tempat.</p></div>
        <button className="primary-btn" onClick={() => onNavigate('invoice')}><Receipt size={17} /> Buka Invoice</button>
      </section>
      <div className="summary-row">
        <MiniStat label="Total Invoice" value={String(invoices.length).padStart(2, '0')} icon={<FileText size={17} />} />
        <MiniStat label="Invoice Lunas" value={String(lunas).padStart(2, '0')} icon={<Check size={17} />} tone="green" />
        <MiniStat label="Belum Lunas" value={String(belum).padStart(2, '0')} icon={<CircleDollarSign size={17} />} tone="orange" />
      </div>
      <div className="summary-row" style={{ marginTop: 12 }}>
        <MiniStat label="Total DP" value={money(totalDP)} icon={<CircleDollarSign size={17} />} />
        <MiniStat label="Total Refund" value={money(totalRefund)} icon={<Archive size={17} />} />
      </div>
      <div className="dashboard-note">
        <div className="note-icon"><Receipt size={20} /></div>
        <div>
          <h3>Dokumen rapi, pekerjaan lebih ringan</h3>
          <p>Gunakan Invoice untuk membuat dokumen sesuai format A4 Rencang Resik. Data tersimpan otomatis di perangkat ini.</p>
        </div>
        <button className="secondary-btn" onClick={() => onNavigate('invoice')}>Lihat Invoice <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon, tone = '', wide = false }: { label: string; value: string; icon: React.ReactNode; tone?: string; wide?: boolean }) {
  return (
    <div className={`mini-stat ${tone} ${wide ? 'wide' : ''}`}>
      <span className="stat-icon">{icon}</span>
      <div><span>{label}</span><strong>{value}</strong></div>
    </div>
  );
}
