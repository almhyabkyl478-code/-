import { useState } from "react";
import { useCreateLeave, getListLeavesQueryKey, getGetLeaveStatsQueryKey } from "@workspace/api-client-react";
import { isoToDdMmYyyy } from "@/lib/utils";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Save } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  idNumber: z.string().min(10, "رقم الهوية يجب أن يكون 10 أرقام على الأقل"),
  patientNameAr: z.string().min(2, "الاسم العربي مطلوب"),
  patientNameEn: z.string().min(2, "الاسم الانجليزي مطلوب"),
  nationalityAr: z.string().optional(),
  nationalityEn: z.string().optional(),
  employerAr: z.string().optional(),
  employerEn: z.string().optional(),
  doctorNameAr: z.string().min(2, "اسم الطبيب مطلوب"),
  doctorNameEn: z.string().min(2, "اسم الطبيب بالانجليزية مطلوب"),
  positionAr: z.string().optional(),
  positionEn: z.string().optional(),
  hospitalNameAr: z.string().min(2, "اسم المستشفى مطلوب"),
  hospitalNameEn: z.string().min(2, "اسم المستشفى بالانجليزية مطلوب"),
  admissionDateGregorian: z.string().min(10, "التاريخ مطلوب"),
  dischargeDateGregorian: z.string().min(10, "التاريخ مطلوب"),
  durationDays: z.coerce.number().min(1, "المدة يجب أن تكون يوماً واحداً على الأقل"),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewLeave() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateLeave();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      idNumber: "",
      patientNameAr: "",
      patientNameEn: "",
      nationalityAr: "سعودي",
      nationalityEn: "Saudi",
      employerAr: "",
      employerEn: "",
      doctorNameAr: "",
      doctorNameEn: "",
      positionAr: "",
      positionEn: "",
      hospitalNameAr: "",
      hospitalNameEn: "",
      admissionDateGregorian: new Date().toISOString().split('T')[0],
      dischargeDateGregorian: new Date().toISOString().split('T')[0],
      durationDays: 1,
    }
  });

  const onSubmit = (data: FormValues) => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const todayDdMmYyyy = `${dd}-${mm}-${yyyy}`;

    const admissionDdMm = isoToDdMmYyyy(data.admissionDateGregorian);
    const dischargeDdMm = isoToDdMmYyyy(data.dischargeDateGregorian);

    const idPart = data.idNumber.slice(-4).padStart(4, '0');
    const admNums = data.admissionDateGregorian.replace(/-/g, '').slice(-3);
    const disNums = data.dischargeDateGregorian.replace(/-/g, '').slice(-4);
    const leaveCode = `PSL${(idPart + admNums + disNums).padEnd(11, '0').slice(0, 11)}`;

    createMutation.mutate({
      data: {
        ...data,
        leaveCode,
        admissionDateGregorian: admissionDdMm,
        dischargeDateGregorian: dischargeDdMm,
        issueDate: todayDdMmYyyy,
      }
    }, {
      onSuccess: (result) => {
        toast({ title: "تم الإصدار بنجاح", description: `تم إصدار الإجازة برمز ${result.leaveCode}` });
        queryClient.invalidateQueries({ queryKey: getListLeavesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLeaveStatsQueryKey() });
        setLocation(`/leaves/${result.id}`);
      },
      onError: () => {
        toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء حفظ الإجازة" });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/leaves" className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">إصدار إجازة مرضية جديدة</h1>
          <p className="text-muted-foreground mt-1">إنشاء سجل إجازة مرضية لمريض في المنصة</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">بيانات المريض (Patient Info)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="idNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهوية / الإقامة</FormLabel>
                  <FormControl><Input {...field} dir="ltr" className="font-mono text-left" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="hidden md:block"></div>

              <FormField control={form.control} name="patientNameAr" render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل (عربي)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="patientNameEn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (English)</FormLabel>
                  <FormControl><Input {...field} dir="ltr" className="text-left" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="nationalityAr" render={({ field }) => (
                <FormItem>
                  <FormLabel>الجنسية (عربي)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="nationalityEn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nationality (English)</FormLabel>
                  <FormControl><Input {...field} dir="ltr" className="text-left" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">المنشأة الطبية (Facility Info)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="hospitalNameAr" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المستشفى (عربي)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="hospitalNameEn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Hospital Name (English)</FormLabel>
                  <FormControl><Input {...field} dir="ltr" className="text-left" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="doctorNameAr" render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الطبيب المعالج (عربي)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="doctorNameEn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor Name (English)</FormLabel>
                  <FormControl><Input {...field} dir="ltr" className="text-left" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b bg-primary/5 text-primary">
              <CardTitle className="text-lg">تفاصيل الإجازة (Leave Dates)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="admissionDateGregorian" render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ البدء</FormLabel>
                  <FormControl><Input type="date" {...field} dir="ltr" className="text-left" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dischargeDateGregorian" render={({ field }) => (
                <FormItem>
                  <FormLabel>تاريخ الانتهاء</FormLabel>
                  <FormControl><Input type="date" {...field} dir="ltr" className="text-left" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="durationDays" render={({ field }) => (
                <FormItem>
                  <FormLabel>المدة (أيام)</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} dir="ltr" className="text-left" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/leaves")}>إلغاء</Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2 px-8">
              {createMutation.isPending ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save className="w-4 h-4" />}
              حفظ وإصدار
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
