'use client';

import { cn } from "@/lib/utils"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useUser } from "@/lib/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Home, Library, Users, Settings, HelpCircle, FolderKanban, Menu } from "lucide-react"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { StudyControls } from "@/components/study-controls"

const navigationItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Documents', href: '/dashboard/documents', icon: FolderKanban },
  { name: 'Library', href: '/dashboard/library', icon: Library },
  { name: 'Team', href: '/dashboard/team', icon: Users },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Profile', href: '/dashboard/profile', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen overflow-hidden bg-background">
        <StudyControls />
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.avatarUrl || ''} alt={user?.name || ''} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <nav className="space-y-1 px-3">
              {navigationItems.map((item) => (
                <Button
                  key={item.name}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <a href={item.href}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </a>
                </Button>
              ))}
            </nav>
          </SidebarContent>

          <SidebarFooter>
            <ThemeSwitcher />
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-0">
          <header className="h-14 border-b px-4 flex items-center gap-4 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
            <div className="font-semibold">Danerdz</div>
          </header>
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
