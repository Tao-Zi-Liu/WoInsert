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
} from "@/components/ui/alert-dialog"

const taskSchema = z.object({
  rowId: z.string(),
  WO_WOID: z.string().min(1, "WOID is required"),
  WO_WLID: z.string().min(1, "WLID is required"),
  WO_XQSL: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Must be a number > 0",
  }),
  WO_JHKGRQ: z.string().min(1, "Start date is required"),
  WO_JHWGRQ: z.string().min(1, "End date is required"),
  WO_BMID: z.string().min(1, "Department is required"),
});

const formSchema = z.object({
  tasks: z.array(taskSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function DataEntryPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        replace(newTasks as any[]); // Use replace to overwrite existing data
        toast({ title: "Import Successful", description: `${newTasks.length} rows have been imported.` });
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
          title: "Submission Successful",
          description: "All tasks have been submitted.",
        });
        replace([]);
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: "Please check the errors on each row.",
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
        title="Data Entry"
        description="Add, import, or manage your production tasks."
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={downloadExcelTemplate}><Download className="mr-2"/> Template</Button>
            <Button variant="outline" onClick={handleImportClick}><FileUp className="mr-2"/> Import</Button>
             <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileImport}
              className="hidden"
              accept=".xlsx, .xls"
            />
            <Button onClick={addRow}><Plus className="mr-2"/> Add Row</Button>
        </div>
      </PageHeader>
      <main className="flex-1 overflow-y-auto p-6">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Work Order ID</TableHead>
                  <TableHead className="w-[150px]">Work List ID</TableHead>
                  <TableHead className="w-[120px]">Quantity</TableHead>
                  <TableHead className="w-[180px]">Start Date</TableHead>
                  <TableHead className="w-[180px]">End Date</TableHead>
                  <TableHead className="w-[180px]">Department</TableHead>
                  <TableHead className="w-[50px] text-right">Action</TableHead>
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
                                          {controllerField.value ? format(new Date(controllerField.value), "PPP") : <span>Pick a date</span>}
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
                                        <SelectValue placeholder="Select dept." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {departments.map(dept => (
                                          <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
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
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No tasks added. Click 'Add Row' or 'Import' to start.
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
                      Batch Submit
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will submit all {fields.length} task(s) to the production system. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={loading || !form.formState.isValid}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continue Submission
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
