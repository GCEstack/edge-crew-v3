import type { EnrichedGame, Side, TeamProfile } from '../grade-types.ts'
import { scoreStarPlayer } from './team.ts'

// Local helper utilities (mirrors grade_engine.py helpers)
function clamp(val: number, lo = 1, hi = 10): number {
  return Math.max(lo, Math.min(hi, Math.round(val * 10) / 10))
}

function getProfile(game: EnrichedGame, side: Side): TeamProfile {
  return game[`${side}_profile`] ?? {}
}

function getTeamName(game: EnrichedGame, side: Side): string {
  if (side === 'home') {
    return game.homeTeam ?? game.home_team ?? game.home ?? ''
  }
  return game.awayTeam ?? game.away_team ?? game.away ?? ''
}

type ScoreNote = [number, string]

// ─── Hardcoded soccer knowledge ───────────────────────────────────────────────
// Top scorer / key creator per top-flight club. Keyed by lowercased team
// displayName / shortDisplayName. A single missing elite starter is worth a
// meaningful swing in the star_player variable.

export const ELITE_SOCCER_STRIKERS: Record<string, string[]> = {
  // Premier League
  'manchester city': ['haaland', 'de bruyne', 'foden'],
  'man city': ['haaland', 'de bruyne', 'foden'],
  'arsenal': ['saka', 'odegaard', 'havertz'],
  'liverpool': ['salah', 'nunez', 'diaz'],
  'tottenham': ['son', 'solanke', 'maddison'],
  'tottenham hotspur': ['son', 'solanke', 'maddison'],
  'chelsea': ['palmer', 'jackson', 'madueke'],
  'manchester united': ['fernandes', 'rashford', 'hojlund'],
  'man united': ['fernandes', 'rashford', 'hojlund'],
  'newcastle': ['isak', 'gordon', 'bruno'],
  'newcastle united': ['isak', 'gordon', 'bruno'],
  'aston villa': ['watkins', 'rogers', 'mcginn'],
  'west ham': ['bowen', 'kudus', 'paqueta'],
  'west ham united': ['bowen', 'kudus', 'paqueta'],
  'brighton': ['mitoma', 'joao pedro', 'welbeck'],
  'brighton & hove albion': ['mitoma', 'joao pedro', 'welbeck'],
  'brentford': ['mbeumo', 'wissa'],
  'crystal palace': ['eze', 'mateta', 'olise'],
  'fulham': ['muniz', 'iwobi', 'pereira'],
  'wolverhampton wanderers': ['cunha', 'hwang', 'sarabia'],
  'wolves': ['cunha', 'hwang', 'sarabia'],
  'nottingham forest': ['wood', 'hudson-odoi', 'gibbs-white'],
  'everton': ['calvert-lewin', 'ndiaye', 'mcneil'],
  'bournemouth': ['evanilson', 'semenyo', 'kluivert'],
  'ipswich town': ['delap', 'hirst'],
  'leicester city': ['vardy', 'mavididi'],
  'southampton': ['armstrong', 'dibling'],
  // La Liga
  'real madrid': ['mbappe', 'vinicius', 'bellingham', 'rodrygo'],
  'barcelona': ['lewandowski', 'yamal', 'raphinha', 'pedri'],
  'atletico madrid': ['griezmann', 'alvarez', 'morata'],
  'atletico': ['griezmann', 'alvarez', 'morata'],
  'athletic club': ['williams', 'guruzeta'],
  'athletic bilbao': ['williams', 'guruzeta'],
  'real sociedad': ['oyarzabal', 'becker', 'kubo'],
  'real betis': ['isco', 'bakambu', 'ezzalzouli'],
  'villarreal': ['moreno', 'baena', 'barry'],
  'sevilla': ['romero', 'rafa mir', 'lukebakio'],
  'valencia': ['hugo duro', 'canos'],
  'girona': ['stuani', 'tsygankov', 'portu'],
  // Serie A
  'inter milan': ['lautaro martinez', 'thuram', 'calhanoglu'],
  'inter': ['lautaro martinez', 'thuram', 'calhanoglu'],
  'ac milan': ['leao', 'pulisic', 'morata', 'reijnders'],
  'milan': ['leao', 'pulisic', 'morata', 'reijnders'],
  'juventus': ['vlahovic', 'yildiz', 'koopmeiners'],
  'napoli': ['lukaku', 'kvaratskhelia', 'mctominay', 'politano'],
  'roma': ['dybala', 'dovbyk', 'pellegrini'],
  'as roma': ['dybala', 'dovbyk', 'pellegrini'],
  'lazio': ['zaccagni', 'castellanos', 'dia'],
  'atalanta': ['retegui', 'lookman', 'de ketelaere'],
  'fiorentina': ['kean', 'beltran', 'gudmundsson'],
  'bologna': ['orsolini', 'castro', 'ndoye'],
  'torino': ['zapata', 'sanabria'],
  // Bundesliga
  'bayern munich': ['kane', 'musiala', 'sane', 'olise'],
  'fc bayern munchen': ['kane', 'musiala', 'sane', 'olise'],
  'bayer leverkusen': ['wirtz', 'boniface', 'schick', 'frimpong'],
  'borussia dortmund': ['adeyemi', 'guirassy', 'brandt', 'gittens'],
  'dortmund': ['adeyemi', 'guirassy', 'brandt', 'gittens'],
  'rb leipzig': ['openda', 'sesko', 'olmo'],
  'eintracht frankfurt': ['marmoush', 'ekitike', 'uzun'],
  'vfb stuttgart': ['woltemade', 'undav', 'demirovic'],
  'stuttgart': ['woltemade', 'undav', 'demirovic'],
  'borussia monchengladbach': ['kleindienst', 'hack', 'honorat'],
  'werder bremen': ['ducksch', 'njinmah'],
  'wolfsburg': ['wind', 'majer'],
  // Ligue 1
  'paris saint-germain': ['dembele', 'barcola', 'kolo muani', 'doue'],
  'psg': ['dembele', 'barcola', 'kolo muani', 'doue'],
  'marseille': ['greenwood', 'maupay', 'rabiot'],
  'olympique marseille': ['greenwood', 'maupay', 'rabiot'],
  'monaco': ['ben seghir', 'embolo', 'balogun'],
  'lille': ['david', 'zhegrova', 'cabella'],
  'lyon': ['lacazette', 'mikautadze', 'cherki'],
  'olympique lyonnais': ['lacazette', 'mikautadze', 'cherki'],
  'nice': ['guessand', 'boga', 'moffi'],
  'strasbourg': ['emegha', 'diarra'],
  // MLS
  'inter miami': ['messi', 'suarez', 'alba', 'busquets'],
  'inter miami cf': ['messi', 'suarez', 'alba', 'busquets'],
  'lafc': ['bouanga', 'giroud'],
  'los angeles fc': ['bouanga', 'giroud'],
  'la galaxy': ['pec', 'paintsil', 'joveljic'],
  'cincinnati': ['denkey', 'acosta'],
  'fc cincinnati': ['denkey', 'acosta'],
  'columbus crew': ['rossi', 'cucho hernandez'],
  'seattle sounders': ['ruidiaz', 'morris'],
  'seattle sounders fc': ['ruidiaz', 'morris'],
  'philadelphia union': ['uhre', 'carranza'],
  'new york city fc': ['martinez', 'magno'],
  'atlanta united': ['silva', 'almada'],
  'atlanta united fc': ['silva', 'almada'],
  'portland timbers': ['moreno', 'mora'],
  'new york red bulls': ['choupo-moting', 'morgan'],
  'orlando city': ['torres', 'pereyra'],
  'orlando city sc': ['torres', 'pereyra'],
  'vancouver whitecaps': ['brian white', 'gauld'],
  'vancouver whitecaps fc': ['brian white', 'gauld'],
  // Liga MX
  'club america': ['henry martin', 'zendejas', 'rodrigo aguirre'],
  'america': ['henry martin', 'zendejas', 'rodrigo aguirre'],
  'chivas': ['alvarado', 'pulido'],
  'guadalajara': ['alvarado', 'pulido'],
  'monterrey': ['berterame', 'canales', 'ocampos'],
  'tigres': ['gignac', 'brunetta'],
  'tigres uanl': ['gignac', 'brunetta'],
  'cruz azul': ['rotondi', 'sepulveda'],
  'pumas': ['dinenno', 'silva'],
  'pumas unam': ['dinenno', 'silva'],
}

export const TEAM_STARTING_KEEPERS: Record<string, string> = {
  // Premier League
  'manchester city': 'ederson',
  'man city': 'ederson',
  'arsenal': 'raya',
  'liverpool': 'alisson',
  'tottenham': 'vicario',
  'tottenham hotspur': 'vicario',
  'chelsea': 'sanchez',
  'manchester united': 'onana',
  'man united': 'onana',
  'newcastle': 'pope',
  'newcastle united': 'pope',
  'aston villa': 'emi martinez',
  'west ham': 'areola',
  'west ham united': 'areola',
  'brighton': 'verbruggen',
  'brighton & hove albion': 'verbruggen',
  'brentford': 'flekken',
  'crystal palace': 'henderson',
  'fulham': 'leno',
  'everton': 'pickford',
  'wolves': 'sa',
  'wolverhampton wanderers': 'sa',
  'bournemouth': 'kepa',
  'nottingham forest': 'sels',
  'ipswich': 'walton',
  'ipswich town': 'walton',
  'leicester': 'hermansen',
  'leicester city': 'hermansen',
  'southampton': 'ramsdale',
  'leeds': 'meslier',
  'leeds united': 'meslier',
  // La Liga
  'real madrid': 'courtois',
  'barcelona': 'ter stegen',
  'atletico madrid': 'oblak',
  'real sociedad': 'remiro',
  'athletic bilbao': 'rulli',
  'athletic club': 'rulli',
  'villarreal': 'jorgensen',
  'real betis': 'rui silva',
  'girona': 'gazzaniga',
  'sevilla': 'bounou',
  'valencia': 'mamardashvili',
  'getafe': 'soria',
  'celta vigo': 'guaita',
  'rayo vallecano': 'dimitrievski',
  'mallorca': 'greif',
  'levante': 'cardenas',
  // Serie A
  'inter milan': 'sommer',
  'internazionale': 'sommer',
  'ac milan': 'maignan',
  'milan': 'maignan',
  'juventus': 'di gregorio',
  'napoli': 'meret',
  'roma': 'svilar',
  'as roma': 'svilar',
  'atalanta': 'carnesecchi',
  'lazio': 'provedel',
  'fiorentina': 'de gea',
  'bologna': 'skorupski',
  'torino': 'milinkovic-savic',
  // Bundesliga
  'bayern munich': 'neuer',
  'bayern': 'neuer',
  'borussia dortmund': 'kobel',
  'dortmund': 'kobel',
  'bayer leverkusen': 'hradecky',
  'leverkusen': 'hradecky',
  'rb leipzig': 'gulacsi',
  'leipzig': 'gulacsi',
  'stuttgart': 'nubel',
  'vfb stuttgart': 'nubel',
  'eintracht frankfurt': 'trapp',
  'frankfurt': 'trapp',
  // Ligue 1
  'psg': 'donnarumma',
  'paris saint-germain': 'donnarumma',
  'marseille': 'de lange',
  'olympique marseille': 'de lange',
  'monaco': 'kohn',
  'lyon': 'perri',
  'olympique lyonnais': 'perri',
  'lille': 'chevalier',
  // MLS
  'inter miami': 'callender',
  'la galaxy': 'scott',
  'lafc': 'crepeau',
  'los angeles fc': 'crepeau',
  'atlanta united': 'guzan',
  'seattle sounders': 'thomas',
  'columbus crew': 'schulte',
  'fc cincinnati': 'kann',
  // Liga MX
  'club america': 'ochoa',
  'america': 'ochoa',
  'chivas': 'rangel',
  'guadalajara': 'rangel',
  'monterrey': 'andrada',
  'tigres': 'guzman',
  'tigres uanl': 'guzman',
  'cruz azul': 'jurado',
}

export const ELITE_SOCCER_KEEPERS = new Set<string>([
  'alisson',
  'courtois',
  'ederson',
  'donnarumma',
  'oblak',
  'ter stegen',
  'sommer',
  'onana',
  'maignan',
  'raya',
  'sanchez',
  'dibu martinez',
  'emi martinez',
  'emiliano martinez',
  'pickford',
  'neuer',
  'szczesny',
  'bounou',
  'lunin',
  'rulli',
  'provedel',
  'milinkovic-savic',
  'di gregorio',
  'svilar',
  'mamardashvili',
  'remiro',
])

export const GOOD_SOCCER_KEEPERS = new Set<string>([
  'kepa',
  'areola',
  'henderson',
  'turner',
  'flekken',
  'sels',
  'pope',
  'steele',
  'fabianski',
  'vicario',
  'meslier',
  'forster',
  'jorgensen',
  'sa',
  'verbruggen',
  'gunn',
  'ramsdale',
])

export const LEAGUE_HOME_BOOST_MAP: Record<string, number> = {
  'soccer_turkey_super_league': 8,
  'soccer_mexico_ligamx': 8,
  'soccer_brazil_campeonato': 8,
  'soccer_epl': 5,
  'soccer_england_league1': 5,
  'soccer_germany_bundesliga': 5,
  'soccer_germany_bundesliga2': 5,
  'soccer_usa_mls': 4,
  'soccer_spain_la_liga': 6,
  'soccer_italy_serie_a': 6,
  'soccer_france_ligue_one': 5,
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

export function soccerKeeperTier(name: string): 'ELITE' | 'GOOD' | null {
  if (!name) return null
  const lc = name.trim().toLowerCase()
  const last = lc.split(/\s+/).pop() ?? ''
  for (const key of ELITE_SOCCER_KEEPERS) {
    if (key === last || lc.endsWith(key)) return 'ELITE'
  }
  for (const key of GOOD_SOCCER_KEEPERS) {
    if (key === last || lc.endsWith(key)) return 'GOOD'
  }
  return null
}

function soccerTeamStars(teamName: string): string[] {
  if (!teamName) return []
  const key = teamName.trim().toLowerCase()
  const stars = ELITE_SOCCER_STRIKERS[key]
  if (stars) return stars
  for (const suffix of [' fc', ' cf', ' sc', ' afc']) {
    if (key.endsWith(suffix)) {
      const stripped = key.slice(0, -suffix.length)
      const strippedStars = ELITE_SOCCER_STRIKERS[stripped]
      if (strippedStars) return strippedStars
    }
  }
  for (const [dk, v] of Object.entries(ELITE_SOCCER_STRIKERS)) {
    if (dk.includes(key) || key.includes(dk)) return v
  }
  return []
}

function soccerStarsOut(game: EnrichedGame, side: Side): Array<[string, string]> {
  const team = getTeamName(game, side)
  const stars = soccerTeamStars(team)
  if (!stars.length) return []
  const injuries = game.injuries?.[side] ?? []
  const hits: Array<[string, string]> = []
  for (const inj of injuries) {
    const status = inj.status ?? ''
    if (!['OUT', 'DOUBTFUL', 'SUSPENDED'].includes(status.toUpperCase())) continue
    const pname = (inj.name ?? inj.player ?? '').trim().toLowerCase()
    if (!pname) continue
    for (const star of stars) {
      if (pname.includes(star)) {
        hits.push([inj.name ?? inj.player ?? pname, status])
        break
      }
    }
  }
  return hits
}

// ─── Soccer-specific scorers ──────────────────────────────────────────────────
// Each returns [score: 1-10, note: string]

export function scoreSoccerKeyPlayer(game: EnrichedGame, side: Side): ScoreNote {
  const ourOut = soccerStarsOut(game, side)
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const oppOut = soccerStarsOut(game, oppSide)
  if (!ourOut.length && !oppOut.length) {
    return scoreStarPlayer(game, side)
  }
  const score = 5.0 + 2.0 * oppOut.length - 2.0 * ourOut.length
  const parts: string[] = []
  if (oppOut.length) {
    parts.push('OPP out: ' + oppOut.map(([n]) => n).join(', '))
  }
  if (ourOut.length) {
    parts.push('US out: ' + ourOut.map(([n]) => n).join(', '))
  }
  return [clamp(score), parts.join(' | ')]
}

export function scoreFixtureCongestion(game: EnrichedGame, side: Side): ScoreNote {
  const p = getProfile(game, side)
  const oppSide: Side = side === 'home' ? 'away' : 'home'
  const opp = getProfile(game, oppSide)
  let our: number | undefined | null = p.matches_in_10d
  if (our == null) our = p.congestion_10d
  let their: number | undefined | null = opp.matches_in_10d
  if (their == null) their = opp.congestion_10d
  if (our == null && their == null) {
    return [5, 'No congestion data']
  }
  const ourI = parseInt(String(our ?? 0), 10)
  const theirI = parseInt(String(their ?? 0), 10)
  if (Number.isNaN(ourI) || Number.isNaN(theirI)) {
    return [5, 'No congestion data']
  }
  const diff = theirI - ourI
  if (diff >= 3) return [9, `Them:${theirI} vs Us:${ourI} in 10d (heavy legs opp)`]
  if (diff === 2) return [8, `Them:${theirI} vs Us:${ourI} in 10d`]
  if (diff === 1) return [6.5, `Them:${theirI} vs Us:${ourI} in 10d`]
  if (diff === 0) return [5, `Even:${ourI} matches in 10d`]
  if (diff === -1) return [3.5, `Them:${theirI} vs Us:${ourI} in 10d`]
  if (diff === -2) return [2, `Them:${theirI} vs Us:${ourI} in 10d (heavy legs us)`]
  return [1.5, `Them:${theirI} vs Us:${ourI} in 10d (very heavy legs us)`]
}

export function scoreGoalkeeper(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const keeperName = profile.goalkeeper ?? profile.keeper ?? ''
  if (!keeperName) {
    return [5, 'no goalkeeper data']
  }
  const tier = soccerKeeperTier(keeperName)
  const tierMap: Record<string, number> = { ELITE: 9, GOOD: 7 }
  const score = tierMap[tier ?? ''] ?? 5
  return [clamp(score), `${keeperName}: ${tier ?? 'unknown'}`]
}

export function scoreXgDiff(profile: TeamProfile): ScoreNote {
  return [5, 'no xG data']
}

export function scoreSquadRotation(game: EnrichedGame, side: Side): ScoreNote {
  const profile = getProfile(game, side)
  const congestion = profile.matches_in_10d ?? profile.congestion_10d
  if (congestion == null) {
    return [5, 'no congestion data for rotation']
  }
  const c = parseInt(String(congestion), 10)
  if (Number.isNaN(c)) {
    return [5, 'no congestion data for rotation']
  }
  if (c >= 3) return [8, `HIGH rotation risk: ${c} matches in 10d`]
  if (c === 2) return [6, `Moderate rotation: ${c} matches in 10d`]
  if (c <= 1) return [2, `LOW rotation risk: ${c} matches in 10d`]
  return [5, `${c} matches in 10d`]
}

export function scoreLeagueHomeBoost(game: EnrichedGame, side: Side): ScoreNote {
  const league = String(game.odds_key ?? game.league ?? '').toLowerCase()
  const boost = LEAGUE_HOME_BOOST_MAP[league]
  if (boost != null) {
    const isHome = side === 'home'
    if (isHome) {
      return [clamp(boost), `League home boost: ${league} (${boost})`]
    }
    const inv = 10 - boost
    return [clamp(inv), `League home boost (away): ${league} (${inv})`]
  }
  return [5, `no league home boost for ${league}`]
}

export function scoreSetPiece(_profile: TeamProfile): ScoreNote {
  return [5, 'no set piece data']
}
