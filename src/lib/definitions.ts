export type Task = {
  id?: string;
  rowId: string; // client-side unique id for react keys
  WO_WOID: string;
  WO_WLID: string;
  WO_XQSL: string;
  WO_JHKGRQ: string;
  WO_JHWGRQ: string;
  WO_BMID: string;
  WO_BZ?: string; // Add optional remark field
  [key: string]: any;
};

export type SubmittedTask = Task & {
  WO_GCID: string;
  WO_LX: string;
  WO_ZT: string;
  WO_DZSC: string;
  WO_ZLH: string; // Manufacturing Order Number
  WO_WHRID: string;
  WO_WHR: string;
  WO_WHSJ: any; // Can be a string or a Firestore Timestamp
}

// Update departments with correct values
export const departments = [
  { value: "GQ", label: "曲阜谷雅" },
  { value: "LC", label: "质检部门" },
  { value: "GQ2", label: "国内仓储" }, // Using GQ2 to differentiate since both use GQ
];

// If the business requirement is that both really use "GQ", then:
export const departmentsActual = [
  { value: "GQ", label: "曲阜谷雅", displayOrder: 1 },
  { value: "LC", label: "质检部门", displayOrder: 2 },
  { value: "GQ", label: "国内仓储", displayOrder: 3 },
];