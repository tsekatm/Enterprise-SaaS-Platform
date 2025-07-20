import { IEntity } from './IEntity';
import { PaginatedResponse, PaginationParams } from './IRepository';

/**
 * Base service interface for business logic operations
 */
export interface IService<T extends IEntity, CreateDto, UpdateDto> {
  /**
   * Get all entities with optional filtering and pagination
   */
  getAll(filters?: any, pagination?: PaginationParams): Promise<PaginatedResponse<T>>;
  
  /**
   * Get entity by ID
   */
  getById(id: string): Promise<T>;
  
  /**
   * Create a new entity
   */
  create(dto: CreateDto, userId: string): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: string, dto: UpdateDto, userId: string): Promise<T>;
  
  /**
   * Delete an entity
   */
  delete(id: string, userId: string): Promise<void>;
  
  /**
   * Validate entity data
   */
  validate(dto: CreateDto | UpdateDto): ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}