import { MenuItem } from "@/components/layout/sidebar";

// 관리자 메뉴 아이템
export const adminMenuItems: MenuItem[] = [
  {
    title: "공지사항 관리",
    href: "/admin/notice",
    icon: "megaphone",
  },
  {
    title: "이벤트 관리",
    href: "/admin/reviews",
    icon: "file-text",
  },
  {
    title: "회원 관리",
    href: "/admin/members",
    icon: "users",
  },
  {
    title: "응모 관리",
    href: "/admin/history",
    icon: "history",
  },
  {
    title: "정산 관리", 
    href: "/admin/payment",
    icon: "calculator",
  },
];

// 광고주 메뉴 아이템
export const providerMenuItems: MenuItem[] = [
  {
    title: "공지사항",
    href: "/provider/notice",
    icon: "megaphone",
  },
  {
    title: "이벤트 관리",
    href: "/provider/reviews",
    icon: "file-text",
  },
  // {
  //   title: "응모 관리",
  //   href: "/provider/history",
  //   icon: "history",
  // }
];

// 리뷰어 메뉴 아이템
export const clientMenuItems: MenuItem[] = [
  {
    title: "공지사항",
    href: "/client/notice",
    icon: "megaphone",
  },
  {
    title: "이벤트 관리",
    href: "/client/reviews",
    icon: "file-text",
  },
  // {
  //   title: "응모 관리",
  //   href: "/client/participation",
  //   icon: "history",
  // },
  {
    title: "마이페이지",
    href: "/client/mypage",
    icon: "mypage",
  }
]; 