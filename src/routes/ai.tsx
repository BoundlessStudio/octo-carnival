import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { convertToCoreMessages, streamText } from 'ai'
import type { UIMessage } from 'ai'
import { useChat } from 'ai/react'
import { createOpenAI } from '@ai-sdk/openai'
import { Brain, Sparkles } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useMemo } from 'react'

import { Conversation, ConversationContent, ConversationEmptyState } from '@/components/ai-elements/conversation'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useAuth0 } from '@auth0/auth0-react'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const runChat = createServerFn({ method: 'POST' }).handler(
  async ({ data }) => {
    const messages = await convertToCoreMessages<UIMessage>(data?.messages ?? [])
    const modelId = data?.modelId ?? 'gpt-4o-mini'

    const result = streamText({
      model: openai(modelId),
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
  const modelId = useMemo(() => 'gpt-4o-mini', [])

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } =
    useChat({
      id: 'tanstack-ai-demo',
      api: runChat.url,
      body: { modelId },
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
            Authenticate with Auth0, stream responses from OpenAI via the AI SDK, and
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
              Powered by <code className="text-cyan-300">@ai-sdk/openai</code> with streaming
              thinking traces and provider source metadata.
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
                  <li>AI SDK streams OpenAI responses with reasoning and sources enabled.</li>
                  <li>ai-elements primitives render conversations with TanStack styling.</li>
                </ul>
                <p className="text-xs text-gray-400">
                  Configure <code>OPENAI_API_KEY</code> to stream real outputs through the server
                  route.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
