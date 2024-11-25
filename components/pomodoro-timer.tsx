"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Timer, Pause, Play, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak'

const TIMER_MODES = {
  pomodoro: { label: 'Pomodoro', duration: 25 * 60 },
  shortBreak: { label: 'Short Break', duration: 5 * 60 },
  longBreak: { label: 'Long Break', duration: 15 * 60 },
}

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES[mode].duration)
  const [isActive, setIsActive] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
    }

    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode)
    setTimeLeft(TIMER_MODES[newMode].duration)
    setIsActive(false)
  }

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setTimeLeft(TIMER_MODES[mode].duration)
    setIsActive(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = (timeLeft / TIMER_MODES[mode].duration) * 100

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-[120px] relative overflow-hidden group"
          >
            <div
              className={cn(
                "absolute inset-0 bg-primary/10 transition-all duration-300",
                isActive ? "opacity-100" : "opacity-0"
              )}
              style={{
                width: `${progress}%`,
              }}
            />
            <div className="relative flex items-center justify-center gap-2">
              <Timer className={cn(
                "h-4 w-4 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="font-medium">{formatTime(timeLeft)}</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <div className="flex flex-col gap-2 p-2">
            <div className="flex gap-2">
              {Object.entries(TIMER_MODES).map(([key, { label }]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={mode === key ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => handleModeChange(key as TimerMode)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={toggleTimer}
              >
                {isActive ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetTimer}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
