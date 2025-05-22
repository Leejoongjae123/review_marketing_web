"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks"

interface Provider {
  id: string
  full_name: string
  email: string
}

interface ProviderSelectorProps {
  value: Provider | null
  onChange: (value: Provider | null) => void
  onRemove?: () => void
}

export function ProviderSelector({ value, onChange, onRemove }: ProviderSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [providers, setProviders] = React.useState<Provider[]>([])
  const [loading, setLoading] = React.useState(false)
  
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  // 검색어가 변경될 때마다 API 호출
  React.useEffect(() => {
    const searchProviders = async () => {
      if (!debouncedSearch) {
        setProviders([])
        return
      }
      
      setLoading(true)
      try {
        const response = await fetch(`/api/search-providers?query=${encodeURIComponent(debouncedSearch)}`)
        const result = await response.json()
        
        if (result.data) {
          setProviders(result.data)
        }
      } catch (error) {
        console.log("광고주 검색 중 오류 발생", error)
      } finally {
        setLoading(false)
      }
    }
    
    searchProviders()
  }, [debouncedSearch])
  
  return (
    <div className="flex flex-col space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            {value ? `${value.full_name} (${value.email})` : "광고주 검색"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="광고주 이름이나 이메일 검색..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            {loading && (
              <div className="py-6 text-center text-sm">검색 중...</div>
            )}
            {!loading && (
              <>
                <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
                <CommandGroup>
                  {providers.map((provider) => (
                    <CommandItem
                      key={provider.id}
                      value={provider.id}
                      onSelect={() => {
                        onChange(provider)
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.id === provider.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{provider.full_name}</span>
                        <span className="text-xs text-muted-foreground">{provider.email}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      
      {value && (
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge className="flex items-center gap-1 px-3 py-1">
            {value.full_name}
            <button
              type="button"
              className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
              onClick={() => {
                onChange(null)
                if (onRemove) onRemove()
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </div>
  )
} 