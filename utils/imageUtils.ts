// 이미지 압축 및 리사이징 유틸리티

/**
 * 이미지를 압축하고 리사이징하는 함수
 * @param file 원본 이미지 파일
 * @param maxWidth 최대 가로 크기 (기본값: 800)
 * @param maxHeight 최대 세로 크기 (기본값: 600)
 * @param quality 압축 품질 (0-1, 기본값: 0.8)
 * @returns 압축된 이미지 파일
 */
export const compressImage = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 600,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 원본 이미지 크기
      const { width, height } = img;
      
      // 비율 계산
      let newWidth = width;
      let newHeight = height;
      
      // 최대 크기를 초과하는 경우 비율을 유지하면서 리사이징
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        newWidth = width * ratio;
        newHeight = height * ratio;
      }
      
      // 캔버스 크기 설정
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }
      
      // 이미지 그리기
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // 압축된 이미지를 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('이미지 압축에 실패했습니다.'));
            return;
          }
          
          // 압축된 Blob을 File로 변환
          const compressedFile = new File([blob], file.name, {
            type: blob.type,
            lastModified: Date.now(),
          });
          
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('이미지 로드에 실패했습니다.'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 이미지를 base64로 변환하는 함수
 * @param file 이미지 파일
 * @returns base64 문자열
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * 파일 크기를 MB 단위로 반환하는 함수
 * @param file 파일
 * @returns 파일 크기 (MB)
 */
export const getFileSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024);
};

/**
 * 이미지 파일 배열을 개별적으로 업로드하는 함수
 * @param files 업로드할 파일 배열
 * @param uploadUrl 업로드 API URL
 * @param prefix 파일명 prefix
 * @returns 업로드된 URL 배열
 */
export const uploadImagesSequentially = async (
  files: File[],
  uploadUrl: string,
  prefix: string = 'image'
): Promise<string[]> => {
  const uploadedUrls: string[] = [];
  
  for (const file of files) {
    try {
      // 이미지 압축
      const compressedFile = await compressImage(file);
      
      // 압축된 이미지를 base64로 변환
      const base64 = await fileToBase64(compressedFile);
      
      // 개별 업로드
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: base64,
          prefix: prefix
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.url) {
          uploadedUrls.push(result.url);
        }
      } else {
        console.error('이미지 업로드 실패:', response.status);
      }
    } catch (error) {
      console.error('이미지 처리 실패:', error);
    }
  }
  
  return uploadedUrls;
}; 