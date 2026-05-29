import { TripInput } from "./types";

export const TRIP_PRESETS: { name: string; icon: string; data: TripInput }[] = [
  {
    name: "Pacific Interstate Reefer Run",
    icon: "🚛",
    data: {
      tripId: "TRP-9842",
      driverName: "Robert \"Bob\" Carter",
      vehicleType: "Semi-Truck (Class 8 Diesel Reefer)",
      cargoType: "Refrigerated Organic Strawberries & Berries",
      cargoWeight: "38,000 lbs",
      pickupLocation: "Port of Los Angeles, CA (Berth 93)",
      deliveryLocation: "Seattle Fulfillment Hub, WA (Terminal 5)",
      departureTime: "2026-06-01T06:00",
      estimatedDistance: "1,140 Miles",
      specialInstructions: "Maintain climate controls strictly at 34°F. Continuous temp logger must be active and active alarm checked every 4 hours. Record seal numbers on BOL at state scale inspections. Avoid Snoqualmie Pass route if high winds or early winter conditions prompt advisory.",
    },
  },
  {
    name: "Manhattan Last-Mile delivery",
    icon: "🔋",
    data: {
      tripId: "TRP-2015",
      driverName: "Marcus Vance",
      vehicleType: "Electric Box Truck (Class 6 City Delivery)",
      cargoType: "High-Value Consumer Electronics & Smart Devices",
      cargoWeight: "4,500 lbs",
      pickupLocation: "Brooklyn Distribution Depot, NY",
      deliveryLocation: "Manhattan Flagship Stores (Multistop), NY",
      departureTime: "2026-05-30T14:00",
      estimatedDistance: "12 Miles",
      specialInstructions: "Double-lock rear roll-up doors and engage load gate lock at every stop. Active GPS tracker must remain plugged in. Park strictly inside commercial curbside zones; do NOT park double or obstruct crosswalks. Collect digital proof of delivery (POD) countersigns.",
    },
  },
  {
    name: "Rockies Structural Steel Haul",
    icon: "🏗️",
    data: {
      tripId: "TRP-5531",
      driverName: "Sarah Jenkins",
      vehicleType: "Heavy-Duty Flatbed (Class 8 Triple-Axle)",
      cargoType: "Grade-A Structural Steel I-Beams (Wide Load)",
      cargoWeight: "44,000 lbs",
      pickupLocation: "Denver Industrial Steel Yard, CO",
      deliveryLocation: "Silverthorne Construction Site, CO (Access Road 14B)",
      departureTime: "2026-06-02T05:00",
      estimatedDistance: "72 Miles",
      specialInstructions: "Requires escort vehicle (pilot car) for oversize width. Re-tension all chain binders and synthetic winches after the hard climb up I-70. Final 3 miles is on unpaved gravel access roads; engage 4WD/differential lock and proceed at under 15 MPH. Note: Zero cellular signal at site. Use two-way radio channel 16 for gate.",
    },
  },
];

export const VEHICLE_OPTIONS = [
  "Semi-Truck (Class 8 Diesel Reefer)",
  "Heavy-Duty Flatbed (Class 8 Triple-Axle)",
  "Electric Box Truck (Class 6)",
  "Cargo Van (High-Roof Transit)",
  "Regular Box Truck",
  "Oversize Load Multi-Axle Hauler",
  "Tanker Truck (Hazmat Certified)"
];
