import { MenuItem } from "@/components/layout/sidebar";

// 관리자 메뉴 아이템
export const adminMenuItems: MenuItem[] = [
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
    title: "로그인/회원가입",
    href: "/admin/auth",
    icon: "log-in",
  },
  {
    title: "응모 관리",
    href: "/admin/history",
    icon: "history",
  },
];

// 광고주 메뉴 아이템
export const providerMenuItems: MenuItem[] = [
  {
    title: "이벤트 관리",
    href: "/provider/reviews",
    icon: "file-text",
  },
  {
    title: "로그인/회원가입",
    href: "/provider/auth",
    icon: "log-in",
  },
  {
    title: "응모 관리",
    href: "/provider/history",
    icon: "history",
  },
];

// 리뷰어 메뉴 아이템
export const clientMenuItems: MenuItem[] = [
  {
    title: "이벤트 관리",
    href: "/client/reviews",
    icon: "file-text",
  },
  {
    title: "로그인/회원가입",
    href: "/client/auth",
    icon: "log-in",
  },
  {
    title: "응모 관리",
    href: "/client/participation",
    icon: "history",
  },
]; 