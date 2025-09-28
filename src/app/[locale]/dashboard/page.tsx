"use client";
export const dynamic = 'force-dynamic';
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
import { type Task } from "@/lib/definitions";
import { downloadExcelTemplate, importFromExcel } from "@/lib/excel-utils";
import { submitTasks } from "@/app/actions";
import { generateWOID, generateBatchWOIDs } from "@/app/actions/wo-actions";
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

export default function DataEntryPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const locale = (params.locale as string) || 'zh';

  const taskSchema = z.object({
    rowId: z.string(),
    WO_WOID: z.string().min(1, "生产任务单号为必填项"),
    WO_WLID: z.string().min(1, "物料编码为必填"),
    WO_XQSL: z.string().min(1, "数量为必填项").refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "数量必须大于0",
    }),
    WO_JHKGRQ: z.string().min(1, "开始日期为必填项"),
    WO_JHWGRQ: z.string().min(1, "结束日期为必填项"),
    WO_BMID: z.string().min(1, "部门为必填项"),
    WO_BZ: z.string().optional(),
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

  const addRow = async () => {
    try {
      const woId = await generateWOID();
      
      append({ 
        rowId: crypto.randomUUID(), 
        WO_WOID: woId,
        WO_WLID: "", 
        WO_XQSL: "", 
        WO_JHKGRQ: "", 
        WO_JHWGRQ: "", 
        WO_BMID: "",
        WO_BZ: ""
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "生成工单号失败，请重试"
      });
    }
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFromExcel(file, async (data) => {
        try {
          const woIds = await generateBatchWOIDs(data.length);
          
          const newTasks = data.map((item, index) => ({
            ...item, 
            rowId: crypto.randomUUID(),
            WO_WOID: item.WO_WOID || woIds[index]
          }));
          
          replace(newTasks as any[]);
          toast({ 
            title: "导入成功", 
            description: `已导入 ${newTasks.length} 行数据` 
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "导入失败",
            description: "生成工单号失败，请重试"
          });
        }
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
          title: "提交成功",
          description: "所有任务已提交",
        });
        replace([]);
      } else {
        toast({
          variant: "destructive",
          title: "提交失败",
          description: "请检查每行的错误",
        });
        result.errors?.forEach((error) => {
          if (error.rowIndex !== undefined && error.message) {
            const fieldName = error.field || 'WO_WOID';
            // Type-safe field names
            const validFields = ['rowId', 'WO_WOID', 'WO_WLID', 'WO_XQSL', 'WO_JHKGRQ', 'WO_JHWGRQ', 'WO_BMID', 'WO_BZ'] as const;
            if (validFields.includes(fieldName as any)) {
                form.setError(`tasks.${error.rowIndex}.${fieldName}` as any, {
                    type: 'manual',
                    message: error.message
                });
            }
          }
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "发生意外错误",
        description: "无法提交任务，请重试",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="生产任务录入"
        description="添加、导入或管理生产任务"
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={downloadExcelTemplate}>
              <Download className="mr-2"/> 模板
            </Button>
            <Button variant="outline" onClick={handleImportClick}>
              <FileUp className="mr-2"/> 导入
            </Button>
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <Button onClick={addRow}>
              <Plus className="mr-2"/> 添加行
            </Button>
        </div>
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-6">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">
                    生产任务单号 <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[140px]">
                    物料编码 <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    需求数量 <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[160px]">
                    计划开工日期 <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[160px]">
                    计划完工日期 <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[140px]">
                    完工部门 <span className="text-red-500">*</span>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    备注
                  </TableHead>
                  <TableHead className="w-[50px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.length > 0 ? (
                  fields.map((field, index) => (
                    <TableRow key={field.rowId}>
                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`tasks.${index}.WO_WOID`}
                          render={({ field: controllerField, fieldState }) => (
                            <div>
                              <Input 
                                {...controllerField} 
                                className={cn(
                                  "bg-gray-100",
                                  fieldState.error && "border-destructive ring-2 ring-destructive ring-offset-2"
                                )}
                                readOnly
                                disabled
                              />
                              {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                            </div>
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`tasks.${index}.WO_WLID`}
                          render={({ field: controllerField, fieldState }) => (
                            <div>
                              <Input 
                                {...controllerField} 
                                className={cn(fieldState.error && "border-destructive ring-2 ring-destructive ring-offset-2")}
                                placeholder="物料编码"
                              />
                              {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                            </div>
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`tasks.${index}.WO_XQSL`}
                          render={({ field: controllerField, fieldState }) => (
                            <div>
                              <Input 
                                {...controllerField} 
                                className={cn(fieldState.error && "border-destructive ring-2 ring-destructive ring-offset-2")}
                                type="number"
                                min="1"
                                placeholder="数量"
                              />
                              {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                            </div>
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`tasks.${index}.WO_JHKGRQ`}
                          render={({ field: controllerField, fieldState }) => (
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
                                    {controllerField.value ? format(new Date(controllerField.value), "yyyy-MM-dd") : <span>选择日期</span>}
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
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`tasks.${index}.WO_JHWGRQ`}
                          render={({ field: controllerField, fieldState }) => (
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
                                    {controllerField.value ? format(new Date(controllerField.value), "yyyy-MM-dd") : <span>选择日期</span>}
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
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`tasks.${index}.WO_BMID`}
                          render={({ field: controllerField, fieldState }) => (
                            <div>
                              <Select onValueChange={controllerField.onChange} value={controllerField.value}>
                                <SelectTrigger className={cn(fieldState.error && "border-destructive ring-2 ring-destructive ring-offset-2")}>
                                  <SelectValue placeholder="选择部门" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="GQ">曲阜固雅</SelectItem>
                                  <SelectItem value="LC">质检部门</SelectItem>
                                  <SelectItem value="GQ">国内仓储</SelectItem>
                                </SelectContent>
                              </Select>
                              {fieldState.error && <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>}
                            </div>
                          )}
                        />
                      </TableCell>

                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`tasks.${index}.WO_BZ`}
                          render={({ field: controllerField }) => (
                            <Input 
                              {...controllerField} 
                              placeholder="备注（可选）"
                            />
                          )}
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      未添加任务。点击"添加行"或"导入"开始。
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
                      批量提交
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border border-gray-200 text-gray-900 max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-gray-900">
                        确认提交？
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600">
                        这将向生产系统提交全部 {fields.length} 个任务。此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300">
                        取消
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={form.handleSubmit(onSubmit)} 
                        disabled={loading || !form.formState.isValid}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        继续提交
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