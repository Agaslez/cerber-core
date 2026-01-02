# Module: pricing-engine

**Owner:** Stefan Pitek  
**Status:** Active  
**Last Updated:** 2026-01-02

## Purpose

Calculates dynamic room pricing based on date, occupancy, season, and other factors. Provides pricing intelligence for the booking system.

## Responsibilities

- Calculate base room price
- Apply seasonal multipliers (high/low season)
- Apply day-of-week adjustments (weekend premiums)
- Calculate advance booking discounts
- Apply length-of-stay discounts
- Provide price breakdowns and explanations

## Public Interface

Functions/classes that other modules can use:

### `calculatePrice(params: PriceParams): PriceResult`

Calculates the total price for a room booking.

**Parameters:**
- `roomType` (string) - Type of room (e.g., 'standard', 'deluxe', 'suite')
- `checkIn` (Date) - Check-in date
- `checkOut` (Date) - Check-out date
- `guests` (number) - Number of guests
- `promoCode` (string, optional) - Promotional code for discounts

**Returns:**
- `totalPrice` (number) - Final calculated price
- `basePrice` (number) - Base room price
- `breakdown` (object) - Detailed price breakdown
  - `nightlyRates` (number[]) - Price per night
  - `seasonalAdjustment` (number) - Seasonal multiplier applied
  - `weekendPremium` (number) - Weekend surcharge
  - `advanceBookingDiscount` (number) - Discount for booking in advance
  - `lengthOfStayDiscount` (number) - Discount for extended stays
  - `promoDiscount` (number) - Promotional code discount

**Example:**
```typescript
import { calculatePrice } from './modules/pricing-engine';

const result = calculatePrice({
  roomType: 'deluxe',
  checkIn: new Date('2026-07-15'),
  checkOut: new Date('2026-07-20'),
  guests: 2,
  promoCode: 'SUMMER20'
});

console.log(result.totalPrice); // 850.00
console.log(result.breakdown); // { nightlyRates: [180, 180, ...], ... }
```

### `getSeasonalMultiplier(date: Date): number`

Returns the seasonal pricing multiplier for a given date.

**Parameters:**
- `date` (Date) - Date to check

**Returns:**
- Multiplier (number) - 1.0 = normal, 1.5 = high season, 0.8 = low season

**Example:**
```typescript
const multiplier = getSeasonalMultiplier(new Date('2026-12-25'));
console.log(multiplier); // 1.5 (Christmas is high season)
```

### `validatePromoCode(code: string): PromoCodeResult`

Validates a promotional code and returns discount information.

**Parameters:**
- `code` (string) - Promo code to validate

**Returns:**
- `valid` (boolean) - Whether code is valid
- `discount` (number) - Discount percentage (0-100)
- `minNights` (number) - Minimum nights required
- `expiryDate` (Date) - When code expires

## Dependencies

Modules this module uses:
- `booking-calendar` - To check availability during pricing calculation
- `database` - To fetch base room prices and seasonal rules

## File Structure

```
src/modules/pricing-engine/
├── index.ts              - Public interface (exports calculatePrice, etc.)
├── calculator.ts         - Core pricing logic
├── seasonal.ts           - Seasonal multiplier logic
├── discounts.ts          - Discount calculations
├── types.ts              - TypeScript type definitions
└── constants.ts          - Pricing constants and rules
```

## Testing

How to test this module:

```bash
npm test -- pricing-engine

# Or specific test suites
npm test -- pricing-engine.calculator
npm test -- pricing-engine.seasonal
npm test -- pricing-engine.discounts
```

Test coverage: 95%

## Performance

- Average calculation time: 5-10ms
- Caching: Seasonal multipliers cached for 24h
- Database queries: 1-2 per calculation (base price + seasonal rules)

## Configuration

Pricing rules configured in:
- `config/pricing-rules.json` - Seasonal dates and multipliers
- Database table `pricing_rules` - Dynamic rules
- Environment variable `WEEKEND_PREMIUM` - Default 1.2 (20% premium)

## Breaking Changes

### v2.0.0 (2026-01-02)
- Changed `calculatePrice` return type to include `breakdown`
- Removed deprecated `getPrice()` function
- `promoCode` parameter now optional (was required)

### v1.5.0 (2025-12-01)
- Added `lengthOfStayDiscount` to breakdown

## Notes

- Pricing engine does NOT handle payment processing (see payment-gateway module)
- All prices in USD, conversion happens at payment layer
- Seasonal rules can be overridden by database entries
- Price calculations are deterministic - same inputs = same output
- Consider caching results for identical requests within 1 hour

## Future Plans

- [ ] Add AI-powered dynamic pricing based on demand
- [ ] Implement competitor price monitoring
- [ ] Add group booking discounts
- [ ] Support multiple currencies natively
