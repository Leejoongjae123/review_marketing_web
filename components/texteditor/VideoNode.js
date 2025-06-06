import { DecoratorNode, $isRootNode, $createParagraphNode } from 'lexical';
import { Suspense } from 'react';
import VideoPlayer from '../VideoPlayer';

export class VideoNode extends DecoratorNode {
  __src;
  __width;
  __height;
  __align;
  __type;
  __fileName;

  static getType() {
    return 'video';
  }

  static clone(node) {
    return new VideoNode(
      node.__src,
      node.__width,
      node.__height,
      node.__align,
      node.__type,
      node.__fileName,
      node.__key
    );
  }

  constructor(src, width, height, align, type = 'url', fileName = null, key) {
    super(key);
    this.__src = src;
    this.__width = width || 560;
    this.__height = height || 315;
    this.__align = align || 'center';
    this.__type = type;
    this.__fileName = fileName;
  }

  createDOM(config) {
    const div = document.createElement('div');
    div.style.display = 'block';
    div.style.width = '100%';
    div.style.margin = '16px 0';
    div.style.textAlign = this.__align;
    div.style.position = 'relative';
    div.style.zIndex = '1';
    div.className = 'video-node-container';
    // 블록 레벨 요소로 설정
    div.setAttribute('data-lexical-decorator', 'true');
    div.setAttribute('contenteditable', 'false');
    return div;
  }

  updateDOM(prevNode, dom) {
    // 정렬이 변경된 경우에만 업데이트
    if (prevNode && prevNode.__align !== this.__align) {
      dom.style.textAlign = this.__align;
      return true;
    }
    return false;
  }

  // DecoratorNode 메서드들
  isInline() {
    return false; // 블록 레벨 요소
  }

  isKeyboardSelectable() {
    return true;
  }

  canInsertTextBefore() {
    return false;
  }

  canInsertTextAfter() {
    return false;
  }

  // HTML export를 위한 메서드
  exportDOM() {
    const element = document.createElement('div');
    element.style.display = 'block';
    element.style.margin = '16px 0';
    element.style.textAlign = this.__align;
    element.className = 'video-container';
    
    // React 컴포넌트를 DOM으로 렌더링하는 것은 복잡하므로
    // HTML export 시에는 간단한 구조로 변환
    if (this.__type === 'url') {
      // YouTube, Vimeo 등의 경우 iframe 생성
      let embedUrl = this.__src;
      const youtubeMatch = this.__src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (youtubeMatch) {
        embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
      }
      
      const vimeoMatch = this.__src.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch) {
        embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }

      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.width = this.__width;
      iframe.height = this.__height;
      iframe.frameBorder = '0';
      iframe.allowFullscreen = true;
      iframe.style.borderRadius = '8px';
      iframe.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      
      element.appendChild(iframe);
    } else {
      // 업로드된 동영상의 경우 video 태그 생성
      const video = document.createElement('video');
      video.src = this.__src;
      video.width = this.__width;
      video.height = this.__height;
      video.controls = true;
      video.style.borderRadius = '8px';
      video.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      video.style.width = '100%';
      video.style.maxWidth = `${this.__width}px`;
      
      element.appendChild(video);
    }
    
    return { element };
  }

  getSrc() {
    return this.__src;
  }

  getWidth() {
    return this.__width;
  }

  getHeight() {
    return this.__height;
  }

  getAlign() {
    return this.__align;
  }

  getType() {
    return this.__type;
  }

  getFileName() {
    return this.__fileName;
  }

  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setAlign(align) {
    const writable = this.getWritable();
    writable.__align = align;
  }

  // YouTube URL을 embed URL로 변환
  static convertToEmbedUrl(url) {
    // YouTube URL 패턴들
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    // Vimeo URL 패턴
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // 이미 embed URL이거나 다른 형식인 경우 그대로 반환
    return url;
  }

  decorate() {
    console.log('VideoNode decorate 호출됨:', {
      src: this.__src,
      width: this.__width,
      height: this.__height,
      align: this.__align,
      type: this.__type
    });

    try {
      return (
        <Suspense fallback={
          <div className="p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
            <div className="animate-pulse">동영상 로딩 중...</div>
          </div>
        }>
          <div className="video-node-wrapper" style={{ display: 'block', width: '100%' }}>
            <VideoPlayer
              src={this.__src}
              width={this.__width}
              height={this.__height}
              align={this.__align}
              type={this.__type}
            />
          </div>
        </Suspense>
      );
    } catch (error) {
      console.error('VideoNode decorate 에러:', error);
      return (
        <div className="p-4 text-center text-red-500 border border-red-200 rounded-lg bg-red-50">
          동영상을 로드할 수 없습니다: {error.message}
        </div>
      );
    }
  }

  static importJSON(serializedNode) {
    const { src, width, height, align, type, fileName } = serializedNode;
    const node = $createVideoNode({
      src,
      width,
      height,
      align,
      type,
      fileName,
    });
    return node;
  }

  exportJSON() {
    return {
      src: this.getSrc(),
      width: this.getWidth(),
      height: this.getHeight(),
      align: this.getAlign(),
      type: this.getType(),
      fileName: this.getFileName(),
      type: 'video',
      version: 1,
    };
  }
}

export function $createVideoNode({ src, width, height, align, type = 'url', fileName = null }) {
  const node = new VideoNode(src, width, height, align, type, fileName);
  return node;
}

export function $isVideoNode(node) {
  return node instanceof VideoNode;
} 