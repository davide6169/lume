// ============================================
// Meta GraphAPI Service
// ============================================

import {
  ParsedMetaUrl,
  FacebookPost,
  FacebookComment,
  InstagramMedia,
  InstagramComment,
  FetchOptions,
  MetaErrorType,
  MetaGraphApiError,
} from '@/types'

export class MetaGraphAPIService {
  private accessToken: string
  private apiVersion: string
  private baseUrl: string

  constructor(accessToken: string, apiVersion: string = 'v19.0') {
    this.accessToken = accessToken
    this.apiVersion = apiVersion
    this.baseUrl = `https://graph.facebook.com/${apiVersion}`
  }

  // ============================================
  // URL Parsing
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
  // Facebook Methods
  // ============================================

  /**
   * Fetch posts from a Facebook page
   */
  async fetchFacebookPosts(pageId: string, options: FetchOptions = {}): Promise<FacebookPost[]> {
    const { limit = 25, after } = options

    const fields = ['id', 'message', 'created_time', 'permalink_url'].join(',')

    try {
      const response = await this.makeRequest(`${pageId}/posts`, {
        fields,
        limit,
        after,
      })

      return response.data || []
    } catch (error) {
      throw this.handleGraphApiError(error)
    }
  }

  /**
   * Fetch comments from a Facebook post
   */
  async fetchFacebookComments(postId: string, options: FetchOptions = {}): Promise<FacebookComment[]> {
    const { limit = 100, after } = options

    const fields = ['id', 'from', 'message', 'created_time'].join(',')

    try {
      const response = await this.makeRequest(`${postId}/comments`, {
        fields,
        limit,
        after,
        filter: 'stream', // Get all comments, including replies
      })

      return response.data || []
    } catch (error) {
      throw this.handleGraphApiError(error)
    }
  }

  // ============================================
  // Instagram Methods
  // ============================================

  /**
   * Resolve Instagram username to business account ID
   * This is necessary because the GraphAPI requires business account IDs, not usernames
   */
  async getInstagramBusinessAccount(username: string): Promise<string> {
    try {
      // Step 1: Get User ID from username
      const userResponse = await this.makeRequest(`${username}`, {
        fields: 'id,username,business_account',
      })

      if (!userResponse.business_account) {
        throw new Error(`@${username} is not a Business/Creator account. Please use a Business account.`)
      }

      // Step 2: Return the business account ID
      return userResponse.business_account.id
    } catch (error) {
      throw this.handleGraphApiError(error)
    }
  }

  /**
   * Fetch media from an Instagram business account
   */
  async fetchInstagramMedia(businessAccountId: string, options: FetchOptions = {}): Promise<InstagramMedia[]> {
    const { limit = 25, after } = options

    const fields = ['id', 'caption', 'media_type', 'permalink', 'timestamp'].join(',')

    try {
      const response = await this.makeRequest(`${businessAccountId}/media`, {
        fields,
        limit,
        after,
      })

      return response.data || []
    } catch (error) {
      throw this.handleGraphApiError(error)
    }
  }

  /**
   * Fetch comments from an Instagram media
   */
  async fetchInstagramComments(mediaId: string, options: FetchOptions = {}): Promise<InstagramComment[]> {
    const { limit = 100, after } = options

    const fields = ['id', 'from', 'text', 'timestamp'].join(',')

    try {
      const response = await this.makeRequest(`${mediaId}/comments`, {
        fields,
        limit,
        after,
      })

      return response.data || []
    } catch (error) {
      throw this.handleGraphApiError(error)
    }
  }

  // ============================================
  // Token Validation
  // ============================================

  /**
   * Validate the access token and get basic app info
   */
  async validateToken(): Promise<{ valid: boolean; appName?: string; error?: string }> {
    try {
      const response = await this.makeRequest('debug_token', {
        input_token: this.accessToken,
      })

      if (response.data && response.data.data) {
        const tokenData = response.data.data
        return {
          valid: tokenData.is_valid,
          appName: tokenData.granular_scopes?.[0]?.app_name,
        }
      }

      return { valid: false, error: 'Invalid response from debug_token endpoint' }
    } catch (error) {
      const apiError = this.handleGraphApiError(error)
      return {
        valid: false,
        error: apiError.message,
      }
    }
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Make a request to the GraphAPI
   */
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}/${endpoint}`, this.baseUrl)
    url.searchParams.append('access_token', this.accessToken)

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Handle GraphAPI errors and transform them into MetaGraphApiError
   */
  private handleGraphApiError(error: any): MetaGraphApiError {
    // If error is already in our format, return it
    if (error.type && Object.values(MetaErrorType).includes(error.type)) {
      return error as MetaGraphApiError
    }

    // GraphAPI error response format
    if (error.error) {
      const code = error.error.code
      const message = error.error.message || 'Unknown error'
      const errorType = error.error.error_subtype || error.error.type

      // Map error codes to our error types
      switch (code) {
        case 190:
          return {
            type: MetaErrorType.AUTH_ERROR,
            message: 'Invalid or expired access token. Please reconfigure in Settings.',
            recoverable: false,
            code,
          }

        case 4:
        case 32:
        case 34:
          return {
            type: MetaErrorType.RATE_LIMIT,
            message: 'Rate limit reached. Please wait before retrying.',
            recoverable: true,
            retryAfter: error.error.error_subcode === 1487115 ? 3600 : 60, // Default retry time
            code,
          }

        case 200:
        case 210:
          return {
            type: MetaErrorType.PERMISSION_DENIED,
            message: `Permission denied: ${message}`,
            recoverable: false,
            code,
          }

        case 100:
          if (message.toLowerCase().includes('private')) {
            return {
              type: MetaErrorType.PRIVATE_CONTENT,
              message: 'Cannot access private content.',
              recoverable: false,
              code,
            }
          }
          return {
            type: MetaErrorType.RESOURCE_NOT_FOUND,
            message: 'Resource not found.',
            recoverable: false,
            code,
          }

        default:
          return {
            type: MetaErrorType.UNKNOWN,
            message,
            recoverable: false,
            code,
          }
      }
    }

    // Network or other errors
    return {
      type: MetaErrorType.UNKNOWN,
      message: error.message || 'Unknown error occurred',
      recoverable: false,
    }
  }
}
