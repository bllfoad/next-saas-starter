"use client"

import { PomodoroTimer } from '@/components/pomodoro-timer'
import { AmbientSound } from '@/components/ambient-sound'

export function StudyControls() {
  return (
    <div className="fixed top-0 right-0 p-4 flex items-center gap-2 z-50">
      <AmbientSound />
      <PomodoroTimer />
    </div>
  )
}
