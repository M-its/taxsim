# TaxSim — API Contracts
## Complete endpoint specifications for all routes

---

## Conventions

- Base URL: `http://localhost:3333`
- All requests: `Content-Type: application/json`
- All responses: `Content-Type: application/json`
- Auth: `Authorization: Bearer <accessToken>` (except auth routes)
- Refresh token: HttpOnly cookie `refreshToken`
- Dates: ISO 8601 (`2026-05-26T14:00:00.000Z`)
- IDs: UUID v4 strings
- Monetary values: strings with 2 decimal places (`"1250.00"`)
- Tax rates: strings with 4 decimal places (`"0.0765"`)

---

## Error Response (all errors follow this shape)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Error codes

| Code | HTTP | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid payload |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Valid token, insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Unique constraint violation |
| `UNPROCESSABLE` | 422 | Business rule violation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 1. Auth

### POST /auth/register
Creates a company and its first user (OWNER role).

**Request:**
```json
{
  "company": {
    "name": "Acme Ltda",
    "document": "12345678000195",
    "taxRegime": "SIMPLES_NACIONAL"
  },
  "user": {
    "name": "João Silva",
    "email": "joao@acme.com",
    "password": "MinhaSenh@123"
  }
}
```

**Response 201:**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@acme.com",
    "role": "OWNER"
  },
  "company": {
    "id": "uuid",
    "name": "Acme Ltda",
    "document": "12345678000195",
    "taxRegime": "SIMPLES_NACIONAL"
  },
  "accessToken": "eyJ..."
}
```
Sets cookie: `refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800`

**Errors:**
- `409 CONFLICT` — document or email already registered

---

### POST /auth/login

**Request:**
```json
{
  "email": "joao@acme.com",
  "password": "MinhaSenh@123"
}
```

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@acme.com",
    "role": "OWNER",
    "companyId": "uuid"
  },
  "accessToken": "eyJ..."
}
```
Sets cookie: `refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/auth/refresh; Max-Age=604800`

**Errors:**
- `401 UNAUTHORIZED` — invalid credentials (never reveal which field is wrong)

---

### POST /auth/refresh
Rotates the refresh token. Old token is immediately invalidated.

**Request:** no body — reads `refreshToken` cookie automatically

**Response 200:**
```json
{
  "accessToken": "eyJ..."
}
```
Sets new cookie: `refreshToken=<newToken>; HttpOnly; ...`

**Errors:**
- `401 UNAUTHORIZED` — missing, expired or already rotated token

---

### POST /auth/logout
Invalidates all refresh tokens for the current user.

**Request:** no body — reads `refreshToken` cookie

**Response 204:** no body

Clears cookie: `refreshToken`

---

## 2. Products

All routes require `Authorization: Bearer <accessToken>`.
All queries are automatically scoped to the authenticated user's `companyId`.

### GET /products

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | — | Filter by name or SKU |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Notebook Dell",
      "sku": "NB-DELL-001",
      "ncmCode": "84713012",
      "unitPrice": "2500.00",
      "createdAt": "2026-05-26T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### POST /products

**Request:**
```json
{
  "name": "Notebook Dell",
  "sku": "NB-DELL-001",
  "ncmCode": "84713012",
  "unitPrice": "2500.00"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "Notebook Dell",
  "sku": "NB-DELL-001",
  "ncmCode": "84713012",
  "unitPrice": "2500.00",
  "createdAt": "2026-05-26T14:00:00.000Z"
}
```

**Errors:**
- `409 CONFLICT` — SKU already exists for this company
- `422 UNPROCESSABLE` — NCM code not found in tax_rules

---

### GET /products/:id

**Response 200:** same shape as single item above

**Errors:**
- `404 NOT_FOUND`

---

### PUT /products/:id

**Request:** same shape as POST (all fields required)

**Response 200:** updated product

---

### DELETE /products/:id

**Response 204:** no body

---

## 3. Clients

### GET /clients

**Query params:** `page`, `limit`, `search` (name or document)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Cliente Exemplo",
      "document": "12345678901",
      "email": "cliente@email.com",
      "createdAt": "2026-05-26T14:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 10, "totalPages": 1 }
}
```

---

### POST /clients

**Request:**
```json
{
  "name": "Cliente Exemplo",
  "document": "12345678901",
  "email": "cliente@email.com"
}
```

**Response 201:** created client

**Errors:**
- `409 CONFLICT` — document already exists for this company

---

### GET /clients/:id
**Response 200:** single client

### PUT /clients/:id
**Request/Response:** same shape as POST

### DELETE /clients/:id
**Response 204:** no body

---

## 4. Sales

### GET /sales

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | 1 | |
| `limit` | number | 20 | |
| `status` | string | — | `DRAFT`, `CONFIRMED`, `CANCELLED` |
| `from` | date | — | Filter by `createdAt` start |
| `to` | date | — | Filter by `createdAt` end |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "clientId": "uuid",
      "clientName": "Cliente Exemplo",
      "status": "CONFIRMED",
      "totalAmount": "3750.00",
      "currentModel": {
        "totalPis": "30.75",
        "totalCofins": "141.75",
        "totalIcms": "675.00",
        "totalIss": "0.00",
        "total": "847.50"
      },
      "reformModel": {
        "totalIbs": "262.50",
        "totalCbs": "101.25",
        "totalIs": "0.00",
        "total": "363.75"
      },
      "delta": {
        "absolute": "-483.75",
        "percentual": "-57.07"
      },
      "createdAt": "2026-05-26T14:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8, "totalPages": 1 }
}
```

---

### POST /sales
Creates a sale and triggers the tax engine (both models calculated synchronously).

**Request:**
```json
{
  "clientId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 1
    }
  ]
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "status": "DRAFT",
  "clientId": "uuid",
  "totalAmount": "2500.00",
  "currentModel": {
    "totalPis": "20.50",
    "totalCofins": "94.50",
    "totalIcms": "450.00",
    "totalIss": "0.00",
    "total": "565.00"
  },
  "reformModel": {
    "totalIbs": "175.00",
    "totalCbs": "67.50",
    "totalIs": "0.00",
    "total": "242.50"
  },
  "delta": {
    "absolute": "-322.50",
    "percentual": "-57.08"
  },
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "Notebook Dell",
      "quantity": 1,
      "unitPrice": "2500.00",
      "totalPrice": "2500.00",
      "ncmCode": "84713012",
      "snapshot": {
        "pisRate": "0.0082",
        "cofinsRate": "0.0378",
        "icmsRate": "0.1800",
        "issRate": "0.0000",
        "ibsRate": "0.0700",
        "cbsRate": "0.0270",
        "isRate": "0.0000"
      }
    }
  ],
  "createdAt": "2026-05-26T14:00:00.000Z"
}
```

**Errors:**
- `404 NOT_FOUND` — clientId or productId not found
- `422 UNPROCESSABLE` — no active tax rule for product NCM + company regime
- `422 UNPROCESSABLE` — tax calculator service unavailable

---

### GET /sales/:id
**Response 200:** same shape as POST response (full sale with items)

---

### PATCH /sales/:id/confirm
Confirms a DRAFT sale. Status becomes CONFIRMED and is immutable after this.

**Request:** no body

**Response 200:**
```json
{ "id": "uuid", "status": "CONFIRMED" }
```

**Errors:**
- `422 UNPROCESSABLE` — sale is not in DRAFT status

---

### PATCH /sales/:id/cancel

**Request:** no body

**Response 200:**
```json
{ "id": "uuid", "status": "CANCELLED" }
```

**Errors:**
- `422 UNPROCESSABLE` — sale is already CONFIRMED

---

## 5. Simulation (stateless — does not persist)

### POST /sales/simulate
Runs the tax engine without creating any record. Used for the dashboard simulator.

**Request:**
```json
{
  "taxRegime": "SIMPLES_NACIONAL",
  "items": [
    {
      "ncmCode": "84713012",
      "quantity": 2,
      "unitPrice": "2500.00"
    }
  ]
}
```

**Response 200:**
```json
{
  "totalAmount": "5000.00",
  "currentModel": {
    "totalPis": "41.00",
    "totalCofins": "189.00",
    "totalIcms": "900.00",
    "totalIss": "0.00",
    "total": "1130.00",
    "effectiveRate": "0.2260"
  },
  "reformModel": {
    "totalIbs": "350.00",
    "totalCbs": "135.00",
    "totalIs": "0.00",
    "total": "485.00",
    "effectiveRate": "0.0970"
  },
  "delta": {
    "absolute": "-645.00",
    "percentual": "-57.08"
  },
  "breakdown": [
    {
      "ncmCode": "84713012",
      "quantity": 2,
      "unitPrice": "2500.00",
      "totalPrice": "5000.00",
      "currentModel": {
        "pisRate": "0.0082",
        "cofinsRate": "0.0378",
        "icmsRate": "0.1800",
        "issRate": "0.0000",
        "totalTax": "1130.00"
      },
      "reformModel": {
        "ibsRate": "0.0700",
        "cbsRate": "0.0270",
        "isRate": "0.0000",
        "totalTax": "485.00"
      }
    }
  ]
}
```

**Errors:**
- `422 UNPROCESSABLE` — no active tax rule for NCM + regime combination
- `422 UNPROCESSABLE` — tax calculator service unavailable

---

## 6. Auth token flow summary

```
1. POST /auth/login
   → accessToken (body, 15min)
   → refreshToken (HttpOnly cookie, 7d)

2. Every request
   → Authorization: Bearer <accessToken>

3. accessToken expires (401)
   → POST /auth/refresh (cookie sent automatically)
   → new accessToken (body)
   → new refreshToken (cookie, old one invalidated)

4. POST /auth/logout
   → all refreshTokens for user deleted from DB
   → cookie cleared
```
