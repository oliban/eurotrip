'use client';

import { useTripState } from '@/store/trip-context';
import { useLocale } from '@/hooks/useLocale';
import { BurgerCard } from './BurgerCard';
import type { Stop, RouteSegment } from '@/lib/types';

// Country name -> flag emoji lookup for common European countries
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
  scotland: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
  romania: '\u{1F1F7}\u{1F1F4}',
  bulgaria: '\u{1F1E7}\u{1F1EC}',
  slovenia: '\u{1F1F8}\u{1F1EE}',
  slovakia: '\u{1F1F8}\u{1F1F0}',
  serbia: '\u{1F1F7}\u{1F1F8}',
  montenegro: '\u{1F1F2}\u{1F1EA}',
  'bosnia and herzegovina': '\u{1F1E7}\u{1F1E6}',
  albania: '\u{1F1E6}\u{1F1F1}',
  'north macedonia': '\u{1F1F2}\u{1F1F0}',
  turkey: '\u{1F1F9}\u{1F1F7}',
  iceland: '\u{1F1EE}\u{1F1F8}',
  luxembourg: '\u{1F1F1}\u{1F1FA}',
  malta: '\u{1F1F2}\u{1F1F9}',
  cyprus: '\u{1F1E8}\u{1F1FE}',
  estonia: '\u{1F1EA}\u{1F1EA}',
  latvia: '\u{1F1F1}\u{1F1FB}',
  lithuania: '\u{1F1F1}\u{1F1F9}',
  monaco: '\u{1F1F2}\u{1F1E8}',
  andorra: '\u{1F1E6}\u{1F1E9}',
  'san marino': '\u{1F1F8}\u{1F1F2}',
  liechtenstein: '\u{1F1F1}\u{1F1EE}',
};

function getFlag(country?: string): string {
  if (!country) return '';
  return COUNTRY_FLAGS[country.toLowerCase()] || '';
}

function formatDate(dateStr: string, loc: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(loc, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function addDays(dateStr: string, days: number, loc: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString(loc, {
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
  startDate?: string,
  loc: string = 'en-US'
): StopDayInfo[] {
  const result: StopDayInfo[] = [];
  let currentDay = 1;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const arrivalDay = currentDay;
    const departureDay = currentDay + stop.nights;

    // Find route segment from previous stop
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
      arrivalDateStr: startDate ? addDays(startDate, arrivalDay - 1, loc) : undefined,
      departureDateStr: startDate ? addDays(startDate, departureDay - 1, loc) : undefined,
      routeFromPrev,
    });

    currentDay = departureDay;
  }

  return result;
}

function getCategoryIcon(category?: string): string {
  switch (category) {
    case 'sightseeing':
      return '\u{1F3DB}';
    case 'food':
      return '\u{1F37D}';
    case 'adventure':
      return '\u{1F3D4}';
    case 'culture':
      return '\u{1F3A8}';
    case 'relaxation':
      return '\u{2728}';
    case 'nightlife':
      return '\u{1F378}';
    case 'shopping':
      return '\u{1F6CD}';
    case 'burger':
      return '\u{1F354}'; // 🍔
    case 'fondue':
      return '\u{1F9C0}'; // 🧀
    default:
      return '\u{2022}';
  }
}

interface PlanViewProps {
  onExportPdf?: () => void;
  className?: string;
}

export default function PlanView({ onExportPdf, className = '' }: PlanViewProps) {
  const state = useTripState();
  const { locale, currency: localeCurrency, t } = useLocale();
  const { metadata, stops, route_segments } = state;

  const dateLocale = locale === 'sv' ? 'sv-SE' : 'en-US';

  if (stops.length === 0) {
    return (
      <div className={`flex h-full flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="mb-4 text-5xl">{'\u{1F5FA}'}</div>
        <h2 className="mb-2 text-lg font-semibold text-zinc-700">{t['plan.emptyTitle']}</h2>
        <p className="max-w-xs text-sm text-zinc-500">
          {t['plan.emptySubtitle']}
        </p>
      </div>
    );
  }

  const dayInfos = computeDayInfo(stops, route_segments, metadata.start_date, dateLocale);
  const totalNights = stops.reduce((sum, s) => sum + s.nights, 0);
  const totalDrivingHours = route_segments.reduce((sum, seg) => sum + (seg.duration_hours || 0), 0);
  const totalDrivingKm = route_segments.reduce((sum, seg) => sum + (seg.distance_km || 0), 0);

  // Compute total estimated cost from itemized costs (accommodation + activities)
  let totalEstimatedCost = 0;
  for (const stop of stops) {
    const accomCost = (stop.accommodation?.cost_per_night || 0) * stop.nights;
    const activityCost = stop.activities.reduce((sum, a) => sum + (a.cost_estimate || 0), 0);
    totalEstimatedCost += accomCost + activityCost;
  }

  const currency = metadata.currency || localeCurrency;
  const currencySymbol = currency === 'EUR' ? '\u20AC' : currency === 'GBP' ? '\u00A3' : currency === 'USD' ? '$' : currency === 'SEK' ? 'kr' : currency;

  return (
    <div className={`h-full overflow-y-auto bg-zinc-50 ${className}`}>
      <div className="mx-auto max-w-2xl p-4 pb-24 lg:pb-4">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              {metadata.name || t['plan.defaultTripName']}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
              {metadata.start_date && (
                <span>
                  {formatDate(metadata.start_date, dateLocale)}
                  {metadata.end_date && ` \u2013 ${formatDate(metadata.end_date, dateLocale)}`}
                </span>
              )}
              {metadata.travelers && (
                <span>{metadata.travelers} {metadata.travelers !== 1 ? t['plan.travelers'] : t['plan.traveler']}</span>
              )}
              <span>{stops.length} {stops.length !== 1 ? t['plan.stops'] : t['plan.stop']}</span>
              {totalEstimatedCost > 0 && (
                <span>~{currencySymbol}{totalEstimatedCost.toLocaleString()}</span>
              )}
            </div>
          </div>
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              {t['plan.exportPdf']}
            </button>
          )}
        </div>

        {/* Stop Cards */}
        <div className="space-y-3">
          {dayInfos.map((info) => {
            const { stop, index, arrivalDay, departureDay, arrivalDateStr, departureDateStr, routeFromPrev } = info;
            const flag = getFlag(stop.country);

            const accom = (stop.accommodation?.cost_per_night || 0) * stop.nights;
            const acts = stop.activities.reduce((s, a) => s + (a.cost_estimate || 0), 0);
            const stopBudget = accom + acts;

            return (
              <div key={stop.id}>
                {/* Travel segment card between stops */}
                {routeFromPrev && (
                  <div className="mb-3 flex items-center gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-2.5">
                    {routeFromPrev.is_ferry ? (
                      <>
                        <span className="text-lg">{'\u26F4'}</span>
                        <div className="text-sm text-zinc-500">
                          <span className="font-medium text-zinc-600">Ferry / {t['plan.flight']}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">{'\u{1F699}'}</span>
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                          {routeFromPrev.duration_hours !== undefined && (
                            <span className="font-medium text-zinc-600">
                              {routeFromPrev.duration_hours < 1
                                ? `${Math.round(routeFromPrev.duration_hours * 60)} min`
                                : `${routeFromPrev.duration_hours.toFixed(1)} h`
                              }
                            </span>
                          )}
                          {routeFromPrev.distance_km !== undefined && (
                            <span>{Math.round(routeFromPrev.distance_km)} km</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Stop card */}
                <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  {/* Stop header */}
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {index + 1}
                        </span>
                        <h3 className="text-base font-semibold text-zinc-900">
                          {stop.name}
                        </h3>
                        {flag && <span className="text-base">{flag}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                        <span>
                          {arrivalDateStr
                            ? `${arrivalDateStr} \u2013 ${departureDateStr}`
                            : `${t['plan.day']} ${arrivalDay} \u2013 ${t['plan.day']} ${departureDay}`
                          }
                        </span>
                        <span>{stop.nights} {stop.nights !== 1 ? t['plan.nights'] : t['plan.night']}</span>
                      </div>
                    </div>
                    {stopBudget > 0 && (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                        ~{currencySymbol}{stopBudget.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Activities */}
                  {stop.activities.length > 0 && (
                    <div className="mb-3">
                      <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        {t['plan.activities']}
                      </h4>
                      <div className="space-y-2">
                        {stop.activities.map((activity, ai) => {
                          // Use special card for burger and fondue activities
                          if (activity.category === 'burger' || activity.category === 'fondue') {
                            return (
                              <BurgerCard
                                key={ai}
                                activity={activity}
                                travelers={metadata.travelers || 1}
                                currency={currency}
                              />
                            );
                          }
                          
                          // Regular activity rendering
                          return (
                            <div key={ai} className="flex items-start gap-2 text-sm text-zinc-700">
                              <span className="mt-0.5 shrink-0 text-xs">
                                {getCategoryIcon(activity.category)}
                              </span>
                              <div className="flex-1">
                                <span className="font-medium">{activity.name}</span>
                                {activity.description && (
                                  <span className="text-zinc-500"> &mdash; {activity.description}</span>
                                )}
                                <span className="ml-1 text-zinc-400">
                                  {activity.duration_hours && ` ${activity.duration_hours}h`}
                                  {activity.cost_estimate !== undefined && activity.cost_estimate > 0 && ` \u00B7 ${currencySymbol}${activity.cost_estimate}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Accommodation */}
                  {stop.accommodation && (
                    <div className="rounded-lg bg-zinc-50 p-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{'\u{1F3E8}'}</span>
                          <span className="font-medium text-zinc-700">{stop.accommodation.name}</span>
                          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                            {stop.accommodation.type}
                          </span>
                        </div>
                        {stop.accommodation.cost_per_night !== undefined && stop.accommodation.cost_per_night > 0 && (
                          <div className="text-right text-xs text-zinc-500">
                            <div>{currencySymbol}{stop.accommodation.cost_per_night}{t['plan.perNight']}</div>
                            {stop.nights > 1 && (
                              <div className="text-zinc-400">
                                {currencySymbol}{(stop.accommodation.cost_per_night * stop.nights).toLocaleString()} {t['plan.totalForStay']}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {stop.accommodation.notes && (
                        <p className="mt-1 text-xs text-zinc-400">{stop.accommodation.notes}</p>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {stop.notes && (
                    <p className="mt-2 text-xs italic text-zinc-500">{stop.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trip Totals */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">{t['plan.tripSummary']}</h3>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <div className="text-lg font-bold text-zinc-900">{totalNights}</div>
              <div className="text-xs text-zinc-500">{t['plan.totalNights']}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-900">{stops.length}</div>
              <div className="text-xs text-zinc-500">{t['plan.stops']}</div>
            </div>
            {totalDrivingHours > 0 && (
              <div>
                <div className="text-lg font-bold text-zinc-900">
                  {totalDrivingHours.toFixed(1)}h
                </div>
                <div className="text-xs text-zinc-500">
                  {t['plan.driving']} ({Math.round(totalDrivingKm)} km)
                </div>
              </div>
            )}
            {totalEstimatedCost > 0 && (
              <div>
                <div className="text-lg font-bold text-zinc-900">
                  {currencySymbol}{totalEstimatedCost.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500">{t['plan.estTotalCost']}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
