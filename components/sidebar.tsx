'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Boxes,
  CircleHelp,
  FileText,
  Home,
  Settings,
  Users,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed?: boolean
}

const items = [
  {
    title: 'Home',
    icon: Home,
    href: '/dashboard',
  },
  {
    title: 'Documents',
    icon: FileText,
    href: '/dashboard/documents',
  },
  {
    title: 'Library',
    icon: BookOpen,
    href: '/dashboard/library',
  },
  {
    title: 'Collections',
    icon: Boxes,
    href: '/dashboard/collections',
  },
  {
    title: 'Team',
    icon: Users,
    href: '/dashboard/team',
  },
  {
    title: 'Help',
    icon: CircleHelp,
    href: '/dashboard/help',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
  },
]

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-1 p-2">
      {items.map((item) => {
        const isActive = pathname === item.href
        return collapsed ? (
          <Tooltip key={item.href} delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href={item.href} passHref>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full h-10 justify-center",
                    isActive && "bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="sr-only">{item.title}</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {item.title}
            </TooltipContent>
          </Tooltip>
        ) : (
          <Link key={item.href} href={item.href} passHref>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                isActive && "bg-muted"
              )}
            >
              <item.icon className="h-4 w-4 mr-3" />
              {item.title}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}
