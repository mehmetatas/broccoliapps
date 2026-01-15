import { ApiError } from "@broccoliapps/shared";
import { useState } from "preact/hooks";
import { createValidationTest } from "../../../shared/api-contracts";

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

export const ApiTestPage = () => {
  const [payload, setPayload] = useState(defaultPayload);
  const [result, setResult] = useState<{ success: boolean; data: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const parsedPayload = JSON.parse(payload);
      const response = await createValidationTest.invoke(parsedPayload);
      setResult({ success: true, data: JSON.stringify(response, null, 2) });
    } catch (err) {
      if (err instanceof ApiError) {
        setResult({ success: false, data: `Error ${err.status} (${err.code}):\n${err.message}` });
      } else {
        setResult({ success: false, data: `Error: ${(err as Error).message}` });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="api-test">
      <h1>API Validation Test</h1>
      <p>POST /api/validation-test</p>
      <textarea value={payload} onInput={(e) => setPayload((e.target as HTMLTextAreaElement).value)} />
      <br />
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Sending..." : "Send Request"}
      </button>
      {result && (
        <pre style={{ color: result.success ? "#22c55e" : "#ef4444" }}>
          {result.success ? "Success:\n" : ""}
          {result.data}
        </pre>
      )}
    </div>
  );
};
