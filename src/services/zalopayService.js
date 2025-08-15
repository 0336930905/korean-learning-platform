const axios = require('axios');
const CryptoJS = require('crypto-js');
const moment = require('moment');

const config = {
    app_id: "2553",
    key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
    key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
    endpoint: "https://sb-openapi.zalopay.vn/v2/create"
};

const createPayment = async (orderData) => {
    try {
        const { amount, orderId, userId, redirectUrl } = orderData;
        const transID = Math.floor(Math.random() * 1000000);
        
        // Tạo embed_data với thông tin để xử lý callback
        const embed_data = JSON.stringify({
            redirectUrl: redirectUrl,
            orderId: orderId,
            merchantId: userId
        });

        const order = {
            app_id: config.app_id,
            app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
            app_user: userId,
            app_time: Date.now(),
            item: JSON.stringify([{}]),
            embed_data: embed_data,
            amount: amount,
            description: `Thanh toán khóa học #${orderId}`,
            bank_code: "zalopayapp",
            callback_url: redirectUrl // Thêm callback_url
        };

        // Create mac signature
        const data = config.app_id + "|" + order.app_trans_id + "|" + 
                    order.app_user + "|" + order.amount + "|" + 
                    order.app_time + "|" + order.embed_data + "|" + order.item;
        order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

        const response = await axios.post(config.endpoint, null, { params: order });
        return response.data;
    } catch (error) {
        console.error('ZaloPay API Error:', error);
        throw new Error('Lỗi khi tạo giao dịch với ZaloPay');
    }
};

module.exports = { createPayment };