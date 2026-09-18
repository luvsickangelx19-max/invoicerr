import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowDownToLine, Copy, Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { type AnyDoc, type DocKind, type Branding, type Settings, DOC_CONFIG } from './types';
import { money, docTotal, exportPDF, exportPNG, uid, generateNumber, formatDate } from './lib';
import { DocumentTemplate } from './DocumentTemplate';
import { ScaledPaper } from './ScaledPaper';
import { DocumentEditor } from './DocumentEditor';

type Props = {
  kind: DocKind;
  docs: AnyDoc[];
  setDocs: (docs: AnyDoc[]) => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
  branding: Branding;
};

export function DocumentWorkspace({ kind, docs, setDocs, settings, setSettings, branding }: Props) {
  const config = DOC_CONFIG[kind];
  const [selectedId, setSelectedId] = useState(docs[0]?.id ?? '');
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  // Off-screen render target for per-row downloads
  const downloadRef = useRef<HTMLDivElement>(null);
  const [downloadTarget, setDownloadTarget] = useState<{ doc: AnyDoc; format: 'pdf' | 'png' } | null>(null);

  const selected = docs.find((d) => d.id === selectedId) ?? docs[0];
  const visible = docs.filter((d) => `${d.number} ${d.customer}`.toLowerCase().includes(query.toLowerCase()));

  const handleCreate = () => {
    const prefix = kind === 'invoice' ? settings.numbering.invoicePrefix : kind === 'dp' ? settings.numbering.dpPrefix : settings.numbering.refundPrefix;
    const number = generateNumber(prefix, settings.numbering, kind);
    const newDoc: AnyDoc = {
      id: uid(),
      kind,
      number,
      date: formatDate(new Date()),
      customer: '',
      address: '',
      customerId: '',
      poNumber: '',
      tempo: '30 hari',
      transport: 0,
      items: [{ id: uid(), name: '', qty: 1, price: 0, discount: 0 }],
      notes: '',
      createdAt: Date.now(),
      status: config.defaultStatus as never,
      ...(kind === 'dp' ? { relatedInvoice: '', paymentMethod: '' } : {}),
      ...(kind === 'refund' ? { relatedInvoice: '', reason: '', paymentMethod: '' } : {}),
    } as AnyDoc;
    setDocs([newDoc, ...docs]);
    setSettings({ ...settings, numbering: { ...settings.numbering, running: { ...settings.numbering.running, [kind]: (settings.numbering.running[kind] ?? 0) + 1 } } });
    setSelectedId(newDoc.id);
    setEditing(true);
  };

  const handleSave = (doc: AnyDoc) => {
    setDocs(docs.map((d) => d.id === doc.id ? doc : d));
    setEditing(false);
  };

  const handleDuplicate = () => {
    if (!selected) return;
    const copy: AnyDoc = { ...selected, id: uid(), number: `${selected.number}-COPY`, status: config.defaultStatus as never, items: selected.items.map((it) => ({ ...it, id: uid() })), createdAt: Date.now() } as AnyDoc;
    setDocs([copy, ...docs]);
    setSelectedId(copy.id);
    setEditing(true);
  };

  const handleDelete = (id: string) => {
    const doc = docs.find((d) => d.id === id);
    if (!doc || !window.confirm(`Hapus ${config.title} ${doc.number}?`)) return;
    const remaining = docs.filter((d) => d.id !== id);
    setDocs(remaining);
    if (selectedId === id) setSelectedId(remaining[0]?.id ?? '');
  };

  const handleRowDownload = useCallback((doc: AnyDoc, format: 'pdf' | 'png') => {
    setDownloadTarget({ doc, format });
  }, []);

  // When downloadTarget is set, wait for the off-screen render to mount, then capture
  useEffect(() => {
    if (!downloadTarget || !downloadRef.current) return;
    let cancelled = false;

    const run = async () => {
      // Wait for images and fonts in the off-screen render
      const el = downloadRef.current;
      if (!el) return;
      await document.fonts.ready;
      await Promise.all(
        Array.from(el.querySelectorAll('img')).map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
                setTimeout(resolve, 15000);
              })
        )
      );
      if (cancelled) return;
      const { doc, format } = downloadTarget;
      if (format === 'pdf') {
        await exportPDF(el, doc.number, true);
      } else {
        await exportPNG(el, doc.number);
      }
      if (!cancelled) setDownloadTarget(null);
    };

    // Small delay to ensure React has committed the off-screen DOM
    requestAnimationFrame(() => { run(); });
    return () => { cancelled = true; };
  }, [downloadTarget]);

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (previewRef.current) await exportPDF(previewRef.current, selected.number, true);
  };

  const handleDownloadPNG = async () => {
    if (previewRef.current) {
      const { exportPNG } = await import('./lib');
      await exportPNG(previewRef.current, selected.number);
    }
  };

  if (editing && selected) {
    return <DocumentEditor doc={selected} branding={branding} onSave={handleSave} onCancel={() => setEditing(false)} />;
  }

  return (
    <div className="workspace">
      <section className="workspace-head">
        <div>
          <p className="eyebrow">{config.title.toUpperCase()}</p>
          <h2>{config.title} Anda</h2>
          <p className="muted">Kelola dokumen {config.title.toLowerCase()} Rencang Resik.</p>
        </div>
        <button className="primary-btn" onClick={handleCreate}><Plus size={17} /> Buat {config.title}</button>
      </section>

      <div className="split-workspace">
        <section className="list-panel">
          <div className="panel-top">
            <div><h3>Semua {config.title}</h3><span className="muted small">{docs.length} dokumen</span></div>
            <div className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari..." /></div>
          </div>
          <div className="table-wrap">
            <table className="list-table">
              <thead><tr><th>Nomor</th><th>Customer</th><th>Tanggal</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {visible.map((d) => (
                  <tr key={d.id} className={selected?.id === d.id ? 'selected-row' : ''} onClick={() => setSelectedId(d.id)}>
                    <td><strong>{d.number}</strong><span className="subline">Tempo {d.tempo}</span></td>
                    <td>{d.customer || 'Belum diisi'}</td>
                    <td>{d.date}</td>
                    <td><strong>{money(docTotal(d))}</strong></td>
                    <td><span className={`status-pill ${d.status === 'LUNAS' ? 'paid' : d.status === 'BELUM LUNAS' || d.status === 'REQUESTED' ? 'unpaid' : ''}`}>{d.status}</span></td>
                    <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="row-action-btn" title="Download PDF" onClick={() => handleRowDownload(d, 'pdf')}><ArrowDownToLine size={14} /></button>
                      <button className="row-action-btn" title="Download PNG" onClick={() => handleRowDownload(d, 'png')}><ArrowDownToLine size={14} /></button>
                      <button className="row-action-btn danger" title="Hapus" onClick={() => handleDelete(d.id)}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {docs.length === 0 && <div className="empty-state"><p>Belum ada {config.title.toLowerCase()}</p><button className="text-btn" onClick={handleCreate}>Buat sekarang</button></div>}
          </div>
        </section>

        <section className="preview-panel">
          <div className="preview-head">
            <div><span className="eyebrow">PRATINJAU</span><h3>{selected?.number ?? '—'}</h3></div>
            <button className="icon-button" onClick={handleDuplicate} title="Duplikat"><Copy size={16} /></button>
          </div>
          {selected && (
            <>
              <ScaledPaper paperRef={previewRef}>
                <DocumentTemplate doc={selected} branding={branding} />
              </ScaledPaper>
              <div className="preview-actions">
                <button className="secondary-btn" onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button>
                <button className="secondary-btn" onClick={handlePrint}><Printer size={15} /> Cetak</button>
                <button className="secondary-btn" onClick={handleDownloadPDF}><ArrowDownToLine size={15} /> PDF</button>
                <button className="secondary-btn" onClick={handleDownloadPNG}><ArrowDownToLine size={15} /> PNG</button>
                <button className="danger-btn" onClick={() => handleDelete(selected.id)}><Trash2 size={15} /></button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Off-screen render for per-row downloads */}
      {downloadTarget && (
        <div style={{ position: 'fixed', left: -10000, top: 0, width: 595, overflow: 'hidden', pointerEvents: 'none', opacity: 0 }}>
          <ScaledPaper paperRef={downloadRef}>
            <DocumentTemplate doc={downloadTarget.doc} branding={branding} />
          </ScaledPaper>
        </div>
      )}
    </div>
  );
}
