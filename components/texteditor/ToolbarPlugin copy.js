'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState, useRef } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $insertNodes,
  $createTextNode,
  $getRoot
} from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import { $isListNode, ListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { 
  INSERT_TABLE_COMMAND,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL
} from '@lexical/table';
import { $createImageNode } from './ImageNode';
import { $createVideoNode } from './VideoNode';
import ImageUploadDialog from './ImageUploadDialog';
import VideoUploadDialog from './VideoUploadDialog';
import TableInsertDialog from './TableInsertDialog';

// React Icons 추가
import { 
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdImage,
  MdTableChart,
  MdVideoLibrary,
  MdFormatColorText
} from 'react-icons/md';

const LowPriority = 1;

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#000000');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element.getParent();
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type || 'paragraph');
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type || 'paragraph');
        }
      }
      
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      
      // Update text color
      const node = anchorNode.getParent() || anchorNode;
      if (node) {
        const style = node.getStyle();
        const colorMatch = style.match(/color:\s*([^;]+)/);
        if (colorMatch) {
          setCurrentTextColor(colorMatch[1].trim());
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [updateToolbar, editor]);

  // 색상 피커 참조
  const colorPickerRef = useRef(null);

  // 색상 피커 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorPicker && colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createCodeNode());
        }
      });
    }
  };

  const insertImage = () => {
    setShowImageDialog(true);
  };

  const onImageInsert = (imageData) => {
    editor.update(() => {
      const imageNode = $createImageNode({
        src: imageData.src,
        altText: imageData.altText,
        width: imageData.width,
        height: imageData.height,
        align: imageData.align,
      });
      $insertNodes([imageNode]);
    });
  };

  const insertVideo = () => {
    console.log('insertVideo 함수 호출됨');
    setShowVideoDialog(true);
  };

  const onVideoInsert = (videoData) => {
    console.log('onVideoInsert 호출됨:', videoData);
    
    editor.update(() => {
      try {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection)) {
          const videoNode = $createVideoNode({
            src: videoData.src,
            width: videoData.width,
            height: videoData.height,
            align: videoData.align,
            type: videoData.type || 'url',
            fileName: videoData.fileName || null,
          });
          
          console.log('VideoNode 생성됨:', videoNode);
          
          // 현재 선택된 노드 찾기
          const anchorNode = selection.anchor.getNode();
          
          // 블록 레벨 요소 찾기
          const topLevelElement = anchorNode.getTopLevelElementOrThrow();
          
          // 현재 블록이 빈 문단인지 확인
          const isEmptyParagraph = topLevelElement.getType() === 'paragraph' && 
                                  topLevelElement.getTextContent().trim() === '';
          
          console.log('현재 블록 상태:', {
            type: topLevelElement.getType(),
            isEmpty: isEmptyParagraph,
            textContent: topLevelElement.getTextContent()
          });
          
          if (isEmptyParagraph) {
            // 빈 문단인 경우 비디오 노드로 교체
            const videoParagraph = $createParagraphNode();
            videoParagraph.append(videoNode);
            topLevelElement.replace(videoParagraph);
            
            // 비디오 노드 다음에 새로운 빈 문단 추가
            const nextParagraph = $createParagraphNode();
            videoParagraph.insertAfter(nextParagraph);
            nextParagraph.select();
            
            console.log('빈 문단을 비디오로 교체 완료');
          } else {
            // 기존 블록이 비어있지 않은 경우 새로운 블록으로 삽입
            const videoParagraph = $createParagraphNode();
            videoParagraph.append(videoNode);
            
            // 현재 블록 뒤에 삽입
            topLevelElement.insertAfter(videoParagraph);
            
            // 비디오 노드 다음에 새로운 빈 문단 추가
            const nextParagraph = $createParagraphNode();
            videoParagraph.insertAfter(nextParagraph);
            nextParagraph.select();
            
            console.log('새 블록으로 비디오 삽입 완료');
          }
        } else {
          console.warn('유효한 선택 영역이 없습니다');
          
          // 선택 영역이 없는 경우 루트에 직접 추가
          const root = $getRoot();
          const videoNode = $createVideoNode({
            src: videoData.src,
            width: videoData.width,
            height: videoData.height,
            align: videoData.align,
            type: videoData.type || 'url',
            fileName: videoData.fileName || null,
          });
          
          const videoParagraph = $createParagraphNode();
          videoParagraph.append(videoNode);
          root.append(videoParagraph);
          
          // 새로운 빈 문단 추가
          const nextParagraph = $createParagraphNode();
          root.append(nextParagraph);
          nextParagraph.select();
          
          console.log('루트에 비디오 삽입 완료');
        }
      } catch (error) {
        console.error('비디오 삽입 중 오류 발생:', error);
      }
    });
  };

  const insertTable = () => {
    setShowTableDialog(true);
  };

  const onTableInsert = (tableData) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: tableData.columns,
      rows: tableData.rows,
    });
  };

  const applyTextColor = (color) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Lexical의 스타일 패치 기능을 사용하여 색상 적용
        $patchStyleText(selection, {
          color: color,
        });
      }
    });
    setCurrentTextColor(color);
    setShowColorPicker(false);
  };

  return (
    <div className="toolbar flex flex-wrap items-center gap-2 p-2 border-b bg-gray-50 rounded-lg">
      {/* Block Type Selector */}
      <select
        className="px-2 py-1 border rounded"
        value={blockType || 'paragraph'}
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'paragraph') {
            formatParagraph();
          } else if (value === 'h1') {
            formatHeading('h1');
          } else if (value === 'h2') {
            formatHeading('h2');
          } else if (value === 'h3') {
            formatHeading('h3');
          } else if (value === 'bullet') {
            formatBulletList();
          } else if (value === 'number') {
            formatNumberedList();
          } else if (value === 'quote') {
            formatQuote();
          } else if (value === 'code') {
            formatCode();
          }
        }}
      >
        <option value="paragraph">일반 텍스트</option>
        <option value="h1">제목 1</option>
        <option value="h2">제목 2</option>
        <option value="h3">제목 3</option>
        <option value="bullet">글머리 기호</option>
        <option value="number">번호 매기기</option>
        <option value="quote">인용</option>
        <option value="code">코드 블록</option>
      </select>

      <div className="h-6 w-px bg-gray-300" />

      {/* Text Format Buttons */}
      <button
        className={`px-3 py-1 border rounded flex items-center justify-center ${isBold ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Bold"
        title="굵게"
        type="button"
      >
        <MdFormatBold className="w-4 h-4" />
      </button>

      <button
        className={`px-3 py-1 border rounded flex items-center justify-center ${isItalic ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Italic"
        title="기울임"
        type="button"
      >
        <MdFormatItalic className="w-4 h-4" />
      </button>

      <button
        className={`px-3 py-1 border rounded flex items-center justify-center ${isUnderline ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Underline"
        title="밑줄"
        type="button"
      >
        <MdFormatUnderlined className="w-4 h-4" />
      </button>

      <button
        className={`px-3 py-1 border rounded flex items-center justify-center ${isStrikethrough ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Strikethrough"
        title="취소선"
        type="button"
      >
        <MdFormatStrikethrough className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-gray-300" />

      {/* Alignment Buttons */}
      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Left Align"
        title="왼쪽 정렬"
        type="button"
      >
        <MdFormatAlignLeft className="w-4 h-4" />
      </button>

      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Center Align"
        title="가운데 정렬"
        type="button"
      >
        <MdFormatAlignCenter className="w-4 h-4" />
      </button>

      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Right Align"
        title="오른쪽 정렬"
        type="button"
      >
        <MdFormatAlignRight className="w-4 h-4" />
      </button>

      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Justify Align"
        title="양쪽 정렬"
        type="button"
      >
        <MdFormatAlignJustify className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-gray-300" />

      {/* Color Picker */}
      <div className="relative" ref={colorPickerRef}>
        <button
          className={`px-3 py-1 border rounded flex items-center justify-center transition-colors ${
            showColorPicker ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-100'
          }`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          aria-label="Text Color"
          title="글자 색상"
          type="button"
        >
          <div className="relative">
            <MdFormatColorText className="w-4 h-4" />
            <div 
              className="absolute bottom-0 left-0 right-0 h-1 rounded-sm"
              style={{ backgroundColor: currentTextColor }}
            />
          </div>
        </button>
        
        {showColorPicker && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowColorPicker(false)}
            />
            
            {/* Popover */}
            <div 
              className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 w-80 animate-in fade-in-0 zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-700 mb-3">색상 선택</h3>
                
                {/* 기본 색상 팔레트 */}
                <div className="grid grid-cols-6 gap-2 mb-4">
                  {[
                    '#000000', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6',
                    '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
                    '#22C55E', '#10B981', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
                    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899', '#F43F5E', '#991B1B',
                    '#92400E', '#78350F', '#713F12', '#365314', '#14532D', '#064E3B',
                    '#155E75', '#1E3A8A', '#312E81', '#581C87', '#701A75', '#BE185D'
                  ].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded border-2 transition-all duration-150 hover:scale-110 ${
                        currentTextColor === color 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        applyTextColor(color);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      type="button"
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              {/* 사용자 지정 색상 */}
              <div className="border-t pt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 지정 색상
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentTextColor}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyTextColor(e.target.value);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={currentTextColor}
                    onChange={(e) => {
                      const color = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(color)) {
                        applyTextColor(color);
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#000000"
                  />
                </div>
              </div>
              
              {/* 액션 버튼 */}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t">
                <button
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    applyTextColor('#000000');
                  }}
                  type="button"
                >
                  기본값
                </button>
                <button
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowColorPicker(false);
                  }}
                  type="button"
                >
                  완료
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* Insert Buttons */}
      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          insertImage();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
        }}
        aria-label="Insert Image"
        title="이미지 삽입"
        type="button"
      >
        <MdImage className="w-4 h-4" />
      </button>


      <ImageUploadDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={onImageInsert}
      />

      <VideoUploadDialog
        isOpen={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        onInsert={onVideoInsert}
      />

      <TableInsertDialog
        isOpen={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={onTableInsert}
      />
    </div>
  );
} 