const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    description: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // New field for join requests
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    schedule: {
        days: [String],
        time: String
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    maxStudents: { type: Number, required: true },
    classImage: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }] // Add this field for assignments
});

classSchema.methods.canCreateAssignment = function() {
    const now = new Date();
    return this.status === 'active' && now >= this.startDate && now <= this.endDate;
};

// Add calculateProgress method to the schema
classSchema.methods.calculateProgress = function() {
    const now = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = Math.round((elapsed / totalDuration) * 100);
    
    return Math.min(Math.max(progress, 0), 100);
};

// Add middleware to populate assignments when a new assignment is created
classSchema.post('save', function(doc, next) {
    doc.populate('assignments').then(function() {
        next();
    });
});

module.exports = mongoose.model('Class', classSchema);