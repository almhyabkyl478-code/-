import { useListLeaves } from "@workspace/api-client-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronRight, ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDateAr } from "@/lib/utils";

export default function LeavesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError } = useListLeaves({ search: debouncedSearch, page, limit });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">سجل الإجازات المرضية</h1>
          <p className="text-muted-foreground">تصفح والبحث في جميع الإجازات المرضية المصدرة</p>
        </div>
        <Link href="/leaves/new" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          إصدار إجازة جديدة
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-muted/20">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالاسم، رقم الهوية، أو رمز الإجازة..."
                className="pl-4 pr-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="overflow-auto min-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">الرمز (Code)</TableHead>
                  <TableHead className="text-right">رقم الهوية (ID)</TableHead>
                  <TableHead className="text-right">المريض (Patient)</TableHead>
                  <TableHead className="text-right">المستشفى (Hospital)</TableHead>
                  <TableHead className="text-right">تاريخ الإصدار</TableHead>
                  <TableHead className="text-right">المدة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-48">
                      <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-48 text-destructive">حدث خطأ أثناء جلب البيانات</TableCell>
                  </TableRow>
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-48 text-muted-foreground">لا توجد نتائج مطابقة لبحثك.</TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-mono text-sm font-medium">{leave.leaveCode}</TableCell>
                      <TableCell className="text-sm">{leave.idNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium">{leave.patientNameAr}</div>
                        <div className="text-xs text-muted-foreground">{leave.patientNameEn}</div>
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{leave.hospitalNameAr}</TableCell>
                      <TableCell className="text-sm">{formatDateAr(leave.issueDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-secondary/5 text-secondary border-secondary/20">{leave.durationDays} أيام</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/leaves/${leave.id}`} className="text-primary hover:underline text-sm font-medium">
                          التفاصيل
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {data && data.total > 0 && (
            <div className="p-4 border-t flex items-center justify-between text-sm">
              <div className="text-muted-foreground">
                إجمالي السجلات: <span className="font-medium text-foreground">{data.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronRight className="w-4 h-4 ml-1" /> السابق
                </Button>
                <span className="px-4 font-medium text-muted-foreground">
                  صفحة {data.page} من {Math.ceil(data.total / data.limit)}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={page >= Math.ceil(data.total / data.limit)}
                  onClick={() => setPage(p => p + 1)}
                >
                  التالي <ChevronLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
