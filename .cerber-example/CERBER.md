# PROJECT CERBER - Master Map

**Project:** Hotel Booking System Example  
**Owner:** Stefan Pitek  
**Last Updated:** 2026-01-02

## Architecture Overview

```
┌─────────────────────────────────────────┐
│      Frontend (React/Next.js)           │
│      - Booking UI                       │
│      - Price Calculator                 │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         API Layer (Express)             │
│         /api/bookings                   │
│         /api/pricing                    │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼─────────┐
        ▼                   ▼
  pricing-engine    booking-calendar
        │                   │
        └─────────┬─────────┘
                  ▼
          PostgreSQL Database
```

## Modules Index

### Core Modules

1. **pricing-engine** - Dynamic pricing calculation
   - Owner: Stefan Pitek
   - Status: Active
   - Files: `src/modules/pricing-engine/`
   - Purpose: Calculate room prices based on date, occupancy, season

2. **booking-calendar** - Room availability and reservations
   - Owner: Stefan Pitek
   - Status: Active
   - Files: `src/modules/booking-calendar/`
   - Purpose: Manage room bookings and availability

## Connections Map

- `pricing-engine` → `booking-calendar`: checkAvailability()
- `booking-calendar` → `pricing-engine`: calculatePrice()

## Team Responsibilities

- **Stefan Pitek**: pricing-engine, booking-calendar
- **Backend Team**: API layer, database schema
- **Frontend Team**: Booking UI, integration

## Module Dependencies

```
booking-calendar
    ↓
pricing-engine
    ↓
database
```

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Prisma ORM
- **Testing**: Jest, Supertest
- **Validation**: Cerber TEAM module system

## Development Workflow

1. **Focus Mode**: `bash team/scripts/cerber-focus.sh pricing-engine`
2. **Validate**: `bash team/scripts/cerber-module-check.sh pricing-engine`
3. **Check Connections**: `bash team/scripts/cerber-connections-check.sh`
4. **Commit**: Guardian validates architecture
5. **Deploy**: Cerber 2.1 validates health

## API Endpoints

### Pricing
- `GET /api/pricing/calculate` - Calculate room price
  - Query: `roomType`, `checkIn`, `checkOut`, `guests`
  - Returns: `{ price: number, breakdown: {...} }`

### Booking
- `POST /api/bookings` - Create reservation
  - Body: `{ roomId, checkIn, checkOut, guestInfo }`
  - Returns: `{ bookingId, confirmationCode }`

- `GET /api/bookings/:id` - Get booking details
- `DELETE /api/bookings/:id` - Cancel booking

## Database Schema

```sql
-- Rooms
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) UNIQUE,
  room_type VARCHAR(50),
  base_price DECIMAL(10,2)
);

-- Bookings
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id),
  check_in DATE,
  check_out DATE,
  guest_name VARCHAR(255),
  total_price DECIMAL(10,2),
  status VARCHAR(20)
);
```

## Notes

- Pricing engine uses dynamic pricing algorithm based on:
  - Seasonal multipliers (high/low season)
  - Day of week (weekends +20%)
  - Advance booking discount
  - Length of stay discount

- Booking calendar ensures no double-bookings
- All changes validated by Guardian pre-commit
- Production health monitored by Cerber 2.1
