"use client"

import * as React from "react"
import { cva } from "class-variance-authority"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

type SidebarContextValue = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  children,
  ...props
}: SidebarProviderProps) {
  const [open, _setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        _setOpen(false)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (setOpenProp) {
        setOpenProp(value)
      } else {
        _setOpen(value)
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp]
  )

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev)
    } else {
      setOpen(!open)
    }
  }, [isMobile, open, setOpen])

  const contextValue = React.useMemo(
    () => ({
      state: open ? "expanded" : "collapsed",
      open: openProp ?? open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
    }),
    [open, openProp, setOpen, openMobile, isMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div {...props} className={cn("text-sidebar-foreground", props.className)}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

const sidebarVariants = cva(
  "relative flex flex-col gap-4 h-screen bg-sidebar-background text-sidebar-foreground border-r border-sidebar-border transition-[width,transform] duration-300 ease-in-out overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        floating: "border rounded-lg h-[calc(100vh-2rem)] m-4",
        inset: "h-[calc(100vh-2rem)] m-4",
      },
      side: {
        left: "",
        right: "right-0 border-l border-r-0",
      },
      collapsible: {
        icon: "",
        offcanvas: "",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      side: "left",
      collapsible: "icon",
    },
  }
)

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "floating" | "inset"
  side?: "left" | "right"
  collapsible?: "icon" | "offcanvas" | "none"
}

export function Sidebar({
  variant,
  side,
  collapsible = "icon",
  className,
  children,
  ...props
}: SidebarProps) {
  const { state, open, openMobile, isMobile } = useSidebar()

  return (
    <aside
      data-state={state}
      data-collapsible={collapsible}
      style={
        {
          "--sidebar-width": SIDEBAR_WIDTH,
          "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
        } as React.CSSProperties
      }
      className={cn(
        sidebarVariants({ variant, side, collapsible }),
        isMobile
          ? cn(
              "fixed inset-y-0 z-50",
              openMobile ? "translate-x-0" : "-translate-x-full"
            )
          : cn(
              collapsible === "icon" &&
                (open ? "w-[var(--sidebar-width)]" : "w-16"),
              collapsible === "offcanvas" &&
                (open ? "w-[var(--sidebar-width)]" : "w-0")
            ),
        className
      )}
      {...props}
    >
      {children}
      {isMobile && openMobile && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => useSidebar().setOpenMobile(false)}
        />
      )}
    </aside>
  )
}

export function SidebarTrigger() {
  const { toggleSidebar, open, isMobile } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
    >
      <ChevronLeft className={cn("h-4 w-4 transition-transform", !open && "rotate-180")} />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  )
}

export function SidebarContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-auto", className)} {...props}>
      {children}
    </div>
  )
}

export function SidebarHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useSidebar()
  
  return (
    <div
      className={cn("px-3 py-2 border-b border-sidebar-border flex items-center justify-between", className)}
      {...props}
    >
      <div className="flex-1">{children}</div>
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 p-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform", !open && "rotate-180")} />
        <span className="sr-only">Toggle Sidebar</span>
      </button>
    </div>
  )
}

export function SidebarFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-3 py-2 border-t border-sidebar-border", className)}
      {...props}
    >
      {children}
    </div>
  )
}
