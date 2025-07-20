import { IEntity } from './IEntity';

/**
 * Base repository interface for data access operations
 */
export interface IRepository<T extends IEntity, CreateDto, UpdateDto> {
  /**
   * Find all entities with optional filtering and pagination
   */
  findAll(filters?: any, pagination?: PaginationParams): Promise<PaginatedResponse<T>>;
  
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T>;
  
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

/**
 * Pagination parameters for list operations
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated response for list operations
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}