export type Task = {
  id?: string;
  rowId: string; // client-side unique id for react keys
  WO_WOID: string;
  WO_WLID: string;
  WO_XQSL: string;
  WO_JHKGRQ: string;
  WO_JHWGRQ: string;
  WO_BMID: string;
  [key: string]: any;
};

export type SubmittedTask = Task & {
  WO_GCID: string;
  WO_LX: string;
  WO_ZT: string;
  WO_DZSC: string;
  WO_WHRID: string;
  WO_WHSJ: any; // Can be a string or a Firestore Timestamp
}

export const departments = [
  { value: "FIN", label: "Finishing" },
  { value: "ASM", label: "Assembly" },
  { value: "QAC", label: "Quality Control" },
  { value: "PKG", label: "Packaging" },
  { value: "WHS", label: "Warehouse" },
];
