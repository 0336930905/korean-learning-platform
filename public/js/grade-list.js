// Grade List Functions for Teacher
function printGradeTable() {
    console.log('printGradeTable called');
    // Check if there's data to print
    const selectedClass = document.querySelector('[data-selected-class="true"]');
    if (selectedClass) {
        window.print();
    } else {
        showNotification('Vui lòng chọn lớp học trước khi in!', 'error');
    }
}

function exportToExcel() {
    console.log('exportToExcel called');
    
    // Get current class ID from URL or form
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get('classId');
    
    if (!classId) {
        showNotification('Vui lòng chọn lớp học trước khi xuất Excel!', 'error');
        return;
    }
    
    // Check if there's data to export
    const gradeTable = document.querySelector('table');
    if (!gradeTable) {
        showNotification('Không tìm thấy dữ liệu để xuất!', 'error');
        return;
    }
    
    showNotification('Đang chuẩn bị file Excel...', 'info');
    
    try {
        // Call backend API to export Excel with teacher info
        const exportUrl = `/teacher/grade-list/export?classId=${classId}&format=excel`;
        
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = exportUrl;
        link.download = `BangDiem_${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Đã xuất file Excel thành công!', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Có lỗi xảy ra khi xuất file Excel!', 'error');
    }
}

function refreshData() {
    showNotification('Đang làm mới dữ liệu...', 'info');
    window.location.reload();
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300';
    
    if (type === 'success') {
        notification.classList.add('bg-green-500', 'text-white');
        notification.innerHTML = '<i class="fas fa-check-circle mr-2"></i>' + message;
    } else if (type === 'error') {
        notification.classList.add('bg-red-500', 'text-white');
        notification.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>' + message;
    } else if (type === 'info') {
        notification.classList.add('bg-blue-500', 'text-white');
        notification.innerHTML = '<i class="fas fa-info-circle mr-2"></i>' + message;
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Class selector functions
let selectedClassId = '';

function updateSelectedClass(classId) {
    selectedClassId = classId;
    const loadBtn = document.getElementById('loadClassBtn');
    
    if (classId) {
        loadBtn.disabled = false;
        loadBtn.classList.remove('disabled:from-gray-400', 'disabled:to-gray-500', 'disabled:cursor-not-allowed');
        loadBtn.classList.add('from-indigo-500', 'to-purple-600', 'hover:from-indigo-600', 'hover:to-purple-700');
    } else {
        loadBtn.disabled = true;
        loadBtn.classList.add('disabled:from-gray-400', 'disabled:to-gray-500', 'disabled:cursor-not-allowed');
        loadBtn.classList.remove('from-indigo-500', 'to-purple-600', 'hover:from-indigo-600', 'hover:to-purple-700');
    }
}

function handleLoadClass() {
    if (selectedClassId && selectedClassId !== '') {
        showNotification('Đang tải dữ liệu lớp học...', 'info');
        
        // Show loading state
        const loadBtn = document.getElementById('loadClassBtn');
        const originalText = loadBtn.innerHTML;
        loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tải...';
        loadBtn.disabled = true;
        
        // Navigate to class
        setTimeout(() => {
            window.location.href = '/teacher/grade-list?classId=' + selectedClassId;
        }, 500);
    } else {
        showNotification('Vui lòng chọn lớp học trước!', 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const classSelector = document.getElementById('classSelector');
    if (classSelector) {
        updateSelectedClass(classSelector.value);
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl + P for print
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            printGradeTable();
        }
        
        // Ctrl + E for export
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportToExcel();
        }
        
        // F5 for refresh
        if (e.key === 'F5') {
            e.preventDefault();
            refreshData();
        }
    });
});
