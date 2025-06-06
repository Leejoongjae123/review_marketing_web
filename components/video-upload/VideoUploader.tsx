import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
  onUploadComplete: (data: {
    url: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    fileType: string;
  }) => void;
  onUploadError: (error: string) => void;
}

export default function VideoUploader({ onUploadComplete, onUploadError }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('video/')) {
      uploadVideo(files[0]);
    } else {
      onUploadError('동영상 파일만 업로드 가능합니다.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0].type.startsWith('video/')) {
      uploadVideo(files[0]);
    } else if (files && files.length > 0) {
      onUploadError('동영상 파일만 업로드 가능합니다.');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadVideo = async (file: File) => {
    setUploading(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.open('POST', '/api/upload/video', true);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      };
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          onUploadComplete({
            url: response.url,
            fileName: response.fileName,
            originalName: file.name,
            fileSize: file.size,
            fileType: file.type
          });
        } else {
          let errorMessage = '동영상 업로드에 실패했습니다.';
          try {
            const response = JSON.parse(xhr.responseText);
            errorMessage = response.error || errorMessage;
          } catch (e) {}
          onUploadError(errorMessage);
        }
        setUploading(false);
      };
      
      xhr.onerror = function() {
        onUploadError('네트워크 오류가 발생했습니다.');
        setUploading(false);
      };
      
      xhr.send(formData);
    } catch (error) {
      onUploadError('동영상 업로드 중 오류가 발생했습니다.');
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-4 transition-colors",
        isDragging ? "border-primary bg-secondary/20" : "border-border",
        uploading ? "opacity-70 pointer-events-none" : ""
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="video/*"
        className="hidden"
      />
      
      {uploading ? (
        <div className="w-full text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <Progress value={progress} className="w-full h-2" />
          <p className="text-sm text-muted-foreground">{progress}% 업로드 중...</p>
        </div>
      ) : (
        <>
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">동영상 파일을 여기에 드래그하거나</p>
            <p className="text-sm text-muted-foreground">최대 100MB, MP4, MOV, AVI 파일 지원</p>
          </div>
          <Button onClick={handleButtonClick} variant="outline" type="button">
            파일 선택
          </Button>
        </>
      )}
    </div>
  );
} 