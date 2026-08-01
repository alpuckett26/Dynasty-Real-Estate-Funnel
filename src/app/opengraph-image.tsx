import { ImageResponse } from 'next/og';
import { AGENT_NAME } from '@/lib/site';

export const runtime = 'nodejs';
export const alt = 'Adreanne The Realtor — Baton Rouge Real Estate';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Social preview card. Generated rather than a static asset so it stays in sync
 * with the brand colours and needs no binary in the repo.
 *
 * Without this every shared link — texts, Facebook, Instagram bio, email —
 * renders as a bare URL with no image, which is the single biggest drag on
 * click-through for a funnel whose traffic plan is people sharing links.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0c1a4a 0%, #1e3a8a 55%, #1d4ed8 100%)',
        }}
      >
        <div style={{ display: 'flex', fontSize: 26, letterSpacing: 6, color: '#93c5fd', fontWeight: 600 }}>
          BATON ROUGE REAL ESTATE
        </div>
        <div style={{ display: 'flex', fontSize: 82, color: 'white', fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
          {AGENT_NAME}
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: 'rgba(255,255,255,0.82)', marginTop: 28, maxWidth: 900, lineHeight: 1.35 }}>
          First-time buyers, healthcare workers, and down payment assistance programs most agents don&apos;t know exist.
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: '#93c5fd', marginTop: 40, fontWeight: 600 }}>
          adreannetherealtor.com · (225) 284-6854
        </div>
      </div>
    ),
    size
  );
}
