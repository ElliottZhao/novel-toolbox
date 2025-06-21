import { load, Element } from 'cheerio'
import vm from 'vm'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Executes a script content in a VM to extract the `window.__INITIAL_STATE__` object.
 * This is a common pattern for server-side rendered (SSR) pages to bootstrap client-side state.
 * @param content The full HTML content of the page.
 * @returns The extracted initial state object, or null if not found.
 */
export function extractInitialState(content: string): any {
  try {
    const $ = load(content)
    const scripts = $('script')
    let initialState: any = null

    scripts.each((i: number, script: Element) => {
      const scriptContent = $(script).html()
      if (scriptContent && scriptContent.includes('window.__INITIAL_STATE__=')) {
        try {
          const windowObj: { __INITIAL_STATE__?: any } = {}
          const context = vm.createContext({ window: windowObj })
          vm.runInContext(scriptContent, context)

          initialState = windowObj.__INITIAL_STATE__

          if (initialState) {
            return false // break each loop
          }
        } catch (e) {
          // Log inner error but continue searching
          console.error(
            'Error executing script to get initial state from a script tag',
            e
          )
        }
      }
    })
    return initialState
  } catch (e) {
    console.error('Failed to extract initial state', e)
    return null
  }
}

let characterMapCache: Record<string, string> | null = null

/**
 * Loads the character map from the local JSON file.
 * Caches the map in memory after the first read.
 * @returns The character map.
 */
function getCharacterMap(): Record<string, string> {
  if (characterMapCache) {
    return characterMapCache
  }

  try {
    // Note: __dirname is relative to the output file in dist/, not the source .ts file.
    // Assuming the build process keeps the directory structure.
    const jsonPath = path.join(__dirname, '..', 'dc027189e0ba4cd.json')
    const fileContent = fs.readFileSync(jsonPath, 'utf-8')
    const charMap = JSON.parse(fileContent)
    characterMapCache = charMap
    return charMap
  } catch (error) {
    console.error('Failed to read or parse character map JSON file:', error)
    // Return empty map on error to avoid crashing the process
    return {}
  }
}

/**
 * Parses the chapter's HTML content, de-obfuscates it using the character map,
 * and returns an array of paragraphs.
 * @param htmlContent The raw HTML of the chapter content.
 * @returns An array of strings, where each string is a de-obfuscated paragraph.
 */
export function parseChapterContent(htmlContent: string): string[] {
  const charMap = getCharacterMap()
  if (Object.keys(charMap).length === 0) {
    console.warn("Character map is empty, returning raw content.")
    // Fallback to just extracting text if map is missing
    const $ = load(htmlContent)
    const paragraphs: string[] = []
    $('p').each((_, p) => {
      const pText = $(p).text().trim()
      if (pText) {
        paragraphs.push(pText)
      }
    })
    return paragraphs
  }

  const $ = load(htmlContent)

  const paragraphs: string[] = []
  $('p').each((_, p) => {
    const pText = $(p).text().trim()
    if (!pText) return // Skip empty paragraphs

    let deobfuscatedText = ''
    for (const char of pText) {
      const charCode = char.charCodeAt(0).toString()
      deobfuscatedText += charMap[charCode] || char
    }
    paragraphs.push(deobfuscatedText)
  })

  return paragraphs
}