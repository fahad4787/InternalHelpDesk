import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
          background: 'linear-gradient(135deg, #ff6c49 0%, #ff8a6a 45%, #e85a38 100%)',
          color: '#ffffff',
          fontSize: 100,
          fontWeight: 700,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          letterSpacing: '-0.04em',
          boxShadow: '0 12px 40px rgba(232, 90, 56, 0.35)',
        }}
      >
        W
      </div>
    ),
    { ...size },
  );
}
