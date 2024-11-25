'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ZoomIn, ZoomOut, Download, Printer, RotateCw, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react'

interface PDFViewerProps {
  file: File | null
  fileUrl?: string
}

export default function PDFViewer({ file, fileUrl }: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages] = useState(18)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  // Create object URL when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  // Reset current page when file changes
  useEffect(() => {
    setCurrentPage(1)
  }, [file, fileUrl])

  const displayUrl = fileUrl || objectUrl

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 20))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))

  if (!displayUrl && !file) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No file selected</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b p-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <Input 
              type="number" 
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-16 text-center"
            />
            <span className="ml-1">%</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handlePrevPage}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <Input 
              type="number" 
              value={currentPage}
              onChange={(e) => {
                const page = Math.max(1, Math.min(Number(e.target.value), totalPages))
                setCurrentPage(page)
              }}
              className="w-16 text-center"
            />
            <span className="mx-1">of {totalPages}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextPage}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => console.log('Download clicked')}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => console.log('More options clicked')}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 relative overflow-auto bg-gray-100">
        {displayUrl && (
          <iframe
            src={displayUrl}
            className="w-full h-full"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
          />
        )}
      </div>
    </div>
  )
}
