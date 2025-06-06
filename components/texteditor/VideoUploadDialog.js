import { useState } from 'react';
import { MdClose, MdVideoLibrary, MdCloudUpload, MdLink, MdError } from 'react-icons/md';

export default function VideoUploadDialog({ isOpen, onClose, onInsert }) {
  const [activeTab, setActiveTab] = useState('url'); // 'url' 또는 'upload'
  const [videoUrl, setVideoUrl] = useState('');
  const [width, setWidth] = useState('560');
  const [height, setHeight] = useState('315');
  const [align, setAlign] = useState('center');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000); // 5초 후 에러 메시지 자동 제거
  };

  const handleUrlSubmit = () => {
    setError('');
    
    if (!videoUrl.trim()) {
      showError('동영상 URL을 입력해주세요.');
      return;
    }

    // URL 유효성 검사
    const isValidUrl = isValidVideoUrl(videoUrl);
    if (!isValidUrl) {
      showError('유효한 YouTube 또는 Vimeo URL을 입력해주세요.');
      return;
    }

    const videoData = {
      src: videoUrl.trim(),
      width: parseInt(width) || 560,
      height: parseInt(height) || 315,
      align,
      type: 'url'
    };

    console.log('URL 기반 동영상 삽입 데이터:', videoData);

    try {
      onInsert(videoData);
      console.log('URL 기반 동영상 삽입 완료');
      
      resetForm();
      onClose();
    } catch (insertError) {
      console.error('URL 기반 동영상 삽입 중 오류:', insertError);
      showError('동영상 삽입 중 오류가 발생했습니다.');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      showError('업로드할 동영상 파일을 선택해주세요.');
      return;
    }

    console.log('동영상 업로드 시작:', selectedFile.name);
    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      console.log('API 요청 전송 중...');
      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorResult = await response.json();
        console.error('업로드 실패:', errorResult);
        showError(errorResult.details 
          ? `${errorResult.error}: ${errorResult.details}` 
          : errorResult.error || '동영상 업로드에 실패했습니다.'
        );
        return;
      }

      const result = await response.json();
      console.log('업로드 성공 응답:', result);

      // 응답 데이터 확인
      if (!result.url) {
        console.error('응답에 URL이 없음:', result);
        showError('서버에서 동영상 URL을 받지 못했습니다.');
        return;
      }

      // 동영상 데이터 구성
      const videoData = {
        src: result.url,
        width: parseInt(width) || 560,
        height: parseInt(height) || 315,
        align: align || 'center',
        type: 'upload',
        fileName: result.fileName || result.originalFileName || selectedFile.name
      };

      console.log('에디터에 삽입할 데이터:', videoData);

      // 에디터에 삽입 - 약간의 지연을 두어 상태 업데이트 완료 기다리기
      setTimeout(() => {
        try {
          onInsert(videoData);
          console.log('onInsert 호출 완료');
          
          // 성공 메시지
          console.log('동영상이 성공적으로 업로드되고 삽입되었습니다.');
          
          resetForm();
          onClose();
        } catch (insertError) {
          console.error('onInsert 호출 중 오류:', insertError);
          showError('동영상 삽입 중 오류가 발생했습니다.');
        }
      }, 100);

    } catch (uploadError) {
      console.error('업로드 중 예외 발생:', uploadError);
      showError(`업로드 중 오류가 발생했습니다: ${uploadError.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    setError(''); // 기존 에러 클리어
    
    if (file) {
      // 파일 크기 검증 (100MB)
      if (file.size > 100 * 1024 * 1024) {
        showError('파일 크기는 100MB 이하여야 합니다.');
        e.target.value = '';
        return;
      }

      // 파일 타입 검증 (확장자 기반으로도 검증)
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv', 'video/quicktime'];
      const fileName = file.name.toLowerCase();
      const allowedExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv'];
      
      const hasValidMimeType = allowedTypes.includes(file.type);
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidMimeType && !hasValidExtension) {
        showError(`지원하지 않는 동영상 형식입니다. (파일 타입: ${file.type}, 파일명: ${file.name})`);
        e.target.value = '';
        return;
      }

      setSelectedFile(file);
    }
  };

  const isValidVideoUrl = (url) => {
    // YouTube URL 패턴
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/;
    // Vimeo URL 패턴
    const vimeoRegex = /vimeo\.com\/\d+/;
    // 일반적인 embed URL 패턴
    const embedRegex = /^https?:\/\/.+/;
    
    return youtubeRegex.test(url) || vimeoRegex.test(url) || embedRegex.test(url);
  };

  const resetForm = () => {
    setVideoUrl('');
    setWidth(560);
    setHeight(315);
    setAlign('center');
    setSelectedFile(null);
    setActiveTab('url');
    setUploading(false);
    setUploadProgress(0);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MdVideoLibrary className="w-5 h-5" />
            동영상 삽입
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
            <MdError className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* 탭 메뉴 */}
        <div className="flex mb-4 border-b">
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'url'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MdLink className="w-4 h-4" />
            URL 입력
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 'upload'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MdCloudUpload className="w-4 h-4" />
            파일 업로드
          </button>
        </div>

        {activeTab === 'url' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                동영상 URL *
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... 또는 https://vimeo.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                YouTube, Vimeo URL을 지원합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  너비 (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  min="200"
                  max="1200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  높이 (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  min="150"
                  max="800"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정렬
              </label>
              <select
                value={align || 'center'}
                onChange={(e) => setAlign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="left">왼쪽</option>
                <option value="center">가운데</option>
                <option value="right">오른쪽</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleUrlSubmit}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                삽입
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                동영상 파일 *
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                최대 100MB, MP4, WebM, OGG, AVI, MOV, WMV 형식을 지원합니다.
              </p>
              {selectedFile && (
                <p className="text-sm text-green-600 mt-1">
                  선택된 파일: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)
                </p>
              )}
            </div>

            {uploading && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>업로드 중...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  너비 (px)
                </label>
                <input
                  type="number"
                  value={width || ''}
                  onChange={(e) => setWidth(e.target.value)}
                  min="200"
                  max="1200"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  높이 (px)
                </label>
                <input
                  type="number"
                  value={height || ''}
                  onChange={(e) => setHeight(e.target.value)}
                  min="150"
                  max="800"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={uploading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정렬
              </label>
              <select
                value={align || 'center'}
                onChange={(e) => setAlign(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              >
                <option value="left">왼쪽</option>
                <option value="center">가운데</option>
                <option value="right">오른쪽</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={uploading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleFileUpload}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                disabled={!selectedFile || uploading}
              >
                {uploading ? '업로드 중...' : '업로드 & 삽입'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 