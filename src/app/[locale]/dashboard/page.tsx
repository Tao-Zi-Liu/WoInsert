"use client";

import { useState, useRef } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { departments, type Task } from "@/lib/definitions";
import { downloadExcelTemplate, importFromExcel } from "@/lib/excel-utils";
import { submitTasks } from "@/app/actions";
import { CalendarIcon, Download, FileUp, Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import PageHeader from "@/components/page-header";
import { useParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Inline translations to avoid configuration issues
const translations = {
  en: {
    dashboard: {
      dataEntry: "Data Entry",
      dataEntryDescription: "Add, import, or manage your production tasks.",
      template: "Template",
      import: "Import",
      addRow: "Add Row"
    },
    form: {
      workOrderId: "WOID",
      workListId: "WLID",
      quantity: "Quantity",
      startDate: "Start Date",
      endDate: "End Date",
      department: "Department",
      action: "Action",
      pickDate: "Pick a date",
      selectDept: "Select dept.",
      batchSubmit: "Batch Submit",
      noTasks: "No tasks added. Click 'Add Row' or 'Import' to start.",
      confirmSubmission: "Are you sure?",
      confirmDescription: "This will submit all {count} task(s) to the production system. This action cannot be undone.",
      cancel: "Cancel",
      continue: "Continue Submission",
      submissionSuccessful: "Submission Successful",
      allTasksSubmitted: "All tasks have been submitted.",
      submissionFailed: "Submission Failed",
      checkErrors: "Please check the errors on each row."
    },
    departments: {
      FIN: "Finishing",
      ASM: "Assembly",
      QAC: "Quality Control",
      PKG: "Packaging",
      WHS: "Warehouse"
    }
  },
  zh: {
    dashboard: {
      dataEntry: "数据录入",
      dataEntryDescription: "添加、导入或管理您的生产任务。",
      template: "模板",
      import: "导入",
      addRow: "添加行"
    },
    form: {
      workOrderId: "生产任务单号",
      workListId: "物料编码",
      quantity: "数量",
      startDate: "计划开工日期",
      endDate: "计划完工日期",
      department: "完工部门",
      action: "操作",
      pickDate: "选择日期",
      selectDept: "选择部门",
      batchSubmit: "批量提交",
      noTasks: "未添加任务。点击\"添加行\"或\"导入\"开始。",
      confirmSubmission: "确认提交？",
      confirmDescription: "这将向生产系统提交全部 {count} 个任务。此操作无法撤销。",
      cancel: "取消",
      continue: "继续提交",
      submissionSuccessful: "提交成功",
      allTasksSubmitted: "所有任务已提交。",
      submissionFailed: "提交失败",
      checkErrors: "请检查每行的错误。"
    },
    departments: {
      FIN: "精整",
      ASM: "装配",
      QAC: "质量控制",
      PKG: "包装",
      WHS: "仓库"
    }
  }
};

export default function DataEntryPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const t = translations[locale as keyof typeof translations] || translations.en;

  // Move taskSchema inside component where locale is available
  const taskSchema = z.object({
    rowId: z.string(),
    WO_WOID: z.string().min(1, locale === 'zh' ? "生产任务单号为必填项" : "Work Order ID is required"),
    WO_WLID: z.string().min(1, locale === 'zh' ? "物料编码为必填" : "Work List ID is required"),
    WO_XQSL: z.string().min(1, locale === 'zh' ? "数量为必填项" : "Quantity is required").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: locale === 'zh' ? "数量必须大于0" : "Quantity must be greater than 0",
    }),
    WO_JHKGRQ: z.string().min(1, locale === 'zh' ? "开始日期为必填项" : "Start date is required"),
    WO_JHWGRQ: z.string().min(1, locale === 'zh' ? "结束日期为必填项" : "End date is required"),
    WO_BMID: z.string().min(1, locale === 'zh' ? "部门为必填项" : "Department is required"),
  });

  const formSchema = z.object({
    tasks: z.array(taskSchema),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tasks: [],
    },
    mode: "onChange",
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "tasks",
    keyName: "rowId",
  });

  const addRow = () => {
    append({ rowId: crypto.randomUUID(), WO_WOID: "", WO_WLID: "", WO_XQSL: "", WO_JHKGRQ: "", WO_JHWGRQ: "", WO_BMID: "" });
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFromExcel(file, (data) => {
        const newTasks = data.map(item => ({...item, rowId: crypto.randomUUID()}));
        replace(newTasks as any[]);
        toast({ 
          title: t.form.submissionSuccessful, 
          description: `${newTasks.length} rows have been imported.` 
        });
      });
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    form.clearErrors();
    try {
      const result = await submitTasks(data.tasks);

      if (result.success) {
        toast({
          title: t.form.submissionSuccessful,
          description: t.form.allTasksSubmitted,
        });
        replace([]);
      } else {
        toast({
          variant: "destructive",
          title: t.form.submissionFailed,
          description: t.form.checkErrors,
        });
        result.errors?.forEach((error) => {
          if (error.rowIndex !== undefined && error.message) {
             const fieldName = error.field || 'WO_WOID';
             form.setError(`tasks.${error.rowIndex}.${fieldName as keyof Task}`, {
                type: 'manual',
                message: error.message
            });
          }
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "An unexpected error occurred.",
        description: "Could not submit tasks. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title={t.dashboard.dataEntry}
        description={t.dashboard.dataEntryDescription}
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={downloadExcelTemplate}>
              <Download className="mr-2"/> {t.dashboard.template}
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <FileUp className="mr-2"/> {t.dashboard.import}
            </Button>
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <Button onClick={addRow}>
              <Plus className="mr-2"/> {t.dashboard.addRow}
            </Button>
        </div>
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-6">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">
                    {t.form.workOrderId} <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    {t.form.workListId} <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    {t.form.quantity} <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[180px]">
                    {t.form.startDate} <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[180px]">
                    {t.form.endDate} <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[180px]">
                    {t.form.department} <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[50px] text-right">{t.form.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length > 0 ? (
                  fields.map((field, index) => (
                    <TableRow key={field.id}>
                      {(["WO_WOID", "WO_WLID", "WO_XQSL", "WO_JHKGRQ", "WO_JHWGRQ", "WO_BMID"] as const).map(fieldName => (
                        <TableCell key={`${field.id}-${fieldName}`}>
                          <Controller
                            control={form.control}
                            name={`tasks.${index}.${fieldName}`}
                            render={({ field: controllerField, fieldState }) => {
                              if (fieldName === 'WO_JHKGRQ' || fieldName === 'WO_JHWGRQ') {
                                return (
                                  <div>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant={"outline"}
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !controllerField.value && "text-muted-foreground",
                                            fieldState.error && "border-destructive ring-2 ring-destructive ring-offset-2"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {controllerField.value ? format(new Date(controllerField.value), "PPP") : <span>{t.form.pickDate}</span>}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          mode="single"
                                          selected={controllerField.value ? new Date(controllerField.value) : undefined}
                                          onSelect={(date) => controllerField.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                                  </div>
                                );
                              }
                              if (fieldName === 'WO_BMID') {
                                return (
                                  <div>
                                    <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                                      <SelectTrigger className={cn(fieldState.error && "border-destructive ring-2 ring-destructive ring-offset-2")}>
                                        <SelectValue placeholder={t.form.selectDept} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {departments.map(dept => (
                                          <SelectItem key={dept.value} value={dept.value}>
                                            {t.departments[dept.value as keyof typeof t.departments]}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                                  </div>
                                );
                              }
                              return (
                                <div>
                                  <Input {...controllerField} className={cn(fieldState.error && "border-destructive ring-2 ring-destructive ring-offset-2")} />
                                  {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                                </div>
                              );
                            }}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                <TableRow key="empty-state">
                  <TableCell colSpan={7} className="h-24 text-center">
                    {t.form.noTasks}
                  </TableCell>
                </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {fields.length > 0 && (
            <div className="flex justify-end mt-6">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t.form.batchSubmit}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border border-gray-200 text-gray-900 max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-gray-900">
                        {t.form.confirmSubmission}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600">
                        {t.form.confirmDescription.replace('{count}', fields.length.toString())}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300">
                        {t.form.cancel}
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={form.handleSubmit(onSubmit)} 
                        disabled={loading || !form.formState.isValid}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.form.continue}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}