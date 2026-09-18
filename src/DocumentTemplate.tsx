import { type Branding, type AnyDoc, type LineItem, docTotalDiscount } from './types';
import { itemAmount, docSubtotal, docTotal } from './lib';

export function DocumentTemplate({ doc, branding }: { doc: AnyDoc; branding: Branding }) {
  const subtotal = docSubtotal(doc);
  const totalDiscount = docTotalDiscount(doc);
  const total = docTotal(doc);
  const isPaid = doc.kind === 'invoice' ? doc.status === 'LUNAS' : doc.kind === 'dp' && doc.status === 'LUNAS';

  return (
    <article className="doc-paper" data-doc-paper>
      <div className="doc-grid">
        <header className="doc-top-row">
          <div className="doc-identity">
            {branding.logo && <img src={branding.logo} alt="Rencang Resik" className="doc-logo-img" />}
            <div className="doc-company">
              <strong>Rencang Resik</strong>
              <span>Kartotiyasan 6/4 Kratonan, Serengan, Solo</span>
            </div>
          </div>
          <div className="doc-title-block">
            <h1>{doc.kind === 'invoice' ? 'Invoice' : doc.kind === 'dp' ? 'Down Payment' : 'Refund'}</h1>
            <div className="doc-header-info">
              <InfoRow label="DATE" value={doc.date || '(Angka) (Bulan) (Tahun)'} />
              <InfoRow label="INVOICE #" value={doc.number || 'INV. (Angka)'} />
              <InfoRow label="CUSTOMER ID" value={doc.customerId || '(Angka)'} />
              <InfoRow label="PO #" value={doc.poNumber || '(Angka)'} />
            </div>
          </div>
        </header>

        <div className="doc-bill-to">
          <div className="doc-bill-heading">Bill To:</div>
          <div className="doc-bill-content">
            <span>{doc.customer || 'Penerima'}</span>
            <span>{doc.address || 'Alamat'}</span>
          </div>
        </div>

        <table className="doc-table">
          <thead>
            <tr>
              <th className="col-no">No.</th>
              <th className="col-name">Jenis Layanan</th>
              <th className="col-qty">Qty</th>
              <th className="col-price">Harga</th>
              <th className="col-disc">Diskon</th>
              <th className="col-amount">Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((item, i) => <ItemRow key={item.id} item={item} index={i} />)}
            <tr className="doc-notes-row">
              <td colSpan={4}>
                <div className="doc-payment-notes">
                  <div className="doc-note-box">
                    <strong>BANK ACCOUNT TO TRANSFER</strong>
                    <p>Transfer Rek BCA 0153795786 a.n Yuliasih Setiati<br />Transfer Rek BRI 033401014826532 a.n Yuliasih Setiati</p>
                  </div>
                  <div className="doc-note-box">
                    <strong>BEBAS ADMIN VIA QRIS</strong>
                    <p>Metoda pembayaran bebas admin bank via QRIS<br />Maaf, tidak terima penangguhan biaya admin antar bank</p>
                  </div>
                </div>
                <div className="doc-qr-wrap"><img src="/WhatsApp_Image_2026-09-14_at_06.02.19.jpeg" alt="QRIS Rencang Resik" className="doc-qr-image" /></div>
              </td>
              <td colSpan={2} className="doc-totals-cell">
                <div className="doc-totals">
                  <div><span>Sub Total</span><strong>{invoiceMoney(subtotal)}</strong></div>
                  <div><span>Diskon</span><strong>{totalDiscount ? invoiceMoney(totalDiscount) : ''}</strong></div>
                  <div><span>Transportasi</span><strong>{invoiceMoney(doc.transport)}</strong></div>
                  <div className="doc-total-line">
                    <span>Total Pelunasan</span>
                    <strong className="doc-total-value">{invoiceMoney(total)}</strong>
                    {isPaid && <img src="/Tanda_lunas copy 2.png" alt="LUNAS" className="doc-paid-stamp-img" />}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="doc-sign-area">
          <div className="doc-signing">
            <span>OWNER</span>
            <div className="doc-sign-stack">
              <img src={branding.stamp || '/Stempel_rencang_resik.png'} alt="Stempel" className="doc-official-stamp" />
              <img src="/Tandatangan-1.png" alt="Tanda tangan" className="doc-signature-img" />
            </div>
            <strong>YULIASIH SETIATI</strong>
          </div>
        </div>
      </div>
      <div className="doc-footer">"{branding.footer}"</div>
    </article>
  );
}

function ItemRow({ item, index }: { item: LineItem; index: number }) {
  return <tr><td className="center">{index + 1}</td><td>{item.name || '—'}</td><td className="center">{item.qty}</td><td className="right">{item.price ? invoiceMoney(item.price) : ''}</td><td className="right">{item.discount ? invoiceMoney(item.discount) : ''}</td><td className="right">{invoiceMoney(itemAmount(item))}</td></tr>;
}

function invoiceMoney(value: number): string {
  return `Rp ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}
