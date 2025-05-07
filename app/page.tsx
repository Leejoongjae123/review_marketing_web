import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">리뷰 커뮤니티 플랫폼</h1>
        <p className="text-muted-foreground">역할에 맞는 서비스로 이동하세요.</p>
      </div>

      

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        <Card className="flex flex-col h-full shadow-lg">
          <CardHeader className="bg-purple-600 text-white">
            <CardTitle className="text-center">관리자</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="text-center mb-6 flex-1">
              <p>플랫폼을 관리하고 모든 기능에 접근할 수 있습니다.</p>
              <ul className="mt-4 text-sm text-muted-foreground text-left list-disc pl-4">
                <li>리뷰 목록 관리</li>
                <li>회원 관리</li>
                <li>회원 이력 검색</li>
              </ul>
            </div>
            <Link href="/admin/reviews" passHref>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                관리자 접속
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full shadow-lg">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-center">광고주</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="text-center mb-6 flex-1">
              <p>제품 홍보와 리뷰 관리를 위한 기능에 접근합니다.</p>
              <ul className="mt-4 text-sm text-muted-foreground text-left list-disc pl-4">
                <li>리뷰 목록 확인</li>
                <li>회원 이력 검색</li>
              </ul>
            </div>
            <Link href="/provider/reviews" passHref>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                광고주 접속
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full shadow-lg">
          <CardHeader className="bg-green-600 text-white">
            <CardTitle className="text-center">리뷰어</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-6">
            <div className="text-center mb-6 flex-1">
              <p>리뷰 작성 및 참여 이력을 관리합니다.</p>
              <ul className="mt-4 text-sm text-muted-foreground text-left list-disc pl-4">
                <li>리뷰 목록 확인</li>
                <li>참여 이력 확인</li>
              </ul>
            </div>
            <Link href="/client/reviews" passHref>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                리뷰어 접속
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
