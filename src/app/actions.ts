"use server";

import { adminDb } from "@/lib/firebase-config";
import { type Task } from "@/lib/definitions";
import { validateAndExplainData, type ValidationInput } from "@/ai/flows/validate-and-explain-data";
import { formatInTimeZone } from 'date-fns-tz';

type SubmissionResult = {
  success: boolean;
  errors?: {
    rowIndex: number;
    message: string;
    field?: keyof Task;
  }[];
};

// Helper to check for duplicate WO_WOIDs in the current submission batch
const findDuplicates = (tasks: Task[]): string[] => {
    const woids = tasks.map(t => t.WO_WOID);
    return woids.filter((item, index) => woids.indexOf(item) !== index);
}

export async function submitTasks(tasks: Task[]): Promise<SubmissionResult> {
  const allWoIdsInForm = tasks.map(t => t.WO_WOID);
  const duplicatesInForm = findDuplicates(tasks);
  
  const validationPromises = tasks.map(async (task, index) => {
    // Frontend-like checks first for duplicates within the form
    if (duplicatesInForm.includes(task.WO_WOID)) {
      return { 
        index,
        isValid: false,
        explanation: `WO_WOID is duplicated in this submission.`,
        field: 'WO_WOID' as keyof Task
      };
    }
    
    const validationInput: ValidationInput = {
      wo_woid: task.WO_WOID,
      wo_wlid: task.WO_WLID,
      wo_xqsl: task.WO_XQSL,
      wo_jhkgrq: task.WO_JHKGRQ,
      wo_jhwgrq: task.WO_JHWGRQ,
      wo_bmid: task.WO_BMID,
      all_woids: allWoIdsInForm,
    };

    try {
      const result = await validateAndExplainData(validationInput);
      // The AI might return valid even if some fields are empty based on its prompt, so we add a check here.
      const hasEmptyFields = Object.values(task).some(v => v === '');
      if (hasEmptyFields) {
          return { index, isValid: false, explanation: "All fields are required." };
      }
      return { index, ...result, field: 'WO_WOID' as keyof Task };
    } catch(e: any) {
      console.error("AI Validation Error:", e);
      return { index, isValid: false, explanation: e.message || "An error occurred during AI validation." }
    }
  });

  const validationResults = await Promise.all(validationPromises);
  const errors: { rowIndex: number; message: string; field?: keyof Task }[] = [];

  validationResults.forEach((result) => {
    if (!result.isValid) {
      errors.push({
        rowIndex: result.index,
        message: result.explanation,
        field: result.field,
      });
    }
  });
  
  // New check: Use admin SDK to check for existence in Firestore for all tasks not already marked with an error
  const validTasks = tasks.filter((_, index) => !errors.some(e => e.rowIndex === index));
  if (validTasks.length > 0) {
      const woidChecks = validTasks.map(task => adminDb.collection('production_tasks').doc(task.WO_WOID).get());
      const woidDocs = await Promise.all(woidChecks);

      woidDocs.forEach((doc, i) => {
          if (doc.exists) {
              const originalIndex = tasks.findIndex(t => t.WO_WOID === validTasks[i].WO_WOID);
              // Avoid adding duplicate error messages
              if (!errors.some(e => e.rowIndex === originalIndex)) {
                errors.push({
                    rowIndex: originalIndex,
                    message: `WO_WOID '${validTasks[i].WO_WOID}' already exists in the database.`,
                    field: 'WO_WOID'
                });
              }
          }
      });
  }


  if (errors.length > 0) {
    return { success: false, errors: errors.sort((a,b) => a.rowIndex - b.rowIndex) };
  }

  // If all validations pass, proceed to batch write to Firestore
  try {
    const batch = adminDb.batch();
    const beijingTime = formatInTimeZone(new Date(), 'Asia/Shanghai', 'yyyy-MM-dd HH:mm:ss');

    tasks.forEach((task) => {
      const docRef = adminDb.collection("production_tasks").doc(task.WO_WOID);
      const newTask = {
        ...task,
        WO_GCID: '01',
        WO_LX: 'MPS',
        WO_ZT: 'P',
        WO_DZSC: 'N',
        WO_WHRID: 'GYGJ240328',
        WO_WHSJ: beijingTime,
      };
      batch.set(docRef, newTask);
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Firestore batch commit failed:", error);
    return {
      success: false,
      errors: [{ rowIndex: 0, message: `Firestore error: ${error.message}` }],
    };
  }
}
