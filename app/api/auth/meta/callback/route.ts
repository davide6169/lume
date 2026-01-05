import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const accessToken = searchParams.get('access_token')
  const error = searchParams.get('error')
  const errorReason = searchParams.get('error_reason')

  // Se c'è un errore, mostralo
  if (error) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Error</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 500px;
            text-align: center;
          }
          h1 { color: #dc2626; margin-bottom: 1rem; }
          p { color: #666; margin-bottom: 1.5rem; }
          code {
            display: block;
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            font-size: 0.875rem;
            text-align: left;
            margin-bottom: 1rem;
          }
          button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Authentication Error</h1>
          <p>There was an error during authentication:</p>
          <code>
            <strong>Error:</strong> ${error}<br>
            <strong>Reason:</strong> ${errorReason || 'Unknown'}
          </code>
          <button onclick="window.close()">Close Window</button>
        </div>
      </body>
      </html>
    `, {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    })
  }

  // Se non c'è il token, mostra errore
  if (!accessToken) {
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>No Token Found</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 600px;
            text-align: center;
          }
          h1 { color: #dc2626; margin-bottom: 1rem; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ No Access Token Found</h1>
          <p>No access token was found in the redirect URL.</p>
        </div>
      </body>
      </html>
    `, {
      status: 400,
      headers: { 'Content-Type': 'text/html' }
    })
  }

  // Token trovato! Mostra un'interfaccia per copiarlo
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Successful</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          max-width: 700px;
        }
        h1 { color: #22c55e; margin-bottom: 1rem; }
        p { color: #666; margin-bottom: 1.5rem; }
        .token-box {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          font-size: 0.75rem;
          word-break: break-all;
          line-height: 1.6;
          margin-bottom: 1rem;
          border: 2px solid #e5e7eb;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        button {
          flex: 1;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover { background: #2563eb; }
        button.secondary {
          background: #6b7280;
        }
        button.secondary:hover { background: #4b5563; }
        .instructions {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 1rem;
          margin-top: 1.5rem;
          border-radius: 4px;
        }
        .instructions h3 {
          margin-top: 0;
          color: #1e40af;
        }
        .instructions ol {
          margin: 0;
          padding-left: 1.5rem;
        }
        .instructions li {
          margin-bottom: 0.5rem;
          color: #1e3a8f;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>✅ Authentication Successful!</h1>
        <p>Your Meta access token has been generated successfully.</p>

        <div class="token-box" id="token">${accessToken}</div>

        <div class="button-group">
          <button onclick="copyToken()">📋 Copy Token</button>
          <button class="secondary" onclick="window.close()">✕ Close</button>
        </div>

        <div id="copyMessage" style="display: none; color: #22c55e; font-weight: bold; margin-bottom: 1rem;">
          ✓ Token copied to clipboard!
        </div>

        <div class="instructions">
          <h3>📝 Next Steps:</h3>
          <ol>
            <li>Click "Copy Token" to copy your access token</li>
            <li>Open the file <code>.env.local</code> in your project</li>
            <li>Replace the value of <code>META_ACCESS_TOKEN</code> with the copied token</li>
            <li>Save the file and restart your dev server</li>
          </ol>
        </div>
      </div>

      <script>
        function copyToken() {
          const tokenElement = document.getElementById('token');
          const token = tokenElement.innerText.trim();

          navigator.clipboard.writeText(token).then(() => {
            const message = document.getElementById('copyMessage');
            message.style.display = 'block';
            setTimeout(() => {
              message.style.display = 'none';
            }, 3000);
          }).catch(err => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = token;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            const message = document.getElementById('copyMessage');
            message.style.display = 'block';
            setTimeout(() => {
              message.style.display = 'none';
            }, 3000);
          });
        }
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  })
}
