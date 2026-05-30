import { useState } from "react";
import { useInquireLeave, getInquireLeaveQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, Activity, ShieldCheck, AlertCircle } from "lucide-react";
import { formatDateEn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Inquiry() {
  const [idNumber, setIdNumber] = useState("");
  const [leaveCode, setLeaveCode] = useState("");
  const [queryParams, setQueryParams] = useState<{idNumber: string, leaveCode: string} | null>(null);

  const { data: leave, isLoading, isError } = useInquireLeave(
    queryParams as {idNumber: string, leaveCode: string}, 
    { query: { enabled: !!queryParams, retry: false, queryKey: getInquireLeaveQueryKey(queryParams ?? undefined) } }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idNumber.trim() && leaveCode.trim()) {
      setQueryParams({ idNumber: idNumber.trim(), leaveCode: leaveCode.trim() });
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-muted/20 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">منصة صحة</h1>
          <p className="text-muted-foreground">خدمة الاستعلام عن الإجازات المرضية (Public Inquiry)</p>
        </div>

        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle>التحقق من إجازة مرضية</CardTitle>
            <CardDescription>الرجاء إدخال رقم الهوية ورمز الإجازة للتحقق من صحتها</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="idNumber">رقم الهوية / الإقامة (ID Number)</Label>
                <Input 
                  id="idNumber" 
                  required 
                  placeholder="100XXXXXXX" 
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  className="font-mono text-left text-lg"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaveCode">رمز الخدمة / الإجازة (Leave Code)</Label>
                <Input 
                  id="leaveCode" 
                  required 
                  placeholder="PSL-XXXXXXXX" 
                  value={leaveCode}
                  onChange={e => setLeaveCode(e.target.value)}
                  className="font-mono text-left text-lg"
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Search className="w-5 h-5 ml-2" /> استعلام</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isError && queryParams && !isLoading && (
          <Alert variant="destructive" className="bg-destructive/10">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>عذراً، لم يتم العثور على الإجازة</AlertTitle>
            <AlertDescription>
              الرجاء التأكد من صحة رقم الهوية ورمز الإجازة المدخل والمحاولة مرة أخرى.
            </AlertDescription>
          </Alert>
        )}

        {leave && !isLoading && (
          <Card className="border-secondary/30 shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-secondary/10 p-4 border-b border-secondary/20 flex items-start gap-3 text-secondary-foreground">
              <ShieldCheck className="w-6 h-6 text-secondary mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-secondary">إجازة مرضية معتمدة</h3>
                <p className="text-sm opacity-90 mt-1">هذه الإجازة المرضية موثقة ومعتمدة من قبل منصة صحة.</p>
              </div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">اسم المريض</span>
                  <strong className="text-base block">{leave.patientNameAr}</strong>
                  <span className="text-muted-foreground text-xs" dir="ltr">{leave.patientNameEn}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">رقم الهوية</span>
                  <strong className="text-base font-mono">{leave.idNumber}</strong>
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <span className="text-muted-foreground block mb-1">المنشأة الطبية</span>
                  <strong className="text-base block">{leave.hospitalNameAr}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">تاريخ البدء</span>
                  <strong className="text-base font-mono" dir="ltr">{formatDateEn(leave.admissionDateGregorian)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">المدة</span>
                  <span className="inline-flex items-center justify-center bg-secondary/10 text-secondary font-bold px-3 py-1 rounded-full text-base">
                    {leave.durationDays} أيام
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
