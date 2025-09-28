"use server";

import { type Task } from "@/lib/definitions";
import { generateZLH } from "@/app/actions/wo-actions";
import { formatInTimeZone } from 'date-fns-tz';
import { validateWOWLID } from '@/lib/oracle-config';
import oracledb from 'oracledb';

type SubmissionResult = {
  success: boolean;
  errors?: {
    rowIndex: number;
    message: string;
    field?: keyof Task;
  }[];
};

export async function submitTasks(tasks: Task[]): Promise<SubmissionResult> {
  const errors: any[] = [];
  
  // Validate each task
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    
    // Check required fields
    if (!task.WO_WOID || !task.WO_WLID || !task.WO_XQSL || !task.WO_JHKGRQ || !task.WO_JHWGRQ || !task.WO_BMID) {
      errors.push({
        rowIndex: i,
        message: "所有字段都是必填项",
        field: 'WO_WOID'
      });
      continue;
    }
    
    // Validate quantity
    const quantity = parseFloat(task.WO_XQSL);
    if (isNaN(quantity) || quantity <= 0) {
      errors.push({
        rowIndex: i,
        message: "数量必须大于0",
        field: 'WO_XQSL'
      });
    }
    
    // Check for duplicate WO_WOIDs in current batch
    const duplicates = tasks.filter(t => t.WO_WOID === task.WO_WOID);
    if (duplicates.length > 1) {
      errors.push({
        rowIndex: i,
        message: `工单号 ${task.WO_WOID} 在当前批次中重复`,
        field: 'WO_WOID'
      });
    }
    
    // Validate WO_WLID exists in Oracle
    try {
      const validation = await validateWOWLID(task.WO_WLID);
      if (!validation.exists) {
        errors.push({
          rowIndex: i,
          message: `物料编码 '${task.WO_WLID}' 在ERP系统中不存在`,
          field: 'WO_WLID'
        });
      }
    } catch (error) {
      errors.push({
        rowIndex: i,
        message: `验证物料编码时出错`,
        field: 'WO_WLID'
      });
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  // Insert into Oracle database
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER!,
      password: process.env.ORACLE_PASSWORD!,
      connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`
    });
    
    // Insert each task
    for (const task of tasks) {
      const zlh = await generateZLH();
      const currentTime = formatInTimeZone(new Date(), 'Asia/Shanghai', 'yyyy-MM-dd HH:mm:ss');
      
      await connection.execute(
        `INSERT INTO WO (
          WO_WOID, WO_GCID, WO_WLID, WO_XQSL, 
          WO_JHKGRQ, WO_JHWGRQ, WO_BMID, WO_ZLH,
          WO_LX, WO_ZT, WO_DZSC, WO_BZ,
          WO_WHRID, WO_WHR, WO_WHSJ
        ) VALUES (
          :woid, '01', :wlid, :xqsl,
          TO_DATE(:jhkgrq, 'YYYY-MM-DD'), 
          TO_DATE(:jhwgrq, 'YYYY-MM-DD'),
          :bmid, :zlh, 'MPS', 'P', 'N', :bz,
          'ADMIN', '系统管理员', TO_DATE(:whsj, 'YYYY-MM-DD HH24:MI:SS')
        )`,
        {
          woid: task.WO_WOID,
          wlid: task.WO_WLID,
          xqsl: parseFloat(task.WO_XQSL),
          jhkgrq: task.WO_JHKGRQ,
          jhwgrq: task.WO_JHWGRQ,
          bmid: task.WO_BMID,
          zlh: zlh,
          bz: task.WO_BZ || '',
          whsj: currentTime
        },
        { autoCommit: false }
      );
    }
    
    await connection.commit();
    return { success: true };
    
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Database insertion failed:', error);
    return { 
      success: false, 
      errors: [{ 
        rowIndex: 0, 
        message: `数据库错误: ${error.message}` 
      }] 
    };
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}