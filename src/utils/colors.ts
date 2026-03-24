import { TEAM_COLORS } from '../constants'

export function getTeamColor(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length]
}
