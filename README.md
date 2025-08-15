# Language Learning Center Management System

A comprehensive web application for managing Korean language learning centers, built with Node.js, Express, and MongoDB.

## Features

### Student Features
- User registration and authentication
- Course enrollment and progress tracking
- Interactive learning materials
- Assignment submission
- Progress reports
- Forum discussions

### Teacher Features
- Class management
- Student progress monitoring
- Assignment creation and grading
- Course material management
- Performance analytics

### Admin Features
- User management (students, teachers)
- Course and class administration
- System-wide reports and analytics
- Content management

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Passport.js, bcrypt
- **Template Engine**: EJS
- **File Upload**: Multer
- **Email**: Nodemailer
- **AI Integration**: Google Generative AI
- **Testing**: Jest

## Installation

1. Clone the repository:
```bash
git clone https://github.com/0336930905/korean-learning-platform.git
cd korean-learning-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
GOOGLE_API_KEY=your_google_ai_api_key
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests

## Project Structure

```
project-name1/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route handlers
│   ├── models/         # MongoDB models
│   ├── routes/         # Express routes
│   ├── middleware/     # Custom middleware
│   └── services/       # Business logic services
├── views/              # EJS templates
├── public/             # Static assets (CSS, JS, images)
├── uploads/            # User uploaded files
├── scripts/            # Database seeding and utility scripts
└── __tests__/          # Test files
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com)
