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
4.  WO_WLID must exist in the Oracle ERP database (WLXX table, WLXX_WLID column).

Respond with a JSON object (following the ValidationOutputSchema) indicating whether the data is valid and providing a detailed explanation of any validation errors. Make sure to set isValid to false if ANY of the above checks fail.

WO_WLID existence in Oracle database cannot be validated by you directly; assume the tool will perform the check and indicate this in the explanation if you have marked the entire form as invalid due to other validation failures.
`,
});

const checkOracleWLID = ai.defineTool(
  {
    name: 'checkOracleWLID',
    description: 'Checks if WO_WLID exists in the Oracle ERP database WLXX table.',
    inputSchema: z.object({
      wo_wlid: z.string().describe('The WO_WLID to check.'),
    }),
    outputSchema: z.object({
      exists: z.boolean().describe('Whether WO_WLID exists in Oracle database.'),
      error: z.string().optional().describe('Error message if validation failed.'),
    }),
  },
  async input => {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/validate-wlid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ woWlid: input.wo_wlid }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          exists: false,
          error: data.error || 'Database validation failed',
        };
      }

      return {
        exists: data.exists,
      };
    } catch (error: any) {
      return {
        exists: false,
        error: error.message || 'Network error during validation',
      };
    }
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

    const oracleCheck = await checkOracleWLID({
      wo_wlid: input.wo_wlid,
    });

    if (oracleCheck.error) {
      return {
        isValid: false,
        explanation: `Database validation error: ${oracleCheck.error}`,
      };
    }

    if (!oracleCheck.exists) {
      return {
        isValid: false,
        explanation: `WO_WLID '${input.wo_wlid}' does not exist in the ERP system database (WLXX table).`,
      };
    }

    return {
      isValid: true,
      explanation: 'All validations passed.',
    };
  }
);