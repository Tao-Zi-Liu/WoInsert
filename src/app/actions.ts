"use server";

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
      return { index, ...result, field: 'WO_WLID' as keyof Task };
    } catch(e: any) {
      console.error("AI Validation Error:", e);
      return { index, isValid: false, explanation: e.message || "An error occurred during validation." }
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

  if (errors.length > 0) {
    return { success: false, errors: errors.sort((a,b) => a.rowIndex - b.rowIndex) };
  }

  // If all validations pass, we would insert into Oracle database here
  // For now, we'll just return success (you'll need to implement Oracle insertion later)
  try {
    // TODO: Implement Oracle database insertion here
    console.log('Tasks validated successfully. Oracle insertion not yet implemented.');
    console.log('Tasks to insert:', tasks);
    
    return { success: true };
  } catch (error: any) {
    console.error("Database insertion failed:", error);
    return {
      success: false,
      errors: [{ rowIndex: 0, message: `Database error: ${error.message}` }],
    };
  }
}