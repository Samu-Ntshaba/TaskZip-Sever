# TaskZip Runner API

Base URL: `http://localhost:4000/api/v1`

All runner endpoints require:
```
Authorization: Bearer <accessToken>
```

## Runner Profile
### Create runner profile
**POST** `/runner/profile`

Request body:
```json
{
  "photoPath": "avatars/uuid/runner-photo.png",
  "bio": "Fast and friendly runner",
  "status": "AVAILABLE",
  "phone": "+123456789"
}
```

Response:
```json
{
  "runnerProfile": {
    "id": "uuid",
    "userId": "uuid",
    "photoPath": "avatars/uuid/runner-photo.png",
    "bio": "Fast and friendly runner",
    "status": "AVAILABLE",
    "totalJobsCompleted": 0,
    "avgRating": 0,
    "reviewCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "phone": "+123456789",
    "isListable": true
  }
}
```

### Get runner profile
**GET** `/runner/profile`

Response: same shape as create.

### Update runner profile
**PATCH** `/runner/profile`

Request body:
```json
{
  "bio": "Updated runner bio",
  "photoPath": "avatars/uuid/new-photo.png",
  "status": "OFFLINE",
  "phone": "+123456789"
}
```

Response: same shape as create.

## Locations
### List service locations
**GET** `/locations`

Response:
```json
{
  "locations": [
    {
      "id": "uuid",
      "name": "Downtown Service Center",
      "address": "123 Main St, City Center",
      "latitude": -26.2041,
      "longitude": 28.0473,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Runner Availability
### Create availability slot
**POST** `/runner/availability`

Request body:
```json
{
  "locationId": "uuid",
  "dayOfWeek": 2,
  "startTime": "09:00",
  "endTime": "12:00"
}
```

Response:
```json
{
  "slot": {
    "id": "uuid",
    "runnerId": "uuid",
    "locationId": "uuid",
    "dayOfWeek": 2,
    "startTime": "09:00",
    "endTime": "12:00",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "location": {
      "id": "uuid",
      "name": "Downtown Service Center",
      "address": "123 Main St, City Center",
      "latitude": -26.2041,
      "longitude": 28.0473,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### List availability slots
**GET** `/runner/availability`

### Update availability slot
**PATCH** `/runner/availability/:id`

### Delete availability slot
**DELETE** `/runner/availability/:id`

## Runner Requests
### List runner requests
**GET** `/runner/requests?status=CREATED`

Response:
```json
{
  "requests": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "runnerId": "uuid",
      "locationId": "uuid",
      "date": "2024-01-01",
      "timeWindowStart": "10:00",
      "timeWindowEnd": "11:00",
      "instructions": "Please hurry",
      "priceCents": 2500,
      "status": "CREATED",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "location": {
        "id": "uuid",
        "name": "Downtown Service Center",
        "address": "123 Main St, City Center",
        "latitude": -26.2041,
        "longitude": 28.0473,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "updates": [],
      "customer": {
        "id": "uuid",
        "email": "customer@example.com",
        "profile": {
          "id": "uuid",
          "userId": "uuid",
          "fullName": "Customer Name",
          "avatarPath": null,
          "phone": "+123456789",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      }
    }
  ]
}
```

### Accept request
**POST** `/runner/requests/:id/accept`

### Reject request
**POST** `/runner/requests/:id/reject`

### Start request (runner joins queue)
**POST** `/runner/requests/:id/start`

### Mark request ready
**POST** `/runner/requests/:id/ready`

### Complete request
**POST** `/runner/requests/:id/complete`

### Add queue update
**POST** `/runner/requests/:id/update`

Request body:
```json
{
  "myNumber": 12,
  "currentlyServing": 9,
  "etaMinutes": 15,
  "note": "Queue moving fast",
  "updateType": "ETA"
}
```

## Runner Reviews & Stats
### List runner reviews
**GET** `/runner/reviews`

### Runner stats
**GET** `/runner/stats`

Response:
```json
{
  "stats": {
    "totalJobsCompleted": 12,
    "avgRating": 4.7,
    "reviewCount": 8,
    "status": "AVAILABLE"
  }
}
```

## Errors
All errors return:
```json
{
  "message": "Human-readable message"
}
```
