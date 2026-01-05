import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Get Page Access Token - Guide</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #1e40af; }
        h2 { color: #3b82f6; margin-top: 2rem; }
        code {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-size: 0.9em;
        }
        pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
        }
        ol { padding-left: 1.5rem; }
        li { margin-bottom: 0.75rem; line-height: 1.6; }
        .step {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 4px;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 4px;
        }
        .success {
          background: #d1fae5;
          border-left: 4px solid #10b981;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔑 Get Page Access Token - Quick Guide</h1>

        <div class="warning">
          <strong>⚠️ IMPORTANT:</strong> You must be the ADMIN of the Facebook page to get its access token.
        </div>

        <h2>Step 1: Go to Graph API Explorer</h2>
        <div class="step">
          Open: <a href="https://developers.facebook.com/tools/explorer/" target="_blank">https://developers.facebook.com/tools/explorer/</a>
        </div>

        <h2>Step 2: Select Your App</h2>
        <div class="step">
          In the top-right dropdown, select <strong>"Lume Audience Builder"</strong>
        </div>

        <h2>Step 3: Generate a User Token</h2>
        <div class="step">
          <ol>
            <li>In the "User Token" field, click <strong>"Get Token" → "Get User Access Token"</strong></li>
            <li>Select ONLY: <code>public_profile</code></li>
            <li>Click <strong>"Generate Access Token"</strong></li>
          </ol>
        </div>

        <h2>Step 4: Query Your Pages</h2>
        <div class="step">
          In the "Query" box (at the bottom), replace everything with:
          <pre>me/accounts</pre>
          Then click <strong>"Submit"</strong>
        </div>

        <h2>Step 5: Find Your Page Token</h2>
        <div class="step">
          You'll see a JSON response with all your pages. Find "Lume Test Page" and copy the <code>access_token</code> value next to it.

          <pre>
{
  "data": [
    {
      "id": "61585911607378",
      "name": "Lume Test Page",
      "access_token": "EAAxxxxxxxxxxxxxxxxxxxxx",  ← COPY THIS!
      ...
    }
  ]
}
          </pre>
        </div>

        <h2>Step 6: Verify the Token</h2>
        <div class="step">
          Open this URL in your browser (replace TOKEN with the token you copied):
          <pre>
https://graph.facebook.com/v24.0/debug_token?input_token=TOKEN&access_token=TOKEN
          </pre>
          You should see <code>"is_valid": true</code> and <code>"type": "PAGE"</code>
        </div>

        <div class="success">
          <strong>✅ Once you have the Page Access Token:</strong>
          <ol>
            <li>Copy it</li>
            <li>Update the <code>META_ACCESS_TOKEN</code> in your <code>.env.local</code> file</li>
            <li>Restart your dev server</li>
            <li>Test with your page URL: <code>https://www.facebook.com/profile.php?id=61585911607378</code></li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
