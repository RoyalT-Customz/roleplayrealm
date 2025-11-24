# API Examples

This document provides example API requests for Roleplay Realm.

## Authentication

All authenticated endpoints require a valid Supabase session cookie. The session is automatically managed by the Supabase auth helpers.

## Posts API

### Get Posts

```bash
curl -X GET "http://localhost:3000/api/posts?page=1&limit=20&tags=fivem,roleplay"
```

### Create Post

```bash
curl -X POST "http://localhost:3000/api/posts" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "content": "Check out this amazing RP clip!",
    "tags": ["fivem", "roleplay", "clip"],
    "media": [
      {
        "type": "image",
        "url": "https://example.com/image.jpg"
      }
    ]
  }'
```

### Like Post

```bash
curl -X POST "http://localhost:3000/api/posts/{postId}/like" \
  -H "Cookie: sb-access-token=..."
```

### Create Comment

```bash
curl -X POST "http://localhost:3000/api/posts/{postId}/comments" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "content": "Great post!"
  }'
```

## Servers API

### Get Servers

```bash
curl -X GET "http://localhost:3000/api/servers?page=1&limit=20&featured=true"
```

### Create Server Listing

```bash
curl -X POST "http://localhost:3000/api/servers" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "name": "Los Santos Roleplay",
    "ip": "192.168.1.100:30120",
    "description": "Best FiveM RP server",
    "tags": ["roleplay", "economy"],
    "features": ["Custom Scripts", "Active Staff"]
  }'
```

## Marketplace API

### Get Marketplace Listings

```bash
curl -X GET "http://localhost:3000/api/marketplace?category=script&page=1"
```

### Create Marketplace Listing

```bash
curl -X POST "http://localhost:3000/api/marketplace" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "title": "Advanced Banking System",
    "description": "Full-featured banking script",
    "category": "script",
    "price": null,
    "tags": ["fivem", "script", "banking"]
  }'
```

## Events API

### Get Events

```bash
curl -X GET "http://localhost:3000/api/events?upcoming=true"
```

### Create Event

```bash
curl -X POST "http://localhost:3000/api/events" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "title": "Weekly Car Meet",
    "description": "Join us for our weekly car meet!",
    "startAt": "2024-01-15T18:00:00Z",
    "endAt": "2024-01-15T20:00:00Z",
    "location": "Server: Los Santos RP",
    "capacity": 50
  }'
```

## Search API

### Search All

```bash
curl -X GET "http://localhost:3000/api/search?q=roleplay&type=all"
```

### Search Posts Only

```bash
curl -X GET "http://localhost:3000/api/search?q=roleplay&type=posts"
```

### Search with Tags

```bash
curl -X GET "http://localhost:3000/api/search?tags=fivem,roleplay&type=all"
```

## Upload API

### Get Upload URL

```bash
curl -X POST "http://localhost:3000/api/upload-url" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "fileName": "image.jpg",
    "fileType": "image/jpeg",
    "fileSize": 1024000
  }'
```

Response:
```json
{
  "path": "images/1234567890-image.jpg",
  "bucket": "uploads"
}
```

Then upload directly to Supabase Storage using the returned path.

## Admin API

### Feature/Unfeature Server

```bash
curl -X POST "http://localhost:3000/api/admin/feature" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "serverId": "server-id-here",
    "featured": true
  }'
```

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Roleplay Realm API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Posts",
      "item": [
        {
          "name": "Get Posts",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/posts?page=1&limit=20",
              "host": ["{{baseUrl}}"],
              "path": ["api", "posts"],
              "query": [
                {"key": "page", "value": "1"},
                {"key": "limit", "value": "20"}
              ]
            }
          }
        },
        {
          "name": "Create Post",
          "request": {
            "method": "POST",
            "header": [
              {"key": "Content-Type", "value": "application/json"}
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"content\": \"Test post\",\n  \"tags\": [\"fivem\"]\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/posts",
              "host": ["{{baseUrl}}"],
              "path": ["api", "posts"]
            }
          }
        }
      ]
    },
    {
      "name": "Servers",
      "item": [
        {
          "name": "Get Servers",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/servers",
              "host": ["{{baseUrl}}"],
              "path": ["api", "servers"]
            }
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

## Environment Variables for Postman

Create a Postman environment with:
- `baseUrl`: `http://localhost:3000` (or your production URL)
- `accessToken`: Your Supabase access token (if needed for direct API calls)

Note: In the browser, authentication is handled automatically via cookies. For direct API testing, you may need to include the access token in headers.

