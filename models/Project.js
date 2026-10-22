const mongoose = require('mongoose');

function extractPoints(content) {
  if (!content) return [];
  if (Array.isArray(content)) return content.map(String).filter(Boolean);
  if (typeof content !== 'string') return [String(content)];
  const trimmed = content.trim();
  if (trimmed.includes('\n')) {
    return trimmed
      .split('\n')
      .map((l) => l.replace(/^[\s•\-*\d.]+\s*/, '').trim())
      .filter(Boolean);
  }
  if (trimmed.includes('•')) {
    return trimmed
      .split('•')
      .map((l) => l.trim())
      .filter(Boolean);
  }
  const sentences = trimmed
    .split(/(?<=\.)\s+/)
    .map((s) => s.replace(/^[\s•\-*\d.]+\s*/, '').trim())
    .filter(Boolean);
  if (sentences.length > 1) return sentences;
  return [trimmed];
}

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    description: { type: String, default: '' },
    points: [{ type: String, trim: true }],
    liveDemo: { type: String, default: '' },
    live: { type: String, default: '' },
    tech: [{ type: String, trim: true }],
    github: { type: String, default: '' },
  },
  { timestamps: true }
);

// Pre-save middleware to keep content/description, points, and liveDemo/live synced
projectSchema.pre('save', function (next) {
  const text = this.content || this.description || '';
  if (text) {
    this.points = extractPoints(text);
  }
  if (this.content && !this.description) {
    this.description = this.content;
  } else if (this.description && !this.content) {
    this.content = this.description;
  }

  if (this.liveDemo && !this.live) {
    this.live = this.liveDemo;
  } else if (this.live && !this.liveDemo) {
    this.liveDemo = this.live;
  }
  next();
});

module.exports = mongoose.models.Project || mongoose.model('Project', projectSchema);