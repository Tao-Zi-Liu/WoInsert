import oracledb from 'oracledb';

// Oracle connection configuration
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE_NAME}`
};

// Test database connection
export async function testOracleConnection(): Promise<{ success: boolean; error?: string }> {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute('SELECT 1 FROM DUAL');
    return { success: true };
  } catch (error: any) {
    console.error('Oracle connection test failed:', error);
    return { 
      success: false, 
      error: error.message || 'Database connection failed' 
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

// Validate WO_WLID exists in WLXX table
export async function validateWOWLID(woWlid: string): Promise<{ exists: boolean; error?: string }> {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const result = await connection.execute(
      `SELECT COUNT(*) as count FROM WLXX WHERE WLXX_WLID = :woWlid`,
      [woWlid],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const count = (result.rows as any[])[0]?.COUNT || 0;
    return { exists: count > 0 };
    
  } catch (error: any) {
    console.error('Oracle validation failed:', error);
    return { 
      exists: false, 
      error: error.message || 'Database validation failed' 
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