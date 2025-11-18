/**
 * Tags Service
 * API methods for tag-related endpoints
 */

import { apiClient } from '../client';
import { API_ENDPOINTS } from '../config';
import type { Tag, RelatedTag, TagQueryParams } from '@/types/polymarket';

export class TagsService {
  /**
   * Get list of tags
   */
  async getTags(params?: TagQueryParams): Promise<Tag[]> {
    return apiClient.get<Tag[]>(API_ENDPOINTS.tags, params);
  }

  /**
   * Get a specific tag by ID
   */
  async getTagById(
    id: string,
    includeTemplate: boolean = false
  ): Promise<Tag> {
    return apiClient.get<Tag>(API_ENDPOINTS.tagById(id), {
      include_template: includeTemplate,
    });
  }

  /**
   * Get a specific tag by slug
   */
  async getTagBySlug(
    slug: string,
    includeTemplate: boolean = false
  ): Promise<Tag> {
    return apiClient.get<Tag>(API_ENDPOINTS.tagBySlug(slug), {
      include_template: includeTemplate,
    });
  }

  /**
   * Get related tag relationships by tag ID
   */
  async getRelatedTagsById(
    id: string,
    omitEmpty: boolean = false,
    status?: 'active' | 'closed' | 'all'
  ): Promise<RelatedTag[]> {
    return apiClient.get<RelatedTag[]>(API_ENDPOINTS.relatedTagsById(id), {
      omit_empty: omitEmpty,
      status,
    });
  }

  /**
   * Get related tag relationships by tag slug
   */
  async getRelatedTagsBySlug(
    slug: string,
    omitEmpty: boolean = false,
    status?: 'active' | 'closed' | 'all'
  ): Promise<RelatedTag[]> {
    return apiClient.get<RelatedTag[]>(
      API_ENDPOINTS.relatedTagsBySlug(slug),
      {
        omit_empty: omitEmpty,
        status,
      }
    );
  }

  /**
   * Get full tag objects related to a tag by ID
   */
  async getRelatedTagObjectsById(
    id: string,
    omitEmpty: boolean = false,
    status?: 'active' | 'closed' | 'all'
  ): Promise<Tag[]> {
    return apiClient.get<Tag[]>(API_ENDPOINTS.relatedTagObjectsById(id), {
      omit_empty: omitEmpty,
      status,
    });
  }

  /**
   * Get full tag objects related to a tag by slug
   */
  async getRelatedTagObjectsBySlug(
    slug: string,
    omitEmpty: boolean = false,
    status?: 'active' | 'closed' | 'all'
  ): Promise<Tag[]> {
    return apiClient.get<Tag[]>(API_ENDPOINTS.relatedTagObjectsBySlug(slug), {
      omit_empty: omitEmpty,
      status,
    });
  }

  /**
   * Get carousel tags
   */
  async getCarouselTags(): Promise<Tag[]> {
    return this.getTags({ is_carousel: true });
  }

  /**
   * Search tags by label
   */
  async searchTags(query: string, limit: number = 20): Promise<Tag[]> {
    const tags = await this.getTags({ limit: 100 });
    return tags
      .filter(
        tag =>
          tag.label?.toLowerCase().includes(query.toLowerCase()) ||
          tag.slug?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  }
}

export const tagsService = new TagsService();





