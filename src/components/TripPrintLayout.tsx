'use client';

import React from 'react';
import type { TripState, Stop, RouteSegment } from '@/lib/types';

const COUNTRY_FLAGS: Record<string, string> = {
  france: '\u{1F1EB}\u{1F1F7}',
  spain: '\u{1F1EA}\u{1F1F8}',
  italy: '\u{1F1EE}\u{1F1F9}',
  germany: '\u{1F1E9}\u{1F1EA}',
  portugal: '\u{1F1F5}\u{1F1F9}',
  netherlands: '\u{1F1F3}\u{1F1F1}',
  belgium: '\u{1F1E7}\u{1F1EA}',
  austria: '\u{1F1E6}\u{1F1F9}',
  switzerland: '\u{1F1E8}\u{1F1ED}',
  greece: '\u{1F1EC}\u{1F1F7}',
  croatia: '\u{1F1ED}\u{1F1F7}',
  czechia: '\u{1F1E8}\u{1F1FF}',
  'czech republic': '\u{1F1E8}\u{1F1FF}',
  poland: '\u{1F1F5}\u{1F1F1}',
  hungary: '\u{1F1ED}\u{1F1FA}',
  sweden: '\u{1F1F8}\u{1F1EA}',
  norway: '\u{1F1F3}\u{1F1F4}',
  denmark: '\u{1F1E9}\u{1F1F0}',
  finland: '\u{1F1EB}\u{1F1EE}',
  ireland: '\u{1F1EE}\u{1F1EA}',
  'united kingdom': '\u{1F1EC}\u{1F1E7}',
  uk: '\u{1F1EC}\u{1F1E7}',
  england: '\u{1F1EC}\u{1F1E7}',
  romania: '\u{1F1F7}\u{1F1F4}',
  bulgaria: '\u{1F1E7}\u{1F1EC}',
  slovenia: '\u{1F1F8}\u{1F1EE}',
  slovakia: '\u{1F1F8}\u{1F1F0}',
  serbia: '\u{1F1F7}\u{1F1F8}',
  montenegro: '\u{1F1F2}\u{1F1EA}',
  albania: '\u{1F1E6}\u{1F1F1}',
  turkey: '\u{1F1F9}\u{1F1F7}',
  iceland: '\u{1F1EE}\u{1F1F8}',
  luxembourg: '\u{1F1F1}\u{1F1FA}',
  malta: '\u{1F1F2}\u{1F1F9}',
  cyprus: '\u{1F1E8}\u{1F1FE}',
  estonia: '\u{1F1EA}\u{1F1EA}',
  latvia: '\u{1F1F1}\u{1F1FB}',
  lithuania: '\u{1F1F1}\u{1F1F9}',
};

function getFlag(country?: string): string {
  if (!country) return '';
  return COUNTRY_FLAGS[country.toLowerCase()] || '';
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

interface StopDayInfo {
  stop: Stop;
  index: number;
  arrivalDay: number;
  departureDay: number;
  arrivalDateStr?: string;
  departureDateStr?: string;
  routeFromPrev?: RouteSegment;
}

function computeDayInfo(
  stops: Stop[],
  routeSegments: RouteSegment[],
  startDate?: string
): StopDayInfo[] {
  const result: StopDayInfo[] = [];
  let currentDay = 1;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const arrivalDay = currentDay;
    const departureDay = currentDay + stop.nights;

    let routeFromPrev: RouteSegment | undefined;
    if (i > 0) {
      routeFromPrev = routeSegments.find(
        (seg) => seg.from_stop_id === stops[i - 1].id && seg.to_stop_id === stop.id
      );
    }

    result.push({
      stop,
      index: i,
      arrivalDay,
      departureDay,
      arrivalDateStr: startDate ? addDays(startDate, arrivalDay - 1) : undefined,
      departureDateStr: startDate ? addDays(startDate, departureDay - 1) : undefined,
      routeFromPrev,
    });

    currentDay = departureDay;
  }

  return result;
}

interface TripPrintLayoutProps {
  tripState: TripState;
  mapImageUrl?: string;
}

const TripPrintLayout = React.forwardRef<HTMLDivElement, TripPrintLayoutProps>(
  function TripPrintLayout({ tripState, mapImageUrl }, ref) {
    const { metadata, stops, route_segments } = tripState;

    if (stops.length === 0) return null;

    const dayInfos = computeDayInfo(stops, route_segments, metadata.start_date);
    const totalNights = stops.reduce((sum, s) => sum + s.nights, 0);
    const totalDrivingHours = route_segments.reduce((sum, seg) => sum + (seg.duration_hours || 0), 0);
    const totalDrivingKm = route_segments.reduce((sum, seg) => sum + (seg.distance_km || 0), 0);

    let totalEstimatedCost = 0;
    for (const stop of stops) {
      const accomCost = (stop.accommodation?.cost_per_night || 0) * stop.nights;
      const activityCost = stop.activities.reduce((sum, a) => sum + (a.cost_estimate || 0), 0);
      totalEstimatedCost += accomCost + activityCost;
    }

    const currency = metadata.currency || 'EUR';
    const currencySymbol = currency === 'EUR' ? '\u20AC' : currency === 'GBP' ? '\u00A3' : currency === 'USD' ? '$' : currency;

    return (
      <div ref={ref} className="print-layout bg-white p-8 text-black" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        {/* Title Section */}
        <div className="mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">
            {metadata.name || 'My European Road Trip'}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
            {metadata.start_date && (
              <span>
                {formatDate(metadata.start_date)}
                {metadata.end_date && ` \u2013 ${formatDate(metadata.end_date)}`}
              </span>
            )}
            {metadata.travelers && (
              <span>{metadata.travelers} traveler{metadata.travelers !== 1 ? 's' : ''}</span>
            )}
            <span>{stops.length} stops \u00B7 {totalNights} nights</span>
            {totalDrivingHours > 0 && (
              <span>{totalDrivingHours.toFixed(1)}h driving ({Math.round(totalDrivingKm)} km)</span>
            )}
            {totalEstimatedCost > 0 && (
              <span>Est. {currencySymbol}{totalEstimatedCost.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Map Image */}
        {mapImageUrl && (
          <div className="mb-6">
            <img
              src={mapImageUrl}
              alt="Trip route map"
              className="w-full rounded border border-gray-300"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* Itinerary */}
        <div>
          {dayInfos.map((info) => {
            const { stop, index, arrivalDay, departureDay, arrivalDateStr, departureDateStr, routeFromPrev } = info;
            const flag = getFlag(stop.country);

            const accom = (stop.accommodation?.cost_per_night || 0) * stop.nights;
            const acts = stop.activities.reduce((s, a) => s + (a.cost_estimate || 0), 0);
            const stopBudget = accom + acts;

            return (
              <div key={stop.id} className="print-stop mb-4">
                {/* Driving segment */}
                {routeFromPrev && (routeFromPrev.duration_hours || routeFromPrev.distance_km) && (
                  <div className="mb-1 text-center text-xs text-gray-400">
                    {'\u2193'}{' '}
                    {routeFromPrev.duration_hours !== undefined && (
                      <>{routeFromPrev.duration_hours < 1
                        ? `${Math.round(routeFromPrev.duration_hours * 60)} min`
                        : `${routeFromPrev.duration_hours.toFixed(1)} hrs`
                      }</>
                    )}
                    {routeFromPrev.duration_hours !== undefined && routeFromPrev.distance_km !== undefined && ', '}
                    {routeFromPrev.distance_km !== undefined && (
                      <>{Math.round(routeFromPrev.distance_km)} km</>
                    )}
                    {' '}{'\u2193'}
                  </div>
                )}

                {/* Stop content */}
                <div className="border border-gray-200 p-3">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <span className="text-sm font-bold">
                        Stop {index + 1}: {stop.name} {flag}
                      </span>
                      <div className="text-xs text-gray-500">
                        {arrivalDateStr
                          ? `${arrivalDateStr} \u2013 ${departureDateStr}`
                          : `Day ${arrivalDay} \u2013 Day ${departureDay}`
                        }
                        {' \u00B7 '}{stop.nights} night{stop.nights !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {stopBudget > 0 && (
                      <span className="text-xs text-gray-500">
                        ~{currencySymbol}{stopBudget.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Activities */}
                  {stop.activities.length > 0 && (
                    <div className="mb-2">
                      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Activities
                      </div>
                      <ul className="list-inside text-xs text-gray-700">
                        {stop.activities.map((activity, ai) => (
                          <li key={ai} className="mb-0.5">
                            {'\u2022'} {activity.name}
                            {activity.duration_hours && ` (${activity.duration_hours}h)`}
                            {activity.cost_estimate !== undefined && activity.cost_estimate > 0 && ` \u2013 ${currencySymbol}${activity.cost_estimate}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Accommodation */}
                  {stop.accommodation && (
                    <div className="text-xs text-gray-600">
                      {'\u{1F3E8}'} {stop.accommodation.name} ({stop.accommodation.type})
                      {stop.accommodation.cost_per_night !== undefined && stop.accommodation.cost_per_night > 0 && (
                        <> \u2013 {currencySymbol}{stop.accommodation.cost_per_night}/night</>
                      )}
                    </div>
                  )}

                  {stop.notes && (
                    <div className="mt-1 text-xs italic text-gray-400">{stop.notes}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-gray-300 pt-3 text-center text-xs text-gray-400">
          Generated by Eurotrip Planner
        </div>
      </div>
    );
  }
);

export default TripPrintLayout;
