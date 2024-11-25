'use client'

import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const steps = [
  'Analyzing document structure',
  'Extracting key concepts',
  'Generating comprehensive flashcards',
  'Creating personalized learning paths',
  'Optimizing for retention and recall'
]

export default function ProcessingStatus() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prevStep) => {
        if (prevStep < steps.length - 1) {
          return prevStep + 1
        }
        clearInterval(interval)
        return prevStep
      })
    }, 1000) // Simulating progress every second

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>AI Processing Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(currentStep / (steps.length - 1)) * 100} />
        <ul className="space-y-2">
          {steps.map((step, index) => (
            <li
              key={index}
              className={`flex items-center space-x-2 ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <span>{index <= currentStep ? '✓' : '○'}</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

