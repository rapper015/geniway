import bcrypt from 'bcryptjs';

export class User {
  constructor(data) {
    // Handle both database field names and application property names
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.name = data.name;
    this.firstName = data.first_name || data.firstName;
    this.lastName = data.last_name || data.lastName;
    this.preferredName = data.preferred_name || data.preferredName;
    this.whatsappNumber = data.whatsapp_number || data.whatsappNumber;
    this.role = data.role;
    this.grade = data.grade;
    this.board = data.board;
    this.state = data.state;
    this.city = data.city;
    this.school = data.school;
    this.subjects = data.subjects;
    this.langPref = data.lang_pref || data.langPref;
    this.teachingLanguage = data.teaching_language || data.teachingLanguage;
    this.pace = data.pace;
    this.learningStyle = data.learning_style || data.learningStyle;
    this.learningStyles = data.learning_styles || data.learningStyles;
    this.contentMode = data.content_mode || data.contentMode;
    this.fastTrackEnabled = data.fast_track_enabled || data.fastTrackEnabled;
    this.saveChatHistory = data.save_chat_history || data.saveChatHistory;
    this.studyStreaksEnabled = data.study_streaks_enabled || data.studyStreaksEnabled;
    this.breakRemindersEnabled = data.break_reminders_enabled || data.breakRemindersEnabled;
    this.masteryNudgesEnabled = data.mastery_nudges_enabled || data.masteryNudgesEnabled;
    this.dataSharingEnabled = data.data_sharing_enabled || data.dataSharingEnabled;
    this.isGuest = data.is_guest || data.isGuest;
    this.ageBand = data.age_band || data.ageBand;
    this.profileCompletionStep = data.profile_completion_step || data.profileCompletionStep;
    this.profileCompleted = data.profile_completed || data.profileCompleted;
    this.phoneNumber = data.phone_number || data.phoneNumber;
    this.totalQuestionsAsked = data.total_questions_asked || data.totalQuestionsAsked;
    this.totalQuizzesCompleted = data.total_quizzes_completed || data.totalQuizzesCompleted;
    this.averageQuizScore = data.average_quiz_score || data.averageQuizScore;
    this.lastActiveSession = data.last_active_session || data.lastActiveSession;
    this.totalSessions = data.total_sessions || data.totalSessions;
    this.preferences = data.preferences;
    this.guestMetadata = data.guest_metadata || data.guestMetadata;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // Static methods for database operations
  static async findOne(conditions) {
    const { query } = await import('../lib/database.js');
    
    if (conditions._id) {
      const result = await query('SELECT * FROM users WHERE id = $1', [conditions._id]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    }
    
    if (conditions.email) {
      const result = await query('SELECT * FROM users WHERE email = $1', [conditions.email]);
      return result.rows[0] ? new User(result.rows[0]) : null;
    }
    
    if (conditions.$or) {
      for (const condition of conditions.$or) {
        if (condition._id) {
          const result = await query('SELECT * FROM users WHERE id = $1', [condition._id]);
          if (result.rows[0]) return new User(result.rows[0]);
        }
        if (condition.email) {
          const result = await query('SELECT * FROM users WHERE email = $1', [condition.email]);
          if (result.rows[0]) return new User(result.rows[0]);
        }
      }
    }
    
    return null;
  }

  static async findById(id) {
    const { query } = await import('../lib/database.js');
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
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
      fields.push(`${dbField} = $${paramCount}`);
      
      // Handle JSONB fields - stringify objects and arrays
      if (['subjects', 'learningStyles', 'preferences', 'guestMetadata'].includes(key) && (Array.isArray(value) || typeof value === 'object')) {
        values.push(JSON.stringify(value));
      } else {
        values.push(value);
      }
      paramCount++;
    }
    
    if (fields.length === 0) {
      return await this.findById(id);
    }
    
    values.push(id);
    const queryText = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static getDbFieldName(field) {
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      preferredName: 'preferred_name',
      whatsappNumber: 'whatsapp_number',
      langPref: 'lang_pref',
      teachingLanguage: 'teaching_language',
      learningStyle: 'learning_style',
      learningStyles: 'learning_styles',
      contentMode: 'content_mode',
      fastTrackEnabled: 'fast_track_enabled',
      saveChatHistory: 'save_chat_history',
      studyStreaksEnabled: 'study_streaks_enabled',
      breakRemindersEnabled: 'break_reminders_enabled',
      masteryNudgesEnabled: 'mastery_nudges_enabled',
      dataSharingEnabled: 'data_sharing_enabled',
      isGuest: 'is_guest',
      ageBand: 'age_band',
      profileCompletionStep: 'profile_completion_step',
      profileCompleted: 'profile_completed',
      phoneNumber: 'phone_number',
      totalQuestionsAsked: 'total_questions_asked',
      totalQuizzesCompleted: 'total_quizzes_completed',
      averageQuizScore: 'average_quiz_score',
      lastActiveSession: 'last_active_session',
      totalSessions: 'total_sessions',
      guestMetadata: 'guest_metadata',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    return fieldMap[field] || field;
  }

  async save() {
    const { query } = await import('../lib/database.js');
    
    if (this.id) {
      // Update existing user
      const fields = [];
      const values = [];
      let paramCount = 1;
      
      for (const [key, value] of Object.entries(this)) {
        if (key === 'id' || key === '_id') continue;
        
        const dbField = User.getDbFieldName(key);
        fields.push(`${dbField} = $${paramCount}`);
        
        // Handle JSONB fields
        if (key === 'subjects' || key === 'learningStyles' || key === 'preferences') {
          values.push(JSON.stringify(value || (key === 'preferences' ? {} : [])));
        } else {
          values.push(value);
        }
        paramCount++;
      }
      
      values.push(this.id);
      const queryText = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`;
      
      const result = await query(queryText, values);
      return new User(result.rows[0]);
    } else {
      // Create new user
      const fields = ['email', 'password', 'name', 'first_name', 'last_name', 'preferred_name', 'whatsapp_number', 'role', 'grade', 'board', 'state', 'city', 'school', 'subjects', 'lang_pref', 'teaching_language', 'pace', 'learning_style', 'learning_styles', 'content_mode', 'fast_track_enabled', 'save_chat_history', 'study_streaks_enabled', 'break_reminders_enabled', 'mastery_nudges_enabled', 'data_sharing_enabled', 'is_guest', 'age_band', 'profile_completion_step', 'profile_completed', 'phone_number', 'total_questions_asked', 'total_quizzes_completed', 'average_quiz_score', 'last_active_session', 'total_sessions', 'preferences', 'guest_metadata'];
      
      const values = [
        this.email,
        this.password,
        this.name,
        this.firstName,
        this.lastName,
        this.preferredName,
        this.whatsappNumber,
        this.role,
        this.grade,
        this.board,
        this.state,
        this.city,
        this.school,
        JSON.stringify(this.subjects || []),
        this.langPref,
        this.teachingLanguage,
        this.pace,
        this.learningStyle,
        JSON.stringify(this.learningStyles || []),
        this.contentMode,
        this.fastTrackEnabled,
        this.saveChatHistory,
        this.studyStreaksEnabled,
        this.breakRemindersEnabled,
        this.masteryNudgesEnabled,
        this.dataSharingEnabled,
        this.isGuest,
        this.ageBand,
        this.profileCompletionStep,
        this.profileCompleted,
        this.phoneNumber,
        this.totalQuestionsAsked,
        this.totalQuizzesCompleted,
        this.averageQuizScore,
        this.lastActiveSession,
        this.totalSessions,
        JSON.stringify(this.preferences || {}),
        JSON.stringify(this.guestMetadata || {})
      ];
      
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const queryText = `INSERT INTO users (${fields.join(', ')}, created_at, updated_at) VALUES (${placeholders}, NOW(), NOW()) RETURNING *`;
      
      const result = await query(queryText, values);
      const newUser = new User(result.rows[0]);
      this.id = newUser.id;
      this._id = newUser.id; // For compatibility
      return newUser;
    }
  }

  // Password hashing
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}
