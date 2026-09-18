import { useEffect, useRef, useState, type ReactNode } from 'react';

const PAPER_W = 595;
const PAPER_H = PAPER_W * (297 / 210);

export function ScaledPaper({ children, paperRef }: { children: ReactNode; paperRef?: React.Ref<HTMLDivElement> }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / PAPER_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ width: '100%', overflow: 'hidden' }}>
      <div style={{ width: PAPER_W, height: PAPER_H * scale, position: 'relative' }}>
        <div ref={paperRef} style={{ width: PAPER_W, transformOrigin: 'top left', transform: `scale(${scale})`, position: 'absolute', top: 0, left: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
