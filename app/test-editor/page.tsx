'use client';

import { useState } from 'react';
import RichTextEditor from '@/components/texteditor/RichTextEditor';

export default function TestEditorPage() {
  const [contents, setContents] = useState('');

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">리치 텍스트 에디터 테스트</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">새로 추가된 기능:</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>글자 색상 변경 기능 (색상 팔레트 및 커스텀 색상 선택)</li>
          <li>동영상 삽입 기능 (YouTube, Vimeo 지원)</li>
        </ul>
      </div>

      <div className="mb-8">
        <RichTextEditor 
          contents={contents} 
          setContents={setContents} 
        />
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">생성된 HTML:</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
          {contents || '내용이 없습니다.'}
        </pre>
      </div>
    </div>
  );
} 