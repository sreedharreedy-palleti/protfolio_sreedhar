const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    duration: { type: String, required: true },
    isCurrent: { type: Boolean, default: false },
    bannerBg: { type: String, default: '#075153' },
    cardBg: { type: String, default: '' },
    logoType: { type: String, default: 'ge' }, // 'ge' | 'cloud' | 'atom' | 'custom'
    logoText: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    socials: {
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Experience || mongoose.model('Experience', experienceSchema);
