// =============================================
// FRONTEND JAVASCRIPT CHO ACCOUNT MANAGEMENT
// Dành cho chức năng Lock/Unlock và Password Management
// =============================================

// Global variables
let isProcessing = false;

// Utility function - Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 mb-2 transform transition-all duration-300 translate-x-full`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span class="flex-1">${message}</span>
        <button onclick="this.parentElement.remove()" class="text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Utility function - Show loading overlay
function showLoading(show = true) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.toggle('hidden', !show);
    }
}

// =============================================
// BLOCK REASON MODAL FUNCTIONALITY
// =============================================

// Show block reason modal
function showBlockReasonModal(userId) {
    return new Promise((resolve) => {
        // Remove existing modal if any
        const existingModal = document.getElementById('blockReasonModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Get user info from table row data attributes
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        
        let userName = 'Unknown';
        let userEmail = 'Unknown';
        
        if (userRow) {
            userName = userRow.getAttribute('data-user-name') || userRow.dataset.userName || 'Unknown';
            userEmail = userRow.getAttribute('data-user-email') || userRow.dataset.userEmail || 'Unknown';
            
            // Fallback: try to get from DOM elements if data attributes don't work
            if (userName === 'Unknown') {
                const nameElement = userRow.querySelector('.text-sm.font-semibold.text-gray-900');
                if (nameElement) {
                    userName = nameElement.textContent.trim();
                }
            }
            
            if (userEmail === 'Unknown') {
                const emailCell = userRow.querySelector('td:nth-child(2) .text-sm.text-gray-900'); // Email column
                if (emailCell) {
                    userEmail = emailCell.textContent.trim();
                }
            }
        }
        
        console.log('Block reason modal - User info:', { userId, userName, userEmail }); // Debug
        
        const modalHTML = `
        <div id="blockReasonModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-fade-in">
                <div class="text-center mb-4">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <i class="fas fa-lock text-red-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Khóa Tài Khoản</h3>
                    <p class="text-sm text-gray-500">Vui lòng nhập lý do khóa tài khoản</p>
                </div>
                
                <div class="mb-4">
                    <div class="bg-gray-50 rounded-lg p-3 mb-4">
                        <p class="text-sm"><strong>Tên:</strong> ${userName}</p>
                        <p class="text-sm"><strong>Email:</strong> ${userEmail}</p>
                    </div>
                    
                    <label class="block text-sm font-medium text-gray-700 mb-2">Lý do khóa tài khoản:</label>
                    <textarea 
                        id="blockReasonInput" 
                        placeholder="Nhập lý do khóa tài khoản..."
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows="3"
                        maxlength="500"
                    ></textarea>
                    <div class="text-xs text-gray-500 mt-1">
                        <span id="charCount">0</span>/500 ký tự
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button type="button" 
                            onclick="confirmBlockUser()" 
                            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                        <i class="fas fa-lock mr-2"></i>Khóa Tài Khoản
                    </button>
                    <button type="button" 
                            onclick="cancelBlockUser()" 
                            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
                        Hủy Bỏ
                    </button>
                </div>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Auto-focus on textarea
        setTimeout(() => {
            const textarea = document.getElementById('blockReasonInput');
            if (textarea) {
                textarea.focus();
                
                // Add character counter
                textarea.addEventListener('input', function() {
                    const charCount = document.getElementById('charCount');
                    if (charCount) {
                        charCount.textContent = this.value.length;
                    }
                });
            }
        }, 100);
        
        // Store resolve function globally for button handlers
        window.blockReasonResolve = resolve;
    });
}

// Confirm block user
window.confirmBlockUser = function() {
    const textarea = document.getElementById('blockReasonInput');
    const reason = textarea ? textarea.value.trim() : '';
    
    if (!reason) {
        showToast('Vui lòng nhập lý do khóa tài khoản', 'warning');
        return;
    }
    
    closeBlockReasonModal();
    if (window.blockReasonResolve) {
        window.blockReasonResolve(reason);
    }
};

// Cancel block user
window.cancelBlockUser = function() {
    closeBlockReasonModal();
    if (window.blockReasonResolve) {
        window.blockReasonResolve(null);
    }
};

// Close block reason modal
function closeBlockReasonModal() {
    const modal = document.getElementById('blockReasonModal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.remove();
        }, 200);
    }
    
    // Clean up
    window.blockReasonResolve = null;
}

// =============================================
// LOCK/UNLOCK USER ACCOUNT FUNCTIONALITY
// =============================================

// Toggle user status - Enhanced với modal để nhập lý do khóa
window.toggleUserStatus = async function(userId) {
    if (isProcessing) {
        showToast('Đang xử lý yêu cầu trước đó, vui lòng chờ...', 'warning');
        return;
    }

    try {
        isProcessing = true;
        
        // Get user info for confirmation
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (!userRow) {
            throw new Error('Không tìm thấy thông tin người dùng');
        }
        
        const userNameElement = userRow.querySelector('.user-name');
        const userEmailElement = userRow.querySelector('.user-email');
        const statusBadge = userRow.querySelector('.status-badge');
        
        const userName = userNameElement ? userNameElement.textContent.trim() : 'Unknown';
        const userEmail = userEmailElement ? userEmailElement.textContent.trim() : 'Unknown';
        const isCurrentlyActive = statusBadge ? statusBadge.textContent.includes('Hoạt động') : false;
        
        let blockReason = '';
        
        // Nếu đang khóa tài khoản (từ active -> inactive), hiển thị modal
        if (isCurrentlyActive) {
            blockReason = await showBlockReasonModal(userId);
            if (blockReason === null) {
                // User cancelled
                return;
            }
        }
        
        // Show loading state
        showLoading(true);
        const toggleButton = userRow.querySelector(`button[onclick*="${userId}"]`);
        if (toggleButton) {
            toggleButton.disabled = true;
            toggleButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        // Make API call
        const response = await fetch(`/account-management/toggle-status/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
            body: JSON.stringify({ blockReason })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Có lỗi xảy ra khi thay đổi trạng thái tài khoản');
        }

        // Update UI with response data
        updateUserStatusUI(userId, data.data);
        
        // Show success message
        showToast(data.message, 'success');
        
        // Log action
        console.log('User status toggled:', data.data);

    } catch (error) {
        console.error('Toggle status error:', error);
        showToast(error.message || 'Có lỗi xảy ra khi thay đổi trạng thái tài khoản', 'error');
    } finally {
        isProcessing = false;
        showLoading(false);
        
        // Reset button state
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        const toggleButton = userRow?.querySelector(`button[onclick*="${userId}"]`);
        if (toggleButton) {
            toggleButton.disabled = false;
            const iconClass = toggleButton.getAttribute('data-icon-class') || 'fa-lock';
            toggleButton.innerHTML = `<i class="fas ${iconClass}"></i>`;
        }
    }
};

// Update user status in UI
function updateUserStatusUI(userId, data) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!row) return;

    // Update status badge
    const statusBadge = row.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.className = `status-badge px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${data.statusClass}`;
        statusBadge.textContent = data.statusBadge;
    }

    // Update toggle button
    const toggleButton = row.querySelector(`button[onclick*="${userId}"]`);
    if (toggleButton) {
        const icon = toggleButton.querySelector('i');
        if (icon) {
            icon.className = `fas ${data.iconClass}`;
        }
        toggleButton.setAttribute('data-icon-class', data.iconClass);
        toggleButton.title = data.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
    }

    // Update profile image indicator
    const statusIndicator = row.querySelector('.status-indicator');
    if (statusIndicator) {
        statusIndicator.className = `status-indicator ${data.isActive ? 'status-active' : 'status-inactive'}`;
    }

    // Add visual feedback
    row.classList.add('animate-pulse');
    setTimeout(() => {
        row.classList.remove('animate-pulse');
    }, 1000);
}

// =============================================
// PASSWORD MANAGEMENT FUNCTIONALITY
// =============================================

// Reset password - Enhanced với modal display
window.resetPassword = async function(userId) {
    if (isProcessing) {
        showToast('Đang xử lý yêu cầu trước đó, vui lòng chờ...', 'warning');
        return;
    }

    try {
        // Get user info for confirmation
        const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
        if (!userRow) {
            throw new Error('Không tìm thấy thông tin người dùng');
        }
        
        const userNameElement = userRow.querySelector('.user-name');
        const userEmailElement = userRow.querySelector('.user-email');
        
        const userName = userNameElement ? userNameElement.textContent.trim() : 'Unknown';
        const userEmail = userEmailElement ? userEmailElement.textContent.trim() : 'Unknown';
        
        isProcessing = true;
        showLoading(true);

        // Make API call
        const response = await fetch(`/account-management/reset-password/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Có lỗi xảy ra khi đặt lại mật khẩu');
        }

        // Show password modal
        showPasswordModal(data.data);
        
        // Show success message
        showToast(data.message, 'success');

    } catch (error) {
        console.error('Reset password error:', error);
        showToast(error.message || 'Có lỗi xảy ra khi đặt lại mật khẩu', 'error');
    } finally {
        isProcessing = false;
        showLoading(false);
    }
};

// Show password modal - Enhanced với copy functionality
function showPasswordModal(data) {
    // Remove existing modal if any
    const existingModal = document.getElementById('newPasswordModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
    <div id="newPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 animate-fade-in">
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <i class="fas fa-key text-green-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-4">${data.modalTitle}</h3>
                <p class="text-sm text-gray-500 mb-4">${data.modalMessage}</p>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới:</label>
                    <div class="flex items-center space-x-2">
                        <input type="text" id="newPasswordInput" 
                               value="${data.newPassword}" 
                               readonly 
                               class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm">
                        <button type="button" 
                                onclick="copyPassword()" 
                                class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="text-xs text-gray-500 mb-4">
                    <p><strong>Người dùng:</strong> ${data.userName} (${data.userEmail})</p>
                    <p><strong>Đặt lại bởi:</strong> ${data.resetBy}</p>
                    <p><strong>Thời gian:</strong> ${new Date(data.resetAt).toLocaleString('vi-VN')}</p>
                </div>
                
                <div class="flex space-x-3">
                    <button type="button" 
                            onclick="copyPassword()" 
                            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        <i class="fas fa-copy mr-2"></i>Sao chép
                    </button>
                    <button type="button" 
                            onclick="closePasswordModal()" 
                            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Auto-focus on password input
    setTimeout(() => {
        const passwordInput = document.getElementById('newPasswordInput');
        if (passwordInput) {
            passwordInput.select();
        }
    }, 100);
}

// Copy password to clipboard
function copyPassword() {
    const passwordInput = document.getElementById('newPasswordInput');
    if (!passwordInput) return;
    
    passwordInput.select();
    passwordInput.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('Đã sao chép mật khẩu vào clipboard', 'success');
            
            // Visual feedback
            const copyButton = document.querySelector('#newPasswordModal button[onclick="copyPassword()"]');
            if (copyButton) {
                const originalHTML = copyButton.innerHTML;
                copyButton.innerHTML = '<i class="fas fa-check mr-2"></i>Đã sao chép';
                copyButton.classList.add('bg-green-600', 'hover:bg-green-700');
                copyButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                
                setTimeout(() => {
                    copyButton.innerHTML = originalHTML;
                    copyButton.classList.remove('bg-green-600', 'hover:bg-green-700');
                    copyButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
                }, 2000);
            }
        } else {
            throw new Error('Không thể sao chép');
        }
    } catch (err) {
        console.error('Copy failed:', err);
        showToast('Không thể sao chép tự động. Vui lòng sao chép thủ công.', 'warning');
    }
}

// Close password modal
function closePasswordModal() {
    const modal = document.getElementById('newPasswordModal');
    if (modal) {
        modal.classList.add('animate-fade-out');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Change password modal (if needed in future)
window.openChangePasswordModal = function(userId) {
    showToast('Chức năng đổi mật khẩu đang được phát triển', 'info');
    // TODO: Implement change password modal
};

// =============================================
// OTHER UTILITY FUNCTIONS
// =============================================

// More actions toggle
window.toggleMoreActions = function(userId) {
    const menu = document.getElementById(`moreActions-${userId}`);
    const allMenus = document.querySelectorAll('[id^="moreActions-"]');
    
    // Close all other menus
    allMenus.forEach(m => {
        if (m.id !== `moreActions-${userId}`) {
            m.classList.add('hidden');
        }
    });
    
    // Toggle current menu
    menu.classList.toggle('hidden');
};

// Placeholder functions for other actions
window.sendMessage = function(userId) {
    showToast('Chức năng gửi tin nhắn đang được phát triển', 'info');
};

window.viewLoginHistory = function(userId) {
    showToast('Chức năng xem lịch sử đăng nhập đang được phát triển', 'info');
};

window.exportUserData = async function(userId) {
    try {
        showToast('Đang xuất dữ liệu...', 'info');
        // TODO: Implement export functionality
        setTimeout(() => {
            showToast('Đã xuất dữ liệu thành công', 'success');
        }, 1000);
    } catch (error) {
        showToast('Có lỗi xảy ra khi xuất dữ liệu', 'error');
    }
};

window.deleteUser = async function(userId) {
    try {
        showToast('Chức năng xóa tài khoản đang được phát triển', 'info');
        // TODO: Implement delete functionality
    } catch (error) {
        showToast('Có lỗi xảy ra khi xóa tài khoản', 'error');
    }
};

// Close dropdown menus when clicking outside
document.addEventListener('click', function(event) {
    const dropdownMenus = document.querySelectorAll('[id^="moreActions-"]');
    dropdownMenus.forEach(menu => {
        if (!menu.contains(event.target) && !event.target.closest(`[onclick*="toggleMoreActions"]`)) {
            menu.classList.add('hidden');
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // ESC to close modals
    if (event.key === 'Escape') {
        // Close password modal
        const passwordModal = document.getElementById('newPasswordModal');
        if (passwordModal) {
            closePasswordModal();
            return;
        }
        
        // Close block reason modal
        const blockModal = document.getElementById('blockReasonModal');
        if (blockModal) {
            cancelBlockUser();
            return;
        }
    }
    
    // Enter in block reason modal to confirm (Ctrl+Enter)
    if (event.key === 'Enter' && event.ctrlKey) {
        const blockModal = document.getElementById('blockReasonModal');
        if (blockModal) {
            confirmBlockUser();
            return;
        }
    }
    
    // Ctrl+C in password modal to copy
    if (event.ctrlKey && event.key === 'c' && document.getElementById('newPasswordModal')) {
        event.preventDefault();
        copyPassword();
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Account Management JavaScript loaded successfully');
    
    // Add loading states to buttons
    const actionButtons = document.querySelectorAll('button[onclick*="toggleUserStatus"], button[onclick*="resetPassword"]');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!button.disabled) {
                const originalHTML = button.innerHTML;
                button.setAttribute('data-original-html', originalHTML);
            }
        });
    });
});
