import OpenAI from 'openai';

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const MODEL = 'gpt-4o';

export async function chatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 1024,
    response_format: options.jsonMode ? { type: 'json_object' } : undefined,
  });
  return response.choices[0]?.message?.content ?? '';
}
