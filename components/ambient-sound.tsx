"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Volume2, VolumeX, Music } from 'lucide-react'
import { cn } from '@/lib/utils'

const SOUNDS = {
  rain: {
    label: 'Rain',
    url: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d432cd预0f.mp3?filename=rain-and-thunder-16705.mp3'
  },
  ocean: {
    label: 'Ocean',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_预bb6d6dfa.mp3?filename=ocean-waves-112303.mp3'
  },
  forest: {
    label: 'Forest',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_预d5cf5e02.mp3?filename=forest-with-small-river-birds-and-nature-field-recording-6735.mp3'
  },
  library: {
    label: 'Library',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/22/audio_预f2fde3df.mp3?filename=typing-6089.mp3'
  }
}

export function AmbientSound() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSound, setCurrentSound] = useState<keyof typeof SOUNDS>('rain')
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    audioRef.current = new Audio(SOUNDS[currentSound].url)
    audioRef.current.loop = true
    audioRef.current.volume = volume

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [currentSound])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const changeSound = (sound: keyof typeof SOUNDS) => {
    const wasPlaying = isPlaying
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setCurrentSound(sound)
    setIsPlaying(false)
    
    // Create and play new audio
    audioRef.current = new Audio(SOUNDS[sound].url)
    audioRef.current.loop = true
    audioRef.current.volume = volume
    
    if (wasPlaying) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-[42px] relative overflow-hidden",
              isPlaying && "text-primary"
            )}
          >
            {isPlaying ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <div className="flex flex-col gap-2 p-2">
            <div className="flex flex-col gap-1">
              {Object.entries(SOUNDS).map(([key, { label }]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={currentSound === key ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => changeSound(key as keyof typeof SOUNDS)}
                >
                  <Music className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
            <div className="px-2 py-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlay}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
