"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, X, Play, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import RichTextEditor from "@/components/texteditor/RichTextEditor";
import VideoUploadManager, { VideoFile } from "@/components/video-upload/VideoUploadManager";
import { useToast } from "@/components/ui/use-toast";

interface NoticeForm {
  title: string;
  content: string;
  category: string;
  priority: string;
  is_pinned: boolean;
  status: string;
}

export default function CreateNoticePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [formData, setFormData] = useState<NoticeForm>({
    title: "",
    content: "",
    category: "general",
    priority: "normal",
    is_pinned: false,
    status: "active",
  });

  const supabase = createClient();
  const { toast } = useToast();

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
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setLoading(true);

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

      const response = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "공지사항 작성에 실패했습니다.");
        return;
      }

      toast({
        title: "공지사항 작성 완료",
        description: "공지사항이 성공적으로 작성되었습니다.",
      });
      router.push("/admin/notice?refresh=true");
    } catch (error) {
      toast({
        title: "공지사항 작성 실패",
        description: "공지사항 작성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (formData.title || formData.content || videos.length > 0) {
      if (confirm("작성 중인 내용이 있습니다. 정말로 취소하시겠습니까?")) {
        // 업로드된 동영상 파일들 삭제
        for (const video of videos) {
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

  return (
    <div className="space-y-6 w-full h-full">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">공지사항 작성</h1>
          <p className="text-muted-foreground">새로운 공지사항을 작성합니다.</p>
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
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "저장 중..." : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
