import {
  ParsedToolCall,
  TripAction,
  Stop,
  Activity,
  Accommodation,
  TripState,
  BurgerAchievement,
} from './types';

function generateId(): string {
  return crypto.randomUUID();
}

function findStopByName(stops: Stop[], name: string): Stop | undefined {
  const lower = name.toLowerCase();
  return stops.find((s) => s.name.toLowerCase() === lower);
}

function parseActivities(raw?: Array<Record<string, unknown>>): Activity[] {
  if (!raw) return [];
  return raw.map((a) => ({
    name: String(a.name || ''),
    description: a.description ? String(a.description) : undefined,
    duration_hours: typeof a.duration_hours === 'number' ? a.duration_hours : undefined,
    cost_estimate: typeof a.cost_estimate === 'number' ? a.cost_estimate : undefined,
    category: a.category as Activity['category'],
  }));
}

function parseAccommodation(raw?: Record<string, unknown>): Accommodation | undefined {
  if (!raw || !raw.name) return undefined;
  return {
    name: String(raw.name),
    type: (raw.type as Accommodation['type']) || 'other',
    cost_per_night: typeof raw.cost_per_night === 'number' ? raw.cost_per_night : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
  };
}

interface ProcessResult {
  actions: TripAction[];
  result: string;
}

export function processToolCall(
  toolCall: ParsedToolCall,
  currentState: TripState
): ProcessResult {
  const { name, input } = toolCall;

  switch (name) {
    case 'set_route': {
      const inp = input as Record<string, unknown>;
      const rawStops = inp.stops as Array<Record<string, unknown>>;
      if (!Array.isArray(rawStops) || rawStops.length === 0) {
        return { actions: [], result: 'Error: stops array is required and must not be empty.' };
      }

      const stops: Stop[] = rawStops.map((s) => ({
        id: generateId(),
        name: String(s.name || ''),
        coordinates: { lng: Number(s.lng), lat: Number(s.lat) },
        country: s.country ? String(s.country) : undefined,
        nights: Number(s.nights) || 1,
        activities: parseActivities(s.activities as Array<Record<string, unknown>>),
        accommodation: parseAccommodation(s.accommodation as Record<string, unknown>),
        daily_budget: typeof s.daily_budget === 'number' ? s.daily_budget : undefined,
        notes: s.notes ? String(s.notes) : undefined,
      }));

      const actions: TripAction[] = [{ type: 'SET_ROUTE', payload: { stops } }];

      // Also update trip metadata if provided
      if (inp.trip_name || inp.start_date || inp.travelers || inp.total_budget) {
        const metaPayload: Record<string, unknown> = {};
        if (inp.trip_name) metaPayload.name = String(inp.trip_name);
        if (inp.start_date) metaPayload.start_date = String(inp.start_date);
        if (typeof inp.travelers === 'number') metaPayload.travelers = inp.travelers;
        if (typeof inp.total_budget === 'number') metaPayload.total_budget = inp.total_budget;
        actions.push({ type: 'UPDATE_TRIP', payload: metaPayload });
      }

      return {
        actions,
        result: `Route set with ${stops.length} stops: ${stops.map((s) => s.name).join(' → ')}`,
      };
    }

    case 'add_stop': {
      const inp = input as Record<string, unknown>;
      const stop: Stop = {
        id: generateId(),
        name: String(inp.name || ''),
        coordinates: { lng: Number(inp.lng), lat: Number(inp.lat) },
        country: inp.country ? String(inp.country) : undefined,
        nights: Number(inp.nights) || 1,
        activities: parseActivities(inp.activities as Array<Record<string, unknown>>),
        accommodation: parseAccommodation(inp.accommodation as Record<string, unknown>),
        daily_budget: typeof inp.daily_budget === 'number' ? inp.daily_budget : undefined,
        notes: inp.notes ? String(inp.notes) : undefined,
      };

      const position = typeof inp.position === 'number' ? inp.position : undefined;

      return {
        actions: [{ type: 'ADD_STOP', payload: { stop, position } }],
        result: `Added stop: ${stop.name}${position !== undefined ? ` at position ${position}` : ' at the end'}`,
      };
    }

    case 'remove_stop': {
      const inp = input as Record<string, unknown>;
      const stopName = String(inp.name || '');
      const found = findStopByName(currentState.stops, stopName);

      if (!found) {
        return {
          actions: [],
          result: `Error: Stop "${stopName}" not found. Current stops: ${currentState.stops.map((s) => s.name).join(', ')}`,
        };
      }

      return {
        actions: [{ type: 'REMOVE_STOP', payload: { stopId: found.id } }],
        result: `Removed stop: ${found.name}`,
      };
    }

    case 'update_stop': {
      const inp = input as Record<string, unknown>;
      const stopName = String(inp.name || '');
      const found = findStopByName(currentState.stops, stopName);

      if (!found) {
        return {
          actions: [],
          result: `Error: Stop "${stopName}" not found. Current stops: ${currentState.stops.map((s) => s.name).join(', ')}`,
        };
      }

      const updates: Partial<Omit<Stop, 'id'>> = {};
      if (typeof inp.nights === 'number') updates.nights = inp.nights;
      if (inp.activities) updates.activities = parseActivities(inp.activities as Array<Record<string, unknown>>);
      if (inp.accommodation) updates.accommodation = parseAccommodation(inp.accommodation as Record<string, unknown>);
      if (typeof inp.daily_budget === 'number') updates.daily_budget = inp.daily_budget;
      if (inp.notes) updates.notes = String(inp.notes);

      return {
        actions: [{ type: 'UPDATE_STOP', payload: { stopId: found.id, updates } }],
        result: `Updated stop: ${found.name}`,
      };
    }

    case 'reorder_stops': {
      const inp = input as Record<string, unknown>;
      const stopNames = inp.stop_names as string[];

      if (!Array.isArray(stopNames)) {
        return { actions: [], result: 'Error: stop_names array is required.' };
      }

      // Map names to IDs
      const orderedIds: string[] = [];
      for (const name of stopNames) {
        const found = findStopByName(currentState.stops, name);
        if (found) {
          orderedIds.push(found.id);
        } else {
          return {
            actions: [],
            result: `Error: Stop "${name}" not found. Current stops: ${currentState.stops.map((s) => s.name).join(', ')}`,
          };
        }
      }

      return {
        actions: [{ type: 'REORDER_STOPS', payload: { stopIds: orderedIds } }],
        result: `Reordered stops: ${stopNames.join(' → ')}`,
      };
    }

    case 'update_trip': {
      const inp = input as Record<string, unknown>;
      const payload: Record<string, unknown> = {};
      if (inp.name) payload.name = String(inp.name);
      if (inp.start_date) payload.start_date = String(inp.start_date);
      if (inp.end_date) payload.end_date = String(inp.end_date);
      if (typeof inp.travelers === 'number') payload.travelers = inp.travelers;
      if (typeof inp.total_budget === 'number') payload.total_budget = inp.total_budget;
      if (inp.currency) payload.currency = String(inp.currency);

      return {
        actions: [{ type: 'UPDATE_TRIP', payload }],
        result: `Updated trip: ${Object.keys(payload).join(', ')}`,
      };
    }

    case 'add_burger_recommendations': {
      const inp = input as Record<string, unknown>;
      const recommendations = inp.recommendations as Array<{
        stop_name: string;
        burgers: Array<{
          restaurant_name: string;
          specialty: string;
          address?: string;
          cost_estimate: number;
          time_suggestion?: string;
          description?: string;
        }>;
      }>;

      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        return { actions: [], result: 'Error: recommendations array is required and must not be empty.' };
      }

      const actions: TripAction[] = [];
      const results: string[] = [];
      const isBurgerChallenge = currentState.metadata.mode === 'burger_challenge';
      let totalScore = currentState.metadata.burgerScore || 0;
      const allAchievements = [...(currentState.metadata.burgersCollected || [])];

      for (const rec of recommendations) {
        const stopName = rec.stop_name;
        const found = findStopByName(currentState.stops, stopName);

        if (!found) {
          results.push(`⚠️ Stop "${stopName}" not found, skipped`);
          continue;
        }

        // Convert burger recommendations to activities with category 'burger'
        const burgerActivities: Activity[] = rec.burgers.map((burger) => {
          // Parse rarity from description in burger challenge mode
          let rarity: 'common' | 'rare' | 'legendary' = 'common';
          if (isBurgerChallenge && burger.description) {
            if (burger.description.toLowerCase().includes('legendary')) {
              rarity = 'legendary';
              totalScore += 10;
            } else if (burger.description.toLowerCase().includes('rare')) {
              rarity = 'rare';
              totalScore += 5;
            } else {
              totalScore += 2;
            }

            // Add achievement
            allAchievements.push({
              city: stopName,
              restaurantName: burger.restaurant_name,
              specialty: burger.specialty,
              rarity,
              collected: true,
            });
          }

          return {
            name: burger.restaurant_name,
            category: 'burger' as Activity['category'],
            specialty: burger.specialty,
            address: burger.address,
            cost_estimate: burger.cost_estimate * (currentState.metadata.travelers || 1), // Total for group
            time: burger.time_suggestion,
            description: burger.description,
            duration_hours: 1,
          };
        });

        // Append burger activities to existing activities
        const updatedActivities = [...(found.activities || []), ...burgerActivities];

        actions.push({
          type: 'UPDATE_STOP',
          payload: {
            stopId: found.id,
            updates: { activities: updatedActivities },
          },
        });

        results.push(`Added ${burgerActivities.length} burger spots to ${found.name}: ${rec.burgers.map((b) => b.restaurant_name).join(', ')}`);
      }

      // Update burger challenge metadata if in that mode
      if (isBurgerChallenge) {
        actions.push({
          type: 'UPDATE_TRIP',
          payload: {
            burgerScore: totalScore,
            burgersCollected: allAchievements,
          },
        });
      }

      return {
        actions,
        result: results.join('\n') + ' 🍔',
      };
    }

    case 'add_fondue_recommendations': {
      const inp = input as Record<string, unknown>;
      const recommendations = inp.recommendations as Array<{
        stop_name: string;
        fondues: Array<{
          restaurant_name: string;
          specialty: string;
          address?: string;
          cost_estimate: number;
          time_suggestion?: string;
          description?: string;
        }>;
      }>;

      if (!Array.isArray(recommendations) || recommendations.length === 0) {
        return { actions: [], result: 'Error: recommendations array is required and must not be empty.' };
      }

      const actions: TripAction[] = [];
      const results: string[] = [];

      for (const rec of recommendations) {
        const stopName = rec.stop_name;
        const found = findStopByName(currentState.stops, stopName);

        if (!found) {
          results.push(`⚠️ Stop "${stopName}" not found, skipped`);
          continue;
        }

        // Convert fondue recommendations to activities with category 'fondue'
        const fondueActivities: Activity[] = rec.fondues.map((fondue) => ({
          name: fondue.restaurant_name,
          category: 'fondue' as Activity['category'],
          specialty: fondue.specialty,
          address: fondue.address,
          cost_estimate: fondue.cost_estimate * (currentState.metadata.travelers || 1), // Total for group
          time: fondue.time_suggestion,
          description: fondue.description,
          duration_hours: 2, // Fondue is typically a longer meal
        }));

        // Append fondue activities to existing activities
        const updatedActivities = [...(found.activities || []), ...fondueActivities];

        actions.push({
          type: 'UPDATE_STOP',
          payload: {
            stopId: found.id,
            updates: { activities: updatedActivities },
          },
        });

        results.push(`Added ${fondueActivities.length} fondue spots to ${found.name}: ${rec.fondues.map((f) => f.restaurant_name).join(', ')}`);
      }

      return {
        actions,
        result: results.join('\n') + ' 🧀',
      };
    }

    default:
      return { actions: [], result: `Unknown tool: ${name}` };
  }
}
