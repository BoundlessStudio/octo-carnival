import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { convertToCoreMessages, streamText } from 'ai'
import type { UIMessage } from 'ai'
import { useChat } from 'ai/react'
import { MockLanguageModelV3 } from 'ai/test'
import { Brain, Sparkles } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useMemo } from 'react'

import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAuth0 } from '@auth0/auth0-react'

const runChat = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const messages = await convertToCoreMessages<UIMessage>(data?.messages ?? [])
    const modelId = data?.modelId ?? 'tanstack-ai-helper'

    const model = new MockLanguageModelV3({
      modelId,
      doStream: async () => ({
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({
              type: 'thinking',
              thinking: 'Reviewing how TanStack Start and AI SDK integrate...',
            })
            controller.enqueue({
              type: 'response',
              content: [
                {
                  type: 'text-delta',
                  textDelta:
                    'Here is a concise walkthrough for TanStack + AI SDK: ',
                },
                {
                  type: 'text-delta',
                  textDelta: messages[messages.length - 1]?.content?.[0]?.text ?? '',
                },
              ],
              sources: [
                {
                  id: 'guide',
                  title: 'TanStack AI Starter',
                  url: 'https://tanstack.com/start',
                },
              ],
            })
            controller.close()
          },
        }),
      }),
    })

    const result = streamText({
      model,
      messages,
      experimental_providerMetadata: { enableSources: true },
      experimental_thinking: { budgetTokens: 128 },
    })

    return result.toDataStreamResponse({ sendReasoning: true })
  },
)

export const Route = createFileRoute('/ai')({ component: AiPlayground })

function AiPlayground() {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const mockModel = useMemo(
    () =>
      new MockLanguageModelV3({
        modelId: 'tanstack-ai-helper',
        doStream: async () => ({
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue({
                type: 'thinking',
                thinking: 'Collecting the best TanStack AI guidance... ',
              })
              controller.enqueue({
                type: 'response',
                content: [
                  {
                    type: 'text-delta',
                    textDelta:
                      'Here is a concise walkthrough for TanStack + AI SDK: ',
                  },
                ],
              })
              controller.close()
            },
          }),
        }),
      }),
    [],
  )

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({
      id: 'tanstack-ai-demo',
      api: runChat.url,
      body: { modelId: mockModel.modelId },
      experimental_thinking: true,
      experimental_sources: true,
      streamProtocol: 'data',
      sendExtraMessageFields: true,
    })

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
                        <Message key={message.id ?? nanoid()} from={message.role}>
                          <MessageContent>
                            {'thinking' in message && message.thinking ? (
                              <p className="text-sm text-cyan-200">{message.thinking}</p>
                            ) : null}
                            {'sources' in message && Array.isArray(message.sources) ? (
                              <div className="mt-2 text-xs text-gray-400">
                                <p className="font-semibold text-gray-200">Sources</p>
                                <ul className="list-disc pl-4">
                                  {message.sources.map((source) => (
                                    <li key={source.id}>
                                      {source.title} - <a className="underline" href={source.url}>{source.url}</a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            {message.content?.map((contentPart, index) => (
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
                <form
                  className="border-t border-slate-800 p-4 space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (isAuthenticated) {
                      handleSubmit(event)
                    } else {
                      loginWithRedirect({ appState: { returnTo: '/ai' } })
                    }
                  }}
                >
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask how TanStack works with your AI stack"
                    className="bg-slate-900"
                  />
                  <div className="flex items-center justify-end">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading
                        ? 'Streaming...'
                        : isAuthenticated
                          ? 'Send prompt with sources'
                          : 'Sign in to run'}
                    </Button>
                  </div>
                </form>
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
