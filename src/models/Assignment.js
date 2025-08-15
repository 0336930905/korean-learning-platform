const mongoose = require('mongoose');

// First check if the model exists
if (mongoose.models.Assignment) {
    module.exports = mongoose.models.Assignment;
} else {
    const assignmentSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true
        },
        description: String,
        dueDate: {
            type: Date,
            required: true
        },
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
            required: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        maxScore: {
            type: Number,
            default: 10
        },
        status: {
            type: String,
            enum: ['active', 'expired'],
            default: 'active'
        },
        submissionStats: {
            totalSubmissions: { type: Number, default: 0 },
            gradedSubmissions: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 }
        },
        attachmentFile: {
            fileName: String,
            originalName: String,
            mimeType: String,
            size: Number,
            path: String
        }
    });

    // Virtual for checking if assignment is overdue
    assignmentSchema.virtual('isOverdue').get(function() {
        return new Date() > this.dueDate;
    });

    // Add these virtual fields
    assignmentSchema.virtual('submissionCount').get(function() {
        return this.submissionStats.totalSubmissions || 0;
    });

    assignmentSchema.virtual('gradedCount').get(function() {
        return this.submissionStats.gradedSubmissions || 0;
    });

    // Enable virtuals in toJSON
    assignmentSchema.set('toJSON', { virtuals: true });
    assignmentSchema.set('toObject', { virtuals: true });

    // Define updateStats as a static method
    assignmentSchema.statics.updateStats = async function(assignmentId) {
        try {
            const Submission = mongoose.model('Submission');
            
            // Get all submissions for this assignment
            const submissions = await Submission.find({ assignment: assignmentId });
            const gradedSubmissions = submissions.filter(s => s.status === 'graded');
            
            // Calculate stats
            const stats = {
                totalSubmissions: submissions.length,
                gradedSubmissions: gradedSubmissions.length,
                averageScore: 0
            };

            // Calculate average score if there are graded submissions
            if (gradedSubmissions.length > 0) {
                const totalScore = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade.score || 0), 0);
                stats.averageScore = totalScore / gradedSubmissions.length;
            }

            // Update assignment stats
            await this.findByIdAndUpdate(assignmentId, {
                $set: { submissionStats: stats }
            });

            return stats;
        } catch (error) {
            console.error('Error updating assignment stats:', error);
            throw error;
        }
    };

    module.exports = mongoose.model('Assignment', assignmentSchema);
}
