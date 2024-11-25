'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface FileChatProps {
  uploadedFiles: File[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function FileChat({ uploadedFiles }: FileChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: ChatMessage = { role: 'user', content: input }
    setMessages(prevMessages => [...prevMessages, userMessage])
    setInput('')

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: `Here's a response about your files: ${uploadedFiles.map(f => f.name).join(', ')}`
      }
      setMessages(prevMessages => [...prevMessages, aiMessage])
    }, 1000)
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat about your files</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pr-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg mb-2 ${
                message.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted'
              }`}
            >
              {message.content}
            </div>
          ))}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex space-x-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your files..."
          />
          <Button type="submit">Send</Button>
        </form>
      </CardContent>
    </Card>
  )
}

