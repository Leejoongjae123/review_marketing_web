"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { X, Upload, Video, Play, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { v4 as uuidv4 } from 'uuid';
import VideoUploader from './VideoUploader';
import VideoPreview from './VideoPreview';

export interface VideoFile {
  id: string;
  url: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
}

interface VideoUploadManagerProps {
  videos: VideoFile[];
  setVideos: React.Dispatch<React.SetStateAction<VideoFile[]>>;
  maxVideos?: number;
}

export default function VideoUploadManager({
  videos,
  setVideos,
  maxVideos = 5
}: VideoUploadManagerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleUploadComplete = (videoData: {
    url: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    fileType: string;
  }) => {
    setVideos(prev => [
      ...prev,
      {
        id: uuidv4(),
        ...videoData
      }
    ]);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleRemoveVideo = async (index: number) => {
    const video = videos[index];
    
    try {
      // 파일 삭제 API 호출
      await fetch(`/api/upload/video/delete?fileName=${video.fileName}`, {
        method: 'DELETE',
      });
      
      // 상태에서 비디오 제거
      setVideos(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      alert('비디오 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      

      
      {videos.length < maxVideos ? (
        <VideoUploader
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          최대 {maxVideos}개의 동영상을 첨부할 수 있습니다.
        </p>
      )}
    </div>
  );
} 