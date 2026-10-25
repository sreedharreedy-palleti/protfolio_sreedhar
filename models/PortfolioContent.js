const mongoose = require('mongoose');

const portfolioContentSchema = new mongoose.Schema(
  {
    hero: {
      badge: { type: String, default: 'Full-Stack Developer' },
      heading: { type: String, default: "HELLO ! I'm Venkata Sreedhar Reddy Palleti" },
      subheading: { type: String, default: '' },
      avatarUrl: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
      statusPill: { type: String, default: 'Full-Stack Engineering' },
      chips: [
        {
          text: { type: String, default: 'Cloud Ready' },
          icon: { type: String, default: 'sparkles' },
          position: { type: String, default: 'top-right' },
          animate: { type: Boolean, default: true },
        },
      ],
    },
    about: {
      title: { type: String, default: 'About Me' },
      subtitle: { type: String, default: 'My introduction' },
      sectionBadge: { type: String, default: 'Profile & Background' },
      sectionTitle: { type: String, default: 'About Me' },
      sectionSubtitle: { type: String, default: 'My introduction' },
      cardBadge: { type: String, default: 'ENGINEERING PHILOSOPHY' },
      headline: { type: String, default: 'Bridging engineering precision with human-centric interfaces' },
      text: {
        type: String,
        default:
          'Senior Software Engineer with 6+ years of experience building scalable cloud-native applications, data platforms, and analytics solutions. I specialize in Java, Spring Boot, Python, React, Azure, Kubernetes, and Apache Superset, with a strong interest in open-source technologies, AI-powered products, and data-driven innovation.',
      },
      stats: [
        {
          value: { type: String, default: '06+' },
          label: { type: String, default: 'Years experience' },
        },
      ],
      cv: {
        url: { type: String, default: '' },
        data: { type: String, default: '' },
        fileName: { type: String, default: '' },
        fileSize: { type: String, default: '' },
        uploadedAt: { type: String, default: '' },
      },
      keyPoints: {
        type: [String],
        default: [
          'Specialized in CSE & Data Science fundamentals',
          'Extensive real-world experience across frontend and backend services',
          'Passionate about automated testing, CI/CD, and maintainable codebases',
        ],
      },
      location: { type: String, default: 'Andhra Pradesh, India' },
      email: { type: String, default: 'palletisreedharreddy82@gmail.com' },
      availability: { type: String, default: 'Open for Roles' },
    },
    skills: [{ type: mongoose.Schema.Types.Mixed }],
    contactInfo: {
      email: { type: String, default: 'palletisreedharreddy82@gmail.com' },
      phone: { type: String, default: '+91-8885439267' },
      location: { type: String, default: 'Andhra Pradesh, India' },
      photoUrl: { type: String, default: '' },
      linkedinUrl: { type: String, default: 'https://linkedin.com' },
      instagramUrl: { type: String, default: 'https://instagram.com' },
      githubUrl: { type: String, default: 'https://github.com' },
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