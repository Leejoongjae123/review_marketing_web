'use client'
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, User, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PrivacyTermsModal from "./components/PrivacyTermsModal";

// 사용자 정보 타입 정의
interface UserInfo {
  username: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  website: string;
  role: string;
  status: string;
  company_name: string;
  staff_name: string;
  bank_name: string;
  account_number: string;
  citizen_no: string;
  ssn_first_part: string; // citizen_no에서 파싱한 앞부분
  ssn_second_part: string; // citizen_no에서 파싱한 뒷부분
}

// slot_submissions 기반 활동 타입 정의
interface SlotSubmissionActivity {
  id: string;
  slot_id: string;
  user_id: string;
  name: string;
  phone: string;
  nickname: string;
  user_images: string[];
  submitted_at: string;
  updated_at: string;
  review_id: string;
  approval: boolean;
  review_title: string;
  review_platform: string;
  review_product_name: string;
  review_rating: number;
  review_price: number;
  review_status: string;
  payment_status: string;
  slot_number: number;
  review_fee: number;
}

// 플랫폼 필터 타입 정의
type PlatformFilter = '전체' | '영수증리뷰' | '예약자리뷰' | '구글' | '카카오' | '쿠팡' | '스토어';

export default function MypagePage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    website: '',
    role: '',
    status: '',
    company_name: '',
    staff_name: '',
    bank_name: '',
    account_number: '',
    citizen_no: '',
    ssn_first_part: '',
    ssn_second_part: ''
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("title");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformFilter>('전체');
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pageSize, setPageSize] = useState(10);
  const [activities, setActivities] = useState<SlotSubmissionActivity[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SlotSubmissionActivity | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  // 플랫폼 필터 옵션
  const platformOptions: PlatformFilter[] = ['전체', '영수증리뷰', '예약자리뷰', '구글', '카카오', '쿠팡', '스토어'];

  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
  };

  const fetchUserInfo = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        alert(`사용자 정보를 불러오는데 실패했습니다: ${userError.message}`);
        return;
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          alert(`프로필 정보를 불러오는데 실패했습니다: ${profileError.message}`);
          return;
        }

        if (profile) {
          const [ssn_first_part, ssn_second_part] = profile.citizen_no ? profile.citizen_no.split('-') : ['', ''];
          setUserInfo({
            username: profile.username || '',
            full_name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            avatar_url: profile.avatar_url || '',
            website: profile.website || '',
            role: profile.role || '',
            status: profile.status || '',
            company_name: profile.company_name || '',
            staff_name: profile.staff_name || '',
            bank_name: profile.bank_name || '',
            account_number: profile.account_number || '',
            citizen_no: profile.citizen_no || '',
            ssn_first_part: ssn_first_part,
            ssn_second_part: ssn_second_part
          });
        }
      }
    } catch (error) {
      alert('사용자 정보를 불러오는데 실패했습니다.');
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        toast({
          title: "사용자 정보를 불러오는데 실패했습니다.",
          description: userError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!user) {
        alert('로그인된 사용자가 없습니다.');
        setLoading(false);
        return;
      }

      let query = supabase
        .from('slot_submissions')
        .select(`
          *,
          reviews!inner(
            title,
            platform,
            product_name,
            rating,
            price,
            status,
            review_fee
          ),
          slots!inner(
            slot_number
          )
        `, { count: 'exact' })
        .eq('user_id', user.id);

      // 플랫폼 필터 적용
      if (selectedPlatform !== '전체') {
        query = query.eq('reviews.platform', selectedPlatform);
      }

      if (searchTerm) {
        if (searchCategory === 'title') {
          query = query.ilike('reviews.title', `%${searchTerm}%`);
        } else if (searchCategory === 'status') {
          query = query.eq('reviews.status', searchTerm);
        } else if (searchCategory === 'platform') {
          query = query.eq('reviews.platform', searchTerm);
        } else if (searchCategory === 'approval') {
          const approvalValue = searchTerm.toLowerCase() === '승인' || searchTerm.toLowerCase() === 'true';
          query = query.eq('approval', approvalValue);
        }
      }

      if (startDate) {
        query = query.gte('submitted_at', startDate);
      }

      if (endDate) {
        query = query.lte('submitted_at', `${endDate}T23:59:59Z`);
      }

      const from = (currentPage - 1) * pageSize;
      const to = currentPage * pageSize - 1;

      const { data, error, count } = await query
        .order('submitted_at', { ascending: false })
        .range(from, to);

      if (error) {
        alert(`활동 내역을 불러오는데 실패했습니다: ${error.message}`);
        return;
      }

      // 데이터 변환
      const formattedActivities: SlotSubmissionActivity[] = (data || []).map((item: any) => ({
        id: item.id,
        slot_id: item.slot_id,
        user_id: item.user_id,
        name: item.name,
        phone: item.phone,
        nickname: item.nickname,
        user_images: item.user_images || [],
        submitted_at: item.submitted_at,
        updated_at: item.updated_at,
        review_id: item.review_id,
        approval: item.approval,
        review_title: item.reviews.title,
        review_platform: item.reviews.platform,
        review_product_name: item.reviews.product_name,
        review_rating: item.reviews.rating,
        review_price: item.reviews.price,
        review_status: item.reviews.status,
        payment_status: item.payment_status || 'pending',
        slot_number: item.slots.slot_number,
        review_fee: item.reviews.review_fee || 0
      }));

      setActivities(formattedActivities);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));

    } catch (error) {
      alert('활동 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
    fetchUserInfo();
    fetchActivities();
  }, [currentPage, pageSize, selectedPlatform]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchActivities();
  };

  const handlePlatformFilter = (platform: PlatformFilter) => {
    setSelectedPlatform(platform);
    setCurrentPage(1);
  };

  const handleSaveUserInfo = async () => {
    setSaving(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        alert(`사용자 정보를 불러오는데 실패했습니다: ${userError.message}`);
        setSaving(false);
        return;
      }

      if (!user) {
        alert('로그인된 사용자가 없습니다.');
        setSaving(false);
        return;
      }

      // 주민등록번호 유효성 검사
      if (userInfo.ssn_first_part && userInfo.ssn_second_part) {
        if (userInfo.ssn_first_part.length !== 6 || userInfo.ssn_second_part.length !== 7) {
          alert('주민등록번호 형식이 올바르지 않습니다.');
          setSaving(false);
          return;
        }
      }

      const fullSsn = (userInfo.ssn_first_part && userInfo.ssn_second_part) 
        ? `${userInfo.ssn_first_part}-${userInfo.ssn_second_part}` 
        : '';

      const updateData = {
        username: userInfo.username || null,
        full_name: userInfo.full_name || null,
        email: userInfo.email || null,
        phone: userInfo.phone || null,
        avatar_url: userInfo.avatar_url || null,
        website: userInfo.website || null,
        role: userInfo.role || null,
        status: userInfo.status || null,
        company_name: userInfo.company_name || null,
        staff_name: userInfo.staff_name || null,
        bank_name: userInfo.bank_name || null,
        account_number: userInfo.account_number || null,
        citizen_no: fullSsn || null,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        toast({
          title: "정보 저장에 실패했습니다.",
          description: updateError.message,
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      toast({
        title: "정보가 성공적으로 저장되었습니다.",
        variant: "default",
      });
      
      // 저장 후 최신 정보로 다시 불러오기
      await fetchUserInfo();
      
    } catch (error) {
      toast({
        title: "정보 저장 중 오류가 발생했습니다.",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getPaymentStatusStyle = (payment_status: string) => {
    switch (payment_status) {
      case "completed":
        return "bg-green-500 text-white px-2 py-1 rounded-md";
      case "failed":
        return "bg-red-500 text-white px-2 py-1 rounded-md";
      case "pending":
      default:
        return "bg-yellow-500 text-white px-2 py-1 rounded-md";
    }
  };

  const getPaymentStatusText = (payment_status: string) => {
    switch (payment_status) {
      case "completed":
        return "입금완료";
      case "failed":
        return "입금불가";
      case "pending":
      default:
        return "대기중";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500 text-white px-2 py-1 rounded-md";
      case "rejected":
        return "bg-red-500 text-white px-2 py-1 rounded-md";
      default:
        return "bg-yellow-500 text-white px-2 py-1 rounded-md";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "승인됨";
      case "rejected":
        return "거부됨";
      case "pending":
        return "대기중";
      default:
        return "알 수 없음";
    }
  };

  const handleRowClick = (activity: SlotSubmissionActivity) => {
    setSelectedActivity(activity);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">마이페이지</h1>
      <p className="text-muted-foreground">개인정보 관리 및 활동 내역을 확인합니다.</p>
      
      {/* 개인정보 입력 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            개인정보 관리
          </CardTitle>
          <CardDescription>
            계좌정보, 연락처 등 개인정보를 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">핸드폰번호</Label>
              <Input
                id="phone"
                placeholder="010-0000-0000"
                value={userInfo.phone}
                onChange={(e) => setUserInfo(prev => ({...prev, phone: e.target.value}))}
              />
            </div>
            
            {/* 계좌정보 */}
            <div className="space-y-2">
              <Label htmlFor="bank_name">은행명</Label>
              <Input
                id="bank_name"
                placeholder="은행명을 입력하세요"
                value={userInfo.bank_name}
                onChange={(e) => setUserInfo(prev => ({...prev, bank_name: e.target.value}))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="account_number">계좌번호</Label>
              <Input
                id="account_number"
                placeholder="계좌번호를 입력하세요"
                value={userInfo.account_number}
                onChange={(e) => setUserInfo(prev => ({...prev, account_number: e.target.value}))}
              />
            </div>
            
            {/* 주민등록번호 */}
            <div className="space-y-2 md:col-span-1">
              <div className="flex items-center">
                <Label htmlFor="ssn_first_part">주민등록번호</Label>
                <PrivacyTermsModal />
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="ssn_first_part"
                  type="text"
                  placeholder="앞 6자리"
                  maxLength={6}
                  value={userInfo.ssn_first_part}
                  onChange={(e) => setUserInfo(prev => ({...prev, ssn_first_part: e.target.value}))}
                  className="w-1/2"
                />
                <span>-</span>
                <Input
                  id="ssn_second_part"
                  type="text"
                  placeholder="뒤 7자리"
                  maxLength={7}
                  value={userInfo.ssn_second_part}
                  onChange={(e) => setUserInfo(prev => ({...prev, ssn_second_part: e.target.value}))}
                  className="w-1/2"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveUserInfo} disabled={saving}>
              {saving ? "저장 중..." : "정보 저장"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 활동 내역 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>신청 내역</CardTitle>
          <CardDescription>내가 신청한 내역을 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 플랫폼 필터 버튼 */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {platformOptions.map((platform) => (
                <Button
                  key={platform}
                  variant={selectedPlatform === platform ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePlatformFilter(platform)}
                  className="transition-colors"
                >
                  {platform}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="검색 카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">리뷰 제목</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-center align-middle font-medium">번호</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">리뷰 제목</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">플랫폼</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">닉네임</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">리뷰비</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">결제 상태</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">신청일</th>
                    <th className="h-12 px-4 text-center align-middle font-medium">상세</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, index) => (
                    <tr 
                      key={activity.id} 
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleRowClick(activity)}
                    >
                      <td className="p-4 text-center">{((currentPage - 1) * pageSize) + index + 1}</td>
                      <td className="p-4 text-center">{activity.review_title}</td>
                      <td className="p-4 text-center">{activity.review_platform}</td>
                      <td className="p-4 text-center">{activity.nickname}</td>
                      <td className="p-4 text-center text-green-600 font-semibold">
                        {activity.review_fee?.toLocaleString()}원
                      </td>
                      <td className="p-4 text-center">
                        <span className={getPaymentStatusStyle(activity.payment_status)}>
                          {getPaymentStatusText(activity.payment_status)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {new Date(activity.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(activity);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* 페이지네이션 */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              전체 {totalCount}개 항목 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}개 표시
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                이전
              </Button>
              <div className="flex items-center">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상세 정보 다이얼로그 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              슬롯 신청 상세 정보
            </DialogTitle>
            <DialogDescription>
              선택한 슬롯 신청의 상세 정보입니다.
            </DialogDescription>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-6">
              {/* 리뷰 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">리뷰 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">제목</Label>
                      <p className="mt-1">{selectedActivity.review_title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">상품명</Label>
                      <p className="mt-1">{selectedActivity.review_product_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">플랫폼</Label>
                      <p className="mt-1">{selectedActivity.review_platform}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">평점</Label>
                      <p className="mt-1">{selectedActivity.review_rating}점</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">상품 가격</Label>
                      <p className="mt-1">{selectedActivity.review_price?.toLocaleString()}원</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">리뷰비</Label>
                      <p className="mt-1 text-green-600 font-semibold">
                        {selectedActivity.review_fee?.toLocaleString()}원
                      </p>
                    </div>

                  </CardContent>
                </Card>

                {/* 신청 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">신청 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">슬롯 번호</Label>
                      <p className="mt-1">{selectedActivity.slot_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">신청자명</Label>
                      <p className="mt-1">{selectedActivity.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">연락처</Label>
                      <p className="mt-1">{selectedActivity.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">닉네임</Label>
                      <p className="mt-1">{selectedActivity.nickname}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">결제 상태</Label>
                      <div className="mt-1">
                        <span className={getPaymentStatusStyle(selectedActivity.payment_status)}>
                          {getPaymentStatusText(selectedActivity.payment_status)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">신청일</Label>
                      <p className="mt-1">{new Date(selectedActivity.submitted_at).toLocaleString()}</p>
                    </div>
                    {selectedActivity.updated_at !== selectedActivity.submitted_at && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">수정일</Label>
                        <p className="mt-1">{new Date(selectedActivity.updated_at).toLocaleString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 제출 이미지 */}
              {selectedActivity.user_images && selectedActivity.user_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">제출 이미지</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedActivity.user_images.map((imageUrl, index) => (
                        <div key={index} className="aspect-square">
                          <img
                            src={imageUrl}
                            alt={`제출 이미지 ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.png'; // 기본 이미지 경로
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
