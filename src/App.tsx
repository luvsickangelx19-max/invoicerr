import { useEffect, useState } from 'react';
import { LayoutDashboard, Receipt, CircleDollarSign, Archive, Download, Share, X } from 'lucide-react';
import { type AnyDoc, type Branding, type NumberingConfig, type ModuleKey, defaultBranding, defaultNumbering } from './types';
import { readStore, writeStore, uid } from './lib';
import { DocumentWorkspace } from './DocumentWorkspace';
import { Dashboard } from './Dashboard';

const sampleItems = [
  { id: uid(), name: 'Kamar mandi (26) dan tempat wudhu (4)', qty: 1, price: 2117000, discount: 423400 },
  { id: uid(), name: 'DC dapur dan cuci peralatan', qty: 1, price: 150000, discount: 0 },
  { id: uid(), name: 'Tempat wudhu depan', qty: 1, price: 70000, discount: 0 },
];

const sampleInvoice: AnyDoc = {
  id: uid(), kind: 'invoice', number: 'INV/330/2026/08', date: '25/08/26', customer: 'SMK Batik 1 Surakarta',
  customerId: 'CUST-001', poNumber: 'PO-001', tempo: '30 hari', transport: 0, items: sampleItems, notes: '', createdAt: Date.now(), status: 'LUNAS',
} as AnyDoc;

const navItems: { key: ModuleKey; label: string; icon: typeof Receipt }[] = [
  { key: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
  { key: 'invoice', label: 'Invoice', icon: Receipt },
  { key: 'dp', label: 'DP', icon: CircleDollarSign },
  { key: 'refund', label: 'Refund', icon: Archive },
];

const titleMap: Record<ModuleKey, string> = {
  dashboard: 'Ringkasan', invoice: 'Invoice', dp: 'DP', refund: 'Refund',
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function App() {
  const [active, setActive] = useState<ModuleKey>('dashboard');
  const [invoices, setInvoices] = useState<AnyDoc[]>(() => readStore('rr-invoices', [sampleInvoice]));
  const [dps, setDps] = useState<AnyDoc[]>(() => readStore('rr-dps', []));
  const [refunds, setRefunds] = useState<AnyDoc[]>(() => readStore('rr-refunds', []));
  const [branding, setBranding] = useState<Branding>(() => {
    const stored = readStore<Branding>('rr-branding', defaultBranding);
    return { ...defaultBranding, ...stored, logo: stored.logo || defaultBranding.logo };
  });
  const [numbering, setNumbering] = useState<NumberingConfig>(() => readStore('rr-numbering', defaultNumbering));
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => writeStore('rr-invoices', invoices), [invoices]);
  useEffect(() => writeStore('rr-dps', dps), [dps]);
  useEffect(() => writeStore('rr-refunds', refunds), [refunds]);
  useEffect(() => writeStore('rr-branding', branding), [branding]);
  useEffect(() => writeStore('rr-numbering', numbering), [numbering]);
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    const standalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(ios);
    if (standalone) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstallPrompt(null);
      return;
    }
    setShowInstallGuide(true);
  };

  const setSettings = (s: { branding: Branding; numbering: NumberingConfig }) => {
    setBranding(s.branding);
    setNumbering(s.numbering);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar-desktop">
        <div className="brand-lockup">
          <div className="brand-mark"><img src="/WhatsApp_Image_2026-08-28_at_10.34.00.jpeg" alt="Rencang Resik" /></div>
          <div><strong>RENCANG RESIK</strong><span>Document workspace</span></div>
        </div>
        <nav>
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <header className="topbar">
        <div className="brand-lockup-mobile">
          <div className="brand-mark"><img src="/WhatsApp_Image_2026-08-28_at_10.34.00.jpeg" alt="Rencang Resik" /></div>
          <div><strong>RENCANG RESIK</strong></div>
        </div>
        <div className="topbar-title"><h1>{titleMap[active]}</h1></div>
      </header>
      <main className="main-area">
        {(installPrompt || isIos) && (
          <section className="install-banner" aria-label="Instal Digital Invoice">
            <div className="install-banner-icon"><Download size={18} /></div>
            <div className="install-banner-copy">
              <strong>Ingin Instal PWA Digital Invoice?</strong>
              <span>{isIos ? 'Simpan aplikasi ke layar utama iPhone atau iPad.' : 'Buka lebih cepat seperti aplikasi di HP atau laptop.'}</span>
            </div>
            <button className="install-banner-button" onClick={installApp}>{isIos ? <Share size={16} /> : <Download size={16} />} Instal</button>
            <button className="install-banner-close" aria-label="Tutup" onClick={() => { setInstallPrompt(null); setIsIos(false); }}><X size={17} /></button>
          </section>
        )}
        {active === 'dashboard' && <Dashboard invoices={invoices} dps={dps} refunds={refunds} onNavigate={setActive} />}
        {active === 'invoice' && <DocumentWorkspace kind="invoice" docs={invoices} setDocs={setInvoices} settings={{ branding, numbering }} setSettings={setSettings} branding={branding} />}
        {active === 'dp' && <DocumentWorkspace kind="dp" docs={dps} setDocs={setDps} settings={{ branding, numbering }} setSettings={setSettings} branding={branding} />}
        {active === 'refund' && <DocumentWorkspace kind="refund" docs={refunds} setDocs={setRefunds} settings={{ branding, numbering }} setSettings={setSettings} branding={branding} />}
      </main>
      <nav className="bottom-nav">
        {navItems.map(({ key, label, icon: Icon }) => (
          <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>
            <Icon size={20} /><span>{label}</span>
          </button>
        ))}
      </nav>
      {showInstallGuide && (
        <div className="install-modal-overlay" onClick={() => setShowInstallGuide(false)}>
          <div className="install-modal" onClick={(e) => e.stopPropagation()}>
            <button className="install-modal-close" aria-label="Tutup" onClick={() => setShowInstallGuide(false)}><X size={20} /></button>
            <div className="install-modal-icon"><Download size={32} /></div>
            <h2>Pasang Digital Invoice</h2>
            <p>Ikuti langkah berikut sesuai perangkat Anda:</p>
            <div className="install-steps">
              <div className="install-step">
                <strong>Android (Chrome)</strong>
                <span>Buka menu <b>⋮</b> di kanan atas, lalu pilih <b>Install app</b> / <b>Add to Home screen</b>.</span>
              </div>
              <div className="install-step">
                <strong>iPhone / iPad (Safari)</strong>
                <span>Ketuk tombol <b>Share</b> <Share size={14} />, lalu pilih <b>Add to Home Screen</b>.</span>
              </div>
              <div className="install-step">
                <strong>Laptop (Chrome / Edge)</strong>
                <span>Klik ikon <b>Install</b> di ujung kanan address bar, atau menu <b>⋮</b> → <b>Install page as app</b>.</span>
              </div>
            </div>
            <button className="install-modal-button" onClick={() => setShowInstallGuide(false)}>Mengerti</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
