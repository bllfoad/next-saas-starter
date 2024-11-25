'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  selectedFile: File | null
}

export default function PDFViewer({ selectedFile }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  if (!selectedFile) {
    return (
      <Card className="p-4 text-center">
        <p>Select a PDF file to view</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <CardContent className="flex flex-col items-center">
        <Document
          file={selectedFile}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          <Page pageNumber={pageNumber} width={300} />
        </Document>
        <div className="flex justify-between items-center mt-4 w-full">
          <Button
            onClick={() => setPageNumber(page => Math.max(page - 1, 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </Button>
          <p>
            Page {pageNumber} of {numPages}
          </p>
          <Button
            onClick={() => setPageNumber(page => Math.min(page + 1, numPages || 1))}
            disabled={pageNumber >= (numPages || 1)}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

