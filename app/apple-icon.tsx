import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

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
          background: '#0C1220',
        }}
      >
        {/* Top-left circle */}
        <div
          style={{
            position: 'absolute',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #ffffff, #c8c8d0)',
            top: '28px',
            left: '32px',
          }}
        />
        {/* Bottom-right circle */}
        <div
          style={{
            position: 'absolute',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #ffffff, #c8c8d0)',
            bottom: '28px',
            right: '32px',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
