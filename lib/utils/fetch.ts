/**
 * Fetch utilities with timeout and abort controller support
 * Prevents hanging requests and implements proper request cancellation
 */

export interface FetchOptions extends RequestInit {
  timeout?: number // Timeout in milliseconds (default: 30000ms = 30s)
  abortController?: AbortController // Optional external controller
}

export interface FetchResult<T> {
  data: T | null
  error: string | null
  status: number
  timedOut: boolean
  aborted: boolean
}

/**
 * Fetch with timeout support
 * @param url - The URL to fetch
 * @param options - Fetch options with optional timeout
 * @returns Promise with result, error, and metadata
 */
export async function fetchWithTimeout<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const { timeout = 30000, abortController: externalController, ...fetchOptions } = options

  // Create abort controller if not provided
  const internalController = new AbortController()
  const controller = externalController || internalController

  // Set timeout to abort request
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Parse response
    const data = await response.json()

    return {
      data,
      error: response.ok ? null : data?.error || `HTTP ${response.status}`,
      status: response.status,
      timedOut: false,
      aborted: false,
    }
  } catch (error) {
    clearTimeout(timeoutId)

    // Handle abort (timeout or manual)
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        data: null,
        error: externalController ? 'Request cancelled' : `Request timed out after ${timeout}ms`,
        status: 0,
        timedOut: !externalController, // Only timed out if we used internal controller
        aborted: !!externalController, // Aborted if external controller was used
      }
    }

    // Handle other errors
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
      timedOut: false,
      aborted: false,
    }
  }
}

/**
 * Fetch with retry logic
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param retryDelay - Delay between retries in ms (default: 1000ms)
 * @returns Promise with fetch result
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: FetchOptions = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<FetchResult<T>> {
  let lastError: string | null = null
  let lastStatus: number = 0

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Don't retry on abort
    if (attempt > 0 && options.abortController?.signal.aborted) {
      break
    }

    const result = await fetchWithTimeout<T>(url, options)

    // Return on success
    if (result.data !== null && result.error === null) {
      return result
    }

    // Don't retry on client errors (4xx) or abort
    if (result.status >= 400 && result.status < 500) {
      return result
    }

    if (result.aborted) {
      return result
    }

    lastError = result.error
    lastStatus = result.status

    // Wait before retry (with exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
    }
  }

  return {
    data: null,
    error: lastError || 'Max retries exceeded',
    status: lastStatus,
    timedOut: false,
    aborted: false,
  }
}

/**
 * Create a fetch wrapper for API calls with common options
 */
export function createApiClient(defaultTimeout: number = 30000) {
  return {
    get: <T = any>(url: string, options: FetchOptions = {}) =>
      fetchWithTimeout<T>(url, {
        ...options,
        method: 'GET',
        timeout: options.timeout || defaultTimeout,
      }),

    post: <T = any>(url: string, data: any, options: FetchOptions = {}) =>
      fetchWithTimeout<T>(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        timeout: options.timeout || defaultTimeout,
      }),

    patch: <T = any>(url: string, data: any, options: FetchOptions = {}) =>
      fetchWithTimeout<T>(url, {
        ...options,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        timeout: options.timeout || defaultTimeout,
      }),

    delete: <T = any>(url: string, options: FetchOptions = {}) =>
      fetchWithTimeout<T>(url, {
        ...options,
        method: 'DELETE',
        timeout: options.timeout || defaultTimeout,
      }),

    put: <T = any>(url: string, data: any, options: FetchOptions = {}) =>
      fetchWithTimeout<T>(url, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        timeout: options.timeout || defaultTimeout,
      }),
  }
}

// Default API client with 30s timeout
export const apiClient = createApiClient(30000)

// Long-running operations client with 5min timeout
export const longRunningClient = createApiClient(5 * 60 * 1000)
