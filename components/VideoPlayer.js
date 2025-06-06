import { useState, useRef } from 'react';
import { MdPlayArrow, MdPause, MdVolumeUp, MdVolumeOff, MdFullscreen } from 'react-icons/md';

export default function VideoPlayer({ src, width = 560, height = 315, align = 'center', type = 'url' }) {
  console.log('VideoPlayer 렌더링됨:', { src, width, height, align, type });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [volume, setVolume] = useState(1);
  const videoRef = useRef(null);

  // src가 없으면 에러 표시
  if (!src) {
    return (
      <div className="p-4 text-center text-red-500 border border-red-200 rounded-lg bg-red-50">
        동영상 URL이 제공되지 않았습니다.
      </div>
    );
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * duration;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAlignmentClass = () => {
    switch (align) {
      case 'left':
        return 'justify-start';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  // URL 기반 동영상 (YouTube, Vimeo 등)의 경우 iframe 사용
  if (type === 'url') {
    let embedUrl = src;
    
    // YouTube URL을 embed URL로 변환
    const youtubeMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (youtubeMatch) {
      embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo URL을 embed URL로 변환
    const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return (
      <div 
        className={`flex ${getAlignmentClass()} my-4 w-full`} 
        style={{ 
          display: 'block',
          width: '100%',
          margin: '16px 0',
          position: 'relative'
        }}
      >
        <div className="relative w-full max-w-none">
          <iframe
            src={embedUrl}
            width={width}
            height={height}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg shadow-lg max-w-full"
            style={{ 
              width: '100%', 
              maxWidth: `${width}px`,
              height: `${height}px`,
              aspectRatio: `${width} / ${height}`,
              display: 'block'
            }}
          />
        </div>
      </div>
    );
  }

  // 업로드된 동영상의 경우 video 태그 사용
  return (
    <div 
      className={`flex ${getAlignmentClass()} my-4 w-full`} 
      style={{ 
        display: 'block',
        width: '100%',
        margin: '16px 0',
        position: 'relative'
      }}
    >
      <div 
        className="relative group w-full max-w-none"
        style={{ 
          width: '100%', 
          maxWidth: `${width}px`,
          height: `${height}px`
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={src}
          width={width}
          height={height}
          className="rounded-lg shadow-lg w-full h-full object-cover max-w-full"
          style={{ 
            width: '100%', 
            maxWidth: `${width}px`,
            height: `${height}px`,
            aspectRatio: `${width} / ${height}`,
            display: 'block'
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          onError={(e) => {
            if (process.env.NODE_ENV === 'development') {
              // console.error 대신 더 안전한 방식으로 처리
            }
          }}
          onLoadStart={() => {
            if (process.env.NODE_ENV === 'development') {
              // console.log 대신 더 안전한 방식으로 처리
            }
          }}
          crossOrigin="anonymous"
        />
        
        {/* 커스텀 컨트롤 */}
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* 진행 바 */}
          <div 
            className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-white rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          
          {/* 컨트롤 버튼들 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? (
                  <MdPause className="w-6 h-6" />
                ) : (
                  <MdPlayArrow className="w-6 h-6" />
                )}
              </button>
              
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted ? (
                  <MdVolumeOff className="w-5 h-5" />
                ) : (
                  <MdVolumeUp className="w-5 h-5" />
                )}
              </button>
              
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <MdFullscreen className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* 재생 버튼 오버레이 */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={togglePlay}
              className="bg-black/50 hover:bg-black/70 text-white rounded-full p-4 transition-all duration-300"
            >
              <MdPlayArrow className="w-12 h-12 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 