const mongoose = require('mongoose');
const ThematicVocabulary = require('../models/ThematicVocabulary');

const MONGODB_URI = 'mongodb://localhost:27017/Korea_DB';
const DEMO_USER_ID = '65f7e9d44c1d7b9b3c000001'; // Replace with actual user ID

const demoData = [
    {
        theme: 'Gia đình (Family)',
        level: 'basic',
        imageUrl: '',
        words: [
            {
                korean: '가족',
                meaning: 'Gia đình',
                pronunciation: 'Gajok',
                imageUrl: ''
            },
            {
                korean: '어머니',
                meaning: 'Mẹ',
                pronunciation: 'Eomeoni',
                imageUrl: ''
            },
            {
                korean: '아버지',
                meaning: 'Bố',
                pronunciation: 'Abeoji',
                imageUrl: ''
            },
            {
                korean: '누나',
                meaning: 'Chị gái (nam gọi)',
                pronunciation: 'Nuna',
                imageUrl: '.jpg'
            },
            {
                korean: '형',
                meaning: 'Anh trai (nam gọi)',
                pronunciation: 'Hyeong',
                imageUrl: '.jpg'
            },
            {
                korean: '동생',
                meaning: 'Em',
                pronunciation: 'Dongsaeng',
                imageUrl: '.jpg'
            },
            {
                korean: '할아버지',
                meaning: 'Ông',
                pronunciation: 'Harabeoji',
                imageUrl: ''
            },
            {
                korean: '할머니',
                meaning: 'Bà',
                pronunciation: 'Halmeoni',
                imageUrl: ''
            },
            {
                korean: '아들',
                meaning: 'Con trai',
                pronunciation: 'Adeul',
                imageUrl: ''
            },
            {
                korean: '딸',
                meaning: 'Con gái',
                pronunciation: 'Ttal',
                imageUrl: ''
            }
        ],
        createdBy: DEMO_USER_ID
    },
    {
        theme: 'Màu sắc (Colors)',
        level: 'basic',
        imageUrl: '',
        words: [
            {
                korean: '빨간색',
                meaning: 'Màu đỏ',
                pronunciation: 'Ppalgansaek',
                imageUrl: ''
            },
            {
                korean: '파란색',
                meaning: 'Màu xanh dương',
                pronunciation: 'Paransaek',
                imageUrl: ''
            },
            {
                korean: '노란색',
                meaning: 'Màu vàng',
                pronunciation: 'Noransaek',
                imageUrl: ''
            },
            {
                korean: '초록색',
                meaning: 'Màu xanh lá',
                pronunciation: 'Choroksaek',
                imageUrl: ''
            },
            {
                korean: '보라색',
                meaning: 'Màu tím',
                pronunciation: 'Borasaek',
                imageUrl: ''
            },
            {
                korean: '주황색',
                meaning: 'Màu cam',
                pronunciation: 'Juhwangsaek',
                imageUrl: ''
            },
            {
                korean: '갈색',
                meaning: 'Màu nâu',
                pronunciation: 'Galsaek',
                imageUrl: ''
            },
            {
                korean: '검은색',
                meaning: 'Màu đen',
                pronunciation: 'Geomeunsaek',
                imageUrl: ''
            },
            {
                korean: '흰색',
                meaning: 'Màu trắng',
                pronunciation: 'Huinsaek',
                imageUrl: ''
            },
            {
                korean: '회색',
                meaning: 'Màu xám',
                pronunciation: 'Hoesaek',
                imageUrl: ''
            }
        ],
        createdBy: DEMO_USER_ID
    },
    {
        theme: 'Thức ăn (Food)',
        level: 'intermediate',
        imageUrl: '',
        words: [
            {
                korean: '김치',
                meaning: 'Kim chi',
                pronunciation: 'Gimchi',
                imageUrl: ''
            },
            {
                korean: '밥',
                meaning: 'Cơm',
                pronunciation: 'Bap',
                imageUrl: ''
            },
            {
                korean: '국',
                meaning: 'Súp',
                pronunciation: 'Guk',
                imageUrl: ''
            },
            {
                korean: '라면',
                meaning: 'Mì',
                pronunciation: 'Ramyeon',
                imageUrl: ''
            },
            {
                korean: '고기',
                meaning: 'Thịt',
                pronunciation: 'Gogi',
                imageUrl: ''
            },
            {
                korean: '생선',
                meaning: 'Cá',
                pronunciation: 'Saengseon',
                imageUrl: ''
            },
            {
                korean: '과일',
                meaning: 'Trái cây',
                pronunciation: 'Gwail',
                imageUrl: ''
            },
            {
                korean: '야채',
                meaning: 'Rau củ',
                pronunciation: 'Yachae',
                imageUrl: ''
            },
            {
                korean: '떡',
                meaning: 'Bánh gạo',
                pronunciation: 'Tteok',
                imageUrl: '.jpg'
            },
            {
                korean: '김밥',
                meaning: 'Cơm cuộn',
                pronunciation: 'Gimbap',
                imageUrl: ''
            }
        ],
        createdBy: DEMO_USER_ID
    },
    {
        theme: 'Động vật (Animals)',
        level: 'basic',
        imageUrl: '',
        words: [
            {
                korean: '강아지',
                meaning: 'Chó',
                pronunciation: 'Gangaji',
                imageUrl: ''
            },
            {
                korean: '고양이',
                meaning: 'Mèo',
                pronunciation: 'Goyangi',
                imageUrl: ''
            },
            {
                korean: '새',
                meaning: 'Chim',
                pronunciation: 'Sae',
                imageUrl: ''
            },
            {
                korean: '물고기',
                meaning: 'Cá',
                pronunciation: 'Mulgogi',
                imageUrl: '.jpg'
            },
            {
                korean: '토끼',
                meaning: 'Thỏ',
                pronunciation: 'Tokki',
                imageUrl: ''
            },
            {
                korean: '말',
                meaning: 'Ngựa',
                pronunciation: 'Mal',
                imageUrl: ''
            },
            {
                korean: '돼지',
                meaning: 'Lợn',
                pronunciation: 'Dwaeji',
                imageUrl: ''
            },
            {
                korean: '소',
                meaning: 'Bò',
                pronunciation: 'So',
                imageUrl: ''
            },
            {
                korean: '닭',
                meaning: 'Gà',
                pronunciation: 'Dak',
                imageUrl: ''
            },
            {
                korean: '양',
                meaning: 'Cừu',
                pronunciation: 'Yang',
                imageUrl: ''
            }
        ],
        createdBy: DEMO_USER_ID
    },
    {
        theme: 'Số đếm (Numbers)',
        level: 'basic',
        imageUrl: '',
        words: [
            {
                korean: '하나',
                meaning: 'Một',
                pronunciation: 'Hana',
                imageUrl: ''
            },
            {
                korean: '둘',
                meaning: 'Hai',
                pronunciation: 'Dul',
                imageUrl: ''
            },
            {
                korean: '셋',
                meaning: 'Ba',
                pronunciation: 'Set',
                imageUrl: ''
            },
            {
                korean: '넷',
                meaning: 'Bốn',
                pronunciation: 'Net',
                imageUrl: ''
            },
            {
                korean: '다섯',
                meaning: 'Năm',
                pronunciation: 'Daseot',
                imageUrl: ''
            },
            {
                korean: '여섯',
                meaning: 'Sáu',
                pronunciation: 'Yeoseot',
                imageUrl: ''
            },
            {
                korean: '일곱',
                meaning: 'Bảy',
                pronunciation: 'Ilgop',
                imageUrl: ''
            },
            {
                korean: '여덟',
                meaning: 'Tám',
                pronunciation: 'Yeodeol',
                imageUrl: ''
            },
            {
                korean: '아홉',
                meaning: 'Chín',
                pronunciation: 'Ahop',
                imageUrl: ''
            },
            {
                korean: '열',
                meaning: 'Mười',
                pronunciation: 'Yeol',
                imageUrl: ''
            }
        ],
        createdBy: DEMO_USER_ID
    },
    {
        theme: 'Thời tiết (Weather)',
        level: 'intermediate',
        imageUrl: '',
        words: [
            {
                korean: '날씨',
                meaning: 'Thời tiết',
                pronunciation: 'Nalssi',
                imageUrl: ''
            },
            {
                korean: '비',
                meaning: 'Mưa',
                pronunciation: 'Bi',
                imageUrl: ''
            },
            {
                korean: '눈',
                meaning: 'Tuyết',
                pronunciation: 'Nun',
                imageUrl: ''
            },
            {
                korean: '바람',
                meaning: 'Gió',
                pronunciation: 'Baram',
                imageUrl: ''
            },
            {
                korean: '맑음',
                meaning: 'Nắng',
                pronunciation: 'Malgeum',
                imageUrl: ''
            },
            {
                korean: '흐림',
                meaning: 'Âm u',
                pronunciation: 'Heurim',
                imageUrl: ''
            },
            {
                korean: '더움',
                meaning: 'Nóng',
                pronunciation: 'Deoum',
                imageUrl: ''
            },
            {
                korean: '추움',
                meaning: 'Lạnh',
                pronunciation: 'Chuum',
                imageUrl: ''
            },
            {
                korean: '안개',
                meaning: 'Sương mù',
                pronunciation: 'Angae',
                imageUrl: ''
            },
            {
                korean: '번개',
                meaning: 'Sấm chớp',
                pronunciation: 'Beongae',
                imageUrl: ''
            }
        ],
        createdBy: DEMO_USER_ID
    }
];

async function seedVocabulary() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        // Clear existing data
        await ThematicVocabulary.deleteMany({});
        console.log('Cleared existing vocabulary data');

        // Insert demo data
        await ThematicVocabulary.insertMany(demoData);
        console.log('Demo data seeded successfully');

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

// Run the seeder
seedVocabulary();