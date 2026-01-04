import { createFileRoute } from '@tanstack/react-router'
import { generateText } from 'ai'
import type { UIMessage } from 'ai'
import { MockLanguageModelV3 } from 'ai/test'
import { Brain, Sparkles } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useMemo, useState } from 'react'

import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth0 } from '@auth0/auth0-react'

export const Route = createFileRoute('/ai')({ component: AiPlayground })

function AiPlayground() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const [prompt, setPrompt] = useState('How can TanStack Start and AI SDK work together?')
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [isThinking, setIsThinking] = useState(false)

  const model = useMemo(
    () =>
      new MockLanguageModelV3({
        modelId: 'tanstack-ai-helper',
        doGenerate: async ({ prompt: incomingPrompt }) => ({
          text:
            'Here is a concise walkthrough for TanStack + AI SDK: ' +
            incomingPrompt,
          finishReason: 'stop',
          usage: { promptTokens: 128, completionTokens: 256, totalTokens: 384 },
        }),
      }),
    [],
  )

  const runPrompt = async () => {
    if (!prompt.trim()) return

    const userMessage: UIMessage = {
      id: nanoid(),
      role: 'user',
      content: [{ type: 'text', text: prompt.trim() }],
    }

    setMessages((current) => [...current, userMessage])
    setIsThinking(true)

    try {
      const result = await generateText({ model, prompt })

      const assistantMessage: UIMessage = {
        id: nanoid(),
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: `${result.text}\n\nTokens used: ${result.usage?.totalTokens ?? 0}`,
          },
        ],
      }

      setMessages((current) => [...current, assistantMessage])
      setPrompt('')
    } catch (error) {
      console.error('Failed to generate text', error)

      const assistantMessage: UIMessage = {
        id: nanoid(),
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'An error occurred while generating the response.',
          },
        ],
      }

      setMessages((current) => [...current, assistantMessage])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-3 text-cyan-300">
            <Brain className="h-6 w-6" />
            <p className="text-sm uppercase tracking-[0.25em]">AI SDK + TanStack</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">
            Build AI features with TanStack, Auth0, and ai-elements
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Authenticate with Auth0, prototype prompts with the AI SDK v6 mocks, and
            showcase outputs using the ai-elements component primitives.
          </p>
        </header>

        <Card className="bg-slate-900/70 border-slate-800">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-200">
              <Sparkles className="h-5 w-5" />
              <CardTitle className="text-xl">AI Studio</CardTitle>
            </div>
            <p className="text-sm text-gray-300">
              Uses <code className="text-cyan-300">MockLanguageModelV3</code> from AI SDK v6 for
              deterministic output without external API keys.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col bg-slate-950/60 rounded-lg border border-slate-800">
                <Conversation className="h-[420px]">
                  {messages.length === 0 ? (
                    <ConversationEmptyState
                      title="No messages yet"
                      description="Submit a prompt to see how the AI SDK responds"
                      icon={<Sparkles className="h-6 w-6" />}
                    />
                  ) : (
                    <ConversationContent>
                      {messages.map((message) => (
                        <Message key={message.id} from={message.role}>
                          <MessageContent>
                            {message.content.map((contentPart, index) => (
                              <p key={`${message.id}-${index}`}>
                                {'text' in contentPart ? contentPart.text : null}
                              </p>
                            ))}
                          </MessageContent>
                        </Message>
                      ))}
                    </ConversationContent>
                  )}
                </Conversation>
                <div className="border-t border-slate-800 p-4 space-y-3">
                  <Textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    placeholder="Ask how TanStack works with your AI stack"
                    className="bg-slate-900"
                  />
                  <div className="flex items-center gap-3">
                    <Input
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder="Quick edit"
                      className="bg-slate-900"
                    />
                    <Button
                      onClick={() =>
                        isAuthenticated ? runPrompt() : loginWithRedirect({ appState: { returnTo: '/ai' } })
                      }
                      disabled={isThinking}
                    >
                      {isThinking ? 'Generating...' : isAuthenticated ? 'Send prompt' : 'Sign in to run'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm text-gray-300">
                <h3 className="text-lg font-semibold text-white">What this demo shows</h3>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Auth0 protects AI interactions while keeping the router stateful.</li>
                  <li>AI SDK v6 mocks make it easy to iterate without network calls.</li>
                  <li>ai-elements primitives render conversations with TanStack styling.</li>
                </ul>
                <p className="text-xs text-gray-400">
                  Replace the mock model with a real provider from <code>ai</code> when you add secrets.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
