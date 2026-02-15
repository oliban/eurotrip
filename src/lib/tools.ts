// Claude tool definitions for the Anthropic API
// These define the JSON schemas Claude uses to structure tool_use calls

export function getTripTools(currency: string = 'EUR') {
  return [
  {
    name: 'set_route',
    description:
      'Set the entire trip itinerary at once. Use this when creating a new trip or completely replacing the current route. Provides all stops with coordinates, activities, accommodations, and budget estimates. Always use this for initial trip creation rather than calling add_stop multiple times.',
    input_schema: {
      type: 'object' as const,
      properties: {
        stops: {
          type: 'array' as const,
          description: 'Ordered list of stops for the trip',
          items: {
            type: 'object' as const,
            properties: {
              name: { type: 'string' as const, description: 'City or location name' },
              lat: { type: 'number' as const, description: 'Latitude' },
              lng: { type: 'number' as const, description: 'Longitude' },
              country: { type: 'string' as const, description: 'Country name' },
              nights: { type: 'number' as const, description: 'Number of nights to stay' },
              activities: {
                type: 'array' as const,
                items: {
                  type: 'object' as const,
                  properties: {
                    name: { type: 'string' as const },
                    description: { type: 'string' as const },
                    duration_hours: { type: 'number' as const },
                    cost_estimate: { type: 'number' as const },
                    category: {
                      type: 'string' as const,
                      enum: ['sightseeing', 'food', 'adventure', 'culture', 'relaxation', 'nightlife', 'shopping', 'burger'],
                    },
                  },
                  required: ['name'],
                },
              },
              accommodation: {
                type: 'object' as const,
                properties: {
                  name: { type: 'string' as const },
                  type: { type: 'string' as const, enum: ['hotel', 'hostel', 'airbnb', 'camping', 'other'] },
                  cost_per_night: { type: 'number' as const },
                  notes: { type: 'string' as const },
                },
                required: ['name', 'type'],
              },
              daily_budget: { type: 'number' as const, description: `Estimated daily budget in ${currency}` },
              notes: { type: 'string' as const },
            },
            required: ['name', 'lat', 'lng', 'nights'],
          },
        },
        trip_name: { type: 'string' as const, description: 'Name for the trip' },
        start_date: { type: 'string' as const, description: 'Trip start date (YYYY-MM-DD)' },
        travelers: { type: 'number' as const, description: 'Number of travelers' },
        total_budget: { type: 'number' as const, description: `Total trip budget in ${currency}` },
      },
      required: ['stops'],
    },
  },
  {
    name: 'add_stop',
    description:
      'Add a single stop to the existing itinerary at a specific position. Use this when the user wants to add one new destination to an already-planned trip. Do NOT use this for reordering — use reorder_stops instead.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'City or location name' },
        lat: { type: 'number' as const, description: 'Latitude' },
        lng: { type: 'number' as const, description: 'Longitude' },
        country: { type: 'string' as const, description: 'Country name' },
        nights: { type: 'number' as const, description: 'Number of nights to stay' },
        position: {
          type: 'number' as const,
          description: 'Zero-based index where to insert the stop. Omit to add at the end.',
        },
        activities: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              name: { type: 'string' as const },
              description: { type: 'string' as const },
              duration_hours: { type: 'number' as const },
              cost_estimate: { type: 'number' as const },
              category: { type: 'string' as const },
            },
            required: ['name'],
          },
        },
        accommodation: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            type: { type: 'string' as const, enum: ['hotel', 'hostel', 'airbnb', 'camping', 'other'] },
            cost_per_night: { type: 'number' as const },
            notes: { type: 'string' as const },
          },
          required: ['name', 'type'],
        },
        daily_budget: { type: 'number' as const },
        notes: { type: 'string' as const },
      },
      required: ['name', 'lat', 'lng', 'nights'],
    },
  },
  {
    name: 'remove_stop',
    description:
      'Remove a stop from the itinerary by name. Use this when the user wants to skip a destination. Do NOT use remove + add to reorder — use reorder_stops instead.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Name of the stop to remove (case-insensitive match)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_stop',
    description:
      'Update details of an existing stop (nights, activities, accommodation, budget). Use this to modify a stop without changing its position in the route.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Name of the stop to update (case-insensitive match)' },
        nights: { type: 'number' as const },
        activities: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              name: { type: 'string' as const },
              description: { type: 'string' as const },
              duration_hours: { type: 'number' as const },
              cost_estimate: { type: 'number' as const },
              category: { type: 'string' as const },
            },
            required: ['name'],
          },
        },
        accommodation: {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            type: { type: 'string' as const, enum: ['hotel', 'hostel', 'airbnb', 'camping', 'other'] },
            cost_per_night: { type: 'number' as const },
            notes: { type: 'string' as const },
          },
          required: ['name', 'type'],
        },
        daily_budget: { type: 'number' as const },
        notes: { type: 'string' as const },
      },
      required: ['name'],
    },
  },
  {
    name: 'reorder_stops',
    description:
      'Change the order of stops in the itinerary. Provide the complete list of stop names in the desired new order. All existing stops must be included.',
    input_schema: {
      type: 'object' as const,
      properties: {
        stop_names: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'All stop names in the desired order',
        },
      },
      required: ['stop_names'],
    },
  },
  {
    name: 'update_trip',
    description:
      'Update trip-level metadata such as the trip name, dates, number of travelers, or total budget. Does not affect individual stops.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Trip name' },
        start_date: { type: 'string' as const, description: 'Start date (YYYY-MM-DD)' },
        end_date: { type: 'string' as const, description: 'End date (YYYY-MM-DD)' },
        travelers: { type: 'number' as const, description: 'Number of travelers' },
        total_budget: { type: 'number' as const, description: `Total budget in ${currency}` },
        currency: { type: 'string' as const, description: 'Currency code (default: EUR)' },
        food_query: { type: 'string' as const, description: 'Google Places search query for food preferences (e.g. "italian restaurant", "vegan food", "seafood restaurant"). Set this after learning the travelers\' food preferences.' },
      },
    },
  },
  {
    name: 'add_burger_recommendations',
    description:
      'Add burger restaurant recommendations as activities to one or more stops. Use this after creating a route when the user is a burger enthusiast. Include specific restaurants with names, specialties, addresses, and costs.',
    input_schema: {
      type: 'object' as const,
      properties: {
        recommendations: {
          type: 'array' as const,
          description: 'Burger recommendations grouped by stop',
          items: {
            type: 'object' as const,
            properties: {
              stop_name: { type: 'string' as const, description: 'Name of the city/stop' },
              burgers: {
                type: 'array' as const,
                description: 'List of burger restaurants for this stop',
                items: {
                  type: 'object' as const,
                  properties: {
                    restaurant_name: { type: 'string' as const, description: 'Restaurant name' },
                    specialty: { type: 'string' as const, description: 'Signature burger or dish (e.g., "Classic smash burger with truffle fries")' },
                    address: { type: 'string' as const, description: 'Street address' },
                    cost_estimate: { type: 'number' as const, description: `Cost per person in ${currency}` },
                    time_suggestion: { type: 'string' as const, description: 'Recommended time (e.g., "Lunch", "Dinner")' },
                    description: { type: 'string' as const, description: 'What makes this place special' },
                  },
                  required: ['restaurant_name', 'specialty', 'cost_estimate'],
                },
              },
            },
            required: ['stop_name', 'burgers'],
          },
        },
      },
      required: ['recommendations'],
    },
  },
  {
    name: 'add_fondue_recommendations',
    description:
      'Add cheese fondue restaurant recommendations as activities to Swiss stops. Use when the route passes through Switzerland and the user loves fondue. Include specific restaurants with traditional Swiss fondue experiences.',
    input_schema: {
      type: 'object' as const,
      properties: {
        recommendations: {
          type: 'array' as const,
          description: 'Fondue recommendations grouped by stop',
          items: {
            type: 'object' as const,
            properties: {
              stop_name: { type: 'string' as const, description: 'Name of the city/stop (should be in Switzerland)' },
              fondues: {
                type: 'array' as const,
                description: 'List of fondue restaurants for this stop',
                items: {
                  type: 'object' as const,
                  properties: {
                    restaurant_name: { type: 'string' as const, description: 'Restaurant name' },
                    specialty: { type: 'string' as const, description: 'Type of fondue (e.g., "Traditional Gruyère & Vacherin blend")' },
                    address: { type: 'string' as const, description: 'Street address' },
                    cost_estimate: { type: 'number' as const, description: `Cost per person in ${currency}` },
                    time_suggestion: { type: 'string' as const, description: 'Recommended time (usually "Dinner")' },
                    description: { type: 'string' as const, description: 'What makes this place special' },
                  },
                  required: ['restaurant_name', 'specialty', 'cost_estimate'],
                },
              },
            },
            required: ['stop_name', 'fondues'],
          },
        },
      },
      required: ['recommendations'],
    },
  },
] as const;
}
