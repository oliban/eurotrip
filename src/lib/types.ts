// ============================================
// Core Trip Types
// ============================================

export interface Coordinates {
  lng: number;
  lat: number;
}

export interface Activity {
  name: string;
  description?: string;
  duration_hours?: number;
  cost_estimate?: number;
  category?: 'sightseeing' | 'food' | 'adventure' | 'culture' | 'relaxation' | 'nightlife' | 'shopping';
}

export interface Accommodation {
  name: string;
  type: 'hotel' | 'hostel' | 'airbnb' | 'camping' | 'other';
  cost_per_night?: number;
  notes?: string;
}

export interface Stop {
  id: string;
  name: string;
  coordinates: Coordinates;
  nights: number;
  activities: Activity[];
  accommodation?: Accommodation;
  daily_budget?: number;
  notes?: string;
  country?: string;
}

export interface RouteSegment {
  from_stop_id: string;
  to_stop_id: string;
  geometry?: GeoJSON.LineString;
  distance_km?: number;
  duration_hours?: number;
  is_ferry?: boolean;
}

export interface TripMetadata {
  name: string;
  start_date?: string;
  end_date?: string;
  travelers?: number;
  total_budget?: number;
  currency?: string;
}

export interface TripState {
  metadata: TripMetadata;
  stops: Stop[];
  route_segments: RouteSegment[];
  selectedStopId: string | null;
}

export const DEFAULT_TRIP_STATE: TripState = {
  metadata: {
    name: '',
  },
  stops: [],
  route_segments: [],
  selectedStopId: null,
};

// ============================================
// Trip Actions (Reducer)
// ============================================

export type TripAction =
  | { type: 'SET_ROUTE'; payload: { stops: Stop[] } }
  | { type: 'ADD_STOP'; payload: { stop: Stop; position?: number } }
  | { type: 'REMOVE_STOP'; payload: { stopId: string } }
  | { type: 'UPDATE_STOP'; payload: { stopId: string; updates: Partial<Omit<Stop, 'id'>> } }
  | { type: 'REORDER_STOPS'; payload: { stopIds: string[] } }
  | { type: 'UPDATE_TRIP'; payload: Partial<TripMetadata> }
  | { type: 'SET_ROUTE_SEGMENTS'; payload: RouteSegment[] }
  | { type: 'SET_SELECTED_STOP'; payload: string | null }
  | { type: 'LOAD_STATE'; payload: TripState }
  | { type: 'RESET' };

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCallInfo[];
  timestamp: number;
}

export interface ToolCallInfo {
  id: string;
  name: string;
  input: Record<string, unknown>;
  result?: string;
}

export type ChatStatus = 'idle' | 'streaming' | 'processing_tools' | 'error';

// ============================================
// Tool Call Types (from Anthropic streaming)
// ============================================

export interface ToolCallAccumulator {
  id: string;
  name: string;
  inputJson: string;
}

export interface ParsedToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// ============================================
// Tool Input Types (discriminated union)
// ============================================

export interface SetRouteInput {
  stops: Array<{
    name: string;
    lat: number;
    lng: number;
    country?: string;
    nights: number;
    activities?: Array<{
      name: string;
      description?: string;
      duration_hours?: number;
      cost_estimate?: number;
      category?: string;
    }>;
    accommodation?: {
      name: string;
      type: string;
      cost_per_night?: number;
      notes?: string;
    };
    daily_budget?: number;
    notes?: string;
  }>;
  trip_name?: string;
  start_date?: string;
  travelers?: number;
  total_budget?: number;
}

export interface AddStopInput {
  name: string;
  lat: number;
  lng: number;
  country?: string;
  nights: number;
  position?: number;
  activities?: Array<{
    name: string;
    description?: string;
    duration_hours?: number;
    cost_estimate?: number;
    category?: string;
  }>;
  accommodation?: {
    name: string;
    type: string;
    cost_per_night?: number;
    notes?: string;
  };
  daily_budget?: number;
  notes?: string;
}

export interface RemoveStopInput {
  name: string;
}

export interface UpdateStopInput {
  name: string;
  nights?: number;
  activities?: Array<{
    name: string;
    description?: string;
    duration_hours?: number;
    cost_estimate?: number;
    category?: string;
  }>;
  accommodation?: {
    name: string;
    type: string;
    cost_per_night?: number;
    notes?: string;
  };
  daily_budget?: number;
  notes?: string;
}

export interface ReorderStopsInput {
  stop_names: string[];
}

export interface UpdateTripInput {
  name?: string;
  start_date?: string;
  end_date?: string;
  travelers?: number;
  total_budget?: number;
  currency?: string;
}

export type ToolInput =
  | { name: 'set_route'; input: SetRouteInput }
  | { name: 'add_stop'; input: AddStopInput }
  | { name: 'remove_stop'; input: RemoveStopInput }
  | { name: 'update_stop'; input: UpdateStopInput }
  | { name: 'reorder_stops'; input: ReorderStopsInput }
  | { name: 'update_trip'; input: UpdateTripInput };
