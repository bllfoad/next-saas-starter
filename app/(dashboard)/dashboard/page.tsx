'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import PDFViewer from "@/components/pdf-viewer"
import FlashcardView from "@/components/flashcard-view"
import ChatView from "@/components/chat-view"
import SummaryView from "@/components/summary-view"
import { Upload, PanelLeftClose, PanelLeftOpen, X, ChevronDown, ChevronRight, Loader2, ScanLine, CarIcon, Car } from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"

interface FileStatus {
  isUploading: boolean
  isScanning: boolean
  isGeneratingFlashcards: boolean
  uploadProgress: number
  flashcards: Flashcard[]
}

interface Flashcard {
  id: number
  term: string
  definition: string
}

export default function Page() {
  const [files, setFiles] = useState<File[]>([])
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [isPdfVisible, setIsPdfVisible] = useState(true)
  const [fileToDelete, setFileToDelete] = useState<File | null>(null)
  const [isFileListVisible, setIsFileListVisible] = useState(true)
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileStatus>>(new Map())
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false)
  const [selectedFileForCards, setSelectedFileForCards] = useState<string | null>(null)

  const simulateFileProcessing = async (file: File) => {
    const fileKey = file.name + file.lastModified

    // Simulate upload
    setFileStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(fileKey, { 
        isUploading: true, 
        isScanning: false, 
        isGeneratingFlashcards: false, 
        uploadProgress: 0,
        flashcards: []
      })
      return newMap
    })

    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setFileStatuses(prev => {
        const newMap = new Map(prev)
        const status = newMap.get(fileKey)
        if (status) {
          newMap.set(fileKey, { ...status, uploadProgress: progress })
        }
        return newMap
      })
    }

    // Simulate scanning
    setFileStatuses(prev => {
      const newMap = new Map(prev)
      const status = newMap.get(fileKey)
      if (status) {
        newMap.set(fileKey, { 
          ...status, 
          isUploading: false, 
          isScanning: true, 
          uploadProgress: 100 
        })
      }
      return newMap
    })
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate flashcard generation
    setFileStatuses(prev => {
      const newMap = new Map(prev)
      const status = newMap.get(fileKey)
      if (status) {
        newMap.set(fileKey, { 
          ...status, 
          isScanning: false, 
          isGeneratingFlashcards: true 
        })
      }
      return newMap
    })
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Complete processing with sample flashcards
    setFileStatuses(prev => {
      const newMap = new Map(prev)
      const status = newMap.get(fileKey)
      if (status) {
        newMap.set(fileKey, { 
          ...status, 
          isGeneratingFlashcards: false,
          flashcards: [
            {
              id: 1,
              term: "Key Concept 1",
              definition: "Definition of the first key concept from the document."
            },
            {
              id: 2,
              term: "Key Concept 2",
              definition: "Definition of the second key concept from the document."
            },
            {
              id: 3,
              term: "Key Concept 3",
              definition: "Definition of the third key concept from the document."
            }
          ]
        })
      }
      return newMap
    })
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || [])
    const pdfFiles = newFiles.filter(file => file.type === 'application/pdf')
    
    if (pdfFiles.length > 0) {
      setFiles(prevFiles => [...prevFiles, ...pdfFiles])
      if (!currentFile) {
        setCurrentFile(pdfFiles[0])
      }
      setIsPdfVisible(true)
      
      // Process each file
      for (const file of pdfFiles) {
        await simulateFileProcessing(file)
      }
    } else {
      alert('Please upload PDF files')
    }
    event.target.value = ''
  }

  const handleDeleteFile = () => {
    if (fileToDelete) {
      setFiles(prevFiles => prevFiles.filter(file => file !== fileToDelete))
      if (currentFile === fileToDelete) {
        const remainingFiles = files.filter(file => file !== fileToDelete)
        setCurrentFile(remainingFiles.length > 0 ? remainingFiles[0] : null)
      }
      setFileToDelete(null)
    }
  }

  const handlePdfPanelCollapse = () => {
    setIsPdfVisible(!isPdfVisible)
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {isPdfVisible ? (
        <ResizablePanel 
          defaultSize={75}
          minSize={30}
          maxSize={90}
          className={`h-full resizable-panel-transition ${
            !isPdfVisible ? 'resizable-panel-collapsed' : 'resizable-panel-expanded'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="border-b p-2 flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <h2 className="text-sm font-medium">Knowledge Base</h2>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" size="sm" className="h-8" asChild>
                    <span>
                      <Upload className="h-3 w-3 mr-2" />
                      Upload PDF
                    </span>
                  </Button>
                </label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8" 
                  onClick={handlePdfPanelCollapse}
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {files.length > 0 && (
                <div className="border-b bg-muted/50">
                  <div 
                    className="flex items-center p-2 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => setIsFileListVisible(!isFileListVisible)}
                  >
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0">
                      {isFileListVisible ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <h3 className="text-sm font-medium ml-1">
                      Uploaded Files ({files.length})
                    </h3>
                  </div>
                  <div className={`overflow-hidden transition-all duration-200 ${
                    isFileListVisible ? 'max-h-40' : 'max-h-0'
                  }`}>
                    <div className="flex gap-2 overflow-x-auto p-2">
                      {files.map((file, index) => {
                        const fileKey = file.name + file.lastModified
                        const status = fileStatuses.get(fileKey)
                        
                        return (
                          <div key={file.name + index} className="relative group flex items-center">
                            <Button
                              variant={currentFile === file ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentFile(file)}
                              className="whitespace-nowrap"
                              disabled={status?.isUploading || status?.isScanning || status?.isGeneratingFlashcards}
                            >
                              <span className="flex items-center gap-2">
                                {file.name}
                                {status?.isUploading && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          <span className="text-xs">Uploading... {status.uploadProgress}%</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Uploading file...</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {status?.isScanning && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <ScanLine className="h-3 w-3 animate-pulse" />
                                          <span className="text-xs">Scanning...</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Scanning document for content...</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {status?.isGeneratingFlashcards && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <CarIcon className="h-3 w-3 animate-pulse" />
                                          <span className="text-xs">Generating...</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Generating flashcards from document...</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </span>
                            </Button>
                            {!status?.isUploading && !status?.isScanning && !status?.isGeneratingFlashcards && (
                              <div className="flex items-center">
                                <Dialog open={isCardsDialogOpen && selectedFileForCards === fileKey} onOpenChange={(open) => {
                                  setIsCardsDialogOpen(open)
                                  if (!open) setSelectedFileForCards(null)
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 p-0 ml-1"
                                      onClick={() => {
                                        setSelectedFileForCards(fileKey)
                                        setIsCardsDialogOpen(true)
                                      }}
                                    >
                                      <Car className="h-3 w-3" />
                                      <span className="sr-only">Manage flashcards</span>
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Flashcards - {file.name}</DialogTitle>
                                      <DialogDescription>
                                        Review and manage generated flashcards
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      {status?.flashcards?.map((card, index) => (
                                        <Card key={card.id} className="p-4">
                                          <CardContent className="p-0">
                                            <div className="font-medium mb-2">Term:</div>
                                            <div className="text-sm mb-4 text-muted-foreground">{card.term}</div>
                                            <div className="font-medium mb-2">Definition:</div>
                                            <div className="text-sm text-muted-foreground">{card.definition}</div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                      {(!status?.flashcards || status.flashcards.length === 0) && (
                                        <div className="text-center text-muted-foreground py-8">
                                          No flashcards generated yet
                                        </div>
                                      )}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 p-0 ml-1"
                                            onClick={() => setFileToDelete(file)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete File</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete "{file.name}"? This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => setFileToDelete(null)}>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteFile}>
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete file</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              <PDFViewer file={currentFile} />
            </div>
          </div>
        </ResizablePanel>
      ) : null}
      <ResizableHandle withHandle className={!isPdfVisible ? 'hidden' : ''} />
      <ResizablePanel 
        defaultSize={25}
        className={`h-full border-l resizable-panel-transition ${
          !isPdfVisible ? '!w-full' : ''
        }`}
      >
        <div className="flex flex-col h-full">
          {!isPdfVisible && (
            <div className="border-b p-2 flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8" 
                onClick={handlePdfPanelCollapse}
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex-1">
            <Tabs defaultValue="chat" className="h-full">
              <TabsList className="w-full justify-between border-b rounded-none h-9">
                <TabsTrigger value="chat" className="flex-1 text-xs">Chat</TabsTrigger>
                <TabsTrigger value="flashcards" className="flex-1 text-xs">Flashcards</TabsTrigger>
                <TabsTrigger value="summary" className="flex-1 text-xs">Summary</TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="p-0 h-[calc(100%-2.25rem)]">
                <ChatView />
              </TabsContent>
              <TabsContent value="flashcards" className="p-0 h-[calc(100%-2.25rem)]">
                <FlashcardView />
              </TabsContent>
              <TabsContent value="summary" className="p-0 h-[calc(100%-2.25rem)]">
                <SummaryView />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
