'use server';

/**
 * @fileOverview Data validation flow for the TaskMaster Pro application.
 *
 * - validateAndExplainData - A function that validates form data and provides explanations for any errors.
 * - ValidationInput - The input type for the validateAndExplainData function.
 * - ValidationOutput - The return type for the validateAndExplainData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {firestore} from 'firebase-admin';

const ValidationInputSchema = z.object({
  wo_woid: z.string().describe('Work Order ID'),
  wo_wlid: z.string().describe('Work List ID'),
  wo_xqsl: z.string().describe('Required Quantity'),
  wo_jhkgrq: z.string().describe('Planned Start Date'),
  wo_jhwgrq: z.string().describe('Planned Completion Date'),
  wo_bmid: z.string().describe('Completion Department'),
  all_woids: z.array(z.string()).describe('All WO_WOIDs in the current form'),
});

export type ValidationInput = z.infer<typeof ValidationInputSchema>;

const ValidationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the data is valid or not'),
  explanation: z.string().describe('Explanation of validation results, including errors.'),
});

export type ValidationOutput = z.infer<typeof ValidationOutputSchema>;

export async function validateAndExplainData(input: ValidationInput): Promise<ValidationOutput> {
  return validateAndExplainDataFlow(input);
}

const validateDataPrompt = ai.definePrompt({
  name: 'validateDataPrompt',
  input: {schema: ValidationInputSchema},
  output: {schema: ValidationOutputSchema},
  prompt: `You are a data validation expert for TaskMaster Pro, an application for managing production task orders.  Your job is to validate the incoming data from a form and explain any validation issues.

Here's the data you need to validate:

WO_WOID: {{{wo_woid}}}
WO_WLID: {{{wo_wlid}}}
WO_XQSL: {{{wo_xqsl}}}
WO_JHKGRQ: {{{wo_jhkgrq}}}
WO_JHWGRQ: {{{wo_jhwgrq}}}
WO_BMID: {{{wo_bmid}}}
All WO_WOIDs in form: {{{all_woids}}}

Here are the validation rules:

1.  All fields (WO_WOID, WO_WLID, WO_XQSL, WO_JHKGRQ, WO_JHWGRQ, WO_BMID) are required.
2.  WO_XQSL must be a number greater than 0.
3.  WO_WOID must be unique within the current form (check against {{{all_woids}}}).
4.  WO_WOID must exist in the Firestore database (production_tasks collection).
5.  WO_WLID must exist in the Firestore database.

Respond with a JSON object (following the ValidationOutputSchema) indicating whether the data is valid and providing a detailed explanation of any validation errors. Make sure to set isValid to false if ANY of the above checks fail.

WO_WOID and WO_WLID existence in Firestore cannot be validated by you directly; assume the tool will perform the check and indicate this in the explanation if you have marked the entire form as invalid.  In other words, if a field is missing, or XQSL is invalid, do not reference rules 4 and 5.
`,
});

const checkFirestoreData = ai.defineTool(
  {
    name: 'checkFirestoreData',
    description: 'Checks if WO_WOID and WO_WLID exist in the Firestore database.',
    inputSchema: z.object({
      wo_woid: z.string().describe('The WO_WOID to check.'),
      wo_wlid: z.string().describe('The WO_WLID to check.'),
    }),
    outputSchema: z.object({
      wo_woid_exists: z.boolean().describe('Whether WO_WOID exists in Firestore.'),
      wo_wlid_exists: z.boolean().describe('Whether WO_WLID exists in Firestore.'),
    }),
  },
  async input => {
    const db = firestore();
    const wo_woid_doc = await db.collection('production_tasks').doc(input.wo_woid).get();
    const wo_wlid_doc = await db.collection('production_tasks').where('WO_WLID', '==', input.wo_wlid).get();

    return {
      wo_woid_exists: wo_woid_doc.exists,
      wo_wlid_exists: !wo_wlid_doc.empty,
    };
  }
);

const validateAndExplainDataFlow = ai.defineFlow(
  {
    name: 'validateAndExplainDataFlow',
    inputSchema: ValidationInputSchema,
    outputSchema: ValidationOutputSchema,
  },
  async input => {
    const {output} = await validateDataPrompt(input);

    if (!output?.isValid) {
      return output!;
    }

    const firestoreCheck = await checkFirestoreData({
      wo_woid: input.wo_woid,
      wo_wlid: input.wo_wlid,
    });

    if (!firestoreCheck.wo_woid_exists || !firestoreCheck.wo_wlid_exists) {
      return {
        isValid: false,
        explanation: `WO_WOID ${input.wo_woid} exists: ${firestoreCheck.wo_woid_exists}, WO_WLID ${input.wo_wlid} exists: ${firestoreCheck.wo_wlid_exists}.  WO_WOID and/or WO_WLID does not exist in the Firestore database.`,
      };
    }

    return {
      isValid: true,
      explanation: 'All validations passed.',
    };
  }
);
