// ============================================
// Meta GraphAPI Stub Service for Demo Mode
// Simulates real GraphAPI responses with accurate data structure
// ============================================

import type {
  FacebookPost,
  FacebookComment,
  InstagramMedia,
  InstagramComment,
  ParsedMetaUrl,
} from '@/types'

/**
 * Simulates realistic Meta GraphAPI responses for demo mode
 * Uses the same data structure as the real GraphAPI
 */
export class MetaGraphAPIStubService {
  private baseUrl = 'https://graph.facebook.com/v24.0'

  // Simulate network delay
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Parse URL (same as real service)
   */
  parseUrl(url: string): ParsedMetaUrl {
    const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '')

    if (cleanUrl.includes('facebook.com')) {
      const pageMatch = cleanUrl.match(/facebook\.com\/([^/?]+)/)
      if (pageMatch) {
        return {
          platform: 'facebook',
          type: 'page',
          id: pageMatch[1],
          username: pageMatch[1],
        }
      }
    }

    if (cleanUrl.includes('instagram.com')) {
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

  /**
   * Fetch Facebook posts (stub)
   * Simulates real GraphAPI /page/posts endpoint
   */
  async fetchFacebookPosts(pageId: string): Promise<FacebookPost[]> {
    await this.delay(300 + Math.random() * 500)

    // Generate realistic posts based on page context
    const posts = this.generateFacebookPosts(pageId)
    return posts
  }

  /**
   * Fetch Facebook comments (stub)
   * Simulates real GraphAPI /post/comments endpoint
   */
  async fetchFacebookComments(postId: string): Promise<FacebookComment[]> {
    await this.delay(200 + Math.random() * 300)

    const comments = this.generateFacebookComments(postId)
    return comments
  }

  /**
   * Get Instagram business account (stub)
   * Simulates real GraphAPI username resolution
   */
  async getInstagramBusinessAccount(username: string): Promise<string> {
    await this.delay(400 + Math.random() * 400)

    // Return a fake business account ID
    return `${username}_business_${Date.now()}`
  }

  /**
   * Fetch Instagram media (stub)
   * Simulates real GraphAPI /business_account/media endpoint
   */
  async fetchInstagramMedia(businessAccountId: string): Promise<InstagramMedia[]> {
    await this.delay(400 + Math.random() * 600)

    const mediaItems = this.generateInstagramMedia(businessAccountId)
    return mediaItems
  }

  /**
   * Fetch Instagram comments (stub)
   * Simulates real GraphAPI /media/comments endpoint
   */
  async fetchInstagramComments(mediaId: string): Promise<InstagramComment[]> {
    await this.delay(200 + Math.random() * 300)

    const comments = this.generateInstagramComments(mediaId)
    return comments
  }

  // ============================================
  // Private generators for realistic demo data
  // ============================================

  private generateFacebookPosts(pageId: string): FacebookPost[] {
    // Generate 2-4 posts per page
    const numPosts = 2 + Math.floor(Math.random() * 3)
    const posts: FacebookPost[] = []

    const contexts = this.getPageContext(pageId)

    for (let i = 0; i < numPosts; i++) {
      const postId = `${pageId}_${Math.floor(Math.random() * 1000000000000)}`
      const post = contexts.posts[i % contexts.posts.length]

      posts.push({
        id: postId,
        message: post,
        created_time: this.getRandomDate(),
        permalink_url: `https://facebook.com/${pageId}/posts/${postId}`,
      })
    }

    return posts
  }

  private generateFacebookComments(postId: string): FacebookComment[] {
    // Generate 3-6 comments per post
    const numComments = 3 + Math.floor(Math.random() * 4)
    const comments: FacebookComment[] = []

    const demoComments = this.getDemoComments('facebook')

    for (let i = 0; i < numComments; i++) {
      const comment = demoComments[i % demoComments.length]
      const commentId = `${postId}_${Math.floor(Math.random() * 1000000000000)}`

      comments.push({
        id: commentId,
        from: {
          id: Math.floor(Math.random() * 1000000000000).toString(),
          name: comment.name,
        },
        message: comment.message,
        created_time: this.getRandomDate(),
      })
    }

    return comments
  }

  private generateInstagramMedia(businessAccountId: string): InstagramMedia[] {
    // Generate 2-3 media items
    const numMedia = 2 + Math.floor(Math.random() * 2)
    const media: InstagramMedia[] = []

    for (let i = 0; i < numMedia; i++) {
      const mediaId = `${businessAccountId}_media_${Math.floor(Math.random() * 1000000000000)}`

      media.push({
        id: mediaId,
        caption: this.getRandomInstagramCaption(),
        media_type: Math.random() > 0.5 ? 'IMAGE' : 'VIDEO',
        permalink: `https://instagram.com/p/${mediaId}`,
        timestamp: this.getRandomDate(),
      })
    }

    return media
  }

  private generateInstagramComments(mediaId: string): InstagramComment[] {
    // Generate 2-4 comments per media
    const numComments = 2 + Math.floor(Math.random() * 3)
    const comments: InstagramComment[] = []

    const demoComments = this.getDemoComments('instagram')

    for (let i = 0; i < numComments; i++) {
      const comment = demoComments[i % demoComments.length]
      const commentId = `${mediaId}_${Math.floor(Math.random() * 1000000000000)}`

      comments.push({
        id: commentId,
        from: {
          id: Math.floor(Math.random() * 1000000000000).toString(),
          username: comment.username || comment.name.toLowerCase().replace(/\s/g, ''),
        },
        text: comment.message,
        timestamp: this.getRandomDate(),
      })
    }

    return comments
  }

  // ============================================
  // Demo data generators
  // ============================================

  private getDemoComments(platform: 'facebook' | 'instagram') {
    const allComments = [
      {
        name: 'Marco Rossi',
        username: 'marco.rossi',
        message: 'Great content! Contact me at marco.rossi@example.com for collaboration',
      },
      {
        name: 'Giulia Bianchi',
        username: 'giulia.bianchi',
        message: 'Very interesting! Reach out to giulia.b@example.com or call +39 333 1234567',
      },
      {
        name: 'Luca Verdi',
        username: 'luca.verdi',
        message: 'Love this! Email: luca.verdi@test.it',
      },
      {
        name: 'Anna Ferrara',
        username: 'anna.ferrara',
        message: 'Amazing work! Contact: anna.ferrari@company.com',
      },
      {
        name: 'Paolo Colombo',
        username: 'paolo.colombo',
        message: 'Very informative! +39 347 9876543 or paolo.colombo@email.it',
      },
      {
        name: 'Sofia Romano',
        username: 'sofia.romano',
        message: 'Thanks for sharing! sofia.romano@demo.it',
      },
      {
        name: 'Alessandro Conti',
        username: 'alessandro.c',
        message: 'Excellent! Email: alessandro.conti@example.com, Phone: +39 333 4567890',
      },
      {
        name: 'Chiara Marino',
        username: 'chiara.marino',
        message: 'Love it! Contact at chiara.marino@test.com',
      },
    ]

    return allComments
  }

  private getPageContext(pageId: string) {
    // Generate context based on page name
    const contexts: Record<string, { posts: string[] }> = {
      netflix: {
        posts: [
          '🎬 New season coming soon! What are you watching?',
          '🍿 Weekend binge-watching plans? Drop your favorites below!',
          '🎭 Behind the scenes of our latest hit show!',
        ],
      },
      microsoft: {
        posts: [
          '💡 Innovation in AI: What are your thoughts on the future?',
          '🖥️ Windows 11 tips and tricks - share yours!',
          '🚀 Empowering developers worldwide!',
        ],
      },
      default: {
        posts: [
          '📢 Exciting announcement coming soon! Stay tuned!',
          '💬 What do you think about our latest update?',
          '🙏 Thank you all for the amazing support!',
          '✨ New features available - check them out!',
        ],
      },
    }

    const pageName = pageId.toLowerCase()
    if (pageName.includes('netflix')) return contexts.netflix
    if (pageName.includes('microsoft')) return contexts.microsoft
    return contexts.default
  }

  private getRandomInstagramCaption(): string {
    const captions = [
      '✨ Living my best life! #lifestyle #blessed',
      '🌟 New adventure awaits! #travel #explore',
      '💪 Fitness journey continues! #gym #motivation',
      '🎯 Goals for the week! #productivity #success',
      '🌅 Beautiful moments like this! #nature #peace',
    ]

    return captions[Math.floor(Math.random() * captions.length)]
  }

  private getRandomDate(): string {
    const now = Date.now()
    const daysAgo = Math.floor(Math.random() * 30)
    const timestamp = now - daysAgo * 24 * 60 * 60 * 1000
    return new Date(timestamp).toISOString()
  }
}
