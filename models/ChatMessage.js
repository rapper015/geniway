export class ChatMessage {
  constructor(data) {
    // Handle both database field names and application property names
    this.id = data.id;
    this.sessionId = data.session_id || data.sessionId;
    this.userId = data.user_id || data.userId;
    this.sender = data.sender;
    this.messageType = data.message_type || data.messageType;
    this.content = data.content;
    this.imageUrl = data.image_url || data.imageUrl;
    this.tokensUsed = data.tokens_used || data.tokensUsed;
    this.model = data.model;
    this.createdAt = data.created_at || data.createdAt;
  }

  // Static methods for database operations
  static async find(conditions = {}) {
    const { query } = await import('../lib/database.js');
    
    let queryText = 'SELECT * FROM chat_messages';
    const values = [];
    let paramCount = 1;
    const whereClauses = [];
    
    if (conditions.sessionId) {
      whereClauses.push(`session_id = $${paramCount}`);
      values.push(conditions.sessionId);
      paramCount++;
    }
    
    if (conditions.userId) {
      whereClauses.push(`user_id = $${paramCount}`);
      values.push(conditions.userId);
      paramCount++;
    }
    
    if (conditions.sender) {
      whereClauses.push(`sender = $${paramCount}`);
      values.push(conditions.sender);
      paramCount++;
    }
    
    if (whereClauses.length > 0) {
      queryText += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    // Add sorting
    queryText += ' ORDER BY created_at ASC';
    
    // Add limit if specified
    if (conditions.limit) {
      queryText += ` LIMIT $${paramCount}`;
      values.push(conditions.limit);
    }
    
    const result = await query(queryText, values);
    return result.rows.map(row => new ChatMessage(row));
  }

  static async findById(id) {
    const { query } = await import('../lib/database.js');
    const result = await query('SELECT * FROM chat_messages WHERE id = $1', [id]);
    return result.rows[0] ? new ChatMessage(result.rows[0]) : null;
  }

  static async findOne(conditions) {
    const { query } = await import('../lib/database.js');
    
    let queryText = 'SELECT * FROM chat_messages';
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
    return result.rows[0] ? new ChatMessage(result.rows[0]) : null;
  }

  static getDbFieldName(field) {
    const fieldMap = {
      sessionId: 'session_id',
      userId: 'user_id',
      messageType: 'message_type',
      imageUrl: 'image_url',
      tokensUsed: 'tokens_used',
      createdAt: 'created_at'
    };
    
    return fieldMap[field] || field;
  }

  async save() {
    const { query } = await import('../lib/database.js');
    
    if (this.id) {
      // Update existing message
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      for (const [key, value] of Object.entries(this)) {
        if (key === 'id') continue;
        
        const dbField = ChatMessage.getDbFieldName(key);
        fields.push(`${dbField} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
      
      values.push(this.id);
      const queryText = `UPDATE chat_messages SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      
      const result = await query(queryText, values);
      return new ChatMessage(result.rows[0]);
    } else {
      // Create new message
      const fields = ['session_id', 'user_id', 'sender', 'message_type', 'content', 'image_url', 'tokens_used', 'model'];
      const values = [
        this.sessionId,
        this.userId,
        this.sender,
        this.messageType,
        this.content,
        this.imageUrl,
        this.tokensUsed,
        this.model
      ];
      
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const queryText = `INSERT INTO chat_messages (${fields.join(', ')}, created_at) VALUES (${placeholders}, NOW()) RETURNING *`;
      
      const result = await query(queryText, values);
      const newMessage = new ChatMessage(result.rows[0]);
      this.id = newMessage.id;
      this._id = newMessage.id; // For compatibility
      return newMessage;
    }
  }
}
