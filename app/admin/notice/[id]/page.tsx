"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Save,
  X,
  Play,
  Trash2,
  Loader2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import RichTextEditor from "@/components/texteditor/RichTextEditor";
import VideoUploadManager, { VideoFile } from "@/components/video-upload/VideoUploadManager";

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

// NoticeForm 타입 정의
interface NoticeForm {
  title: string;
  content: string;
  category: string;
  priority: string;
  is_pinned: boolean;
  status: string;
}

export default function EditNoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<NoticeForm>({
    title: "",
    content: "",
    category: "general",
    priority: "normal",
    is_pinned: false,
    status: "active",
  });

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
        const noticeData = data.notice;
        setNotice(noticeData);
        
        // 폼 데이터 설정
        setFormData({
          title: noticeData.title || "",
          content: noticeData.content || "",
          category: noticeData.category || "general",
          priority: noticeData.priority || "normal",
          is_pinned: noticeData.is_pinned || false,
          status: noticeData.status || "active",
        });

        // 동영상 첨부 파일이 있다면 변환
        if (noticeData.video_attachments && noticeData.video_attachments.length > 0) {
          const videoFiles: VideoFile[] = noticeData.video_attachments.map((attachment: VideoAttachment) => ({
            id: attachment.fileName, // 고유 ID로 fileName 사용
            url: attachment.url,
            fileName: attachment.fileName,
            originalName: attachment.originalName,
            fileSize: attachment.fileSize,
            fileType: attachment.fileType,
            progress: 100,
            uploading: false
          }));
          setVideos(videoFiles);
        }
      } catch (error) {
        setError('공지사항을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchNoticeData();
  }, [params.id]);

  const handleInputChange = (
    field: keyof NoticeForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContentChange = (htmlContent: string) => {
    setFormData((prev) => ({
      ...prev,
      content: htmlContent,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "입력 오류",
        description: "제목과 내용을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // 성공적으로 업로드된 동영상만 포함
      const videoAttachments = videos.map(v => ({
        url: v.url,
        fileName: v.fileName,
        originalName: v.originalName,
        fileSize: v.fileSize,
        fileType: v.fileType
      }));

      const requestData = {
        ...formData,
        video_attachments: videoAttachments
      };

      const response = await fetch(`/api/notices/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "수정 실패",
          description: errorData.error || "공지사항 수정에 실패했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "수정 완료",
        description: "공지사항이 성공적으로 수정되었습니다.",
      });
      
      router.push("/admin/notice?refresh=true");
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "공지사항 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (JSON.stringify(formData) !== JSON.stringify({
      title: notice?.title || "",
      content: notice?.content || "",
      category: notice?.category || "general",
      priority: notice?.priority || "normal",
      is_pinned: notice?.is_pinned || false,
      status: notice?.status || "active",
         }) || videos.some(v => v.uploading)) {
      if (confirm("수정 중인 내용이 있습니다. 정말로 취소하시겠습니까?")) {
        // 새로 업로드된 동영상 파일들 삭제 (기존 파일 제외)
        const newVideos = videos.filter(v => !notice?.video_attachments?.some(existing => existing.fileName === v.fileName));
        for (const video of newVideos) {
          if (video.fileName) {
            try {
              await fetch(`/api/upload/video/delete?fileName=${video.fileName}`, {
                method: 'DELETE',
              });
            } catch (error) {
              // 삭제 실패해도 계속 진행
            }
          }
        }
        router.push("/admin/notice");
      }
    } else {
      router.push("/admin/notice");
    }
  };

  const handleDelete = async () => {
    if (!params.id) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/notices/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "삭제 실패",
          description: errorData.error || "공지사항 삭제에 실패했습니다.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "삭제 완료",
        description: "공지사항이 성공적으로 삭제되었습니다.",
      });
      
      router.push("/admin/notice?refresh=true");
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "공지사항 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
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
          <Button variant="outline" onClick={() => router.push('/admin/notice')}>
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
    <div className="space-y-6 w-full h-full">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">공지사항 수정</h1>
          <p className="text-muted-foreground">공지사항을 수정합니다.</p>
        </div>
      </div>

      <Card>
        <CardContent className="mt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                placeholder="공지사항 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>

            {/* 설정 옵션 */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="space-y-3">
                <Label htmlFor="status">상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="is_pinned">중요 공지사항</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_pinned"
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_pinned", checked)
                  }
                />
                <Label htmlFor="is_pinned">중요 공지사항으로 설정</Label>
              </div>
            </div>

            {/* 내용 */}
            <div className="space-y-2">
              <Label htmlFor="content">내용 *</Label>
              <RichTextEditor
                contents={formData.content}
                setContents={handleContentChange}
              />
            </div>
            
            {/* 동영상 첨부 */}
            <div className="space-y-4">
              <VideoUploadManager videos={videos} setVideos={setVideos} maxVideos={3} />
              
              {/* 업로드된 동영상 목록 */}
              {videos.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">업로드된 동영상 ({videos.length})</h3>
                  <div className="space-y-3">
                    {videos.map((video, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-md border">
                        <div className="flex items-center space-x-3">
                          <div className="bg-slate-100 p-2 rounded-md">
                            <Play className="h-5 w-5 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{video.originalName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(video.fileSize / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            const newVideos = [...videos];
                            newVideos.splice(index, 1);
                            setVideos(newVideos);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={saving || deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    수정 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    수정
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 첨부된 동영상 파일도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-500 hover:bg-red-600"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 