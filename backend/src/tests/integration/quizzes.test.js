const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Course = require('../../src/models/Course');
const Quiz = require('../../src/models/Quiz');
const UserProgress = require('../../src/models/UserProgress');

describe('Quiz Endpoints', () => {
  let instructor, student, instructorToken, studentToken, course, quiz;

  beforeEach(async () => {
    // Create instructor
    instructor = await User.create({
      name: 'Instructor',
      email: 'instructor@example.com',
      password: 'Password123',
      role: 'instructor'
    });
    instructorToken = instructor.generateAuthToken();

    // Create student
    student = await User.create({
      name: 'Student',
      email: 'student@example.com',
      password: 'Password123',
      role: 'student'
    });
    studentToken = student.generateAuthToken();

    // Create course
    course = await Course.create({
      title: 'Test Course',
      description: 'Test course description',
      subject: 'Programming',
      level: 'beginner',
      instructor: instructor._id,
      lessons: [
        {
          title: 'Lesson 1',
          content: 'Lesson 1 content',
          duration: 30,
          order: 1
        }
      ],
      isPublished: true
    });

    // Create user progress for student
    const userProgress = await UserProgress.create({ user: student._id });
    await userProgress.updateCourseProgress(course._id, {
      status: 'enrolled',
      enrolledAt: new Date()
    });

    // Create quiz
    quiz = await Quiz.create({
      title: 'Test Quiz',
      description: 'Test quiz description',
      course: course._id,
      instructor: instructor._id,
      questions: [
        {
          question: 'What is 2 + 2?',
          type: 'multiple-choice',
          options: [
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false }
          ],
          difficulty: 'easy',
          points: 1
        }
      ],
      timeLimit: 10,
      passingScore: 70,
      isPublished: true
    });
  });

  describe('GET /api/quizzes', () => {
    it('should get all published quizzes for enrolled student', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.quizzes).toHaveLength(1);
      expect(res.body.data.quizzes[0].title).toBe(quiz.title);
      
      // Should not contain correct answers
      expect(res.body.data.quizzes[0].questions).toBeUndefined();
    });

    it('should filter quizzes by course', async () => {
      const res = await request(app)
        .get(`/api/quizzes?course=${course._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.quizzes).toHaveLength(1);
    });
  });

  describe('GET /api/quizzes/:id', () => {
    it('should get quiz details for enrolled student', async () => {
      const res = await request(app)
        .get(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.quiz.title).toBe(quiz.title);
      expect(res.body.data.remainingAttempts).toBe(quiz.attempts.allowed);
      
      // Should not show correct answers for new attempt
      expect(res.body.data.quiz.questions[0].options).toHaveLength(3);
      expect(res.body.data.quiz.questions[0].options[0].isCorrect).toBeUndefined();
    });

    it('should not allow non-enrolled student to access quiz', async () => {
      // Create another student
      const otherStudent = await User.create({
        name: 'Other Student',
        email: 'other@example.com',
        password: 'Password123',
        role: 'student'
      });
      const otherToken = otherStudent.generateAuthToken();

      const res = await request(app)
        .get(`/api/quizzes/${quiz._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('enrolled');
    });
  });

  describe('POST /api/quizzes', () => {
    const validQuiz = {
      title: 'New Quiz',
      description: 'New quiz description',
      course: null, // Will be set in test
      questions: [
        {
          question: 'What is JavaScript?',
          type: 'multiple-choice',
          options: [
            { text: 'A coffee type', isCorrect: false },
            { text: 'A programming language', isCorrect: true },
            { text: 'A markup language', isCorrect: false }
          ],
          difficulty: 'medium',
          points: 2
        }
      ],
      timeLimit: 15,
      passingScore: 80
    };

    it('should create quiz as instructor', async () => {
      validQuiz.course = course._id;

      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(validQuiz)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.quiz.title).toBe(validQuiz.title);
      expect(res.body.data.quiz.questions).toHaveLength(1);
      expect(res.body.data.quiz.totalPoints).toBe(2);

      // Verify in database
      const savedQuiz = await Quiz.findById(res.body.data.quiz._id);
      expect(savedQuiz).toBeTruthy();
    });

    it('should not create quiz as student', async () => {
      validQuiz.course = course._id;

      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validQuiz)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should not create quiz for non-owned course', async () => {
      // Create another instructor and course
      const otherInstructor = await User.create({
        name: 'Other Instructor',
        email: 'other.instructor@example.com',
        password: 'Password123',
        role: 'instructor'
      });

      const otherCourse = await Course.create({
        title: 'Other Course',
        description: 'Other course description',
        subject: 'Science',
        level: 'intermediate',
        instructor: otherInstructor._id,
        lessons: [{ title: 'Lesson', content: 'Content', duration: 30, order: 1 }]
      });

      validQuiz.course = otherCourse._id;

      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send(validQuiz)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('authorized');
    });
  });

  describe('POST /api/quizzes/:id/attempt', () => {
    it('should submit quiz attempt successfully', async () => {
      const answers = ['4']; // Correct answer

      const res = await request(app)
        .post(`/api/quizzes/${quiz._id}/attempt`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers,
          timeSpent: 5
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.attempt.score.percentage).toBe(100);
      expect(res.body.data.passed).toBe(true);
      expect(res.body.data.correctAnswers).toBeDefined();

      // Verify attempt was saved
      const userProgress = await UserProgress.findOne({ user: student._id });
      expect(userProgress.overallStats.totalQuizzesTaken).toBe(1);
    });

    it('should handle incorrect answers', async () => {
      const answers = ['3']; // Incorrect answer

      const res = await request(app)
        .post(`/api/quizzes/${quiz._id}/attempt`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers,
          timeSpent: 3
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.attempt.score.percentage).toBe(0);
      expect(res.body.data.passed).toBe(false);
    });

    it('should enforce attempt limits', async () => {
      // Submit maximum allowed attempts
      const answers = ['4'];
      
      for (let i = 0; i < quiz.attempts.allowed; i++) {
        await request(app)
          .post(`/api/quizzes/${quiz._id}/attempt`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ answers })
          .expect(200);
      }

      // Try one more attempt
      const res = await request(app)
        .post(`/api/quizzes/${quiz._id}/attempt`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Maximum attempts exceeded');
    });
  });

  describe('GET /api/quizzes/:id/attempts', () => {
    it('should get user quiz attempts', async () => {
      // Submit an attempt first
      await request(app)
        .post(`/api/quizzes/${quiz._id}/attempt`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: ['4'] });

      const res = await request(app)
        .get(`/api/quizzes/${quiz._id}/attempts`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.attempts).toHaveLength(1);
      expect(res.body.data.attempts[0].status).toBe('completed');
    });
  });

  describe('GET /api/quizzes/:id/results', () => {
    it('should get quiz results after attempts', async () => {
      // Submit attempts
      await request(app)
        .post(`/api/quizzes/${quiz._id}/attempt`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: ['4'] }); // Correct

      await request(app)
        .post(`/api/quizzes/${quiz._id}/attempt`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: ['3'] }); // Incorrect

      const res = await request(app)
        .get(`/api/quizzes/${quiz._id}/results`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.attempts).toHaveLength(2);
      expect(res.body.data.stats.totalAttempts).toBe(2);
      expect(res.body.data.stats.bestScore).toBe(100);
      expect(res.body.data.stats.passed).toBe(true);
    });
  });
});
