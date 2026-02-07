import { useReducer, useCallback } from 'react';
import { TripState, TripAction, Stop, DEFAULT_TRIP_STATE } from '@/lib/types';

function generateId(): string {
  return crypto.randomUUID();
}

export function tripReducer(state: TripState, action: TripAction): TripState {
  switch (action.type) {
    case 'SET_ROUTE': {
      const stops: Stop[] = action.payload.stops.map((s) => ({
        ...s,
        id: s.id || generateId(),
      }));
      return {
        ...state,
        stops,
        route_segments: [], // clear — will be re-fetched
      };
    }

    case 'ADD_STOP': {
      const newStop: Stop = {
        ...action.payload.stop,
        id: action.payload.stop.id || generateId(),
      };
      const stops = [...state.stops];
      const pos = action.payload.position;
      if (pos !== undefined && pos >= 0 && pos <= stops.length) {
        stops.splice(pos, 0, newStop);
      } else {
        stops.push(newStop);
      }
      return {
        ...state,
        stops,
        route_segments: [], // clear — will be re-fetched
      };
    }

    case 'REMOVE_STOP': {
      return {
        ...state,
        stops: state.stops.filter((s) => s.id !== action.payload.stopId),
        route_segments: [], // clear — will be re-fetched
      };
    }

    case 'UPDATE_STOP': {
      return {
        ...state,
        stops: state.stops.map((s) =>
          s.id === action.payload.stopId ? { ...s, ...action.payload.updates } : s
        ),
      };
    }

    case 'REORDER_STOPS': {
      const orderedIds = action.payload.stopIds;
      const stopMap = new Map(state.stops.map((s) => [s.id, s]));
      const reordered = orderedIds.map((id) => stopMap.get(id)).filter(Boolean) as Stop[];
      // Include any stops not in the reorder list at the end
      const remaining = state.stops.filter((s) => !orderedIds.includes(s.id));
      return {
        ...state,
        stops: [...reordered, ...remaining],
        route_segments: [],
      };
    }

    case 'UPDATE_TRIP': {
      return {
        ...state,
        metadata: { ...state.metadata, ...action.payload },
      };
    }

    case 'SET_ROUTE_SEGMENTS': {
      return {
        ...state,
        route_segments: action.payload,
      };
    }

    case 'SET_SELECTED_STOP': {
      return {
        ...state,
        selectedStopId: action.payload,
      };
    }

    case 'LOAD_STATE': {
      return action.payload;
    }

    case 'RESET': {
      return DEFAULT_TRIP_STATE;
    }

    default:
      return state;
  }
}

export function useTrip(initialState?: TripState) {
  const [state, dispatch] = useReducer(tripReducer, initialState ?? DEFAULT_TRIP_STATE);

  const setRoute = useCallback((stops: Stop[]) => {
    dispatch({ type: 'SET_ROUTE', payload: { stops } });
  }, []);

  const addStop = useCallback((stop: Stop, position?: number) => {
    dispatch({ type: 'ADD_STOP', payload: { stop, position } });
  }, []);

  const removeStop = useCallback((stopId: string) => {
    dispatch({ type: 'REMOVE_STOP', payload: { stopId } });
  }, []);

  const updateStop = useCallback((stopId: string, updates: Partial<Omit<Stop, 'id'>>) => {
    dispatch({ type: 'UPDATE_STOP', payload: { stopId, updates } });
  }, []);

  const reorderStops = useCallback((stopIds: string[]) => {
    dispatch({ type: 'REORDER_STOPS', payload: { stopIds } });
  }, []);

  return { state, dispatch, setRoute, addStop, removeStop, updateStop, reorderStops };
}
