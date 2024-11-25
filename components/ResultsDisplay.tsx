'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Flashcard {
  question: string
  answer: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

interface LearningPath {
  title: string
  steps: string[]
  estimatedTime: string
}

const ResultsDisplay = () => {
  const [results, setResults] = useState<{
    flashcards: Flashcard[]
    learningPaths: LearningPath[]
  }>({
    flashcards: [],
    learningPaths: []
  })

  useEffect(() => {
    // Simulating API call to get results
    const fetchResults = async () => {
      // Replace this with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setResults({
        flashcards: [
          { question: 'What is the main theme of the uploaded document?', answer: 'AI-powered learning systems', difficulty: 'Easy' },
          { question: 'Explain the concept of neural networks in the context of the document', answer: 'Neural networks are a key component of AI systems, mimicking human brain function', difficulty: 'Medium' },
          { question: 'What are the ethical implications of AI in education as discussed in the document?', answer: 'Privacy concerns, potential bias in algorithms, and the changing role of educators', difficulty: 'Hard' },
        ],
        learningPaths: [
          {
            title: 'AI in Education: Comprehensive Overview',
            steps: ['Introduction to AI', 'Machine Learning Basics', 'Neural Networks', 'AI Applications in Education', 'Ethical Considerations'],
            estimatedTime: '4-6 hours'
          },
          {
            title: 'Deep Dive: Neural Networks in Educational AI',
            steps: ['Fundamentals of Neural Networks', 'Types of Neural Networks', 'Training Neural Networks', 'Implementing NNs in Educational Software', 'Case Studies'],
            estimatedTime: '8-10 hours'
          },
        ],
      })
    }
    fetchResults()
  }, [])

  return (
    <div className="mt-8 space-y-8">
      <Tabs defaultValue="flashcards">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="learning-paths">Learning Paths</TabsTrigger>
        </TabsList>
        <TabsContent value="flashcards">
          <div className="grid gap-4 md:grid-cols-2">
            {results.flashcards.map((flashcard, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{flashcard.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{flashcard.answer}</p>
                  <p className="mt-2 text-sm font-semibold">Difficulty: {flashcard.difficulty}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="learning-paths">
          {results.learningPaths.map((path, index) => (
            <Card key={index} className="mb-4">
              <CardHeader>
                <CardTitle>{path.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside">
                  {path.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>
                <p className="mt-2 text-sm font-semibold">Estimated completion time: {path.estimatedTime}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      <Button>Download AI-Generated Study Materials</Button>
    </div>
  )
}

export default ResultsDisplay;
