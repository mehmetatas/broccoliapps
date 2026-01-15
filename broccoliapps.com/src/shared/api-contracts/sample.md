
Complex validation test API

```
export const createValidationTest = api("POST", "/validation-test")
  .withRequest({
    // String validations
    name: v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(50)),
    email: v.pipe(v.string(), v.email()),
    phone: v.pipe(v.string(), v.regex(/^\+?[1-9]\d{1,14}$/)),
    slug: v.pipe(v.string(), v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
    bio: v.optional(v.pipe(v.string(), v.maxLength(500))),
    // Number validations
    age: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(150)),
    price: v.pipe(v.number(), v.minValue(0)),
    quantity: v.pipe(v.number(), v.integer(), v.minValue(1)),
    // Enum validations
    status: v.picklist(["draft", "active", "archived"]),
    priority: v.picklist(["low", "medium", "high"]),
    // Date validations
    startDate: v.pipe(v.string(), v.isoDate()),
    endDate: v.optional(v.pipe(v.string(), v.isoDate())),
    // Nested objects
    address: v.object({
      street: v.pipe(v.string(), v.minLength(1)),
      city: v.pipe(v.string(), v.minLength(1)),
      zipCode: v.pipe(v.string(), v.minLength(1)),
      country: v.pipe(v.string(), v.length(2)),
      coordinates: v.optional(
        v.object({
          lat: v.pipe(v.number(), v.minValue(-90), v.maxValue(90)),
          lng: v.pipe(v.number(), v.minValue(-180), v.maxValue(180)),
        })
      ),
    }),
    settings: v.object({
      notifications: v.object({
        email: v.boolean(),
        push: v.boolean(),
        sms: v.boolean(),
      }),
      preferences: v.object({
        theme: v.picklist(["light", "dark", "system"]),
        language: v.pipe(v.string(), v.length(2)),
      }),
    }),
    // Array validations
    tags: v.pipe(v.array(v.pipe(v.string(), v.minLength(1))), v.minLength(1), v.maxLength(10)),
    items: v.pipe(
      v.array(
        v.object({
          sku: v.pipe(v.string(), v.minLength(1)),
          quantity: v.pipe(v.number(), v.integer(), v.minValue(1)),
          metadata: v.optional(
            v.object({
              color: v.optional(v.string()),
              size: v.optional(v.string()),
            })
          ),
        })
      ),
      v.minLength(1)
    ),
    // Union type (discriminated)
    paymentMethod: v.variant("type", [
      v.object({
        type: v.literal("card"),
        last4: v.pipe(v.string(), v.length(4), v.regex(/^\d{4}$/)),
      }),
      v.object({
        type: v.literal("bank"),
        accountNumber: v.pipe(v.string(), v.minLength(1)),
      }),
    ]),
  })
  .withResponse<{
    received: Record<string, unknown>;
    validatedAt: string;
  }>();
```