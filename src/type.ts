export interface TripInput {
  tripId: string;
  driverName: string;
  vehicleType: string;
  cargoType: string;
  cargoWeight: string;
  pickupLocation: string;
  deliveryLocation: string;
  departureTime: string;
  estimatedDistance: string;
  specialInstructions: string;
}

export interface TripBriefing {
  routeOverview: string;
  routeNotes: string;
  expectedChallenges: string[];
  fuelPlanning: string;
  tollNotes: string;
  deliveryInstructions: string;
  safetyRecommendations: string[];
  tripComplexity: "Easy" | "Moderate" | "High";
  finalSummary: string;
}

export interface SavedTrip {
  id: string; // Unique local DB key
  timestamp: string; // Date saved
  input: TripInput;
  briefing: TripBriefing;
}
