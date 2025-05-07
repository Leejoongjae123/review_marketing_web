'use client'
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ColumnConfig<T> {
  key: string;
  title: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  title: string;
  onRowClick?: (item: T) => void;
  renderDetail?: (item: T) => React.ReactNode;
  detailContent?: React.ReactNode;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  title,
  onRowClick,
  renderDetail,
  detailContent,
}: DataTableProps<T>) {
  const [selectedItem, setSelectedItem] = useState<T | null>(null);
  
  const handleRowClick = (item: T) => {
    setSelectedItem(item);
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
  };

  // 클라이언트 컴포넌트 내에서 render 함수 처리
  const renderCell = (item: T, column: ColumnConfig<T>) => {
    // render 함수가 있는 경우
    if (column.render) {
      try {
        return column.render(item);
      } catch (error) {
        console.error(`Error rendering column ${column.key}:`, error);
        // 에러 시 기본값 표시
        return (item as any)[column.key];
      }
    }
    
    // render 함수가 없는 경우 기본 표시
    return (item as any)[column.key];
  };

  const renderDetailClient = (item: T) => {
    if (renderDetail) {
      try {
        return renderDetail(item);
      } catch (error) {
        console.error("Error rendering detail:", error);
        // 에러 발생 시 기본 상세 정보 표시
        return renderDefaultDetail(item);
      }
    }
    
    if (detailContent) {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(item).map(([key, value]) => (
              <React.Fragment key={key}>
                <div className="font-semibold">{key}:</div>
                <div>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </React.Fragment>
            ))}
          </div>
          {detailContent}
        </div>
      );
    }
    
    return renderDefaultDetail(item);
  };

  const renderDefaultDetail = (item: T) => {
    return (
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(item).map(([key, value]) => (
          <React.Fragment key={key}>
            <div className="font-semibold">{key}:</div>
            <div>
              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.title}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className="cursor-pointer"
                >
                  {columns.map((column) => (
                    <TableCell key={`${item.id}-${column.key}`}>
                      {renderCell(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>상세 정보</DialogTitle>
          </DialogHeader>
          {selectedItem && renderDetailClient(selectedItem)}
        </DialogContent>
      </Dialog>
    </>
  );
} 