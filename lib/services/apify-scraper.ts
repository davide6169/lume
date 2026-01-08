// ============================================
// Apify Scraper Service
// Alternative to Meta GraphAPI for Instagram & Facebook
// ============================================

import {
  ParsedMetaUrl,
  FacebookComment,
  InstagramComment,
  FetchOptions,
  MetaGraphApiError,
  MetaErrorType,
} from '@/types'

interface ApifyRunResponse {
  id: string
  actId: string
  status: 'READY' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED-OUT' | 'ABORTED'
  startedAt: string
  finishedAt: string
  datasetId: string
}

interface ApifyDatasetItem {
  // Instagram comment fields
  text?: string
  timestamp?: string
  ownerUsername?: string
  ownerFullName?: string
  ownerId?: string

  // Facebook comment fields
  commentText?: string
  commentTime?: string
  commenterName?: string
  commenterId?: string

  // Common fields
  url?: string
  type?: string
}

export class ApifyScraperService {
  private apiToken: string
  private baseUrl: string = 'https://api.apify.com/v2'

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  // ============================================
  // URL Parsing (riutilizzato da meta-graphapi)
  // ============================================

  /**
   * Parse a Facebook or Instagram URL to extract platform, type, and ID/username
   */
  parseUrl(url: string): ParsedMetaUrl {
    // Remove protocol and www if present
    const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '')

    // Facebook patterns
    if (cleanUrl.includes('facebook.com')) {
      // Match post: facebook.com/{page}/posts/{post_id}
      const postMatch = cleanUrl.match(/facebook\.com\/([^/]+)\/posts\/(\d+)/)
      if (postMatch) {
        return {
          platform: 'facebook',
          type: 'post',
          id: postMatch[2],
          username: postMatch[1],
        }
      }

      // Match group: facebook.com/groups/{group_id}
      const groupMatch = cleanUrl.match(/facebook\.com\/groups\/(\d+)/)
      if (groupMatch) {
        return {
          platform: 'facebook',
          type: 'group',
          id: groupMatch[1],
        }
      }

      // Match page: facebook.com/{page_name} or facebook.com/{page_id}
      const pageMatch = cleanUrl.match(/facebook\.com\/([^/?]+)/)
      if (pageMatch) {
        const potentialId = pageMatch[1]
        // Check if it's numeric (page ID)
        if (/^\d+$/.test(potentialId)) {
          return {
            platform: 'facebook',
            type: 'page',
            id: potentialId,
          }
        }
        // It's a page name - will need to resolve to ID
        return {
          platform: 'facebook',
          type: 'page',
          id: potentialId,
          username: potentialId,
        }
      }
    }

    // Instagram patterns
    if (cleanUrl.includes('instagram.com')) {
      // Match post: instagram.com/p/{post_id}/
      const postMatch = cleanUrl.match(/instagram\.com\/p\/([^/?]+)/)
      if (postMatch) {
        return {
          platform: 'instagram',
          type: 'post',
          id: postMatch[1],
        }
      }

      // Match reel: instagram.com/reel/{reel_id}/
      const reelMatch = cleanUrl.match(/instagram\.com\/reel\/([^/?]+)/)
      if (reelMatch) {
        return {
          platform: 'instagram',
          type: 'reel',
          id: reelMatch[1],
        }
      }

      // Match profile: instagram.com/{username}
      const profileMatch = cleanUrl.match(/instagram\.com\/([^/?]+)/)
      if (profileMatch) {
        return {
          platform: 'instagram',
          type: 'profile',
          id: profileMatch[1],
          username: profileMatch[1],
        }
      }
    }

    throw new Error(`Unsupported URL format: ${url}`)
  }

  // ============================================
  // Instagram Scraping
  // ============================================

  /**
   * Fetch comments from Instagram profile posts
   */
  async fetchInstagramComments(
    url: string,
    options: FetchOptions = {}
  ): Promise<InstagramComment[]> {
    const parsed = this.parseUrl(url)

    if (parsed.platform !== 'instagram') {
      throw new Error('URL must be an Instagram URL')
    }

    // Check if URL is a profile (not supported)
    if (parsed.type === 'profile') {
      throw new Error(
        'Instagram profile URLs are not supported. Please use a specific post or reel URL.\n' +
        'Supported formats:\n' +
        '  - https://www.instagram.com/p/ABC123/ (post)\n' +
        '  - https://www.instagram.com/reel/ABC123/ (reel)\n' +
        'To get a post/reel URL:\n' +
        '  1. Open Instagram\n' +
        '  2. Find a post with comments\n' +
        '  3. Click the three dots (•••) on the post\n' +
        '  4. Select "Copy link"\n' +
        '  5. Paste that URL here\n\n' +
        'Note: Profile URLs like "instagram.com/username" will NOT work.'
      )
    }

    try {
      // Start Apify Instagram scraper
      const run = await this.startInstagramScraper(url, options)

      // Wait for completion (pass actor ID)
      await this.waitForRun(run.id, 'apify~instagram-scraper')

      // Fetch results
      const datasetId = run.datasetId
      const items = await this.fetchDataset(datasetId)

      // Transform to InstagramComment format
      return items
        .filter((item) => item.type === 'comment' && item.text)
        .map((item) => ({
          id: item.ownerId || '',
          text: item.text || '',
          timestamp: item.timestamp || new Date().toISOString(),
          username: item.ownerUsername || '',
          from: {
            username: item.ownerUsername || '',
            id: item.ownerId || ''
          },
          like_count: 0, // Apify doesn't provide this in basic mode
        }))
    } catch (error) {
      throw this.handleApifyError(error)
    }
  }

  /**
   * Start Instagram scraper run
   */
  private async startInstagramScraper(
    url: string,
    options: FetchOptions
  ): Promise<ApifyRunResponse> {
    const requestBody = {
      directUrls: [url],
      resultsType: 'comments',
      maxItems: options.limit || 100,
      addParentData: false,
    }

    console.log('[Apify] Starting Instagram scraper with request:', {
      url: `${this.baseUrl}/acts/apify~instagram-scraper/runs`,
      method: 'POST',
      body: requestBody,
    })

    const response = await fetch(
      `${this.baseUrl}/acts/apify~instagram-scraper/runs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    const responseData = await response.json()

    console.log('[Apify] Instagram scraper response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: responseData,
    })

    if (!response.ok) {
      throw responseData
    }

    return responseData
  }

  // ============================================
  // Facebook Scraping
  // ============================================

  /**
   * Fetch comments from Facebook posts
   */
  async fetchFacebookComments(
    url: string,
    options: FetchOptions = {}
  ): Promise<FacebookComment[]> {
    const parsed = this.parseUrl(url)

    if (parsed.platform !== 'facebook') {
      throw new Error('URL must be a Facebook URL')
    }

    // Check if URL is a page or group (only posts are supported)
    if (parsed.type === 'page' || parsed.type === 'group') {
      throw new Error(
        'Facebook page and group URLs are not supported. Please use a specific post URL.\n' +
        'Supported format:\n' +
        '  - https://www.facebook.com/{page}/posts/{post_id} (post)\n' +
        'To get a post URL:\n' +
        '  1. Open Facebook\n' +
        '  2. Find a post with comments\n' +
        '  3. Click the date/timestamp on the post\n' +
        '  4. Copy the URL from the address bar\n' +
        '  5. Paste that URL here'
      )
    }

    try {
      // Start Apify Facebook scraper
      const run = await this.startFacebookScraper(url, options)

      // Wait for completion (pass actor ID)
      await this.waitForRun(run.id, 'apify~facebook-posts-scraper')

      // Fetch results
      const datasetId = run.datasetId
      const items = await this.fetchDataset(datasetId)

      // Transform to FacebookComment format
      return items
        .filter((item) => item.type === 'comment' && item.commentText)
        .map((item) => ({
          id: item.commenterId || '',
          message: item.commentText || '',
          created_time: item.commentTime || new Date().toISOString(),
          from: {
            id: item.commenterId || '',
            name: item.commenterName || 'Unknown',
          },
          like_count: 0, // Apify doesn't provide this in basic mode
        }))
    } catch (error) {
      throw this.handleApifyError(error)
    }
  }

  /**
   * Start Facebook scraper run
   */
  private async startFacebookScraper(
    url: string,
    options: FetchOptions
  ): Promise<ApifyRunResponse> {
    const requestBody = {
      startUrls: [{ url }],
      resultsType: 'posts',
      maxItems: options.limit || 100,
      includeComments: true,
      maxComments: 100,
    }

    console.log('[Apify] Starting Facebook scraper with request:', {
      url: `${this.baseUrl}/acts/apify~facebook-posts-scraper/runs`,
      method: 'POST',
      body: requestBody,
    })

    const response = await fetch(
      `${this.baseUrl}/acts/apify~facebook-posts-scraper/runs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    )

    const responseData = await response.json()

    console.log('[Apify] Facebook scraper response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: responseData,
    })

    if (!response.ok) {
      throw responseData
    }

    return responseData
  }

  // ============================================
  // Token Validation
  // ============================================

  /**
   * Validate the Apify API token
   */
  async validateToken(): Promise<{ valid: boolean; appName?: string; error?: string }> {
    try {
      // Try to get user info
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (!response.ok) {
        return {
          valid: false,
          error: 'Invalid Apify API token',
        }
      }

      const data = await response.json()
      return {
        valid: true,
        appName: data.data?.username || 'Apify',
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Wait for an Apify run to complete
   */
  private async waitForRun(runId: string, actorId: string, maxWaitTime: number = 300000): Promise<void> {
    const startTime = Date.now()
    const pollInterval = 2000 // Check every 2 seconds

    console.log('[Apify] Waiting for run to complete:', {
      runId,
      actorId,
      maxWaitTime: `${maxWaitTime}ms`,
    })

    while (Date.now() - startTime < maxWaitTime) {
      const statusUrl = `${this.baseUrl}/acts/${actorId}/runs/${runId}`

      const response = await fetch(statusUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (!response.ok) {
        console.error('[Apify] Failed to check run status:', {
          status: response.status,
          statusText: response.statusText,
          url: statusUrl,
        })
        throw new Error(`Failed to check run status: ${response.statusText}`)
      }

      const run: ApifyRunResponse = await response.json()

      console.log('[Apify] Run status update:', {
        runId,
        status: run.status,
        datasetId: run.datasetId,
      })

      if (run.status === 'SUCCEEDED') {
        console.log('[Apify] Run completed successfully:', {
          runId,
          datasetId: run.datasetId,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
        })
        return
      }

      if (run.status === 'FAILED' || run.status === 'TIMED-OUT' || run.status === 'ABORTED') {
        console.error('[Apify] Run failed:', {
          runId,
          status: run.status,
          startedAt: run.startedAt,
          finishedAt: run.finishedAt,
        })
        throw new Error(`Apify run ${run.status.toLowerCase()}`)
      }

      // Still running, wait and retry
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    throw new Error('Apify run timed out')
  }

  /**
   * Fetch dataset items
   */
  private async fetchDataset(datasetId: string): Promise<ApifyDatasetItem[]> {
    const items: ApifyDatasetItem[] = []
    let offset = 0
    const limit = 100

    console.log('[Apify] Fetching dataset items:', {
      datasetId,
      limit,
    })

    while (true) {
      const datasetUrl = `${this.baseUrl}/datasets/${datasetId}/items?limit=${limit}&offset=${offset}`

      const response = await fetch(datasetUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
        },
      })

      if (!response.ok) {
        console.error('[Apify] Failed to fetch dataset:', {
          datasetId,
          status: response.status,
          statusText: response.statusText,
          url: datasetUrl,
        })
        throw new Error(`Failed to fetch dataset: ${response.statusText}`)
      }

      const batch: ApifyDatasetItem[] = await response.json()

      console.log('[Apify] Dataset batch received:', {
        datasetId,
        offset,
        batchSize: batch.length,
        totalItems: items.length + batch.length,
      })

      if (batch.length === 0) {
        break
      }

      items.push(...batch)
      offset += limit

      // Safety limit to prevent infinite loops
      if (items.length >= 10000) {
        console.warn('[Apify] Reached maximum dataset size limit (10,000 items)')
        break
      }
    }

    console.log('[Apify] Dataset fetch completed:', {
      datasetId,
      totalItems: items.length,
    })

    return items
  }

  /**
   * Handle Apify errors and transform them into MetaGraphApiError
   */
  private handleApifyError(error: any): MetaGraphApiError {
    // If error is already in our format, return it
    if (error.type && Object.values(MetaErrorType).includes(error.type)) {
      return error as MetaGraphApiError
    }

    // Apify error response format
    if (error.error) {
      const message = error.error.message || error.error.type || 'Unknown Apify error'
      const status = error.error.status || error.error.code

      // Map error types
      if (status === 401 || status === 403) {
        return {
          type: MetaErrorType.AUTH_ERROR,
          message: 'Invalid Apify API token. Please reconfigure in Settings.',
          recoverable: false,
        }
      }

      if (status === 404) {
        return {
          type: MetaErrorType.RESOURCE_NOT_FOUND,
          message: 'Resource not found on Apify.',
          recoverable: false,
        }
      }

      if (status === 429) {
        return {
          type: MetaErrorType.RATE_LIMIT,
          message: 'Apify rate limit exceeded. Please try again later.',
          recoverable: true,
        }
      }

      // Default error
      return {
        type: MetaErrorType.UNKNOWN,
        message: `Apify error: ${message}`,
        recoverable: false,
      }
    }

    // Generic error
    return {
      type: MetaErrorType.UNKNOWN,
      message: error instanceof Error ? error.message : 'Unknown error',
      recoverable: false,
    }
  }

  /**
   * Get cost estimate for a run (in USD)
   */
  estimateCost(url: string, options: FetchOptions = {}): number {
    const parsed = this.parseUrl(url)

    // Instagram: $1.50 per 1,000 results
    if (parsed.platform === 'instagram') {
      const limit = options.limit || 100
      return (limit / 1000) * 1.5
    }

    // Facebook: $5 per batch (approx 100-200 results)
    if (parsed.platform === 'facebook') {
      const limit = options.limit || 100
      return (limit / 100) * 5
    }

    return 0
  }
}

// Factory function to create service instance
export function createApifyScraperService(apiToken: string): ApifyScraperService {
  return new ApifyScraperService(apiToken)
}
