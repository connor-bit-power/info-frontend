/**
 * useSports Hook
 * React hooks for fetching sports metadata and teams data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { polymarketApi } from '@/lib/api';
import type { SportsMetadata, Team, TeamQueryParams } from '@/types/polymarket';

export interface UseSportsMetadataOptions {
  enabled?: boolean;
}

export interface UseSportsMetadataResult {
  sports: SportsMetadata[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch sports metadata
 */
export function useSportsMetadata(
  options: UseSportsMetadataOptions = {}
): UseSportsMetadataResult {
  const { enabled = true } = options;
  const [sports, setSports] = useState<SportsMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSports = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.sports.getSportsMetadata();
      setSports(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchSports();
  }, [fetchSports]);

  return {
    sports,
    isLoading,
    error,
    refetch: fetchSports,
  };
}

export interface UseTeamsOptions extends TeamQueryParams {
  enabled?: boolean;
}

export interface UseTeamsResult {
  teams: Team[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getTeamById: (id: number) => Team | undefined;
}

/**
 * Hook to fetch teams
 */
export function useTeams(options: UseTeamsOptions = {}): UseTeamsResult {
  const { enabled = true, ...params } = options;
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await polymarketApi.sports.getTeams(params);
      setTeams(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, JSON.stringify(params)]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const getTeamById = useCallback(
    (id: number) => {
      return teams.find((team) => team.id === id);
    },
    [teams]
  );

  return {
    teams,
    isLoading,
    error,
    refetch: fetchTeams,
    getTeamById,
  };
}

