const mongoose = require('mongoose');

const statItemSchema = new mongoose.Schema(
  {
    value: { type: String, default: '00' },
    label: { type: String, default: 'Metric' },
  },
  { _id: false }
);

const aboutSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'About Me' },
    subtitle: { type: String, default: 'My introduction' },
    sectionBadge: { type: String, default: 'Profile & Background' },
    sectionTitle: { type: String, default: 'About Me' },
    sectionSubtitle: { type: String, default: 'My introduction' },
    cardBadge: { type: String, default: 'ENGINEERING PHILOSOPHY' },
    headline: {
      type: String,
      default: 'Bridging engineering precision with human-centric interfaces',
    },
    text: {
      type: String,
      default:
        'Senior Software Engineer with 6+ years of experience building scalable cloud-native applications, data platforms, and analytics solutions. I specialize in Java, Spring Boot, Python, React, Azure, Kubernetes, and Apache Superset, with a strong interest in open-source technologies, AI-powered products, and data-driven innovation.',
    },
    // Modern 3-stat counters from user design
    stats: {
      type: [statItemSchema],
      default: [
        { value: '06+', label: 'Years experience' },
        { value: '05', label: 'Companies Work' },
        { value: '15+', label: 'Technical Skills' },
      ],
    },
    // CV / Resume upload data stored in MongoDB
    cv: {
      url: { type: String, default: '' },
      data: { type: String, default: '' }, // Base64 data URI for direct file uploads
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
  { timestamps: true }
);

module.exports = mongoose.models.About || mongoose.model('About', aboutSchema);
