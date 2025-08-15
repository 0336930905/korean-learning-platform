const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Course = require('../models/Course');
const ThematicVocabulary = require('../models/ThematicVocabulary');
const Class = require('../models/class');

// Initialize variables
let genAI = null;

// Initialize Google AI using dynamic import
async function initializeAI() {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not found in environment variables');
    }

    genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    console.log('Google AI initialized successfully');
  } catch (error) {
    console.error('Error initializing Google AI:', error);
    throw error;
  }
}

// Call initialization
initializeAI().catch(console.error);

async function getUserContext(userId) {
  try {
    // Get user information with enrolled courses
    const user = await User.findById(userId)
      .select('fullName email koreanLevel enrolledCourses')
      .populate({
        path: 'enrolledCourses',
        select: 'title level price description category duration',
        populate: {
          path: 'instructor',
          select: 'fullName'
        }
      });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's classes and progress
    const userClasses = await Class.find({
      students: userId,
      status: 'active'
    })
    .select('name course progress assignments')
    .populate('course', 'title');

    // Get vocabulary relevant to user's level
    const vocabulary = await ThematicVocabulary.find({
      level: user.koreanLevel.toLowerCase()
    })
    .select('theme words')
    .limit(5);

    // Format courses info
    const coursesInfo = user.enrolledCourses.map(course => ({
      name: course.title,
      level: course.level,
      price: course.price,
      duration: course.duration,
      category: course.category,
      instructor: course.instructor.fullName
    }));

    // Format vocabulary info
    const vocabularyInfo = vocabulary.map(topic => ({
      theme: topic.theme,
      words: topic.words.map(word => ({
        korean: word.korean,
        meaning: word.meaning,
        pronunciation: word.pronunciation
      }))
    }));

    return {
      name: user.fullName,
      email: user.email,
      level: user.koreanLevel,
      courses: coursesInfo,
      classes: userClasses.map(c => ({
        name: c.name,
        courseName: c.course.title,
        progress: c.calculateProgress(),
        assignmentsCount: c.assignments.length
      })),
      vocabulary: vocabularyInfo
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

async function getGeminiResponse(message, context) {
  try {
    if (!genAI) {
      await initializeAI();
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `
        Bạn là trợ giảng tiếng Hàn thông minh và thân thiện. Hãy sử dụng thông tin sau để trả lời:

        THÔNG TIN HỌC VIÊN:
        - Họ tên: ${context.name}
        - Email: ${context.email}
        - Trình độ: ${context.level}
        
        KHÓA HỌC ĐANG THEO (${context.courses.length} khóa):
        ${context.courses.map(c => `
        - ${c.name}
          + Cấp độ: ${c.level}
          + Giá: ${c.price.toLocaleString('vi-VN')}đ
          + Thời lượng: ${c.duration}
          + Giảng viên: ${c.instructor}
        `).join('\n')}

        LỚP HỌC HIỆN TẠI:
        ${context.classes.map(c => `
        - ${c.name} (${c.courseName})
          + Tiến độ: ${c.progress}%
          + Số bài tập: ${c.assignmentsCount}
        `).join('\n')}

        TỪ VỰNG THEO TRÌNH ĐỘ:
        ${context.vocabulary.map(topic => `
        Chủ đề: ${topic.theme}
        ${topic.words.map(w => `- ${w.korean} (${w.pronunciation}): ${w.meaning}`).join('\n')}
        `).join('\n')}

        Câu hỏi của học viên: ${message}

        Hãy trả lời bằng tiếng Việt một cách ngắn gọn, dễ hiểu và thân thiện. 
        Nếu câu hỏi liên quan đến từ vựng hoặc bài học, hãy sử dụng các ví dụ từ dữ liệu trên.
      `
    });

    return response.text;
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.';
  }
}

const chatbotController = {
  handleMessage: async (req, res) => {
    try {
      if (!genAI) {
        return res.status(503).json({
          success: false,
          message: 'AI service is initializing. Please try again in a moment.'
        });
      }

      const { message } = req.body;
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      const userId = req.user._id;
      const userContext = await getUserContext(userId);

      if (!userContext) {
        return res.status(404).json({
          success: false,
          message: 'User context not found'
        });
      }

      const aiResponse = await getGeminiResponse(message, userContext);

      const chatMessage = new ChatMessage({
        userId,
        message,
        response: aiResponse,
        context: {
          courseId: req.body.courseId || null,
          assignmentId: req.body.assignmentId || null
        }
      });
      await chatMessage.save();

      res.json({ 
        success: true, 
        response: aiResponse,
        userContext
      });

    } catch (error) {
      console.error('Chatbot error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  getHistory: async (req, res) => {
    try {
      const history = await ChatMessage.find({ 
        userId: req.user._id 
      })
      .sort({ timestamp: -1 })
      .limit(10);
      
      res.json({ success: true, history });
    } catch (error) {
      console.error('History error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error loading chat history' 
      });
    }
  }
};

module.exports = chatbotController;