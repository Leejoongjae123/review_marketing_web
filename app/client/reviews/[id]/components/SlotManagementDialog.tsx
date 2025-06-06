"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, Eye, X, Edit, Save, RotateCcw } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import { Quota, SubmissionHistoryData } from "../types";

interface SlotManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  slot: Quota | null;
  reviewId: string;
  onSlotUpdate: (updatedSlot: Quota) => void;
  submissionHistory?: SubmissionHistoryData | null;
}

interface UserSubmissionData {
  name: string;
  phone: string;
  nickname: string;
  userImages: { file: File; preview: string }[];
}

interface ImageData {
  id: string;
  preview: string;
  file?: File;
  isExisting: boolean;
}

export default function SlotManagementDialog({
  isOpen,
  onOpenChange,
  slot,
  reviewId,
  onSlotUpdate,
  submissionHistory,
}: SlotManagementDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [userSubmission, setUserSubmission] = useState<UserSubmissionData>({
    name: "",
    phone: "",
    nickname: "",
    userImages: [],
  });
  const [allImages, setAllImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string>("");
  const [imageError, setImageError] = useState<string>("");
  const userImageInputRef = useRef<HTMLInputElement>(null);

  // 제출 이력이 있으면 폼에 데이터 설정
  useEffect(() => {
    if (submissionHistory) {
      // 제출 이력이 있으면 기존 데이터로 설정
      setUserSubmission({
        name: submissionHistory.name,
        phone: submissionHistory.phone,
        nickname: submissionHistory.nickname,
        userImages: [],
      });
      
      // 기존 이미지를 allImages에 설정
      const existingImages: ImageData[] = (submissionHistory.user_images || []).map((url, index) => ({
        id: `existing-${index}`,
        preview: url,
        isExisting: true,
      }));
      setAllImages(existingImages);
      
      // 제출 완료 상태이므로 validation 에러 초기화
      setNicknameError("");
      setImageError("");
      setIsEditMode(true); // 제출 완료 상태에서도 편집 모드로 시작
    } else {
      // 제출 이력이 없으면 빈 값으로 초기화하고 입력 모드로 시작
      setUserSubmission({
        name: "",
        phone: "",
        nickname: "",
        userImages: [],
      });
      setAllImages([]);
      setNicknameError("닉네임을 입력해주세요");
      setImageError("리뷰 이미지를 업로드해주세요");
      setIsEditMode(true); // 새로 입력할 때는 바로 편집 모드
    }
  }, [submissionHistory, isOpen]);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isOpen) return;

      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          return;
        }

        // 제출 이력이 없을 때만 프로필 정보 설정
        if (!submissionHistory) {
          setUserSubmission(prev => ({
            ...prev,
            name: profile.full_name || "",
            phone: profile.phone || "",
          }));
        }
      } catch (error) {
        // 에러 발생해도 사용자에게 보이지 않게 조용히 처리
      }
    };

    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  // 닉네임 변경 시 실시간 validation
  const handleNicknameChange = (value: string) => {
    setUserSubmission(prev => ({ ...prev, nickname: value }));
    
    // 실시간으로 에러 상태 업데이트
    if (value.trim()) {
      setNicknameError("");
    } else {
      setNicknameError("닉네임을 입력해주세요");
    }
  };

  // 이미지 업로드 상태 체크
  const checkImageValidation = (images: ImageData[]) => {
    if (images.length > 0) {
      setImageError("");
    } else {
      setImageError("리뷰 이미지를 업로드해주세요");
    }
  };

  // 편집 모드 토글
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    
    // 편집 모드를 나갈 때 원래 데이터로 복원
    if (isEditMode && submissionHistory) {
      setUserSubmission({
        name: submissionHistory.name,
        phone: submissionHistory.phone,
        nickname: submissionHistory.nickname,
        userImages: [],
      });
      
      const existingImages: ImageData[] = (submissionHistory.user_images || []).map((url, index) => ({
        id: `existing-${index}`,
        preview: url,
        isExisting: true,
      }));
      setAllImages(existingImages);
      
      setNicknameError("");
      setImageError("");
    }
  };

  if (!slot) return null;

  // 파일 다운로드 함수
  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: "다운로드 완료",
        description: `${filename} 파일이 다운로드되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 사용자 이미지 업로드 처리
  const handleUserImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file: File) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          const newImageData: ImageData = {
            id: `new-${Date.now()}-${Math.random()}`,
            preview: reader.result as string,
            file,
            isExisting: false,
          };
          
          setAllImages((prev) => {
            const updatedImages = [...prev, newImageData];
            checkImageValidation(updatedImages);
            return updatedImages;
          });
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // 이미지 제거
  const removeImage = (imageId: string) => {
    setAllImages((prev) => {
      const updatedImages = prev.filter(img => img.id !== imageId);
      checkImageValidation(updatedImages);
      return updatedImages;
    });
  };

  // 사용자 정보 및 이미지 제출
  const handleSubmitUserData = async () => {
    // 닉네임 유효성 검사
    if (!userSubmission.nickname.trim()) {
      setNicknameError("닉네임을 입력해주세요");
      toast({
        title: "입력 오류",
        description: "닉네임을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 이미지 업로드 유효성 검사
    if (allImages.length === 0) {
      setImageError("리뷰 이미지를 업로드해주세요");
      toast({
        title: "입력 오류",
        description: "리뷰 이미지를 업로드해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (
      !userSubmission.name ||
      !userSubmission.phone
    ) {
      toast({
        title: "입력 오류",
        description: "이름, 전화번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("slotId", slot.id);
      formData.append("name", userSubmission.name);
      formData.append("phone", userSubmission.phone);
      formData.append("nickname", userSubmission.nickname);

      // 새로 업로드한 이미지만 전송
      const newImages = allImages.filter(img => !img.isExisting && img.file);
      newImages.forEach((imageData) => {
        if (imageData.file) {
          formData.append(`userImages`, imageData.file);
        }
      });

      // 기존 이미지 URL들도 전송 (유지할 이미지들)
      const existingImages = allImages.filter(img => img.isExisting);
      existingImages.forEach((imageData, index) => {
        formData.append(`existingImages[${index}]`, imageData.preview);
      });

      const response = await fetch(
        `/api/reviews/${reviewId}/submit-user-data`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "제출에 실패했습니다.");
      }

      toast({
        title: submissionHistory ? "수정 완료" : "제출 완료",
        description: submissionHistory 
          ? "사용자 정보와 이미지가 성공적으로 수정되었습니다."
          : "사용자 정보와 이미지가 성공적으로 제출되었습니다.",
      });

      // 상위 컴포넌트에서 제출 상태 업데이트 (status를 complete로 변경)
      const updatedSlot = { ...slot!, status: 'complete' as const };
      onSlotUpdate(updatedSlot);

      // 제출/수정 완료 후 다이얼로그 닫기
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "제출 실패",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-start text-2xl font-bold">
              {submissionHistory ? "리뷰 인증 정보 관리" : "리뷰 인증 이미지 업로드"}
            </DialogTitle>
          </DialogHeader>

          {/* 제출 완료 상태 안내 */}
          {submissionHistory && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-green-700">
                  ✅ 리뷰 인증 완료 - 수정 가능
                </h3>
              </div>
              
              <div className="text-sm text-green-600">
                <p>제출일: {new Date(submissionHistory.submitted_at).toLocaleString('ko-KR')}</p>
                {submissionHistory.updated_at !== submissionHistory.submitted_at && (
                  <p>최종 수정일: {new Date(submissionHistory.updated_at).toLocaleString('ko-KR')}</p>
                )}
              </div>
              
              <p className="text-green-600 text-sm">
                아래에서 정보를 수정하고 다시 저장할 수 있습니다.
              </p>
            </div>
          )}

          {/* 폼 입력 영역 - 항상 표시 */}
          {(
            <div className="space-y-6">
              {/* 이미지/영수증 조회 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-center items-center">
                {/* 관리자 업로드 이미지들 */}
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-lg font-semibold mb-3">참고용 이미지</h3>
                  {slot.images.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {slot.images.map((imageData, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={imageData.preview}
                              alt={`참고 이미지 ${index + 1}`}
                              fill
                              className="object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => setSelectedImage(imageData.preview)}
                            />
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              업로드: {imageData.uploadedAt}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                downloadFile(
                                  imageData.preview,
                                  `참고이미지_${index + 1}.jpg`
                                )
                              }
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      업로드된 참고 이미지가 없습니다.
                    </p>
                  )}
                </div>

                {/* 관리자 업로드 영수증들 */}
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-lg font-semibold mb-3">영수증</h3>
                  {slot.receipts.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                      {slot.receipts.map((receiptData, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                            <Image
                              src={receiptData.preview}
                              alt={`영수증 ${index + 1}`}
                              fill
                              className="object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() =>
                                setSelectedImage(receiptData.preview)
                              }
                            />
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              업로드: {receiptData.uploadedAt}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                downloadFile(
                                  receiptData.preview,
                                  `영수증_${index + 1}.jpg`
                                )
                              }
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      업로드된 영수증이 없습니다.
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* 정보 입력 및 이미지 업로드 */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={userSubmission.name}
                      onChange={(e) =>
                        setUserSubmission((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="실명을 입력해주세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호 *</Label>
                    <Input
                      id="phone"
                      value={userSubmission.phone}
                      onChange={(e) =>
                        setUserSubmission((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="010-0000-0000"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nickname">닉네임 *</Label>
                    <Input
                      id="nickname"
                      value={userSubmission.nickname}
                      onChange={(e) => handleNicknameChange(e.target.value)}
                      placeholder="리뷰에 사용할 닉네임"
                      className={nicknameError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
                    />
                    {nicknameError && (
                      <p className="text-red-500 text-sm mt-1 font-medium">{nicknameError}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* 리뷰 이미지 관리 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">리뷰 이미지 *</h3>
                  <div className="space-y-4">
                    <div>
                      <input
                        ref={userImageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUserImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => userImageInputRef.current?.click()}
                        className={`w-full ${imageError ? 'border-red-500 hover:border-red-600' : ''}`}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        이미지 추가
                      </Button>
                      {imageError && (
                        <p className="text-red-500 text-sm mt-2 font-medium">{imageError}</p>
                      )}
                    </div>
                    
                    {allImages.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {allImages.map((imageData) => (
                          <div key={imageData.id} className="relative group">
                            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                              <Image
                                src={imageData.preview}
                                alt={imageData.isExisting ? "기존 이미지" : "새 이미지"}
                                fill
                                className="object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setSelectedImage(imageData.preview)}
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(imageData.id)}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              {imageData.isExisting && (
                                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                                  기존
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isLoading}
                  >
                    닫기
                  </Button>
                  <Button
                    onClick={handleSubmitUserData}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      submissionHistory ? "수정 중..." : "제출 중..."
                    ) : (
                      <>
                        {submissionHistory ? <Save className="w-4 h-4 mr-2" /> : null}
                        {submissionHistory ? "수정 완료" : "제출하기"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 이미지 확대 보기 모달 */}
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>이미지 확대 보기</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={selectedImage}
                alt="확대 보기"
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
