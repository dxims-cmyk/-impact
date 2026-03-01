import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = ':Impact — Stop Losing the Leads You Paid For'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0B1220 0%, #1a2840 100%)',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: '#E8642C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 800,
            }}
          >
            :I
          </div>
          <span
            style={{
              fontSize: '32px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            <span style={{ color: '#E8642C' }}>:</span>Impact
          </span>
        </div>

        <h1
          style={{
            fontSize: '64px',
            fontWeight: 800,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            margin: '0 0 24px 0',
            letterSpacing: '-2px',
          }}
        >
          Stop Losing the Leads
          <br />
          <span style={{ color: '#E8642C' }}>You Paid For</span>
        </h1>

        <p
          style={{
            fontSize: '24px',
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            margin: 0,
            maxWidth: '700px',
          }}
        >
          WhatsApp alerts in 5 seconds. AI lead scoring. One inbox for everything.
        </p>

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '16px',
          }}
        >
          driveimpact.io — A product by AM:PM Media
        </div>
      </div>
    ),
    { ...size }
  )
}
