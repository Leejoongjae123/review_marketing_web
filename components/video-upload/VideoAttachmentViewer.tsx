"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoAttachment {
  url: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
}

interface VideoAttachmentViewerProps {
  attachments: VideoAttachment[];
}

export default function VideoAttachmentViewer({ attachments }: VideoAttachmentViewerProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + 'MB';
  };

  const getVideoType = (fileType: string): string => {
    switch (fileType) {
      case 'video/mp4':
        return 'MP4';
      case 'video/webm':
        return 'WebM';
      case 'video/ogg':
        return 'OGG';
      case 'video/avi':
        return 'AVI';
      case 'video/mov':
      case 'video/quicktime':
        return 'MOV';
      case 'video/wmv':
        return 'WMV';
      default:
        return 'Video';
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      // 다운로드 실패 시 새 탭에서 열기
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Video className="h-5 w-5" />
        첨부된 동영상 ({attachments.length}개)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments.map((attachment, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-4">
              {/* 동영상 플레이어 */}
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  <source src={attachment.url} type={attachment.fileType} />
                  <p className="flex items-center justify-center h-full text-gray-500">
                    브라우저에서 지원하지 않는 동영상 형식입니다.
                  </p>
                </video>
              </div>
              
              {/* 파일 정보 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate" title={attachment.originalName}>
                    {attachment.originalName}
                  </p>
                  <Badge variant="secondary" className="ml-2">
                    {getVideoType(attachment.fileType)}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(attachment.url, attachment.originalName)}
                      className="h-8 px-3"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      다운로드
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="h-8 px-3"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      새 창
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 