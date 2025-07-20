/**
 * Base interface for all entities in the system
 */
export interface IEntity {
  id: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
}