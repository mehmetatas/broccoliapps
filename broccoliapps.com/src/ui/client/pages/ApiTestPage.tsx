const defaultPayload = `{
  "name": "John Doe",
  "email": "john.doe+test@example.com",
  "phone": "+14155551234",
  "slug": "john-doe-profile",
  "bio": "Software developer with 10 years of experience.",
  "age": 32,
  "price": 99.99,
  "quantity": 5,
  "status": "active",
  "priority": "high",
  "startDate": "2026-01-15",
  "endDate": "2026-02-15",
  "address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "zipCode": "94102",
    "country": "US",
    "coordinates": {
      "lat": 37.7749,
      "lng": -122.4194
    }
  },
  "settings": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "preferences": {
      "theme": "dark",
      "language": "en"
    }
  },
  "tags": ["developer", "premium", "verified"],
  "items": [
    {
      "sku": "ITEM-001",
      "quantity": 2,
      "metadata": {
        "color": "blue",
        "size": "large"
      }
    },
    {
      "sku": "ITEM-002",
      "quantity": 1
    }
  ],
  "paymentMethod": {
    "type": "bank",
    "accountNumber": "1234"
  }
}`;

const clientScript = `
document.getElementById('submitBtn').addEventListener('click', async function() {
  const textarea = document.getElementById('payload');
  const resultDiv = document.getElementById('result');
  const button = this;

  try {
    button.disabled = true;
    button.textContent = 'Sending...';
    resultDiv.textContent = '';

    const payload = JSON.parse(textarea.value);

    const response = await fetch('/api/validation-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      resultDiv.style.color = '#22c55e';
      resultDiv.textContent = 'Success:\\n' + JSON.stringify(data, null, 2);
    } else {
      resultDiv.style.color = '#ef4444';
      resultDiv.textContent = 'Error ' + response.status + ':\\n' + JSON.stringify(data, null, 2);
    }
  } catch (err) {
    resultDiv.style.color = '#ef4444';
    resultDiv.textContent = 'Error: ' + err.message;
  } finally {
    button.disabled = false;
    button.textContent = 'Send Request';
  }
});
`;

export const ApiTestPage = () => {
  return (
    <html>
      <head>
        <title>API Test - Validation Test</title>
        <style>{`
          body {
            font-family: system-ui, -apple-system, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 2rem;
            background: #1a1a2e;
            color: #eee;
          }
          h1 { color: #4ade80; margin-bottom: 1rem; }
          textarea {
            width: 100%;
            height: 500px;
            font-family: monospace;
            font-size: 14px;
            padding: 1rem;
            border: 1px solid #333;
            border-radius: 8px;
            background: #0f0f1a;
            color: #eee;
            resize: vertical;
          }
          button {
            margin-top: 1rem;
            padding: 0.75rem 2rem;
            font-size: 16px;
            background: #4ade80;
            color: #000;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }
          button:hover { background: #22c55e; }
          button:disabled { background: #666; cursor: not-allowed; }
          #result {
            margin-top: 1rem;
            padding: 1rem;
            background: #0f0f1a;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            white-space: pre-wrap;
            word-break: break-all;
            min-height: 100px;
          }
          a { color: #4ade80; }
        `}</style>
      </head>
      <body>
        <h1>API Validation Test</h1>
        <p>
          <a href="/">Home</a> | POST /api/validation-test
        </p>
        <textarea id="payload" defaultValue={defaultPayload} />
        <br />
        <button id="submitBtn">Send Request</button>
        <div id="result"></div>
        <script dangerouslySetInnerHTML={{ __html: clientScript }} />
      </body>
    </html>
  );
};
