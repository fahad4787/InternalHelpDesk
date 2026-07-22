import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #ff6c49 0%, #ff8a6a 45%, #e85a38 100%)',
          color: '#ffffff',
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          letterSpacing: '-0.04em',
        }}
      >
        W
      </div>
    ),
    { ...size },
  );
}
