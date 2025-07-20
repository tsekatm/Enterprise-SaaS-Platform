import { IEntity } from './IEntity';
import { PaginatedResponse, PaginationParams } from './IRepository';

/**
 * Base controller interface for handling HTTP requests
 */
export interface IController<T extends IEntity, CreateDto, UpdateDto> {
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
  create(dto: CreateDto): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: string, dto: UpdateDto): Promise<T>;
  
  /**
   * Delete an entity
   */
  delete(id: string): Promise<void>;
}