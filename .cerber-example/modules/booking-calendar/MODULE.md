# Module: booking-calendar

**Owner:** Stefan Pitek  
**Status:** Active  
**Last Updated:** 2026-01-02

## Purpose

Manages room availability, bookings, and calendar operations. Ensures no double-bookings and provides real-time availability information.

## Responsibilities

- Track room availability by date
- Create and manage bookings
- Prevent double-bookings (conflict detection)
- Calculate available rooms for date ranges
- Handle booking cancellations and modifications
- Generate availability calendars

## Public Interface

Functions/classes that other modules can use:

### `checkAvailability(params: AvailabilityParams): AvailabilityResult`

Checks if rooms are available for the specified dates.

**Parameters:**
- `roomType` (string) - Type of room to check
- `checkIn` (Date) - Check-in date
- `checkOut` (Date) - Check-out date
- `quantity` (number) - Number of rooms needed

**Returns:**
- `available` (boolean) - Whether rooms are available
- `availableCount` (number) - How many rooms available
- `conflictingBookings` (string[]) - IDs of conflicting bookings (if any)

**Example:**
```typescript
import { checkAvailability } from './modules/booking-calendar';

const result = checkAvailability({
  roomType: 'deluxe',
  checkIn: new Date('2026-07-15'),
  checkOut: new Date('2026-07-20'),
  quantity: 2
});

if (result.available) {
  console.log(`${result.availableCount} rooms available`);
} else {
  console.log('Rooms not available for these dates');
}
```

### `createBooking(params: BookingParams): BookingResult`

Creates a new booking reservation.

**Parameters:**
- `roomId` (string) - ID of the room to book
- `checkIn` (Date) - Check-in date
- `checkOut` (Date) - Check-out date
- `guestInfo` (GuestInfo) - Guest details
- `totalPrice` (number) - Total booking price

**Returns:**
- `bookingId` (string) - Unique booking identifier
- `confirmationCode` (string) - Human-readable confirmation code
- `status` (string) - Booking status ('confirmed', 'pending', 'cancelled')

**Example:**
```typescript
const booking = createBooking({
  roomId: 'room-101',
  checkIn: new Date('2026-07-15'),
  checkOut: new Date('2026-07-20'),
  guestInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  },
  totalPrice: 850.00
});

console.log(`Booking confirmed: ${booking.confirmationCode}`);
```

### `cancelBooking(bookingId: string): CancellationResult`

Cancels an existing booking.

**Parameters:**
- `bookingId` (string) - ID of booking to cancel

**Returns:**
- `success` (boolean) - Whether cancellation succeeded
- `refundAmount` (number) - Amount to be refunded
- `cancellationFee` (number) - Fee charged for cancellation

### `getBooking(bookingId: string): Booking`

Retrieves booking details.

**Parameters:**
- `bookingId` (string) - Booking ID or confirmation code

**Returns:**
- Complete booking object with all details

### `modifyBooking(bookingId: string, changes: BookingChanges): BookingResult`

Modifies an existing booking (dates, room type, etc.).

**Parameters:**
- `bookingId` (string) - Booking to modify
- `changes` (BookingChanges) - Fields to update

**Returns:**
- Updated booking with new confirmation code

## Dependencies

Modules this module uses:
- `pricing-engine` - To recalculate prices when modifying bookings
- `database` - To persist bookings and check availability

## File Structure

```
src/modules/booking-calendar/
├── index.ts              - Public interface
├── availability.ts       - Availability checking logic
├── booking-manager.ts    - Create/modify/cancel bookings
├── conflict-detector.ts  - Double-booking prevention
├── types.ts              - Type definitions
└── validators.ts         - Input validation
```

## Testing

How to test this module:

```bash
npm test -- booking-calendar

# Or specific test suites
npm test -- booking-calendar.availability
npm test -- booking-calendar.conflicts
npm test -- booking-calendar.bookings
```

Test coverage: 98%

## Performance

- Availability check: 10-20ms (with database query)
- Create booking: 50-100ms (includes conflict check + database write)
- Conflict detection: < 5ms (optimized query with indexes)

## Database Schema

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  room_id VARCHAR(50) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(50),
  total_price DECIMAL(10,2),
  status VARCHAR(20),
  confirmation_code VARCHAR(10) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookings_dates ON bookings(room_id, check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);
```

## Conflict Detection Rules

- Check-in date must be before check-out date
- Cannot book if ANY overlap exists with confirmed bookings
- Overlap includes:
  - Booking A starts before Booking B ends
  - Booking B starts before Booking A ends
- Cancelled bookings are ignored in conflict detection
- Pending bookings held for 15 minutes before release

## Breaking Changes

### v2.0.0 (2026-01-02)
- `createBooking` now requires `totalPrice` parameter
- Changed `status` enum values ('active' → 'confirmed')
- Removed deprecated `bookRoom()` function

### v1.8.0 (2025-11-15)
- Added `modifyBooking()` function
- Changed return type of `checkAvailability` to include count

## Notes

- All dates are stored in UTC, converted to local time for display
- Confirmation codes are 10-character alphanumeric (e.g., "XY9K4P2M1Q")
- Bookings automatically cancelled if not paid within 24 hours
- Same-day bookings require phone confirmation
- Check-in time: 3:00 PM, Check-out time: 11:00 AM

## Integration Notes

- Pricing engine calls `checkAvailability` before calculating prices
- Payment gateway triggers `createBooking` after payment success
- Email service notified on booking creation/cancellation
- Housekeeping service receives next-day check-in list

## Future Plans

- [ ] Add waitlist functionality for fully booked dates
- [ ] Implement automatic overbooking prevention with buffer
- [ ] Add recurring booking support (e.g., weekly stays)
- [ ] Integration with external booking platforms (Booking.com, Airbnb)
