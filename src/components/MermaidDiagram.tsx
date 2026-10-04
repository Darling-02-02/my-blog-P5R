import { useEffect, useState, type ReactNode } from 'react';

let nextDiagramId = 0;
let mermaidPromise: Promise<typeof import('mermaid')['default']> | undefined;

const loadMermaid = () => mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => {
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true, htmlLabels: false });
  return mermaid;
}).catch((error: unknown) => {
  mermaidPromise = undefined;
  throw error;
});

export default function MermaidDiagram({ source, children }: { source: string; children: ReactNode }) {
  const [result, setResult] = useState<{ source: string; svg?: string; failed?: boolean }>();
  const current = result?.source === source ? result : undefined;

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      let container: HTMLDivElement | undefined;
      try {
        const mermaid = await loadMermaid();
        if (cancelled) return;
        // Mermaid needs a connected element to measure text. Keep its temporary DOM isolated.
        container = document.createElement('div');
        container.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
        document.body.append(container);
        const { svg } = await mermaid.render(`markdown-mermaid-${++nextDiagramId}`, source, container);
        if (!cancelled) setResult({ source, svg });
      } catch {
        if (!cancelled) setResult({ source, failed: true });
      } finally {
        container?.remove();
      }
    };
    void render();
    return () => { cancelled = true; };
  }, [source]);

  return (
    <div style={{ margin: '1.5rem 0' }}>
      {current?.svg ? (
        // SVG in an image context cannot execute scripts or bind Mermaid click handlers.
        <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(current.svg)}`}
          alt="Mermaid 图表（源码见下方）" style={{ display: 'block', maxWidth: '100%', height: 'auto', margin: 'auto' }} />
      ) : (
        <p role="status">{current?.failed ? '图表渲染失败，请查看源码。' : '图表加载中…'}</p>
      )}
      <details open={!current?.svg}>
        <summary>Mermaid 源码</summary>
        {children}
      </details>
    </div>
  );
}
