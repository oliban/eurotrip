export type Locale = 'en' | 'sv';

export interface Translations {
  // ChatPanel
  'chat.title': string;
  'chat.emptyTitle': string;
  'chat.emptySubtitle': string;
  'chat.updatingTrip': string;
  'chat.confirmReset': string;
  'chat.confirmBurgerOn': string;
  'chat.confirmBurgerOff': string;
  'chat.switchToBurger': string;
  'chat.switchToStandard': string;
  'chat.foodPreferences': string;

  // ChatInput
  'input.placeholder': string;

  // PlanView
  'plan.emptyTitle': string;
  'plan.emptySubtitle': string;
  'plan.defaultTripName': string;
  'plan.traveler': string;
  'plan.travelers': string;
  'plan.stop': string;
  'plan.stops': string;
  'plan.exportPdf': string;
  'plan.activities': string;
  'plan.night': string;
  'plan.nights': string;
  'plan.perNight': string;
  'plan.accommodation': string;
  'plan.totalForStay': string;
  'plan.flight': string;
  'plan.tripSummary': string;
  'plan.totalNights': string;
  'plan.driving': string;
  'plan.estTotalCost': string;
  'plan.day': string;

  // MobileNav
  'nav.chat': string;
  'nav.map': string;
  'nav.plan': string;

  // ViewTabs
  'tabs.map': string;
  'tabs.plan': string;
}

const en: Translations = {
  'chat.title': 'Trip Planner',
  'chat.emptyTitle': 'Plan your European road trip',
  'chat.emptySubtitle': 'Tell me where you want to go and I\'ll build your itinerary on the map.',
  'chat.updatingTrip': 'Updating your trip...',
  'chat.confirmReset': 'Start over? This will clear your current trip and conversation.',
  'chat.confirmBurgerOn': 'Switch to Burger Challenge mode? Claude will adapt your current trip to focus on legendary burger spots.',
  'chat.confirmBurgerOff': 'Switch to standard mode? Claude will adapt your current trip to a regular road trip.',
  'chat.switchToBurger': 'Switch my trip to Burger Challenge mode! Adapt the existing stops to focus on legendary burger joints and add a burger achievement system.',
  'chat.switchToStandard': 'Switch my trip back to standard road trip mode. Adapt the existing stops to a regular sightseeing trip.',
  'chat.foodPreferences': 'I want to find great restaurants along my route! Ask me about our food preferences (cuisine types, dietary restrictions, budget, etc.) and then set the food_query so restaurants show up on the map.',

  'input.placeholder': 'Plan your trip...',

  'plan.emptyTitle': 'No itinerary yet',
  'plan.emptySubtitle': 'Your itinerary will appear here as you plan with Claude. Start by describing your dream European road trip!',
  'plan.defaultTripName': 'My European Road Trip',
  'plan.traveler': 'traveler',
  'plan.travelers': 'travelers',
  'plan.stop': 'stop',
  'plan.stops': 'stops',
  'plan.exportPdf': 'Export PDF',
  'plan.activities': 'Activities',
  'plan.night': 'night',
  'plan.nights': 'nights',
  'plan.perNight': '/night',
  'plan.accommodation': 'Accommodation',
  'plan.totalForStay': 'total',
  'plan.flight': 'flight',
  'plan.tripSummary': 'Trip Summary',
  'plan.totalNights': 'Total nights',
  'plan.driving': 'Driving',
  'plan.estTotalCost': 'Est. total cost',
  'plan.day': 'Day',

  'nav.chat': 'Chat',
  'nav.map': 'Map',
  'nav.plan': 'Plan',

  'tabs.map': 'Map',
  'tabs.plan': 'Plan',
};

const sv: Translations = {
  'chat.title': 'Reseplanerare',
  'chat.emptyTitle': 'Planera din europeiska roadtrip',
  'chat.emptySubtitle': 'Berätta vart du vill åka så bygger jag din resplan på kartan.',
  'chat.updatingTrip': 'Uppdaterar din resa...',
  'chat.confirmReset': 'Börja om? Detta rensar din nuvarande resa och konversation.',
  'chat.confirmBurgerOn': 'Byt till Burger Challenge-läge? Claude anpassar din nuvarande resa till att fokusera på legendariska burgarställen.',
  'chat.confirmBurgerOff': 'Byt till standardläge? Claude anpassar din nuvarande resa till en vanlig roadtrip.',
  'chat.switchToBurger': 'Byt min resa till Burger Challenge-läge! Anpassa befintliga stopp för att fokusera på legendariska burgarställen och lägg till ett burger-achievement-system.',
  'chat.switchToStandard': 'Byt min resa tillbaka till vanligt roadtrip-läge. Anpassa befintliga stopp till en vanlig sightseeingresa.',
  'chat.foodPreferences': 'Jag vill hitta bra restauranger längs vår rutt! Fråga mig om våra matpreferenser (kökstyper, allergier, budget osv.) och sätt sedan food_query så att restauranger visas på kartan.',

  'input.placeholder': 'Planera din resa...',

  'plan.emptyTitle': 'Ingen resplan ännu',
  'plan.emptySubtitle': 'Din resplan visas här när du planerar med Claude. Börja med att beskriva din drömresa!',
  'plan.defaultTripName': 'Min europeiska roadtrip',
  'plan.traveler': 'resenär',
  'plan.travelers': 'resenärer',
  'plan.stop': 'stopp',
  'plan.stops': 'stopp',
  'plan.exportPdf': 'Exportera PDF',
  'plan.activities': 'Aktiviteter',
  'plan.night': 'natt',
  'plan.nights': 'nätter',
  'plan.perNight': '/natt',
  'plan.accommodation': 'Boende',
  'plan.totalForStay': 'totalt',
  'plan.flight': 'flyg',
  'plan.tripSummary': 'Resöversikt',
  'plan.totalNights': 'Totalt nätter',
  'plan.driving': 'Körtid',
  'plan.estTotalCost': 'Uppskattad kostnad',
  'plan.day': 'Dag',

  'nav.chat': 'Chatt',
  'nav.map': 'Karta',
  'nav.plan': 'Plan',

  'tabs.map': 'Karta',
  'tabs.plan': 'Plan',
};

const translations: Record<Locale, Translations> = { en, sv };

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

export const LOCALE_CURRENCY: Record<Locale, string> = {
  en: 'EUR',
  sv: 'SEK',
};

export const LOCALE_LANGUAGE_NAME: Record<Locale, string> = {
  en: 'English',
  sv: 'Swedish',
};

// Map browser language codes to our supported locales
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.toLowerCase() ?? '';
  if (lang.startsWith('sv')) return 'sv';
  return 'en';
}
