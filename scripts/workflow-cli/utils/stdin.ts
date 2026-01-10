/**
 * Stdin Reader Utility
 * Reads input from stdin asynchronously
 */

/**
 * Read all data from stdin
 * @returns Promise<string> - All data read from stdin
 */
export async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''

    // Check if stdin is readable
    if (process.stdin.isTTY) {
      resolve('')
      return
    }

    try {
      process.stdin.setEncoding('utf8')

      process.stdin.on('data', (chunk) => {
        data += chunk
      })

      process.stdin.on('end', () => {
        resolve(data)
      })

      process.stdin.on('error', (error) => {
        reject(error)
      })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Read stdin as JSON
 * @returns Promise<any> - Parsed JSON object
 */
export async function readStdinAsJSON(): Promise<any> {
  const data = await readStdin()

  if (!data || data.trim().length === 0) {
    throw new Error('Stdin is empty')
  }

  try {
    return JSON.parse(data)
  } catch (error) {
    throw new Error(`Invalid JSON in stdin: ${(error as Error).message}`)
  }
}
