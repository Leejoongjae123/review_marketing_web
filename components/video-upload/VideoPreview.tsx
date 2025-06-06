import React, { useState, useEffect, useRef } from 'react';
import { X, PlayCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';

interface VideoPreviewProps {
  videoUrl: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  onRemove: () => void;
}

export default function VideoPreview({
  videoUrl,
  fileName,
  originalName,
  fileSize,
  onRemove
}: VideoPreviewProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 동영상에서 썸네일 생성
  useEffect(() => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    
    video.onloadeddata = () => {
      try {
        // 동영상의 1/3 지점에서 썸네일 생성
        video.currentTime = Math.min(video.duration / 3, 3);
      } catch (error) {
        // 오류 발생 시 시작 지점 사용
        video.currentTime = 0;
      }
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg');
          setThumbnailUrl(dataUrl);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    video.onerror = () => {
      setLoading(false);
    };

    video.src = videoUrl;
    
    return () => {
      video.onerror = null;
      video.onloadeddata = null;
      video.onseeked = null;
      URL.revokeObjectURL(video.src);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  return (
    <div className="relative border rounded-md overflow-hidden group">
      {playing ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto max-h-[200px] object-contain bg-black"
          controls
          onEnded={() => setPlaying(false)}
          onPause={() => setPlaying(false)}
        />
      ) : (
        <div 
          className="relative aspect-video bg-muted flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              {thumbnailUrl ? (
                <img 
                  src={thumbnailUrl} 
                  alt={originalName}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full bg-muted">
                  <PlayCircle className="h-12 w-12 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle className="h-12 w-12 text-white" />
              </div>
            </>
          )}
        </div>
      )}
      
      <div className="p-3 text-sm">
        <p className="font-medium truncate" title={originalName}>{originalName}</p>
        <p className="text-muted-foreground text-xs">{formatBytes(fileSize)}</p>
      </div>
      
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
} 