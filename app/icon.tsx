import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

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
          background: '#0C1220',
          borderRadius: '6px',
        }}
      >
        {/* Top-left circle */}
        <div
          style={{
            position: 'absolute',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #ffffff, #c8c8d0)',
            top: '5px',
            left: '6px',
          }}
        />
        {/* Bottom-right circle */}
        <div
          style={{
            position: 'absolute',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #ffffff, #c8c8d0)',
            bottom: '5px',
            right: '6px',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
