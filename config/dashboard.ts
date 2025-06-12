import { MenuItem } from "@/components/layout/sidebar";

/**
 * 대시보드 설정 정보
 */
export const dashboardConfig = {
  /**
   * 관리자 사이드바 네비게이션 메뉴 설정
   */
  adminSidebarNav: [
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
    
  ] as MenuItem[],
  
  /**
   * 광고주 사이드바 네비게이션 메뉴 설정
   */
  providerSidebarNav: [
    {
      title: "이벤트 관리",
      href: "/provider/reviews",
      icon: "file-text",
    },
    {
      title: "응모 관리",
      href: "/provider/history",
      icon: "history",
    },
  ] as MenuItem[],
  
  /**
   * 리뷰어 사이드바 네비게이션 메뉴 설정
   */
  clientSidebarNav: [
    {
      title: "이벤트 목록",
      href: "/client/reviews",
      icon: "file-text",
    },
    {
      title: "응모 내역",
      href: "/client/participation",
      icon: "history",
    },
  ] as MenuItem[],
}; 