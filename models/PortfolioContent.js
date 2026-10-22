const mongoose = require('mongoose');

const portfolioContentSchema = new mongoose.Schema(
  {
    hero: {
      badge: { type: String, default: 'Full-Stack Developer' },
      heading: { type: String, default: "HELLO ! I'm Venkata Sreedhar Reddy Palleti" },
      subheading: { type: String, default: 'Specializing in React, Node.js, and modern cloud architectures.' },
      avatarUrl: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
    },
    about: {
      text: { type: String, default: 'I am a software engineer focused on developing performant web services and accessible interfaces.' },
    },
    skills: [{ type: String, trim: true }],
    contactInfo: {
      email: { type: String, default: 'nmallikarjunareddy1998@gmail.com' },
      phone: { type: String, default: '+91-9885366006' },
      location: { type: String, default: 'Andhra Pradesh, India' },
      photoUrl: { type: String, default: '' },
      githubUrl: { type: String, default: 'https://github.com' },
      linkedinUrl: { type: String, default: 'https://linkedin.com' },
      instagramUrl: { type: String, default: 'https://instagram.com' },
      facebookUrl: { type: String, default: 'https://facebook.com' },
      twitterUrl: { type: String, default: 'https://twitter.com' },
    },
    education: [
      {
        degree: { type: String, default: '' },
        institution: { type: String, default: '' },
        duration: { type: String, default: '' },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.PortfolioContent || mongoose.model('PortfolioContent', portfolioContentSchema);