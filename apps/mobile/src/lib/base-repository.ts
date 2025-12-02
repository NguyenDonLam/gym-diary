// base-repository.ts
// Generic repository operating directly on the domain entity.

export abstract class BaseRepository<TEntity> {
  /**
   * Fetch entity by id.
   */
  abstract get(id: string): Promise<TEntity | null>;

  /**
   * Fetch all entities.
   */
  abstract getAll(): Promise<TEntity[]>;

  /**
   * Insert new entity. Must return the entity with its final id set.
   */
  protected abstract insert(entity: TEntity): Promise<TEntity>;

  /**
   * Update existing entity.
   */
  protected abstract update(entity: TEntity): Promise<TEntity>;

  /**
   * Delete entity by id.
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Save logic:
   * If the entity has no id => insert.
   * If it has id => update.
   *
   * Requires the entity to expose `id: string | null | undefined`.
   */
  async save(entity: TEntity & { id: string }): Promise<TEntity> {
    const existing = await this.get(entity.id);
    if (existing) {
      return this.update(entity);
    }
    return this.insert(entity);
  }
}
