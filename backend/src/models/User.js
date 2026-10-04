// backend/src/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password by default in queries
    },
    preferences: {
      language: {
        type: String,
        default: 'English (Indian Context)',
      },
      responseStyle: {
        type: String,
        default: 'Simple, Jargon-Free',
      },
      textSize: {
        type: String,
        default: 'Standard',
      },
      voicePrompt: {
        type: String,
        default: 'Off',
      },
      voiceEnabled: {
        type: Boolean,
        default: false,
      },
      highContrast: {
        type: Boolean,
        default: false,
      },
    },
    // Localized name cache by language code (en, hi, bn, mr, etc.)
    // Preserves canonical `name` without mutation.
    localizedNames: {
      type: Map,
      of: String,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe representation without sensitive fields
userSchema.methods.toSafeObject = function (requestedLang = null) {
  const prefLang = requestedLang || this.preferences?.language || 'en';
  const langKey = (prefLang.slice(0, 2) || 'en').toLowerCase();

  let localizedMap = {};
  if (this.localizedNames instanceof Map) {
    localizedMap = Object.fromEntries(this.localizedNames);
  } else if (this.localizedNames && typeof this.localizedNames === 'object') {
    localizedMap = { ...this.localizedNames };
  }

  // Canonical name is always preserved as `name`
  // Display name is transliterated representation in current language if available
  const displayName = localizedMap[langKey] || localizedMap[prefLang] || this.name;

  return {
    _id: this._id,
    id: this._id,
    name: this.name,
    displayName,
    localizedNames: localizedMap,
    email: this.email,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
