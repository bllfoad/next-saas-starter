'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import PDFViewer from "@/components/pdf-viewer"
import FlashcardView from "@/components/flashcard-view"
import ChatView from "@/components/chat-view"
import SummaryView from "@/components/summary-view"
import { Upload, PanelLeftClose, PanelLeftOpen, File, X, ChevronDown, ChevronRight, Loader2, ScanLine, CarIcon, Car } from 'lucide-react'
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
  status: string
  currentPage?: number
  totalPages?: number
  processingStep: 'uploading' | 'scanning' | 'generating' | 'complete' | 'error'
  stepDetails: string
  flashcards: Flashcard[]
  url?: string
}

interface Flashcard {
  id: number
  question: string
  answer: string
  hint?: string
  difficulty: number
  metadata: {
    chapter: string
    section: string | null
    topic: string
    language?: string
  }
}

export default function Page() {
  const [files, setFiles] = useState<File[]>([])
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null)
  const [isPdfVisible, setIsPdfVisible] = useState(true)
  const [fileToDelete, setFileToDelete] = useState<File | null>(null)
  const [isFileListVisible, setIsFileListVisible] = useState(true)
  const [fileStatuses, setFileStatuses] = useState<Map<string, FileStatus>>(new Map())
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false)
  const [selectedFileForCards, setSelectedFileForCards] = useState<string | null>(null)
  const [savedFiles, setSavedFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load saved files on mount
  useEffect(() => {
    const loadSavedFiles = async () => {
      try {
        const response = await fetch('/api/files/list')
        if (response.ok) {
          const { files } = await response.json()
          setSavedFiles(files)
          
          // Initialize file statuses for saved files
          const newStatuses = new Map<string, FileStatus>()
          files.forEach((file: any) => {
            const fileKey = `${file.id}-${file.filename}`
            newStatuses.set(fileKey, {
              isUploading: false,
              isScanning: false,
              isGeneratingFlashcards: false,
              uploadProgress: 100,
              status: 'Complete!',
              processingStep: 'complete',
              stepDetails: 'File processing complete',
              flashcards: [],
              url: file.url
            })
          })
          setFileStatuses(newStatuses)
        }
      } catch (error) {
        console.error('Error loading saved files:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedFiles()
  }, [])

  const simulateFileProcessing = async (file: File) => {
    const fileKey = `${file.name + file.lastModified}`

    // Initialize file status
    setFileStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(fileKey, { 
        isUploading: true, 
        isScanning: false, 
        isGeneratingFlashcards: false, 
        uploadProgress: 0,
        status: 'Starting upload...',
        processingStep: 'uploading',
        stepDetails: 'Preparing file for upload',
        flashcards: []
      })
      return newMap
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Update progress periodically
      const progressInterval = setInterval(() => {
        setFileStatuses(prev => {
          const newMap = new Map(prev)
          const status = newMap.get(fileKey)
          if (status && status.isUploading && status.uploadProgress < 90) {
            const newProgress = status.uploadProgress + 10
            let statusMessage = 'Uploading file...'
            let stepDetails = 'Transferring file data'
            let processingStep: FileStatus['processingStep'] = 'uploading'
            
            if (newProgress > 30 && newProgress <= 60) {
              statusMessage = 'Processing PDF...'
              stepDetails = 'Analyzing document structure'
              processingStep = 'scanning'
            } else if (newProgress > 60 && newProgress <= 90) {
              statusMessage = 'Generating flashcards...'
              stepDetails = 'Creating learning materials'
              processingStep = 'generating'
            }
            
            // Simulate page progress
            const currentPage = Math.floor((newProgress / 100) * 10)
            const totalPages = 10
            
            newMap.set(fileKey, {
              ...status,
              uploadProgress: newProgress,
              status: statusMessage,
              processingStep,
              stepDetails,
              currentPage,
              totalPages,
              isScanning: newProgress > 30 && newProgress <= 60,
              isGeneratingFlashcards: newProgress > 60 && newProgress <= 90
            })
          }
          return newMap
        })
      }, 500)

      const response = await fetch('/api/files/process', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error('Failed to process file')
      }

      const result = await response.json()

      // Complete processing
      setFileStatuses(prev => {
        const newMap = new Map(prev)
        const status = newMap.get(fileKey)
        if (status) {
          newMap.set(fileKey, { 
            ...status, 
            isUploading: false,
            isScanning: false,
            isGeneratingFlashcards: false,
            uploadProgress: 100,
            status: 'Complete!',
            processingStep: 'complete',
            stepDetails: 'File processing complete',
            url: result.fileUrl
          })
        }
        return newMap
      })

      // Refresh saved files list
      const listResponse = await fetch('/api/files/list')
      if (listResponse.ok) {
        const { files } = await listResponse.json()
        setSavedFiles(files)
      }

      return result
    } catch (error) {
      console.error('Error processing file:', error)
      setFileStatuses(prev => {
        const newMap = new Map(prev)
        const status = newMap.get(fileKey)
        if (status) {
          newMap.set(fileKey, { 
            ...status, 
            isUploading: false,
            isScanning: false,
            isGeneratingFlashcards: false,
            uploadProgress: 0,
            status: 'Error processing file',
            processingStep: 'error',
            stepDetails: 'An error occurred during file processing'
          })
        }
        return newMap
      })
      throw error
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || [])
    const pdfFiles = newFiles.filter(file => file.type === 'application/pdf')
    
    if (pdfFiles.length > 0) {
      // Immediately set loading state for all files before processing
      pdfFiles.forEach(file => {
        const fileKey = `${file.name + file.lastModified}`
        setFileStatuses(prev => {
          const newMap = new Map(prev)
          newMap.set(fileKey, { 
            isUploading: true, 
            isScanning: false, 
            isGeneratingFlashcards: false, 
            uploadProgress: 0,
            status: 'Starting upload...',
            processingStep: 'uploading',
            stepDetails: 'Preparing file for upload',
            flashcards: []
          })
          return newMap
        })
      })

      // Set files and current file
      setFiles(prevFiles => [...prevFiles, ...pdfFiles])
      
      // Set the first file as current if none is selected
      if (!currentFile) {
        setCurrentFile(pdfFiles[0])
        const objectUrl = URL.createObjectURL(pdfFiles[0])
        setCurrentFileUrl(objectUrl)
      }
      
      // Process each file
      pdfFiles.forEach(async (file) => {
        const fileKey = `${file.name + file.lastModified}`
        const objectUrl = URL.createObjectURL(file)
        
        // Update status with object URL
        setFileStatuses(prev => {
          const newMap = new Map(prev)
          const currentStatus = newMap.get(fileKey)
          if (currentStatus) {
            newMap.set(fileKey, { 
              ...currentStatus,
              url: objectUrl
            })
          }
          return newMap
        })

        try {
          await simulateFileProcessing(file)
        } catch (error) {
          console.error('Error uploading file:', error)
          URL.revokeObjectURL(objectUrl)
          
          // Update status to show error
          setFileStatuses(prev => {
            const newMap = new Map(prev)
            const currentStatus = newMap.get(fileKey)
            if (currentStatus) {
              newMap.set(fileKey, { 
                ...currentStatus,
                isUploading: false,
                status: 'Error processing file',
                processingStep: 'error',
                stepDetails: 'An error occurred during upload'
              })
            }
            return newMap
          })
        }
      })
    }
    
    event.target.value = ''
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (currentFileUrl) {
        URL.revokeObjectURL(currentFileUrl)
      }
      fileStatuses.forEach(status => {
        if (status.url?.startsWith('blob:')) {
          URL.revokeObjectURL(status.url)
        }
      })
    }
  }, [fileStatuses, currentFileUrl])

  const handleDeleteFile = async (fileId: number) => {
    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Remove file from state
      setSavedFiles(prev => prev.filter(file => file.id !== fileId));
      setFileStatuses(prev => {
        const newMap = new Map(prev);
        const fileKey = `${fileId}-${savedFiles.find(f => f.id === fileId)?.filename}`;
        newMap.delete(fileKey);
        return newMap;
      });

      // Close the dialog
      setFileToDelete(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      // You might want to show an error message to the user here
    }
  };

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
              <div className="flex flex-col space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Files</h2>
                  <Button
                    onClick={() => setIsFileListVisible(!isFileListVisible)}
                    variant="ghost"
                    size="sm"
                  >
                    {isFileListVisible ? 'Hide Files' : 'Show Files'}
                  </Button>
                </div>

                {isFileListVisible && (
                  <div className="space-y-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : savedFiles.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No files uploaded yet
                      </div>
                    ) : (
                      savedFiles.map((file) => {
                        const fileKey = `${file.id}-${file.filename}`;
                        const status = fileStatuses.get(fileKey);
                        
                        return (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <File className="h-6 w-6 text-blue-500" />
                              </div>
                              <div>
                                <h3 className="text-sm font-medium">{file.filename}</h3>
                                <p className="text-xs text-gray-500">
                                  {new Date(file.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {status?.isUploading || status?.isScanning || status?.isGeneratingFlashcards ? (
                                <div className="flex items-center space-x-3">
                                  <div className="flex flex-col w-32">
                                    <Progress value={status.uploadProgress} className="h-2" />
                                    {status.currentPage !== undefined && status.totalPages !== undefined && (
                                      <span className="text-xs text-gray-500 mt-1">
                                        Page {status.currentPage}/{status.totalPages}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center space-x-2">
                                      {status.isUploading && <Upload className="h-4 w-4 text-blue-500 animate-pulse" />}
                                      {status.isScanning && <ScanLine className="h-4 w-4 text-yellow-500 animate-pulse" />}
                                      {status.isGeneratingFlashcards && <Loader2 className="h-4 w-4 text-green-500 animate-spin" />}
                                      <span className="text-sm font-medium text-gray-700">
                                        {status.status}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {status.stepDetails}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {status?.url && (
                                    <a
                                      href={status.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:text-blue-700"
                                    >
                                      View
                                    </a>
                                  )}
                                  <Button
                                    onClick={() => {
                                      setSelectedFileForCards(fileKey)
                                      setIsCardsDialogOpen(true)
                                    }}
                                    variant="ghost"
                                    size="sm"
                                  >
                                    Flashcards
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteFile(file.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <PDFViewer file={currentFile} fileUrl={currentFileUrl} />
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
