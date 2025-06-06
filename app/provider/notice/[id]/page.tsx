"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Pin,
  Eye,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import VideoAttachmentViewer from "@/components/video-upload/VideoAttachmentViewer";

// VideoAttachment 타입 정의
interface VideoAttachment {
  url: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
}

// Notice 타입 정의
interface Notice {
  id: string;
  title: string;
  content: string;
  status: string;
  author_id?: string;
  author_name?: string;
  category: string;
  priority: string;
  is_pinned: boolean;
  view_count: number;
  video_attachments?: VideoAttachment[];
  created_at: string;
  updated_at?: string;
}

export default function ProviderNoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchNoticeData = async () => {
      if (!params.id) return;

      setLoading(true);
      try {
        // 조회수 증가 없이 데이터만 가져오기
        const response = await fetch(`/api/notices/${params.id}?view=false`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('공지사항을 찾을 수 없습니다.');
          } else {
            setError('공지사항을 불러오는데 실패했습니다.');
          }
          return;
        }
        
        const data = await response.json();
        setNotice(data.notice);
      } catch (error) {
        setError('공지사항을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchNoticeData();
  }, [params.id]);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "normal":
        return "bg-blue-500 text-white";
      case "low":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "긴급";
      case "high":
        return "높음";
      case "normal":
        return "보통";
      case "low":
        return "낮음";
      default:
        return "보통";
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "general":
        return "일반";
      case "event":
        return "이벤트";
      case "maintenance":
        return "점검";
      case "update":
        return "업데이트";
      default:
        return "일반";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 text-white";
      case "inactive":
        return "bg-gray-500 text-white";
      default:
        return "bg-yellow-500 text-white";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "활성";
      case "inactive":
        return "비활성";
      default:
        return "알 수 없음";
    }
  };

  const handleGoBack = () => {
    router.push('/provider/notice?refresh=true');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="space-y-4 w-full h-full">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              {error || '공지사항을 찾을 수 없습니다.'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>

      {/* 공지사항 상세 정보 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {notice.is_pinned && (
                  <Pin className="w-5 h-5 text-red-500" />
                )}
                <CardTitle className={`text-2xl ${notice.is_pinned ? 'text-red-600' : ''}`}>
                  {notice.title}
                </CardTitle>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {notice.author_name || '관리자'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 w-4" />
                  {new Date(notice.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  조회수 {notice.view_count}
                </div>
              </div>
            </div>
            
            
          </div>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="p-6">
          <div className="prose max-w-none">
            <div 
              className="whitespace-pre-wrap text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: notice.content.replace(/\n/g, '<br />') 
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 동영상 첨부 파일 */}
      {notice.video_attachments && notice.video_attachments.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <VideoAttachmentViewer attachments={notice.video_attachments} />
          </CardContent>
        </Card>
      )}

      {/* 하단 액션 버튼 */}
      <div className="flex justify-center pt-6">
        <Button onClick={handleGoBack} className="w-32">
          목록으로 돌아가기
        </Button>
      </div>
    </div>
  );
} 