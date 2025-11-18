/**
 * Sports Service
 * API methods for sports-related endpoints
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { SportsMetadata, Team, TeamQueryParams } from '@/types/polymarket';

export class SportsService {
  /**
   * Get sports metadata information
   * Returns sport configuration data including tag IDs for filtering
   */
  async getSportsMetadata(): Promise<SportsMetadata[]> {
    return apiClient.get<SportsMetadata[]>(API_ENDPOINTS.sports);
  }

  /**
   * Get sport metadata by sport code
   */
  async getSportByCode(sportCode: string): Promise<SportsMetadata | null> {
    const sports = await this.getSportsMetadata();
    return sports.find(s => s.sport === sportCode) || null;
  }

  /**
   * Get tag IDs for a specific sport
   */
  async getTagsForSport(sportCode: string): Promise<string[]> {
    const sport = await this.getSportByCode(sportCode);
    return sport?.tags.split(',').map(t => t.trim()) || [];
  }

  /**
   * Get list of teams
   */
  async getTeams(params?: TeamQueryParams): Promise<Team[]> {
    return apiClient.get<Team[]>(API_ENDPOINTS.teams, params);
  }

  /**
   * Get teams by league
   */
  async getTeamsByLeague(
    league: string,
    limit: number = 50
  ): Promise<Team[]> {
    return this.getTeams({ league, limit });
  }

  /**
   * Get team by name
   */
  async getTeamByName(name: string): Promise<Team | null> {
    const teams = await this.getTeams({ name });
    return teams.length > 0 ? teams[0] : null;
  }

  /**
   * Get team by abbreviation
   */
  async getTeamByAbbreviation(abbreviation: string): Promise<Team | null> {
    const teams = await this.getTeams({ abbreviation });
    return teams.length > 0 ? teams[0] : null;
  }

  /**
   * Get all available leagues
   */
  async getAvailableLeagues(): Promise<string[]> {
    const teams = await this.getTeams({ limit: 1000 });
    const leagues = new Set(teams.map(t => t.league).filter(Boolean));
    return Array.from(leagues) as string[];
  }

  /**
   * Get all available sports
   */
  async getAvailableSports(): Promise<string[]> {
    const sports = await this.getSportsMetadata();
    return sports.map(s => s.sport);
  }
}

export const sportsService = new SportsService();





