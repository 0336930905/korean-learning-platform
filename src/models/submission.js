const mongoose = require('mongoose');
const Assignment = require('./Assignment');

const submissionSchema = new mongoose.Schema({
    assignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'graded', 'late'],
        default: 'pending'
    },
    grade: {
        score: {
            type: Number,
            min: 0,
            max: 10
        },
        percentage: {
            type: Number,
            min: 0,
            max: 100
        },
        feedback: String,
        gradedAt: Date,
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    attempts: {
        type: Number,
        default: 1
    },
    isLate: {
        type: Boolean,
        default: false
    }
});

// Calculate percentage when setting score
submissionSchema.pre('save', async function(next) {
    if (this.isModified('grade.score')) {
        const Assignment = mongoose.model('Assignment');
        const assignment = await Assignment.findById(this.assignment);
        
        if (assignment) {
            this.grade.percentage = (this.grade.score / assignment.maxScore) * 100;
            
            // Update submission status
            this.status = 'graded';
        }
    }

    // Check if submission is late
    if (this.isNew) {
        const Assignment = mongoose.model('Assignment');
        const assignment = await Assignment.findById(this.assignment);
        if (assignment && new Date() > assignment.dueDate) {
            this.isLate = true;
            this.status = 'late';
            
            // Add warning but allow save (route-level prevention is primary)
            console.warn(`Warning: Late submission attempted for assignment ${this.assignment}`);
        }
    }

    next();
});

// Update post save middleware
submissionSchema.post('save', async function(doc) {
    try {
        // Use the static method from Assignment model
        await Assignment.updateStats(doc.assignment);
    } catch (error) {
        console.error('Error updating assignment stats:', error);
    }
});

// Add post update middleware
submissionSchema.post('findOneAndUpdate', async function(doc) {
    if (doc) {
        try {
            await Assignment.updateStats(doc.assignment);
        } catch (error) {
            console.error('Error updating assignment stats after update:', error);
        }
    }
});

// Static method to check if assignment is still accepting submissions
submissionSchema.statics.canSubmitAssignment = async function(assignmentId) {
    const Assignment = mongoose.model('Assignment');
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
        return { canSubmit: false, reason: 'Assignment not found' };
    }
    
    const currentTime = new Date();
    if (currentTime > assignment.dueDate) {
        return { 
            canSubmit: false, 
            reason: 'Assignment is past due date',
            dueDate: assignment.dueDate 
        };
    }
    
    return { canSubmit: true };
};

// Static method to check if student already submitted
submissionSchema.statics.hasStudentSubmitted = async function(assignmentId, studentId) {
    const submission = await this.findOne({
        assignment: assignmentId,
        student: studentId
    });
    
    return !!submission;
};

module.exports = mongoose.model('Submission', submissionSchema);