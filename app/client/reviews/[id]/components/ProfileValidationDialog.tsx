import React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProfileValidationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  missingFields: string[];
}

const fieldNameMap: Record<string, string> = {
  phone: "핸드폰 번호",
  bank_name: "은행명",
  account_number: "계좌번호",
  citizen_no: "주민등록번호",
};

const ProfileValidationDialog: React.FC<ProfileValidationDialogProps> = ({
  isOpen,
  onOpenChange,
  missingFields,
}) => {
  const router = useRouter();

  const handleGoToMyPage = () => {
    router.push("/client/mypage");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">필수 정보 입력 필요</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-red-500">
            <X className="h-5 w-5" />
            <span className="font-medium">리뷰 신청을 위해 다음 정보가 필요합니다:</span>
          </div>
          <ul className="list-disc pl-6 space-y-1">
            {missingFields.map((field) => (
              <li key={field} className="text-gray-700">
                {fieldNameMap[field] || field}
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            원활한 리뷰 신청 및 정산을 위해 마이페이지에서 모든 필수 정보를 입력해주세요.
            모든 정보는 안전하게 암호화되어 저장됩니다.
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button onClick={handleGoToMyPage} className="bg-blue-600 hover:bg-blue-700">
            마이페이지로 이동
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileValidationDialog; 