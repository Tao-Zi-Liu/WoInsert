import * as XLSX from 'xlsx';
import { Task } from './definitions';

export const downloadExcelTemplate = () => {
  const headers = ["WO_WOID", "WO_WLID", "WO_XQSL", "WO_JHKGRQ", "WO_JHWGRQ", "WO_BMID"];
  const worksheet = XLSX.utils.aoa_to_sheet([headers]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  XLSX.writeFile(workbook, 'TaskMaster_Template.xlsx');
};

export const importFromExcel = (file: File, callback: (data: Partial<Task>[]) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target?.result;
    const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });
    
    const formattedData = json.map((row: any) => ({
      WO_WOID: row.WO_WOID?.toString() || '',
      WO_WLID: row.WO_WLID?.toString() || '',
      WO_XQSL: row.WO_XQSL?.toString() || '',
      WO_JHKGRQ: row.WO_JHKGRQ instanceof Date ? row.WO_JHKGRQ.toISOString().split('T')[0] : (row.WO_JHKGRQ?.toString() || ''),
      WO_JHWGRQ: row.WO_JHWGRQ instanceof Date ? row.WO_JHWGRQ.toISOString().split('T')[0] : (row.WO_JHWGRQ?.toString() || ''),
      WO_BMID: row.WO_BMID?.toString() || '',
    }));

    callback(formattedData);
  };
  reader.readAsBinaryString(file);
};
