import { useGetLeave, useDeleteLeave, getGetLeaveQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Trash2, ArrowRight, User, Hospital, Calendar, Briefcase } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateAr, formatDateEn } from "@/lib/utils";

function InfoRow({ label, valueAr, valueEn }: { label: string, valueAr?: string | null, valueEn?: string | null }) {
  if (!valueAr && !valueEn) return null;
  return (
    <div className="flex flex-col py-3 border-b last:border-0 border-border/50">
      <span className="text-sm font-medium text-muted-foreground mb-1">{label}</span>
      <div className="flex justify-between items-center gap-4">
        <span className="font-medium text-foreground">{valueAr || '-'}</span>
        {valueEn && <span className="text-sm text-muted-foreground font-mono text-left" dir="ltr">{valueEn}</span>}
      </div>
    </div>
  );
}

export default function LeaveDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leave, isLoading, isError } = useGetLeave(id, {
    query: {
      enabled: !!id,
      queryKey: getGetLeaveQueryKey(id)
    }
  });

  const deleteMutation = useDeleteLeave();

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (isError || !leave) return <div className="p-6 text-destructive text-center">الإجازة غير موجودة (Leave not found)</div>;

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "تم الحذف بنجاح", description: "تم حذف سجل الإجازة المرضية" });
        queryClient.invalidateQueries({ queryKey: ["/api/leaves"] });
        queryClient.invalidateQueries({ queryKey: ["/api/leaves/stats"] });
        setLocation("/leaves");
      },
      onError: () => {
        toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء الحذف" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/leaves" className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">تفاصيل الإجازة المرضية</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">{leave.leaveCode}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> طباعة
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" /> إلغاء الإجازة
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد من إلغاء هذه الإجازة؟</AlertDialogTitle>
                <AlertDialogDescription>
                  هذا الإجراء لا يمكن التراجع عنه. سيتم حذف السجل نهائياً من قاعدة البيانات.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:justify-start">
                <AlertDialogCancel>تراجع</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  تأكيد الحذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> بيانات المريض (Patient Info)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-6">
            <InfoRow label="رقم الهوية / الإقامة" valueAr={leave.idNumber} />
            <InfoRow label="اسم المريض" valueAr={leave.patientNameAr} valueEn={leave.patientNameEn} />
            <InfoRow label="الجنسية" valueAr={leave.nationalityAr} valueEn={leave.nationalityEn} />
            <InfoRow label="جهة العمل" valueAr={leave.employerAr} valueEn={leave.employerEn} />
            <InfoRow label="المسمى الوظيفي" valueAr={leave.positionAr} valueEn={leave.positionEn} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-muted/30 border-b pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Hospital className="w-5 h-5 text-primary" /> بيانات المنشأة الطبية (Facility Info)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 px-6">
            <InfoRow label="اسم المستشفى / العيادة" valueAr={leave.hospitalNameAr} valueEn={leave.hospitalNameEn} />
            <InfoRow label="الطبيب المعالج" valueAr={leave.doctorNameAr} valueEn={leave.doctorNameEn} />
            <InfoRow label="تاريخ التقرير" valueAr={formatDateAr(leave.issueDate)} valueEn={formatDateEn(leave.issueDate)} />
            <InfoRow label="وقت التقرير" valueAr={leave.reportTime} />
          </CardContent>
        </Card>

        <Card className="shadow-sm md:col-span-2 border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <Calendar className="w-5 h-5" /> تفاصيل الإجازة (Leave Details)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <span className="text-sm text-muted-foreground block mb-1">تاريخ الدخول / بدء الإجازة</span>
                    <div className="font-bold text-lg">{formatDateEn(leave.admissionDateGregorian)}</div>
                    <div className="text-sm text-muted-foreground mt-1">{leave.admissionDateHijri || '-'}</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg border">
                    <span className="text-sm text-muted-foreground block mb-1">تاريخ الخروج / نهاية الإجازة</span>
                    <div className="font-bold text-lg">{formatDateEn(leave.dischargeDateGregorian)}</div>
                    <div className="text-sm text-muted-foreground mt-1">{leave.dischargeDateHijri || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-center bg-secondary/10 border border-secondary/20 p-6 rounded-full w-32 h-32 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-secondary">{leave.durationDays}</span>
                <span className="text-sm font-medium text-secondary/80 mt-1">أيام (Days)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
