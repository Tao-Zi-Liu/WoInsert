"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase-config";
import { SubmittedTask } from "@/lib/definitions";
import PageHeader from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function HistoryPage() {
  const [tasks, setTasks] = useState<SubmittedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "production_tasks"), orderBy("WO_WHSJ", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasksData: SubmittedTask[] = [];
      querySnapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() } as SubmittedTask);
      });
      setTasks(tasksData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching history: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false }).replace(',', '');
    }
    try {
        return new Date(timestamp).toLocaleString('en-CA', { timeZone: 'Asia/Shanghai', hour12: false }).replace(',', '');
    } catch {
        return String(timestamp);
    }
  }

  const TaskStatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'P':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Planned</Badge>;
      case 'R':
        return <Badge className="bg-green-100 text-green-800">Released</Badge>;
      case 'C':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Completed</Badge>;
      default:
        return <Badge variant="destructive">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Submission History"
        description="A real-time view of all submitted production tasks."
      />
      <main className="flex-1 overflow-hidden p-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full flex flex-col">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow>
                  <TableHead>Work Order ID</TableHead>
                  <TableHead>Work List ID</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Planned Start</TableHead>
                  <TableHead>Planned End</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead className="text-right">Submission Time (BJT)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                         <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : tasks.length > 0 ? (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.WO_WOID}</TableCell>
                      <TableCell>{task.WO_WLID}</TableCell>
                      <TableCell>{task.WO_XQSL}</TableCell>
                      <TableCell>{task.WO_JHKGRQ}</TableCell>
                      <TableCell>{task.WO_JHWGRQ}</TableCell>
                      <TableCell>{task.WO_BMID}</TableCell>
                      <TableCell><TaskStatusBadge status={task.WO_ZT} /></TableCell>
                      <TableCell>{task.WO_WHRID}</TableCell>
                      <TableCell className="text-right">{formatDate(task.WO_WHSJ)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No submitted tasks yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
           <div className="p-4 text-center text-sm text-muted-foreground border-t">
              <TableCaption>Showing {tasks.length} submissions. Data is updated in real-time.</TableCaption>
          </div>
        </div>
      </main>
    </div>
  );
}
