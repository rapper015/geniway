export class ChatSession {
  constructor(data) {
    // Handle both database field names (user_id) and application property names (userId)
    this.id = data.id;
    this.userId = data.user_id !== undefined ? data.user_id : data.userId;
    this.subject = data.subject;
    this.mode = data.mode;
    this.title = data.title;
    this.messageCount = data.message_count !== undefined ? data.message_count : data.messageCount;
    this.lastActive = data.last_active !== undefined ? data.last_active : data.lastActive;
    this.isGuest = data.is_guest !== undefined ? data.is_guest : data.isGuest;
    this.status = data.status;
    this.messages = data.messages || [];
    this.metadata = data.metadata || {};
    this.createdAt = data.created_at !== undefined ? data.created_at : data.createdAt;
    this.updatedAt = data.updated_at !== undefined ? data.updated_at : data.updatedAt;
  }

  // Static methods for database operations
  static async find(conditions = {}) {
    const { query } = await import('../lib/database.js');
    
    let queryText = 'SELECT * FROM chat_sessions';
    const values = [];
    let paramCount = 1;
    const whereClauses = [];
    
    if (conditions.userId) {
      whereClauses.push(`user_id = $${paramCount}`);
      values.push(conditions.userId);
      paramCount++;
    }
    
    if (conditions.status) {
      whereClauses.push(`status = $${paramCount}`);
      values.push(conditions.status);
      paramCount++;
    }
    
    if (conditions.isGuest !== undefined) {
      whereClauses.push(`is_guest = $${paramCount}`);
      values.push(conditions.isGuest);
      paramCount++;
    }
    
    if (whereClauses.length > 0) {
      queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // Add sorting
    if (conditions.sort) {
      queryText += ` ORDER BY ${conditions.sort}`;
    } else {
      queryText += ' ORDER BY created_at DESC';
    }
    
    // Add limit if specified
    if (conditions.limit) {
      queryText += ` LIMIT $${paramCount}`;
      values.push(conditions.limit);
    }
    
    const result = await query(queryText, values);
    return result.rows.map(row => new ChatSession(row));
  }

  static async findById(id) {
    const { query } = await import('../lib/database.js');
    const result = await query('SELECT * FROM chat_sessions WHERE id = $1', [id]);
    return result.rows[0] ? new ChatSession(result.rows[0]) : null;
  }

  static async findOne(conditions) {
    const { query } = await import('../lib/database.js');
    
    let queryText = 'SELECT * FROM chat_sessions';
    const values = [];
    let paramCount = 1;
    const whereClauses = [];
    
    for (const [key, value] of Object.entries(conditions)) {
      const dbField = this.getDbFieldName(key);
      whereClauses.push(`${dbField} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
    
    if (whereClauses.length > 0) {
      queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    queryText += ' LIMIT 1';
    
    const result = await query(queryText, values);
    return result.rows[0] ? new ChatSession(result.rows[0]) : null;
  }

  static async findByIdAndUpdate(id, updateData) {
    const { query } = await import('../lib/database.js');
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key === '_id' || key === 'id') continue;
      
      // Handle MongoDB-style operations
      if (key === '$inc') {
        // Handle increment operations
        for (const [incKey, incValue] of Object.entries(value)) {
          const dbField = this.getDbFieldName(incKey);
          fields.push(`${dbField} = ${dbField} + $${paramCount}`);
          values.push(incValue);
          paramCount++;
        }
      } else if (key === '$set') {
        // Handle set operations
        for (const [setKey, setValue] of Object.entries(value)) {
          const dbField = this.getDbFieldName(setKey);
          fields.push(`${dbField} = $${paramCount}`);
          values.push(setValue);
          paramCount++;
        }
      } else {
        // Handle regular field updates
        const dbField = this.getDbFieldName(key);
        fields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (fields.length === 0) {
      return await this.findById(id);
    }
    
    values.push(id);
    const queryText = `UPDATE chat_sessions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    return result.rows[0] ? new ChatSession(result.rows[0]) : null;
  }

  static getDbFieldName(field) {
    const fieldMap = {
      userId: 'user_id',
      messageCount: 'message_count',
      lastActive: 'last_active',
      isGuest: 'is_guest',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    return fieldMap[field] || field;
  }

  async save() {
    const { query } = await import('../lib/database.js');
    
    if (this.id) {
      // Update existing session
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      for (const [key, value] of Object.entries(this)) {
        if (key === 'id' || key === '_id') continue;
        
        const dbField = ChatSession.getDbFieldName(key);
        if (key === 'messages') {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(value || []));
        } else if (key === 'metadata') {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(value || {}));
        } else {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
      
      values.push(this.id);
      const queryText = `UPDATE chat_sessions SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
      
      const result = await query(queryText, values);
      return new ChatSession(result.rows[0]);
    } else {
      // Create new session
      const fields = ['user_id', 'subject', 'mode', 'title', 'message_count', 'last_active', 'is_guest', 'status', 'messages', 'metadata'];
      const values = [
        this.userId,
        this.subject,
        this.mode,
        this.title,
        this.messageCount,
        this.lastActive,
        this.isGuest,
        this.status,
        JSON.stringify(this.messages || []),
        JSON.stringify(this.metadata || {})
      ];
      
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const queryText = `INSERT INTO chat_sessions (${fields.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`;
      
      const result = await query(queryText, values);
      const newSession = new ChatSession(result.rows[0]);
      this.id = newSession.id;
      this._id = newSession.id; // For compatibility
      return newSession;
    }
  }
}

