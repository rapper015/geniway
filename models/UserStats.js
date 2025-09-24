export class UserStats {
  constructor(data) {
    // Handle both database field names and application property names
    this.id = data.id;
    this.userId = data.user_id || data.userId;
    this.totalMessages = data.total_messages || data.totalMessages;
    this.totalSessions = data.total_sessions || data.totalSessions;
    this.totalQuestionsAsked = data.total_questions_asked || data.totalQuestionsAsked;
    this.totalQuizzesCompleted = data.total_quizzes_completed || data.totalQuizzesCompleted;
    this.averageQuizScore = data.average_quiz_score || data.averageQuizScore;
    this.totalStudyTime = data.total_study_time || data.totalStudyTime;
    this.lastActive = data.last_active || data.lastActive;
    this.streakCount = data.streak_count || data.streakCount;
    this.lastStreakDate = data.last_streak_date || data.lastStreakDate;
    this.preferences = data.preferences || {};
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Static methods for database operations
  static async findOne(conditions) {
    const { query } = await import('../lib/database.js');
    
    if (conditions.userId) {
      const result = await query('SELECT * FROM user_stats WHERE user_id = $1', [conditions.userId]);
      return result.rows[0] ? new UserStats(result.rows[0]) : null;
    }
    
    if (conditions._id) {
      const result = await query('SELECT * FROM user_stats WHERE id = $1', [conditions._id]);
      return result.rows[0] ? new UserStats(result.rows[0]) : null;
    }
    
    return null;
  }

  static async findById(id) {
    const { query } = await import('../lib/database.js');
    const result = await query('SELECT * FROM user_stats WHERE id = $1', [id]);
    return result.rows[0] ? new UserStats(result.rows[0]) : null;
  }

  static async findByIdAndUpdate(id, updateData) {
    const { query } = await import('../lib/database.js');
    
    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key === '_id' || key === 'id') continue;
      
      const dbField = this.getDbFieldName(key);
      if (key === 'preferences') {
        fields.push(`${dbField} = $${paramCount}`);
        values.push(value);
      } else {
        fields.push(`${dbField} = $${paramCount}`);
        values.push(value);
      }
      paramCount++;
    }
    
    if (fields.length === 0) {
      return await this.findById(id);
    }
    
    values.push(id);
    const queryText = `UPDATE user_stats SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    return result.rows[0] ? new UserStats(result.rows[0]) : null;
  }

  static async findOneAndUpdate(conditions, updateData, options = {}) {
    const { query } = await import('../lib/database.js');
    
    // Find the record first
    let record = null;
    if (conditions.userId) {
      const findResult = await query('SELECT * FROM user_stats WHERE user_id = $1', [conditions.userId]);
      record = findResult.rows[0];
    }
    
    if (!record) {
      if (options.upsert) {
        // Create new record
        const fields = ['user_id', 'total_messages', 'total_sessions', 'total_questions_asked', 'total_quizzes_completed', 'average_quiz_score', 'total_study_time', 'last_active', 'streak_count', 'last_streak_date', 'preferences'];
        const values = [
          conditions.userId,
          updateData.totalMessages || 0,
          updateData.totalSessions || 0,
          updateData.totalQuestionsAsked || 0,
          updateData.totalQuizzesCompleted || 0,
          updateData.averageQuizScore || 0,
          updateData.totalStudyTime || 0,
          updateData.lastActive || new Date(),
          updateData.streakCount || 0,
          updateData.lastStreakDate,
          JSON.stringify(updateData.preferences || {})
        ];
        
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        const queryText = `INSERT INTO user_stats (${fields.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`;
        
        const result = await query(queryText, values);
        return new UserStats(result.rows[0]);
      }
      return null;
    }
    
    // Update existing record with increment support
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updateData)) {
      const dbField = this.getDbFieldName(key);
      if (key === 'preferences') {
        fields.push(`${dbField} = $${paramCount}`);
        values.push(JSON.stringify(value || {}));
      } else {
        // Handle increment operations
        if (typeof value === 'number' && record[dbField] !== undefined) {
          fields.push(`${dbField} = ${dbField} + $${paramCount}`);
          values.push(value);
        } else {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
      }
      paramCount++;
    }
    
    values.push(record.id);
    const queryText = `UPDATE user_stats SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    return result.rows[0] ? new UserStats(result.rows[0]) : null;
  }

  static getDbFieldName(field) {
    const fieldMap = {
      userId: 'user_id',
      totalMessages: 'total_messages',
      totalSessions: 'total_sessions',
      totalQuestionsAsked: 'total_questions_asked',
      totalQuizzesCompleted: 'total_quizzes_completed',
      averageQuizScore: 'average_quiz_score',
      totalStudyTime: 'total_study_time',
      lastActive: 'last_active',
      streakCount: 'streak_count',
      lastStreakDate: 'last_streak_date',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    return fieldMap[field] || field;
  }

  async save() {
    const { query } = await import('../lib/database.js');
    
    if (this.id) {
      // Update existing stats
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      for (const [key, value] of Object.entries(this)) {
        if (key === 'id') continue;
        
        const dbField = UserStats.getDbFieldName(key);
        if (key === 'preferences') {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(JSON.stringify(value || {}));
        } else {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
      
      values.push(this.id);
      const queryText = `UPDATE user_stats SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
      
      const result = await query(queryText, values);
      return new UserStats(result.rows[0]);
    } else {
      // Create new stats
      const fields = ['user_id', 'total_messages', 'total_sessions', 'total_questions_asked', 'total_quizzes_completed', 'average_quiz_score', 'total_study_time', 'last_active', 'streak_count', 'last_streak_date', 'preferences'];
      const values = [
        this.userId,
        this.totalMessages,
        this.totalSessions,
        this.totalQuestionsAsked,
        this.totalQuizzesCompleted,
        this.averageQuizScore,
        this.totalStudyTime,
        this.lastActive,
        this.streakCount,
        this.lastStreakDate,
        JSON.stringify(this.preferences || {})
      ];
      
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const queryText = `INSERT INTO user_stats (${fields.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`;
      
      const result = await query(queryText, values);
      const newStats = new UserStats(result.rows[0]);
      this.id = newStats.id;
      this._id = newStats.id; // For compatibility
      return newStats;
    }
  }
}

