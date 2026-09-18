export type InvoiceStatus = 'DRAFT' | 'SENT' | 'BELUM LUNAS' | 'LUNAS' | 'CANCELLED';
export type DPStatus = 'DRAFT' | 'SENT' | 'LUNAS' | 'CANCELLED';
export type RefundStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSED' | 'CANCELLED';
export type DocKind = 'invoice' | 'dp' | 'refund';
export type ModuleKey = 'dashboard' | 'invoice' | 'dp' | 'refund';

export type LineItem = { id: string; name: string; qty: number; price: number; discount: number };

export type BaseDoc = {
  id: string;
  number: string;
  date: string;
  customer: string;
  address: string;
  customerId: string;
  poNumber: string;
  tempo: string;
  transport: number;
  items: LineItem[];
  notes: string;
  createdAt: number;
};

export type Invoice = BaseDoc & { kind: 'invoice'; status: InvoiceStatus };
export type DP = BaseDoc & { kind: 'dp'; status: DPStatus; relatedInvoice: string; paymentMethod: string };
export type Refund = BaseDoc & { kind: 'refund'; status: RefundStatus; relatedInvoice: string; reason: string; paymentMethod: string };
export type AnyDoc = Invoice | DP | Refund;

export type Customer = {
  id: string;
  name: string;
  company: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
};

export type Branding = {
  logo: string;
  stamp: string;
  paidStamp: string;
  signature: string;
  company: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  footer: string;
};

export type NumberingConfig = {
  invoicePrefix: string;
  dpPrefix: string;
  refundPrefix: string;
  running: Record<string, number>;
};

export type Settings = {
  branding: Branding;
  numbering: NumberingConfig;
};

export const docTotal = (doc: { items: { qty: number; price: number; discount: number }[]; transport: number }) =>
  doc.items.reduce((sum, item) => sum + Math.max(0, item.qty * item.price - item.discount), 0) + doc.transport;

export const docTotalDiscount = (doc: { items: { discount: number }[] }) =>
  doc.items.reduce((sum, item) => sum + item.discount, 0);

export const WHATSAPP_NUMBER = '628586502681';

export const FONT_OPTIONS = [
  { value: 'Poppins', label: 'Poppins (Modern Bold)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
  { value: 'Caveat', label: 'Caveat (Handwritten Aesthetic)' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville (Classic)' },
  { value: 'DM Sans', label: 'DM Sans (Clean Bold)' },
  { value: 'Montserrat', label: 'Montserrat (Bold Modern)' },
  { value: 'Lora', label: 'Lora (Soft Serif)' },
  { value: 'Pacifico', label: 'Pacifico (Retro Aesthetic)' },
  { value: 'Dancing Script', label: 'Dancing Script (Cursive Aesthetic)' },
  { value: 'Bebas Neue', label: 'Bebas Neue (Bold Condensed)' },
  { value: 'Great Vibes', label: 'Great Vibes (Elegant Script)' },
  { value: 'Satisfy', label: 'Satisfy (Casual Script)' },
  { value: 'Archivo Black', label: 'Archivo Black (Heavy Bold)' },
  { value: 'Quicksand', label: 'Quicksand (Soft Rounded)' },
  { value: 'Cormorant Garamond', label: 'Cormorant (Luxury Serif)' },
  { value: 'Sacramento', label: 'Sacramento (Light Script)' },
  { value: 'Anton', label: 'Anton (Impact Bold)' },
  { value: 'Nunito', label: 'Nunito (Friendly Rounded)' },
  { value: 'Shadows Into Light', label: 'Shadows Into Light (Pencil Aesthetic)' },
  { value: 'Cinzel', label: 'Cinzel (Roman Classic)' },
];

export const COLOR_OPTIONS = [
  { value: '#ffffff', name: 'Putih', text: '#53636a' },
  { value: '#fdf2f8', name: 'Soft Pink', text: '#9d3a6b' },
  { value: '#fce7f3', name: 'Pink Blush', text: '#9d3a6b' },
  { value: '#fbcfe8', name: 'Pink Pastel', text: '#831843' },
  { value: '#00a2e8', name: 'Sky Blue', text: '#fff' },
  { value: '#0d9488', name: 'Teal', text: '#fff' },
  { value: '#059669', name: 'Emerald', text: '#fff' },
  { value: '#d97706', name: 'Amber', text: '#fff' },
  { value: '#e11d48', name: 'Rose', text: '#fff' },
  { value: '#475569', name: 'Slate', text: '#fff' },
];

export const TEMPLATE_OPTIONS = [
  { value: 'classic', label: 'Klasik' },
  { value: 'modern', label: 'Modern' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'aesthetic', label: 'Aesthetic' },
];

export const SIZE_OPTIONS = [
  { value: 'ig-feed', label: 'Instagram Feed (1080×1080)', w: 1080, h: 1080 },
  { value: 'ig-story', label: 'Instagram Story (1080×1920)', w: 1080, h: 1920 },
  { value: 'tiktok-feed', label: 'TikTok Feed (1080×1350)', w: 1080, h: 1350 },
  { value: 'tiktok-story', label: 'TikTok Story (1080×1920)', w: 1080, h: 1920 },
  { value: 'square', label: 'Square (1080×1080)', w: 1080, h: 1080 },
];

export const INVOICE_STATUSES: InvoiceStatus[] = ['DRAFT', 'SENT', 'BELUM LUNAS', 'LUNAS', 'CANCELLED'];
export const DP_STATUSES: DPStatus[] = ['DRAFT', 'SENT', 'LUNAS', 'CANCELLED'];
export const REFUND_STATUSES: RefundStatus[] = ['REQUESTED', 'APPROVED', 'PROCESSED', 'CANCELLED'];

export const DOC_CONFIG: Record<DocKind, { title: string; label: string; statuses: string[]; defaultStatus: string; docLabel: string }> = {
  invoice: { title: 'Invoice', label: 'Invoice', statuses: INVOICE_STATUSES, defaultStatus: 'DRAFT', docLabel: 'INVOICE' },
  dp: { title: 'DP', label: 'DP', statuses: DP_STATUSES, defaultStatus: 'DRAFT', docLabel: 'DOWN PAYMENT' },
  refund: { title: 'Refund', label: 'Refund', statuses: REFUND_STATUSES, defaultStatus: 'REQUESTED', docLabel: 'REFUND' },
};

export const defaultBranding: Branding = {
  logo: '/WhatsApp_Image_2026-08-28_at_10.34.00.jpeg',
  stamp: '',
  paidStamp: '',
  signature: '',
  company: 'RENCANG RESIK',
  address: 'Surakarta, Jawa Tengah',
  phone: '0812 0000 0000',
  email: 'rencangresik@gmail.com',
  instagram: '@rencang.resik',
  footer: 'Konco apik supoyo papan panggonan dadi resik',
};

export const defaultNumbering: NumberingConfig = {
  invoicePrefix: 'INV',
  dpPrefix: 'DP',
  refundPrefix: 'RF',
  running: { invoice: 330, dp: 1, refund: 1 },
};

export const defaultSettings: Settings = {
  branding: defaultBranding,
  numbering: defaultNumbering,
};
