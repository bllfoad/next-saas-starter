'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface FileUploadProps {
  onFileUpload: (files: File[]) => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileUpload(acceptedFiles)
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  })

  return (
    <Card {...getRootProps()} className={`p-8 text-center cursor-pointer ${isDragActive ? 'bg-primary/10' : ''}`}>
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
      <Button className="mt-4">Select Files</Button>
    </Card>
  )
}

