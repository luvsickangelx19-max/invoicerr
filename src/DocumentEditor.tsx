import { useState, useRef, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowLeft, Check, Plus, Printer, X } from 'lucide-react';
import { type AnyDoc, type LineItem, type DocKind, type Branding, DOC_CONFIG } from './types';
import { money, itemAmount, docSubtotal, docTotal, docTotalDiscount, uid, exportPDF } from './lib';
import { DocumentTemplate } from './DocumentTemplate';
import { ScaledPaper } from './ScaledPaper';

type Props = {
  doc: AnyDoc;
  branding: Branding;
  onSave: (doc: AnyDoc) => void;
  onCancel: () => void;
};

export function DocumentEditor({ doc, branding, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<AnyDoc>(doc);
  const config = DOC_CONFIG[draft.kind];
  const subtotal = docSubtotal(draft);
  const totalDiscount = docTotalDiscount(draft);
  const total = docTotal(draft);
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();
  const handleDownloadPDF = async () => {
    if (previewRef.current) await exportPDF(previewRef.current, draft.number, true);
  };
  const handleDownloadPNG = async () => {
    if (previewRef.current) {
      const { exportPNG } = await import('./lib');
      await exportPNG(previewRef.current, draft.number);
    }
  };

  const patch = (changes: Record<string, unknown>) => setDraft((d) => ({ ...d, ...changes }) as AnyDoc);
  const patchItem = (id: string, changes: Partial<LineItem>) =>
    patch({ items: draft.items.map((it) => it.id === id ? { ...it, ...changes } : it) });
  const addItem = () => patch({ items: [...draft.items, { id: uid(), name: '', qty: 1, price: 0, discount: 0 }] });
  const removeItem = (id: string) => patch({ items: draft.items.filter((it) => it.id !== id) });

  return (
    <div className="editor-layout">
      <div className="editor-form">
        <button className="back-link" onClick={onCancel}><ArrowLeft size={15} /> Kembali</button>
        <div className="editor-title">
          <div>
            <p className="eyebrow">EDIT {config.title.toUpperCase()}</p>
            <h2>{draft.number}</h2>
          </div>
          <button className="primary-btn" onClick={() => onSave(draft)}><Check size={16} /> Simpan</button>
        </div>

        <div className="form-section">
          <h3>Informasi {config.title}</h3>
          <div className="form-grid">
            <Field label="Tanggal">
              <input type="date" value={toDateInput(draft.date)} onChange={(e) => patch({ date: formatDateFromInput(e.target.value) })} />
            </Field>
            <Field label={NUMBER_LABEL(draft.kind)}>
              <input value={draft.number} onChange={(e) => patch({ number: e.target.value })} />
            </Field>
            <Field label="Customer ID">
              <input value={draft.customerId || ''} onChange={(e) => patch({ customerId: e.target.value })} placeholder="ID pelanggan" />
            </Field>
            <Field label="PO #">
              <input value={draft.poNumber || ''} onChange={(e) => patch({ poNumber: e.target.value })} placeholder="No. PO" />
            </Field>
            <Field label="Nama Customer">
              <input value={draft.customer} onChange={(e) => patch({ customer: e.target.value })} placeholder="Nama pelanggan" />
            </Field>
            <Field label="Alamat">
              <input value={draft.address || ''} onChange={(e) => patch({ address: e.target.value })} placeholder="Alamat pelanggan" />
            </Field>
            <Field label="Tempo">
              <input value={draft.tempo} onChange={(e) => patch({ tempo: e.target.value })} />
            </Field>
          </div>
          {draft.kind === 'dp' && (
            <div className="form-grid" style={{ marginTop: 15 }}>
              <Field label="Invoice terkait"><input value={draft.relatedInvoice} onChange={(e) => patch({ relatedInvoice: e.target.value })} placeholder="No. invoice" /></Field>
            </div>
          )}
          {draft.kind === 'refund' && (
            <div className="form-grid" style={{ marginTop: 15 }}>
              <Field label="Invoice terkait"><input value={draft.relatedInvoice} onChange={(e) => patch({ relatedInvoice: e.target.value })} placeholder="No. invoice" /></Field>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="section-heading">
            <div><h3>Rincian layanan</h3><p className="muted small">Jumlah = (Qty × Harga) − Diskon</p></div>
            <button className="text-btn" onClick={addItem}><Plus size={15} /> Tambah baris</button>
          </div>
          <div className="item-editor">
            <div className="item-head">
              <span className="item-head-name">Layanan</span><span>Qty</span><span>Harga</span><span>Diskon</span><span>Jumlah</span><span />
            </div>
            {draft.items.map((item, i) => (
              <div className="item-line" key={item.id}>
                <span className="item-number">{i + 1}</span>
                <input className="service-input" value={item.name} onChange={(e) => patchItem(item.id, { name: e.target.value })} placeholder="Jenis layanan" />
                <input type="number" min={1} value={item.qty} onChange={(e) => patchItem(item.id, { qty: Number(e.target.value) })} />
                <input type="number" min={0} value={item.price || ''} onChange={(e) => patchItem(item.id, { price: Number(e.target.value) })} />
                <input type="number" min={0} value={item.discount || ''} onChange={(e) => patchItem(item.id, { discount: Number(e.target.value) })} />
                <strong>{money(itemAmount(item))}</strong>
                <button className="remove-line" onClick={() => removeItem(item.id)}><X size={15} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section total-form">
          <Field label="Transportasi"><input type="number" min={0} value={draft.transport} onChange={(e) => patch({ transport: Number(e.target.value) })} /></Field>
          <div className="editor-total">
            <span>Subtotal <strong>{money(subtotal)}</strong></span>
            <span>Diskon <strong>{money(totalDiscount)}</strong></span>
            <span>Transportasi <strong>{money(draft.transport)}</strong></span>
            <span>Total biaya <b>{money(total)}</b></span>
          </div>
        </div>

        <div className="form-section">
          <h3>Status</h3>
          <div className="status-options">
            {config.statuses.map((status) => (
              <button key={status} className={draft.status === status ? 'status-option selected' : 'status-option'}
                onClick={() => patch({ status: status })}>
                {draft.status === status && <Check size={14} />}{status}
              </button>
            ))}
          </div>
        </div>

        {draft.kind !== 'invoice' && (
          <div className="form-section">
            <h3>Catatan</h3>
            <textarea className="notes-area" value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} rows={3} placeholder="Catatan tambahan..." />
          </div>
        )}
      </div>

      <div className="editor-preview">
        <div className="editor-preview-head">
          <span className="eyebrow">PRATINJAU A4</span>
          <div className="editor-preview-actions">
            <button className="secondary-btn" onClick={handlePrint}><Printer size={15} /> Cetak</button>
            <button className="secondary-btn" onClick={handleDownloadPDF}><ArrowDownToLine size={15} /> PDF</button>
            <button className="secondary-btn" onClick={handleDownloadPNG}><ArrowDownToLine size={15} /> PNG</button>
          </div>
        </div>
        <ScaledPaper paperRef={previewRef}>
          <DocumentTemplate doc={draft} branding={branding} />
        </ScaledPaper>
      </div>
    </div>
  );
}

function toDateInput(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  return dateStr;
}

function formatDateFromInput(input: string): string {
  if (!input) return '';
  const [y, m, d] = input.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function NUMBER_LABEL(kind: DocKind): string {
  return DOC_CONFIG[kind].title === 'Invoice' ? 'Invoice #' : DOC_CONFIG[kind].title === 'DP' ? 'No. DP' : 'No. Refund';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}
