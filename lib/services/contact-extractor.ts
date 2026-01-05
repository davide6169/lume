// ============================================
// Contact Extractor Service
// ============================================

import { FacebookComment, InstagramComment, Contact } from '@/types'

export class ContactExtractorService {
  // Email regex pattern - matches most common email formats
  private emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/g

  // Phone regex patterns - matches international formats
  private phoneRegexes = [
    // International format with +: +1 234 567 8900, +44 20 1234 5678
    /\+?[\d\s-]{10,}/g,
    // US format: (123) 456-7890, 123-456-7890, 123.456.7890
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    // European format: 06 12345678, 0612345678
    /\d{2}[-.\s]?\d{8}/g,
  ]

  // ============================================
  // Facebook Contact Extraction
  // ============================================

  /**
   * Extract contacts from Facebook comments
   */
  extractFromFacebook(comments: FacebookComment[]): Contact[] {
    const contacts: Contact[] = []

    for (const comment of comments) {
      const contact = this.extractFromComment(
        comment.message,
        comment.from.name,
        comment.id
      )

      if (contact) {
        contacts.push(contact)
      }
    }

    return contacts.filter(c => this.isValidContact(c))
  }

  // ============================================
  // Instagram Contact Extraction
  // ============================================

  /**
   * Extract contacts from Instagram comments
   */
  extractFromInstagram(comments: InstagramComment[]): Contact[] {
    const contacts: Contact[] = []

    for (const comment of comments) {
      const contact = this.extractFromComment(
        comment.text,
        comment.from.username,
        comment.id
      )

      if (contact) {
        contacts.push(contact)
      }
    }

    return contacts.filter(c => this.isValidContact(c))
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Extract contact information from a comment text
   */
  private extractFromComment(text: string, authorName: string, commentId: string): Contact | null {
    const email = this.extractEmail(text)
    const phone = this.extractPhone(text)
    const { firstName, lastName } = this.extractName(authorName)

    // A contact is valid if we have at least a name and email
    // Phone is optional but valuable if present
    if (!email) {
      return null
    }

    return {
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      commentId,
      source: 'comment',
    }
  }

  /**
   * Extract email from text using regex
   */
  private extractEmail(text: string): string | null {
    if (!text) return null

    const matches = text.match(this.emailRegex)
    if (!matches || matches.length === 0) return null

    // Return the first valid email found
    return matches[0].trim().toLowerCase()
  }

  /**
   * Extract phone number from text using regex
   */
  private extractPhone(text: string): string | null {
    if (!text) return null

    // Try each phone pattern
    for (const regex of this.phoneRegexes) {
      const matches = text.match(regex)
      if (matches && matches.length > 0) {
        const phone = matches[0].trim()
        // Basic validation: phone should be at least 10 digits
        const digitCount = phone.replace(/\D/g, '').length
        if (digitCount >= 10) {
          return this.normalizePhone(phone)
        }
      }
    }

    return null
  }

  /**
   * Normalize phone number to a consistent format
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')

    // If starts with +, keep international format
    if (cleaned.startsWith('+')) {
      return cleaned
    }

    // Otherwise, assume US format and add +1
    return `+1${cleaned}`
  }

  /**
   * Extract first and last name from a full name
   */
  private extractName(fullName: string): { firstName: string; lastName: string } {
    if (!fullName) {
      return { firstName: 'Unknown', lastName: 'User' }
    }

    // Split by spaces
    const parts = fullName.trim().split(/\s+/)

    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' }
    }

    // First word is first name, last word is last name
    const firstName = parts[0]
    const lastName = parts[parts.length - 1]

    return { firstName, lastName }
  }

  /**
   * Validate that a contact has minimum required fields
   */
  private isValidContact(contact: Contact): boolean {
    return (
      !!contact.firstName &&
      !!contact.lastName &&
      !!contact.email &&
      this.isValidEmail(contact.email)
    )
  }

  /**
   * Basic email validation
   */
  private isValidEmail(email: string): boolean {
    // More thorough email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
    return emailRegex.test(email)
  }
}
