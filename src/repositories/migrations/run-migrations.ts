import { Pool } from 'pg';
import { MigrationRunner } from './MigrationRunner';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to run database migrations
 * Usage: ts-node run-migrations.ts
 */
async function main() {
  // Create database connection pool
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'crm',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? true : false
  });

  try {
    // Create migration runner
    const migrationRunner = new MigrationRunner(pool);
    
    // Get migration status
    const status = await migrationRunner.getMigrationStatus();
    console.log('Migration status:');
    console.log(`- Applied migrations: ${status.applied.length}`);
    console.log(`- Pending migrations: ${status.pending.length}`);
    
    if (status.pending.length > 0) {
      console.log('\nPending migrations:');
      status.pending.forEach(migration => console.log(`- ${migration}`));
      
      // Run migrations
      console.log('\nRunning migrations...');
      await migrationRunner.runMigrations();
    } else {
      console.log('\nNo pending migrations to apply');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the script
main().catch(console.error);