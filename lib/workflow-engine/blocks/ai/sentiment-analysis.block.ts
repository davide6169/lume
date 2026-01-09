/**
 * AI Sentiment Analysis Block
 *
 * Analyzes sentiment of text content using OpenRouter LLM.
 * Returns sentiment score, category, and key phrases.
 */

import { BaseBlockExecutor } from '../../registry'
import type { ExecutionContext } from '../../types'
import { OpenRouterService } from '@/lib/services/openrouter'

export interface SentimentAnalysisConfig {
  apiToken: string // {{secrets.openrouter}}
  texts: string[] // Texts to analyze
  model?: string // Default: "mistralai/mistral-7b-instruct:free"
  granularity?: 'document' | 'sentence' | 'aspect' // Default: 'document'
}

/**
 * AI Sentiment Analysis Block Executor
 */
export class SentimentAnalysisBlock extends BaseBlockExecutor {
  constructor() {
    super('ai.sentimentAnalysis')
  }

  async execute(
    config: SentimentAnalysisConfig,
    input: any,
    context: ExecutionContext
  ) {
    const startTime = Date.now()

    try {
      this.log(context, 'info', 'Executing AI Sentiment Analysis block', {
        textsCount: config.texts?.length || 0,
        model: config.model || 'mistralai/mistral-7b-instruct:free',
        granularity: config.granularity || 'document'
      })

      // Validate config
      if (!config.apiToken) {
        throw new Error('OpenRouter API token is required')
      }
      if (!config.texts || !Array.isArray(config.texts)) {
        throw new Error('Texts array is required')
      }

      const service = new OpenRouterService(config.apiToken)
      const model = config.model || 'mistralai/mistral-7b-instruct:free'
      const granularity = config.granularity || 'document'

      this.log(context, 'info', `Analyzing sentiment for ${config.texts.length} texts`, {
        granularity
      })

      const results: any[] = []
      let positiveCount = 0
      let negativeCount = 0
      let neutralCount = 0

      // Process each text
      for (let i = 0; i < config.texts.length; i++) {
        const text = config.texts[i]
        this.log(context, 'debug', `Analyzing text ${i + 1}/${config.texts.length}`)

        try {
          const analysis = await this.analyzeSentiment(service, text, model, granularity)

          results.push({
            text,
            textId: i,
            ...analysis
          })

          // Count sentiments
          if (analysis.sentiment === 'positive') positiveCount++
          else if (analysis.sentiment === 'negative') negativeCount++
          else neutralCount++

          // Update progress
          const progress = Math.round(((i + 1) / config.texts.length) * 100)
          context.updateProgress(progress, {
            timestamp: new Date().toISOString(),
            event: 'sentiment_analysis_progress',
            details: {
              processed: i + 1,
              total: config.texts.length
            }
          })
        } catch (error) {
          this.log(context, 'warn', `Failed to analyze text ${i + 1}`, {
            error: (error as Error).message
          })
          results.push({
            text,
            textId: i,
            sentiment: 'neutral',
            score: 0,
            confidence: 0,
            error: (error as Error).message
          })
          neutralCount++
        }
      }

      const executionTime = Date.now() - startTime

      const output = {
        analyses: results,
        metadata: {
          totalTexts: config.texts.length,
          positiveCount,
          negativeCount,
          neutralCount,
          avgScore: results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length,
          model,
          granularity
        }
      }

      this.log(context, 'info', 'Sentiment analysis completed', {
        executionTime,
        totalTexts: config.texts.length,
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount,
        avgScore: output.metadata.avgScore.toFixed(2)
      })

      return {
        status: 'completed',
        output,
        executionTime,
        error: undefined,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {
          positiveCount,
          negativeCount,
          neutralCount
        },
        logs: []
      }
    } catch (error) {
      const executionTime = Date.now() - startTime
      this.log(context, 'error', 'AI Sentiment Analysis block failed', {
        error: (error as Error).message
      })

      return {
        status: 'failed',
        output: null,
        executionTime,
        error: error as Error,
        retryCount: 0,
        startTime,
        endTime: Date.now(),
        metadata: {},
        logs: []
      }
    }
  }

  /**
   * Analyze sentiment of a single text
   */
  private async analyzeSentiment(
    service: OpenRouterService,
    text: string,
    model: string,
    granularity: string
  ): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral'
    score: number // -1 to 1
    confidence: number // 0 to 1
    keyPhrases?: string[]
    emotions?: string[]
  }> {
    const prompt = this.buildSentimentPrompt(text, granularity)

    const response = await service.chatCompletion({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at sentiment analysis. Analyze text and return structured JSON results.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content || '{}'

    try {
      let result = JSON.parse(content)

      // Handle markdown code blocks
      if (typeof result !== 'object') {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[1])
        }
      }

      // Validate and normalize
      return {
        sentiment: result.sentiment || 'neutral',
        score: typeof result.score === 'number' ? result.score : 0,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        keyPhrases: result.keyPhrases || [],
        emotions: result.emotions || []
      }
    } catch (error) {
      console.error('Failed to parse sentiment:', content)
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0
      }
    }
  }

  /**
   * Build sentiment analysis prompt
   */
  private buildSentimentPrompt(text: string, granularity: string): string {
    return `Analyze the sentiment of this text:

Text: "${text}"

Return a JSON object with this structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": -1.0 to 1.0,
  "confidence": 0.0 to 1.0,
  "keyPhrases": ["phrase1", "phrase2"],
  "emotions": ["joy", "anger", "sadness", "fear", "surprise", "neutral"]
}

Rules:
- sentiment: overall sentiment category
- score: -1 (very negative) to +1 (very positive), 0 is neutral
- confidence: how confident you are (0-1)
- keyPhrases: extract 3-5 key phrases that indicate sentiment
- emotions: list emotions detected (can include multiple)
- Return ONLY the JSON object, no explanations`
  }
}
