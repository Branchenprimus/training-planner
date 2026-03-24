type Locale = 'en' | 'de'

type TranslationValue = string | ((params: Record<string, string | number>) => string)

const STORAGE_KEY = 'training-planner-locale'

const messages: Record<Locale, Record<string, TranslationValue>> = {
  en: {
    'nav.eyebrow': 'Personal Sports Dashboard',
    'nav.title': 'Training Planner',
    'nav.signedInAs': 'Signed in as',
    'nav.dashboard': 'Dashboard',
    'nav.running': 'Running',
    'nav.cycling': 'Cycling',
    'nav.swimming': 'Swimming',
    'nav.settings': 'Settings',
    'nav.back': 'App Dashboard',
    'banner.stravaTitle': 'Connect Strava to unlock your dashboard',
    'banner.stravaCopy': 'Your account is not connected to Strava yet. Open settings to connect it and start syncing activities.',
    'banner.stravaButton': 'Open settings',
    'wizard.title': 'Connect Strava to unlock your dashboard',
    'wizard.subtitle': 'Follow this short setup flow to prepare your Strava app and finish the connection.',
    'wizard.start': 'Start setup',
    'wizard.step1Title': 'Step 1: Prepare your Strava app',
    'wizard.step1Copy': 'Open your Strava API settings and copy these values into the Strava fields in this order before you continue.',
    'wizard.step2Title': 'Step 2: Enter your Strava app credentials',
    'wizard.step2Copy': 'Paste the client ID and client secret from your Strava API app, then finish setup to begin authorization.',
    'wizard.step3Title': 'Strava connection complete',
    'wizard.step3Copy': 'Your Strava account is connected. You can go back to Settings or open the dashboard now.',
    'wizard.stepErrorTitle': 'Strava setup needs attention',
    'wizard.stepErrorCopy': 'The authorization flow did not complete successfully. Review your app settings and try again.',
    'wizard.openStravaSettings': 'Open Strava API Settings',
    'wizard.copy': 'Copy',
    'wizard.copied': 'Copied',
    'wizard.copyFailed': 'Could not copy the value to the clipboard.',
    'wizard.continue': 'Continue',
    'wizard.cancel': 'Cancel',
    'wizard.back': 'Back',
    'wizard.finish': 'Finish setup',
    'wizard.finishPending': 'Opening Strava...',
    'wizard.settingsEntryTitle': 'Connect to Strava',
    'wizard.settingsEntryCopy': 'Start the guided setup to configure your Strava app and connect this account.',
    'wizard.settingsEntryButton': 'Open setup wizard',
    'loading.title': 'Loading',
    'loading.description': 'Fetching the latest dashboard data.',
    'counter.running': 'Running Counter',
    'counter.cycling': 'Cycling Counter',
    'counter.titleDue': 'Interval due now',
    'counter.titleProgress': ({ easyStreak, easyTarget }) => `${easyStreak}/${easyTarget} easy sessions`,
    'counter.descriptionDue': 'Your next qualifying hard session should be an interval workout.',
    'counter.descriptionRemaining': ({ remaining, suffix }) => `${remaining} easy session${suffix} until interval.`,
    'counter.planRatio': 'Plan ratio',
    'counter.streak': 'Easy-session streak',
    'counter.remaining': 'Remaining',
    'counter.dueBadge': 'Next session: interval',
    'counter.info': ({ sportLabel, easyTarget, intervalTarget }) =>
      `This counter follows a simple easy-versus-interval training rhythm for ${sportLabel}. Each Zone 2 session increases the easy streak, and a true Interval session resets it. Zone 3 and Zone 4 sessions do not reset the streak automatically. The current plan ratio is ${easyTarget}:${intervalTarget}, and you can change that ratio in Settings.`,
    'counter.aria': ({ sport }) => `How the ${sport} counter works`,
    'chart.howCalculated': ({ title }) => `How ${title} is calculated`,
    'chart.relativeEffort': 'Relative Effort',
    'chart.relativeEffortSeries': 'Relative Effort',
    'activity.openInStrava': 'Open in Strava',
    'activity.speed': 'Speed',
    'activity.pace': 'Pace',
    'activity.hr': 'HR',
    'activity.hrZone': 'HR zone',
    'activity.distance': 'Distance',
    'activity.elevation': 'Elevation',
    'activity.duration': 'Duration',
    'activity.relativeEffort': 'Relative Effort',
    'activity.relativeEffortBreakdown': 'Relative Effort breakdown',
    'activity.relativeEffortBreakdownHint': 'Hover to inspect zone-time breakdown',
    'activity.relativeEffortStreamBased': 'Based on HR stream samples',
    'activity.relativeEffortAverageBased': 'Estimated from average HR',
    'auth.success': 'Connection complete',
    'auth.error': 'Connection failed',
    'auth.title': 'Strava authorization',
    'auth.successMessage': 'Strava connected successfully. You can return to the dashboard and start a sync.',
    'auth.errorMessage': 'The Strava connection could not be completed.',
    'auth.dashboard': 'Go to dashboard',
    'auth.settings': 'Open settings',
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your Strava app connection and the heart-rate rules that decide which activities count as Zone 2, Zone 3, Zone 4, or Interval in tiles, counters, and charts.',
    'settings.syncInterval': 'Sync interval',
    'settings.lastDataPull': 'Last data pull',
    'settings.lastPullStatus': 'Last pull status',
    'settings.importedThisRun': 'Imported this run',
    'settings.manualPullTitle': 'Manual Strava pull',
    'settings.manualPullSubtitle': 'Start an on-demand sync and review the latest import status here.',
    'settings.manualPullButton': 'Pull Strava data now',
    'settings.syncingNow': 'Pulling data...',
    'settings.neverSynced': 'Never',
    'settings.waitingForFirstSync': 'Waiting for first sync.',
    'settings.connection': 'Connection',
    'settings.connected': 'Connected',
    'settings.disconnected': 'Disconnected',
    'settings.signedInAs': 'Signed in as',
    'settings.stravaApp': 'Strava app',
    'settings.configured': 'Configured',
    'settings.needsSetup': 'Needs setup',
    'settings.languageTitle': 'Language',
    'settings.languageSubtitle': 'Choose whether the app should use English or German text.',
    'settings.languageEnglish': 'English',
    'settings.languageGerman': 'Deutsch',
    'settings.stravaTitle': 'Strava App',
    'settings.stravaSubtitle': 'Enter the client ID and client secret from your Strava API application in normal language instead of editing env vars by hand.',
    'settings.credentialsSaved': 'Credentials saved',
    'settings.credentialsMissing': 'Credentials missing',
    'settings.stravaHintTitle': 'Strava setup hint',
    'settings.stravaHintText': 'In Strava, open your API application, copy the client ID and client secret into the fields below, then make sure the callback settings match this app exactly.',
    'settings.website': 'Website:',
    'settings.callbackDomain': 'Authorization Callback Domain:',
    'settings.callbackDomainFallback': 'Enter only your public app domain',
    'settings.redirectUri': 'Redirect URI:',
    'settings.openStravaSettings': 'Open Strava API Settings',
    'settings.clientId': 'Strava app client ID',
    'settings.clientIdPlaceholder': 'Example: 123456',
    'settings.clientIdHelp': 'This is the numeric client ID from your Strava app. It is used only on the server during OAuth.',
    'settings.clientSecret': 'Strava app client secret',
    'settings.clientSecretPlaceholderKeep': 'Leave blank to keep the current secret',
    'settings.clientSecretPlaceholderPaste': 'Paste the client secret from Strava',
    'settings.clientSecretHelp': 'The secret is write-only in the UI. Leave it blank to keep the currently saved secret.',
    'settings.resetStrava': 'Reset Strava connection',
    'settings.trainingRatioTitle': 'Training Ratio',
    'settings.trainingRatioSubtitle': 'Control how many Zone 2 sessions should come before an interval session is due. The default is `9 to 1`, but you can change the easy-to-interval ratio here.',
    'settings.zone2BeforeInterval': 'Zone 2 sessions before interval',
    'settings.intervalSessions': 'Interval sessions in the ratio',
    'settings.currentPlan': ({ zone2, interval }) => `Current plan: ${zone2} : ${interval}. The running and cycling counters use this saved ratio, while still resetting only when a true interval workout is detected.`,
    'settings.heartRateTitle': 'Heart Rate',
    'settings.heartRateSubtitle': 'Max heart rate is stored per sport and used to turn average HR into percentage-based zones. Those saved thresholds control the colored HR labels and which points get highlighted as strict Zone 2 in the charts.',
    'settings.runningMaxHr': 'Running max heart rate (bpm)',
    'settings.cyclingMaxHr': 'Cycling max heart rate (bpm)',
    'settings.heartRateHelp': 'Saving these values immediately recalculates HR zones, counter logic, and chart highlights for every imported activity. A run can still appear in the gray “all runs” line while dropping out of the highlighted Zone 2 overlay if its average HR no longer matches your saved zone range.',
    'settings.runningZonesTitle': 'Running Zones',
    'settings.runningZonesSubtitle': 'Percentages of your running max heart rate. Only runs whose average HR lands inside the saved Zone 2 range are highlighted in the Running Zone 2 Progress chart.',
    'settings.cyclingZonesTitle': 'Cycling Zones',
    'settings.cyclingZonesSubtitle': 'Percentages of your cycling max heart rate. Only rides whose average HR lands inside the saved Zone 2 range are highlighted in the Cycling Zone 2 Progress chart.',
    'settings.zoneMin': ({ zone }) => `${zone} min (%)`,
    'settings.zoneMax': ({ zone }) => `${zone} max (%)`,
    'settings.connectStrava': 'Connect Strava',
    'settings.connectHint': 'Save your Strava app client ID and secret first, then connect the account.',
    'settings.reviewTitle': 'Feedback',
    'settings.reviewSubtitle': 'Spotted something to improve? Open a GitHub issue directly from here.',
    'settings.reviewButton': 'Leave a review',
    'settings.logoutButton': 'Logout',
    'settings.logoutHint': 'Return to the authentication entrypoint for this app.',
    'page.charts': 'Charts',
    'page.chartsSubtitle': 'Performance trends for easy efforts and heart-rate context.',
    'page.recentActivities': 'Recent activities',
    'page.recentSubtitle': 'Latest imported sessions across all sports.',
    'page.noActivities': 'No activities yet',
    'page.noActivitiesDescription': 'Connect Strava and run your first sync to populate the dashboard.',
    'page.loadMoreActivities': 'Load more activities',
    'page.showingRecent': 'Showing recent activities from the last 12 months.',
    'page.runningTitle': 'Running Analysis',
    'page.runningSubtitle': 'Track easy pace trends, heart-rate relationship, run volume, and climbing over time.',
    'page.noRuns': 'No running activities',
    'page.noRunsDescription': 'Once Strava sync imports runs, they will appear here as mobile-friendly tiles.',
    'page.loadMoreRuns': 'Load more runs',
    'page.showingAllRuns': 'Showing all running activities from the last 12 months.',
    'page.cyclingTitle': 'Cycling Analysis',
    'page.cyclingSubtitle': 'Track speed trends, heart-rate relationship, and overall ride intensity over time.',
    'page.noRides': 'No cycling activities',
    'page.noRidesDescription': 'Connect Strava and sync to populate your cycling-specific dashboard.',
    'page.loadMoreRides': 'Load more rides',
    'page.showingAllRides': 'Showing all cycling activities from the last 12 months.',
    'page.noSwims': 'No swimming activities',
    'page.noSwimsDescription': 'Swims show up here independently and do not affect the running or cycling counters.',
    'page.loadMoreSwims': 'Load more swims',
    'page.showingAllSwims': 'Showing all swimming activities from the last 12 months.',
    'sport.running': 'Running',
    'sport.cycling': 'Cycling',
    'sport.swimming': 'Swimming',
    'zone.zone2': 'Zone 2',
    'zone.zone3': 'Zone 3',
    'zone.zone4': 'Zone 4',
    'zone.interval': 'Interval',
    'zone.unavailable': 'Unavailable',
    'zone.belowZone2': 'Below Zone 2',
    'zone.aboveInterval': 'Above Interval',
    'zone.unclassified': 'Unclassified'
  },
  de: {
    'nav.eyebrow': 'Persönliches Sport-Dashboard',
    'nav.title': 'Training Planner',
    'nav.signedInAs': 'Angemeldet als',
    'nav.dashboard': 'Dashboard',
    'nav.running': 'Laufen',
    'nav.cycling': 'Radfahren',
    'nav.swimming': 'Schwimmen',
    'nav.settings': 'Einstellungen',
    'nav.back': 'App-Dashboard',
    'banner.stravaTitle': 'Verbinde Strava, um dein Dashboard zu aktivieren',
    'banner.stravaCopy': 'Dein Konto ist noch nicht mit Strava verbunden. Öffne die Einstellungen, um Strava zu verbinden und Aktivitäten zu synchronisieren.',
    'banner.stravaButton': 'Einstellungen öffnen',
    'wizard.title': 'Verbinde Strava, um dein Dashboard zu aktivieren',
    'wizard.subtitle': 'Folge diesem kurzen Setup-Assistenten, um deine Strava-App vorzubereiten und die Verbindung abzuschließen.',
    'wizard.start': 'Setup starten',
    'wizard.step1Title': 'Schritt 1: Strava-App vorbereiten',
    'wizard.step1Copy': 'Öffne deine Strava-API-Einstellungen und trage diese Werte in genau dieser Reihenfolge in Strava ein, bevor du fortfährst.',
    'wizard.step2Title': 'Schritt 2: Zugangsdaten der Strava-App eingeben',
    'wizard.step2Copy': 'Füge die Client-ID und das Client-Secret deiner Strava-API-App ein und schließe dann das Setup ab, um die Autorisierung zu starten.',
    'wizard.step3Title': 'Strava-Verbindung abgeschlossen',
    'wizard.step3Copy': 'Dein Strava-Konto ist verbunden. Du kannst jetzt zu den Einstellungen oder direkt zum Dashboard zurückgehen.',
    'wizard.stepErrorTitle': 'Strava-Setup braucht Aufmerksamkeit',
    'wizard.stepErrorCopy': 'Der Autorisierungsvorgang wurde nicht erfolgreich abgeschlossen. Prüfe deine App-Einstellungen und versuche es erneut.',
    'wizard.openStravaSettings': 'Strava-API-Einstellungen öffnen',
    'wizard.copy': 'Kopieren',
    'wizard.copied': 'Kopiert',
    'wizard.copyFailed': 'Der Wert konnte nicht in die Zwischenablage kopiert werden.',
    'wizard.continue': 'Weiter',
    'wizard.cancel': 'Abbrechen',
    'wizard.back': 'Zurück',
    'wizard.finish': 'Setup abschließen',
    'wizard.finishPending': 'Strava wird geöffnet...',
    'wizard.settingsEntryTitle': 'Mit Strava verbinden',
    'wizard.settingsEntryCopy': 'Starte den geführten Assistenten, um deine Strava-App einzurichten und dieses Konto zu verbinden.',
    'wizard.settingsEntryButton': 'Setup-Assistent öffnen',
    'loading.title': 'Lädt',
    'loading.description': 'Die neuesten Dashboard-Daten werden geladen.',
    'counter.running': 'Laufzähler',
    'counter.cycling': 'Radzähler',
    'counter.titleDue': 'Intervall ist fällig',
    'counter.titleProgress': ({ easyStreak, easyTarget }) => `${easyStreak}/${easyTarget} lockere Einheiten`,
    'counter.descriptionDue': 'Deine nächste harte Einheit sollte ein Intervalltraining sein.',
    'counter.descriptionRemaining': ({ remaining, suffix }) => `Noch ${remaining} lockere Einheit${suffix} bis zum Intervall.`,
    'counter.planRatio': 'Planverhältnis',
    'counter.streak': 'Serie lockerer Einheiten',
    'counter.remaining': 'Verbleibend',
    'counter.dueBadge': 'Nächste Einheit: Intervall',
    'counter.info': ({ sportLabel, easyTarget, intervalTarget }) =>
      `Dieser Zähler folgt für ${sportLabel} einem einfachen Rhythmus aus lockeren und Intervall-Einheiten. Jede Zone-2-Einheit erhöht die lockere Serie, ein echtes Intervall setzt sie zurück. Zone 3 und Zone 4 setzen die Serie nicht automatisch zurück. Das aktuelle Planverhältnis ist ${easyTarget}:${intervalTarget} und kann in den Einstellungen angepasst werden.`,
    'counter.aria': ({ sport }) => `So funktioniert der ${sport}-Zähler`,
    'chart.howCalculated': ({ title }) => `So wird ${title} berechnet`,
    'chart.relativeEffort': 'Relative Effort',
    'chart.relativeEffortSeries': 'Relative Effort',
    'activity.openInStrava': 'In Strava öffnen',
    'activity.speed': 'Geschwindigkeit',
    'activity.pace': 'Pace',
    'activity.hr': 'HF',
    'activity.hrZone': 'HF-Zone',
    'activity.distance': 'Distanz',
    'activity.elevation': 'Höhenmeter',
    'activity.duration': 'Dauer',
    'activity.relativeEffort': 'Relative Effort',
    'activity.relativeEffortBreakdown': 'Relative-Effort-Aufschlüsselung',
    'activity.relativeEffortBreakdownHint': 'Darüberfahren, um die Zonenzeiten zu prüfen',
    'activity.relativeEffortStreamBased': 'Auf Basis von HF-Stream-Samples',
    'activity.relativeEffortAverageBased': 'Aus durchschnittlicher HF geschätzt',
    'auth.success': 'Verbindung abgeschlossen',
    'auth.error': 'Verbindung fehlgeschlagen',
    'auth.title': 'Strava-Autorisierung',
    'auth.successMessage': 'Strava wurde erfolgreich verbunden. Du kannst zum Dashboard zurückkehren und eine Synchronisierung starten.',
    'auth.errorMessage': 'Die Strava-Verbindung konnte nicht abgeschlossen werden.',
    'auth.dashboard': 'Zum Dashboard',
    'auth.settings': 'Einstellungen öffnen',
    'settings.title': 'Einstellungen',
    'settings.subtitle': 'Verwalte deine Strava-App-Verbindung und die Herzfrequenz-Regeln, die bestimmen, welche Aktivitäten in Kacheln, Zählern und Charts als Zone 2, Zone 3, Zone 4 oder Intervall zählen.',
    'settings.syncInterval': 'Sync-Intervall',
    'settings.lastDataPull': 'Letzter Datenabruf',
    'settings.lastPullStatus': 'Status des letzten Abrufs',
    'settings.importedThisRun': 'In diesem Lauf importiert',
    'settings.manualPullTitle': 'Manueller Strava-Abruf',
    'settings.manualPullSubtitle': 'Starte hier eine manuelle Synchronisierung und prüfe den neuesten Importstatus.',
    'settings.manualPullButton': 'Strava-Daten jetzt abrufen',
    'settings.syncingNow': 'Daten werden abgerufen...',
    'settings.neverSynced': 'Nie',
    'settings.waitingForFirstSync': 'Warte auf die erste Synchronisierung.',
    'settings.connection': 'Verbindung',
    'settings.connected': 'Verbunden',
    'settings.disconnected': 'Getrennt',
    'settings.signedInAs': 'Angemeldet als',
    'settings.stravaApp': 'Strava-App',
    'settings.configured': 'Konfiguriert',
    'settings.needsSetup': 'Einrichtung nötig',
    'settings.languageTitle': 'Sprache',
    'settings.languageSubtitle': 'Wähle, ob die App englische oder deutsche Texte verwenden soll.',
    'settings.languageEnglish': 'English',
    'settings.languageGerman': 'Deutsch',
    'settings.stravaTitle': 'Strava-App',
    'settings.stravaSubtitle': 'Trage die Client-ID und das Client-Secret deiner Strava-API-Anwendung direkt hier ein, statt Umgebungsvariablen per Hand zu bearbeiten.',
    'settings.credentialsSaved': 'Zugangsdaten gespeichert',
    'settings.credentialsMissing': 'Zugangsdaten fehlen',
    'settings.stravaHintTitle': 'Strava-Hinweis',
    'settings.stravaHintText': 'Öffne in Strava deine API-Anwendung, kopiere die Client-ID und das Client-Secret in die Felder unten und stelle sicher, dass die Callback-Einstellungen exakt zu dieser App passen.',
    'settings.website': 'Website:',
    'settings.callbackDomain': 'Authorization Callback Domain:',
    'settings.callbackDomainFallback': 'Nur die öffentliche App-Domain eintragen',
    'settings.redirectUri': 'Redirect URI:',
    'settings.openStravaSettings': 'Strava-API-Einstellungen öffnen',
    'settings.clientId': 'Strava-App-Client-ID',
    'settings.clientIdPlaceholder': 'Beispiel: 123456',
    'settings.clientIdHelp': 'Das ist die numerische Client-ID deiner Strava-App. Sie wird nur serverseitig während OAuth verwendet.',
    'settings.clientSecret': 'Strava-App-Client-Secret',
    'settings.clientSecretPlaceholderKeep': 'Leer lassen, um das aktuelle Secret zu behalten',
    'settings.clientSecretPlaceholderPaste': 'Client-Secret aus Strava einfügen',
    'settings.clientSecretHelp': 'Das Secret ist in der UI nur schreibbar. Leer lassen, um den aktuellen Wert zu behalten.',
    'settings.resetStrava': 'Strava-Verbindung zurücksetzen',
    'settings.trainingRatioTitle': 'Trainingsverhältnis',
    'settings.trainingRatioSubtitle': 'Lege fest, wie viele Zone-2-Einheiten vor einer fälligen Intervall-Einheit kommen sollen. Standard ist `9 zu 1`, du kannst das Verhältnis hier anpassen.',
    'settings.zone2BeforeInterval': 'Zone-2-Einheiten vor Intervall',
    'settings.intervalSessions': 'Intervall-Einheiten im Verhältnis',
    'settings.currentPlan': ({ zone2, interval }) => `Aktueller Plan: ${zone2} : ${interval}. Die Lauf- und Radzähler verwenden dieses gespeicherte Verhältnis und werden weiterhin nur durch echte Intervall-Einheiten zurückgesetzt.`,
    'settings.heartRateTitle': 'Herzfrequenz',
    'settings.heartRateSubtitle': 'Die maximale Herzfrequenz wird pro Sport gespeichert und wandelt die durchschnittliche HF in prozentuale Zonen um. Diese Schwellen steuern die farbigen HF-Labels und welche Punkte in den Charts als strikte Zone 2 hervorgehoben werden.',
    'settings.runningMaxHr': 'Maximale Herzfrequenz Laufen (bpm)',
    'settings.cyclingMaxHr': 'Maximale Herzfrequenz Radfahren (bpm)',
    'settings.heartRateHelp': 'Das Speichern dieser Werte berechnet HF-Zonen, Zählerlogik und Chart-Hervorhebungen für alle importierten Aktivitäten neu. Ein Lauf kann weiter in der grauen Linie aller Läufe erscheinen, aber aus dem hervorgehobenen Zone-2-Overlay fallen, wenn seine durchschnittliche HF nicht mehr zu deiner gespeicherten Zone passt.',
    'settings.runningZonesTitle': 'Laufzonen',
    'settings.runningZonesSubtitle': 'Prozentwerte deiner maximalen Lauf-Herzfrequenz. Nur Läufe, deren durchschnittliche HF in deine gespeicherte Zone 2 fällt, werden im Running Zone 2 Progress Chart hervorgehoben.',
    'settings.cyclingZonesTitle': 'Radzonen',
    'settings.cyclingZonesSubtitle': 'Prozentwerte deiner maximalen Rad-Herzfrequenz. Nur Fahrten, deren durchschnittliche HF in deine gespeicherte Zone 2 fällt, werden im Cycling Zone 2 Progress Chart hervorgehoben.',
    'settings.zoneMin': ({ zone }) => `${zone} min (%)`,
    'settings.zoneMax': ({ zone }) => `${zone} max (%)`,
    'settings.connectStrava': 'Strava verbinden',
    'settings.connectHint': 'Speichere zuerst Client-ID und Secret deiner Strava-App und verbinde dann den Account.',
    'settings.reviewTitle': 'Feedback',
    'settings.reviewSubtitle': 'Etwas entdeckt, das besser werden kann? Eröffne direkt von hier ein GitHub-Issue.',
    'settings.reviewButton': 'Review hinterlassen',
    'settings.logoutButton': 'Abmelden',
    'settings.logoutHint': 'Zur Authentifizierungs-Einstiegsseite dieser App zurückkehren.',
    'page.charts': 'Charts',
    'page.chartsSubtitle': 'Leistungstrends für lockere Belastungen und Herzfrequenz-Kontext.',
    'page.recentActivities': 'Letzte Aktivitäten',
    'page.recentSubtitle': 'Die zuletzt importierten Einheiten über alle Sportarten.',
    'page.noActivities': 'Noch keine Aktivitäten',
    'page.noActivitiesDescription': 'Verbinde Strava und starte den ersten Sync, um das Dashboard zu füllen.',
    'page.loadMoreActivities': 'Mehr Aktivitäten laden',
    'page.showingRecent': 'Es werden Aktivitäten aus den letzten 12 Monaten angezeigt.',
    'page.runningTitle': 'Laufanalyse',
    'page.runningSubtitle': 'Verfolge Pace-Trends bei lockeren Einheiten, die Herzfrequenz-Beziehung, Laufumfang und Höhenmeter im Zeitverlauf.',
    'page.noRuns': 'Keine Laufaktivitäten',
    'page.noRunsDescription': 'Sobald Strava Läufe importiert, erscheinen sie hier als mobile Kacheln.',
    'page.loadMoreRuns': 'Mehr Läufe laden',
    'page.showingAllRuns': 'Es werden alle Laufaktivitäten der letzten 12 Monate angezeigt.',
    'page.cyclingTitle': 'Radanalyse',
    'page.cyclingSubtitle': 'Verfolge Geschwindigkeitstrends, die Herzfrequenz-Beziehung und die gesamte Belastung deiner Fahrten im Zeitverlauf.',
    'page.noRides': 'Keine Radaktivitäten',
    'page.noRidesDescription': 'Verbinde Strava und synchronisiere, um dein Rad-Dashboard zu füllen.',
    'page.loadMoreRides': 'Mehr Fahrten laden',
    'page.showingAllRides': 'Es werden alle Radaktivitäten der letzten 12 Monate angezeigt.',
    'page.noSwims': 'Keine Schwimmaktivitäten',
    'page.noSwimsDescription': 'Schwimmeinheiten erscheinen hier separat und beeinflussen weder Lauf- noch Radzähler.',
    'page.loadMoreSwims': 'Mehr Schwimmeinheiten laden',
    'page.showingAllSwims': 'Es werden alle Schwimmaktivitäten der letzten 12 Monate angezeigt.',
    'sport.running': 'Laufen',
    'sport.cycling': 'Radfahren',
    'sport.swimming': 'Schwimmen',
    'zone.zone2': 'Zone 2',
    'zone.zone3': 'Zone 3',
    'zone.zone4': 'Zone 4',
    'zone.interval': 'Intervall',
    'zone.unavailable': 'Nicht verfügbar',
    'zone.belowZone2': 'Unter Zone 2',
    'zone.aboveInterval': 'Über Intervall',
    'zone.unclassified': 'Nicht klassifiziert'
  }
}

function resolveMessage(locale: Locale, key: string): TranslationValue | undefined {
  return messages[locale][key] ?? messages.en[key]
}

function formatMessage(value: TranslationValue | undefined, params: Record<string, string | number>) {
  if (typeof value === 'function') {
    return value(params)
  }

  if (!value) {
    return ''
  }

  return value.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? ''))
}

function detectLocale(): Locale {
  if (!import.meta.client) {
    return 'en'
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'de') {
    return stored
  }

  return window.navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en'
}

export function useI18n() {
  const locale = useState<Locale>('app-locale', () => 'en')
  const initialized = useState<boolean>('app-locale-initialized', () => false)

  if (import.meta.client && !initialized.value) {
    initialized.value = true
    locale.value = detectLocale()

    watch(
      locale,
      (nextLocale) => {
        window.localStorage.setItem(STORAGE_KEY, nextLocale)
        document.documentElement.lang = nextLocale === 'de' ? 'de' : 'en'
      },
      { immediate: true }
    )
  }

  function setLocale(nextLocale: Locale) {
    locale.value = nextLocale
  }

  function t(key: string, params: Record<string, string | number> = {}) {
    return formatMessage(resolveMessage(locale.value, key), params)
  }

  function translateSport(sport: string) {
    return t(`sport.${sport}`)
  }

  function translateHrZoneLabel(label: string) {
    const normalized = label.trim().toLowerCase()
    if (normalized === 'zone 2') {
      return t('zone.zone2')
    }
    if (normalized === 'zone 3') {
      return t('zone.zone3')
    }
    if (normalized === 'zone 4') {
      return t('zone.zone4')
    }
    if (normalized === 'interval') {
      return t('zone.interval')
    }
    if (normalized === 'unavailable') {
      return t('zone.unavailable')
    }
    if (normalized === 'below zone 2') {
      return t('zone.belowZone2')
    }
    if (normalized === 'above interval') {
      return t('zone.aboveInterval')
    }
    if (normalized === 'unclassified') {
      return t('zone.unclassified')
    }

    return label
  }

  return {
    locale,
    setLocale,
    t,
    translateSport,
    translateHrZoneLabel
  }
}
