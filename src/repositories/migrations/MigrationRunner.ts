import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg'; // Assuming PostgreSQL is used

/**
 * Migration runner for database schema migrations
 * This class handles the execution of SQL migration scripts
 */
export class MigrationRunner {
  private pool: Pool;
  private migrationsDir: string;
  private migrationTableName: string = 'schema_migrations';

  /**
   * Constructor
   * @param pool Database connection pool
   * @param migrationsDir Directory containing migration scripts
   */
  constructor(pool: Pool, migrationsDir: string = path.join(__dirname)) {
    this.pool = pool;
    this.migrationsDir = migrationsDir;
  }

  /**
   * Initialize the migrations table if it doesn't exist
   */
  private async initMigrationsTable(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${this.migrationTableName} (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Get list of applied migrations
   * @returns Array of applied migration names
   */
  private async getAppliedMigrations(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT name FROM ${this.migrationTableName} ORDER BY id;
      `);
      return result.rows.map(row => row.name);
    } finally {
      client.release();
    }
  }

  /**
   * Get list of available migration files
   * @returns Array of migration file names
   */
  private async getAvailableMigrations(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(this.migrationsDir, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Filter SQL files and sort them
        const sqlFiles = files
          .filter(file => file.endsWith('.sql'))
          .sort();
        
        resolve(sqlFiles);
      });
    });
  }

  /**
   * Read migration file content
   * @param filename Migration file name
   * @returns SQL content of the migration
   */
  private async readMigrationFile(filename: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(this.migrationsDir, filename), 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }

  /**
   * Apply a single migration
   * @param filename Migration file name
   */
  private async applyMigration(filename: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Read and execute migration
      const sql = await this.readMigrationFile(filename);
      await client.query(sql);
      
      // Record migration
      await client.query(`
        INSERT INTO ${this.migrationTableName} (name) VALUES ($1);
      `, [filename]);
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`Applied migration: ${filename}`);
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error(`Error applying migration ${filename}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  public async runMigrations(): Promise<void> {
    try {
      // Initialize migrations table
      await this.initMigrationsTable();
      
      // Get applied and available migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const availableMigrations = await this.getAvailableMigrations();
      
      // Find pending migrations
      const pendingMigrations = availableMigrations.filter(
        migration => !appliedMigrations.includes(migration)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations to apply');
        return;
      }
      
      console.log(`Found ${pendingMigrations.length} pending migrations`);
      
      // Apply each pending migration
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }
      
      console.log('All migrations applied successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get migration status
   * @returns Object containing applied and pending migrations
   */
  public async getMigrationStatus(): Promise<{ applied: string[], pending: string[] }> {
    await this.initMigrationsTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const availableMigrations = await this.getAvailableMigrations();
    
    const pendingMigrations = availableMigrations.filter(
      migration => !appliedMigrations.includes(migration)
    );
    
    return {
      applied: appliedMigrations,
      pending: pendingMigrations
    };
  }
}