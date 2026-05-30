import { useGetLeaveStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CalendarDays, Clock, Activity } from "lucide-react";
import { formatDateAr } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetLeaveStats();

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (isError || !stats) {
    return <div className="p-6 text-destructive">حدث خطأ أثناء تحميل الإحصائيات. (Error loading stats)</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">نظرة عامة (Overview)</h1>
        <p className="text-muted-foreground">إحصائيات الإجازات المرضية عبر المنصة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">إجمالي الإجازات (Total)</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalLeaves.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">إجازات اليوم (Today)</p>
              <p className="text-3xl font-bold text-foreground">{stats.todayLeaves.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">هذا الشهر (This Month)</p>
              <p className="text-3xl font-bold text-foreground">{stats.thisMonthLeaves.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600">
              <CalendarDays className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">متوسط المدة (Avg Duration)</p>
              <p className="text-3xl font-bold text-foreground">{stats.avgDuration.toFixed(1)} <span className="text-base font-normal text-muted-foreground">أيام</span></p>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">أحدث الإجازات المصدرة (Recent Leaves)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-right">الرمز (Code)</TableHead>
                  <TableHead className="text-right">المريض (Patient)</TableHead>
                  <TableHead className="text-right">المستشفى (Hospital)</TableHead>
                  <TableHead className="text-right">تاريخ الإصدار (Date)</TableHead>
                  <TableHead className="text-right">المدة (Duration)</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا توجد إجازات (No leaves found)</TableCell>
                  </TableRow>
                ) : (
                  stats.recentLeaves.map(leave => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-mono text-sm">{leave.leaveCode}</TableCell>
                      <TableCell>
                        <div className="font-medium">{leave.patientNameAr}</div>
                        <div className="text-xs text-muted-foreground">{leave.patientNameEn}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{leave.hospitalNameAr}</div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDateAr(leave.issueDate)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">{leave.durationDays} أيام</Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/leaves/${leave.id}`} className="text-primary text-sm font-medium hover:underline">
                          عرض التفاصيل
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
