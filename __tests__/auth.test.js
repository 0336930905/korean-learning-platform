const request = require('supertest');
const app = require('../app');
const User = require('../src/models/User');
const mongoose = require('mongoose');

describe('Authentication Tests', () => {
    beforeAll(async () => {
        // Kết nối database test
        await mongoose.connect(process.env.MONGODB_URI_TEST);
    });

    afterAll(async () => {
        // Đóng kết nối database
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        // Xóa dữ liệu test cũ
        await User.deleteMany({});
    });

    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    fullName: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBeTruthy();
        });
    });

    describe('POST /auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            // Tạo user test
            const user = new User({
                fullName: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });
            await user.save();

            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBeTruthy();
        });
    });

    describe('POST /auth/forgot-password', () => {
        it('should send reset password email successfully', async () => {
            const user = await User.create({
                fullName: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });

            const res = await request(app)
                .post('/auth/forgot-password')
                .send({ email: user.email });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBeTruthy();
        });
    });

    describe('POST /auth/reset-password', () => {
        it('should reset password successfully with valid token', async () => {
            const user = await User.create({
                fullName: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                resetPasswordToken: 'valid-token',
                resetPasswordExpires: Date.now() + 3600000
            });

            const res = await request(app)
                .post('/auth/reset-password')
                .send({
                    token: 'valid-token',
                    password: 'newpassword123'
                });
            
            expect(res.status).toBe(200);
            expect(res.body.success).toBeTruthy();
        });
    });
});