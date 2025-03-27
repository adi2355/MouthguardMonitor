/**
 * QueryBuilder - A simple SQL query builder for SQLite
 * 
 * This class provides a fluent interface for building SQL queries
 * without having to write raw SQL strings.
 */
export class QueryBuilder {
  private selectCols: string[] = [];
  private fromTableName: string = '';
  private whereConditions: string[] = [];
  private orderByClauses: string[] = [];
  private groupByClauses: string[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private paramValues: any[] = [];
  
  /**
   * Select columns to include in the query
   * @param columns Column names to select
   * @returns this instance for chaining
   */
  selectColumns(columns: string | string[]): QueryBuilder {
    if (Array.isArray(columns)) {
      this.selectCols.push(...columns);
    } else {
      this.selectCols.push(columns);
    }
    return this;
  }
  
  /**
   * Set the table to query from
   * @param table Table name
   * @returns this instance for chaining
   */
  from(table: string): QueryBuilder {
    this.fromTableName = table;
    return this;
  }
  
  /**
   * Add a WHERE condition with parameters
   * @param condition SQL condition as string
   * @param params Parameters to bind to the condition
   * @returns this instance for chaining
   */
  whereClause(condition: string, ...params: any[]): QueryBuilder {
    this.whereConditions.push(condition);
    this.paramValues.push(...params);
    return this;
  }

  /**
   * Add an ORDER BY clause
   * @param column Column to order by
   * @param direction Sort direction (ASC or DESC)
   * @returns this instance for chaining
   */
  orderByColumn(column: string, direction: 'ASC' | 'DESC' = 'ASC'): QueryBuilder {
    this.orderByClauses.push(`${column} ${direction}`);
    return this;
  }

  /**
   * Add a GROUP BY clause
   * @param columns Columns to group by
   * @returns this instance for chaining
   */
  groupByColumns(columns: string | string[]): QueryBuilder {
    if (Array.isArray(columns)) {
      this.groupByClauses.push(...columns);
    } else {
      this.groupByClauses.push(columns);
    }
    return this;
  }

  /**
   * Set LIMIT clause
   * @param limit Maximum number of rows to return
   * @returns this instance for chaining
   */
  limitTo(limit: number): QueryBuilder {
    this.limitValue = limit;
    return this;
  }

  /**
   * Set OFFSET clause
   * @param offset Number of rows to skip
   * @returns this instance for chaining
   */
  offsetBy(offset: number): QueryBuilder {
    this.offsetValue = offset;
    return this;
  }
  
  /**
   * Build the final SQL query and parameters
   * @returns Object containing the query string and parameters array
   */
  build(): { query: string, params: any[] } {
    const parts: string[] = [];
    
    // SELECT clause
    parts.push(`SELECT ${this.selectCols.length > 0 ? this.selectCols.join(', ') : '*'}`);
    
    // FROM clause
    parts.push(`FROM ${this.fromTableName}`);
    
    // WHERE clause
    if (this.whereConditions.length > 0) {
      parts.push(`WHERE ${this.whereConditions.join(' AND ')}`);
    }
    
    // GROUP BY clause
    if (this.groupByClauses.length > 0) {
      parts.push(`GROUP BY ${this.groupByClauses.join(', ')}`);
    }
    
    // ORDER BY clause
    if (this.orderByClauses.length > 0) {
      parts.push(`ORDER BY ${this.orderByClauses.join(', ')}`);
    }
    
    // LIMIT clause
    if (this.limitValue !== null) {
      parts.push(`LIMIT ${this.limitValue}`);
    }
    
    // OFFSET clause
    if (this.offsetValue !== null) {
      parts.push(`OFFSET ${this.offsetValue}`);
    }
    
    return {
      query: parts.join(' '),
      params: this.paramValues
    };
  }
} 