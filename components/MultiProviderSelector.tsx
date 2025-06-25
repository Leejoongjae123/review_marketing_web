"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export interface Provider {
  id: string
  full_name: string
  email: string
  company_name?: string
}

interface MultiProviderSelectorProps {
  value: Provider[]
  onChange: (value: Provider[]) => void
  maxSelections?: number
}

export function MultiProviderSelector({ 
  value, 
  onChange, 
  maxSelections = 3 
}: MultiProviderSelectorProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [providers, setProviders] = React.useState<Provider[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  
  // 선택된 프로바이더 ID 목록
  const selectedIds = value.map(provider => provider.id)

  // 외부 클릭 감지하여 팝오버 닫기
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsPopoverOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 검색어가 변경될 때마다 API 호출
  const handleSearch = async (query: string) => {
    if (!query || query.trim() === '') {
      setProviders([])
      setIsPopoverOpen(false)
      return
    }
    
    setLoading(true)
    setIsPopoverOpen(true)
    
    try {
      const response = await fetch(`/api/search-providers?query=${encodeURIComponent(query.trim())}`)
      
      const result = await response.json()
      
      if (!response.ok) {
        toast({
          title: "검색 오류",
          description: result.error || "광고주 검색 중 문제가 발생했습니다.",
          variant: "destructive",
        })
        setProviders([])
        return
      }
      
      if (result.data) {
        setProviders(result.data)
      } else {
        setProviders([])
      }
    } catch (error) {
      toast({
        title: "검색 오류",
        description: "광고주 검색 중 문제가 발생했습니다.",
        variant: "destructive",
      })
      setProviders([])
    } finally {
      setLoading(false)
    }
  }
  
  // 광고주 추가
  const handleSelect = (provider: Provider) => {
    // 이미 선택된 경우 중복 추가 방지
    if (selectedIds.includes(provider.id)) {
      // 이미 선택된 경우 제거 (토글 기능)
      handleRemove(provider.id)
      return
    }
    
    // 최대 선택 가능 수 체크
    if (value.length >= maxSelections) {
      toast({
        title: "선택 제한",
        description: `광고주는 최대 ${maxSelections}개까지만 선택 가능합니다.`,
        variant: "destructive",
      })
      return
    }
    
    // 새 값 생성하여 onChange 호출
    const newValue = [...value, provider]
    onChange(newValue)
    
    // 검색창 비우기
    // setSearchQuery("")
  }
  
  // 광고주 제거
  const handleRemove = (providerId: string) => {
    onChange(value.filter(item => item.id !== providerId))
  }

  return (
    <div className="space-y-4 relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            handleSearch(e.target.value)
          }}
          onFocus={() => {
            if (searchQuery.trim() !== '') {
              setIsPopoverOpen(true)
            }
          }}
          placeholder="광고주 검색..."
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${value.length === 0 ? 'border-red-300 focus:border-red-500' : 'border-gray-300'}`}
        />
        
        {/* 팝오버 결과 */}
        {isPopoverOpen && (
          <div 
            ref={popoverRef}
            className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {loading && (
              <div className="py-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                <span>검색 중...</span>
              </div>
            )}
            
            {!loading && providers.length === 0 && searchQuery.trim() !== '' && (
              <div className="py-2 px-3 text-sm text-gray-500">
                검색 결과가 없습니다
              </div>
            )}
            
            {!loading && searchQuery.trim() === '' && (
              <div className="py-2 px-3 text-xs text-center text-gray-500">
                광고주 이름, 회사명, 이메일로 검색하세요. 검색 결과에서 클릭하면 선택됩니다.
                <div className="mt-1 text-xs text-gray-400">최대 {maxSelections}개까지 선택 가능합니다.</div>
              </div>
            )}
            
            {!loading && providers.length > 0 && (
              <div className="divide-y divide-gray-100">
                {providers.map((provider) => {
                  const isSelected = selectedIds.includes(provider.id);
                  return (
                    <div 
                      key={provider.id}
                      className={cn(
                        "px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center",
                        isSelected ? "bg-gray-100" : ""
                      )}
                      onClick={() => handleSelect(provider)}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        className="h-4 w-4 cursor-pointer accent-black mr-2"
                        onChange={() => handleSelect(provider)}
                      />
                      <div className="flex flex-col flex-grow">
                        <span className="font-medium">{provider.full_name}</span>
                        {provider.company_name && (
                          <span className="text-sm text-blue-600">{provider.company_name}</span>
                        )}
                        <span className="text-xs text-gray-500">{provider.email || '이메일 없음'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 선택된 광고주 목록 (Chips) */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((provider) => (
            <div 
              key={provider.id} 
              className="bg-gray-200 text-gray-800 h-7 px-3 text-sm font-medium rounded-full flex items-center gap-1"
            >
              {provider.full_name}
              <button
                type="button"
                className="ml-1 rounded-full outline-none hover:bg-gray-300 p-0.5"
                onClick={() => handleRemove(provider.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {value.length > 0 && (
            <div className="text-xs text-gray-500 flex items-center">
              {value.length}/{maxSelections} 선택됨
            </div>
          )}
        </div>
      )}
    </div>
  )
} 