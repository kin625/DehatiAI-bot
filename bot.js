// ============================================
// 🌾 DEHATIAI WHATSAPP BOT - CLOUD API VERSION
// ============================================

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(express.json());

// ─── Secret File سے Token پڑھیں (یہ نیا کوڈ ہے) ──────
let WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
try {
    if (fs.existsSync('/etc/secrets/token.txt')) {
        WHATSAPP_TOKEN = fs.readFileSync('/etc/secrets/token.txt', 'utf8').trim();
        console.log('✅ Token Secret File سے لوڈ ہو گیا!');
    }
} catch (err) {
    console.log('⚠️ Secret File نہیں ملی، Environment Variable استعمال ہوگا');
}
// ─────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'dehati123';
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

console.log('🌾 DehatiAI WhatsApp Bot v7.0 (Cloud API)');
console.log('═══════════════════════════════════════════════');

// ─── 1. ڈیٹا بیس ──────────────────────────────────────────────
const CROPS = {
    'گندم': { water: '4-6', fert: 'DAP 50kg, Urea 40kg, SOP 25kg', season: 'ربیع' },
    'چاول': { water: '12-15', fert: 'DAP 40kg, Urea 50kg, SOP 20kg', season: 'خریف' },
    'مکئی': { water: '5-7', fert: 'DAP 45kg, Urea 35kg, SOP 25kg', season: 'خریف' },
    'کپاس': { water: '6-8', fert: 'DAP 50kg, Urea 30kg, SOP 20kg', season: 'خریف' },
    'گنا': { water: '20-25', fert: 'DAP 60kg, Urea 45kg, SOP 30kg', season: 'خریف' },
    'آلو': { water: '6-8', fert: 'DAP 40kg, Urea 30kg, SOP 25kg', season: 'ربیع' },
    'ٹماٹر': { water: '8-10', fert: 'DAP 35kg, Urea 25kg, SOP 20kg', season: 'ربیع' },
    'پیاز': { water: '7-9', fert: 'DAP 30kg, Urea 25kg, SOP 20kg', season: 'ربیع' },
    'سرسوں': { water: '3-5', fert: 'DAP 40kg, Urea 20kg, SOP 15kg', season: 'ربیع' }
};

const MANDI_PRICES = {
    'گندم': { price: 4200, unit: 'فی 40 کلو', trend: 'up' },
    'باسمتی چاول': { price: 7500, unit: 'فی 40 کلو', trend: 'same' },
    'مکئی': { price: 2200, unit: 'فی 40 کلو', trend: 'down' },
    'کپاس': { price: 9000, unit: 'فی 40 کلو', trend: 'up' },
    'گنا': { price: 480, unit: 'فی 40 کلو', trend: 'up' },
    'آلو': { price: 1800, unit: 'فی 40 کلو', trend: 'down' },
    'ٹماٹر': { price: 1200, unit: 'فی 20 کلو', trend: 'up' },
    'پیاز': { price: 1600, unit: 'فی 40 کلو', trend: 'same' }
};

const SCHEMES = {
    'پنجاب': [
        { name: 'کسان کارڈ', desc: '₨50,000 زرعی قرض', contact: '0800-15000' },
        { name: 'وزیراعظم فصل بیمہ', desc: '70% نقصان کا معاوضہ', contact: '0800-26477' },
        { name: 'ٹریکٹر سبسڈی', desc: '30% تخفیف', contact: '0800-15000' }
    ],
    'سندھ': [
        { name: 'سندھ کسان کارڈ', desc: '₨40,000 قرض', contact: '0800-15000' }
    ],
    'خیبر پختونخوا': [
        { name: 'KPK کسان پروگرام', desc: '₨30,000 قرض', contact: '0800-15000' }
    ],
    'بلوچستان': [
        { name: 'بلوچستان زراعت پروگرام', desc: '₨25,000 قرض', contact: '0800-15000' }
    ]
};

const DISEASES = {
    'گندم': { name: 'زنگ / پھپھوندی', cause: 'نمی اور گرمی', treatment: 'کوپر آکسی کلورائیڈ 3% سپرے', dosage: '250 گرام فی ایکڑ', prevention: 'وقت پر سپرے' },
    'چاول': { name: 'بلاست بیماری', cause: 'پانی کی زیادتی', treatment: 'ٹرائی سائکلیزول سپرے', dosage: '200 گرام فی ایکڑ', prevention: 'پانی کی نکاسی' },
    'مکئی': { name: 'مئی بلائٹ', cause: 'بارش', treatment: 'مینکوزیب سپرے', dosage: '300 گرام فی ایکڑ', prevention: 'فصل کی گردش' },
    'کپاس': { name: 'سنڈی کا حملہ', cause: 'کیڑے', treatment: 'پائرتھرائیڈ سپرے', dosage: '200 ملی لیٹر فی ایکڑ', prevention: 'بروقت سپرے' }
};

const LIVESTOCK_TREATMENTS = {
    'گائے': { 'بخار': 'پانی زیادہ دیں، ڈاکٹر بلائیں', 'کھانا نہیں': 'چارہ تبدیل کریں', 'دودھ کم': 'زیادہ چارہ اور پانی دیں', 'لنگڑانا': 'زخم چیک کریں، ڈاکٹر بلائیں' },
    'بکری': { 'بخار': 'پانی زیادہ دیں، سایہ میں رکھیں', 'کھانا نہیں': 'چارہ تبدیل کریں', 'اسہال': 'پانی اور نمک دیں' },
    'مرغی': { 'کھانا نہیں': 'دانہ تبدیل کریں', 'کمزوری': 'وٹامن دیں' }
};

// ─── یوزر ڈیٹا بیس ──────────────────────────────────────────
const USERS_FILE = 'users.json';
function getUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ─── لوکیشن ──────────────────────────────────────────────────
async function getLocationFromNumber() {
    try {
        const ipRes = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
        if (ipRes.data.city) {
            return { city: ipRes.data.city, region: ipRes.data.region };
        }
    } catch (e) {}
    return { city: 'Lahore', region: 'Punjab' };
}

// ─── موسم ──────────────────────────────────────────────────
async function getWeather(city) {
    try {
        if (!city || city.trim() === '' || city.includes('here') || city.includes('میرا')) {
            var loc = await getLocationFromNumber();
            city = loc.city;
        }
        var res = await axios.get('https://wttr.in/' + encodeURIComponent(city) + '?format=j1', { timeout: 10000 });
        var data = res.data;
        var current = data.current_condition[0];
        var area = data.nearest_area[0];
        var temp = current.temp_C;
        var desc = current.weatherDesc[0].value;
        var cityName = (area.areaName && area.areaName[0] && area.areaName[0].value) || city;
        var advice = parseInt(temp) > 38 ? '🔥 شدید گرمی — صبح سویرے کام کریں' : '✅ موسم موزوں ہے';
        return '🌤️ *' + cityName + ' کا موسم*\n🌡️ ' + temp + '°C\n💧 نمی: ' + current.humidity + '%\n📝 ' + desc + '\n🌾 مشورہ: ' + advice;
    } catch (error) {
        return '⚠️ موسم نہ مل سکا، شہر کا نام درست لکھیں۔';
    }
}

// ─── منڈی بھاؤ ──────────────────────────────────────────────
function getMandiPrices() {
    var reply = '📊 *منڈی بھاؤ (تازہ)*\n\n';
    for (var crop in MANDI_PRICES) {
        var info = MANDI_PRICES[crop];
        var emoji = info.trend === 'up' ? '📈' : info.trend === 'down' ? '📉' : '➡️';
        reply += emoji + ' *' + crop + '*: ₨' + info.price + ' ' + info.unit + '\n';
    }
    return reply;
}

// ─── بیماری ──────────────────────────────────────────────────
function getDisease(crop) {
    var data = DISEASES[crop];
    if (!data) {
        return '🔬 براہ کرم درست فصل چنیں: گندم، چاول، مکئی، کپاس';
    }
    return '🔬 *' + crop + ' کی بیماری*\n📋 نام: ' + data.name + '\n🔍 وجہ: ' + data.cause + '\n💊 علاج: ' + data.treatment + '\n📌 مقدار: ' + data.dosage + '\n🛡️ بچاؤ: ' + data.prevention;
}

// ─── کھاد ──────────────────────────────────────────────────
function getFertilizer(crop) {
    var data = CROPS[crop];
    if (!data) {
        return '🧪 براہ کرم فصل کا نام لکھیں: گندم، چاول، مکئی، کپاس، گنا، آلو، ٹماٹر، پیاز، سرسوں';
    }
    return '🧪 *' + crop + ' کی کھاد*\n🌱 بوائی: DAP 50kg\n💧 پہلا پانی: Urea 40kg\n🌿 دوسرا پانی: SOP 25kg\n⏰ موسم: ' + data.season;
}

// ─── منافع ──────────────────────────────────────────────────
function getProfit(crop, acres) {
    var data = CROPS[crop];
    if (!data) {
        return '📊 براہ کرم فصل اور رقبہ لکھیں (مثال: گندم 5 ایکڑ)';
    }
    var cost = { seed: 3000, fert: 8000, spray: 2000, labor: 5000, water: 4000 };
    var totalCost = 0;
    for (var key in cost) {
        totalCost += cost[key];
    }
    var yieldPerAcre = crop === 'گندم' ? 35 : 40;
    var price = (MANDI_PRICES[crop] && MANDI_PRICES[crop].price) || 4000;
    var revenue = yieldPerAcre * price;
    var profitVal = revenue - totalCost;
    return '📊 *' + crop + ' - ' + acres + ' ایکڑ کا منافع*\n💰 فی ایکڑ لاگت: ₨' + totalCost + '\n📦 فی ایکڑ آمدنی: ₨' + revenue + '\n✅ فی ایکڑ منافع: ₨' + profitVal + '\n📊 کل منافع: ₨' + (profitVal * acres);
}

// ─── اسکیمیں ──────────────────────────────────────────────────
function getSchemes(province) {
    var list = SCHEMES[province] || SCHEMES['پنجاب'];
    var reply = '🏛️ *' + province + ' کی اسکیمیں*\n\n';
    for (var i = 0; i < list.length; i++) {
        var s = list[i];
        reply += (i+1) + '. ' + s.name + '\n   ' + s.desc + '\n   📞 ' + s.contact + '\n\n';
    }
    return reply;
}

// ─── مویشی ──────────────────────────────────────────────────
function getLivestock(animal, symptom) {
    var animalData = LIVESTOCK_TREATMENTS[animal];
    if (!animalData) {
        return '🐄 جانور کا نام لکھیں: گائے، بکری، مرغی';
    }
    var treatment = animalData[symptom] || 'ڈاکٹر سے رابطہ کریں';
    return '🐄 *' + animal + ' کی صحت*\n📋 علامت: ' + symptom + '\n💊 علاج: ' + treatment + '\n📞 ایمرجنسی: 1122';
}

// ─── پانی ──────────────────────────────────────────────────
function getWater(crop, acres) {
    var data = CROPS[crop];
    if (!data) {
        return '💧 براہ کرم فصل کا نام لکھیں۔';
    }
    var range = data.water.split('-');
    var avg = (parseInt(range[0]) + parseInt(range[1])) / 2;
    return '💧 *پانی کا حق*\n🌾 فصل: ' + crop + '\n📏 رقبہ: ' + acres + ' ایکڑ\n💧 پانی: ' + (avg * acres).toFixed(1) + ' ایکڑ انچ\n📞 محکمہ آبپاشی: 1122';
}

// ─── بیمہ ──────────────────────────────────────────────────
function getInsurance(crop) {
    return '🛡️ *' + crop + ' کا فصل بیمہ*\n✅ 1 ایکڑ سے زیادہ اہل\n📋 اسکیمیں: وزیراعظم بیمہ (70% معاوضہ)\n📞 ہیلپ لائن: 0800-26477';
}

// ─── شکایت ──────────────────────────────────────────────────
function getComplaint(issue, name) {
    return '📢 *شکایت درخواست*\nموضوع: ' + issue + '\nنام: ' + (name || 'کسان') + '\n📞 ہیلپ لائن: 0800-15000\nدستاویزات: CNIC + زمین کا ریکارڈ';
}

// ─── AI ──────────────────────────────────────────────────
async function callAI(userMessage) {
    if (!CLAUDE_API_KEY) return null;
    try {
        var response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-sonnet-20241022',
            max_tokens: 800,
            system: 'You are DehatiAI. Always reply in URDU SCRIPT (نستعلیق). Help farmers practically.',
            messages: [{ role: 'user', content: userMessage }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });
        return response.data.content[0].text;
    } catch (error) {
        console.error('❌ AI Error:', error.message);
        return null;
    }
}

// ─── مین پروسیسر ──────────────────────────────────────────
async function processMessage(text, phoneNumber) {
    var lower = text.toLowerCase().trim();

    // لاگ ان / رجسٹر
    if (lower.includes('لاگ ان') || lower.includes('login') || lower.includes('رجسٹر')) {
        var users = getUsers();
        if (!users[phoneNumber]) {
            users[phoneNumber] = { name: phoneNumber, registered: new Date().toISOString() };
            saveUsers(users);
            return '🌾 خوش آمدید! آپ DehatiAI میں رجسٹر ہو گئے۔\n📌 "مدد" لکھیں۔';
        }
        return '✅ آپ پہلے سے رجسٹرڈ ہیں۔';
    }

    // مدد
    if (lower.includes('مدد') || lower.includes('help') || lower.includes('سلام')) {
        return '🌾 *DehatiAI - کسانوں کا ڈیجیٹل وکیل*\n\n1️⃣ موسم — "موسم"\n2️⃣ منڈی بھاؤ — "منڈی بھاؤ"\n3️⃣ بیماری — "گندم کی بیماری"\n4️⃣ کھاد — "گندم کی کھاد"\n5️⃣ منافع — "گندم 5 ایکڑ منافع"\n6️⃣ اسکیمیں — "پنجاب کی اسکیمیں"\n7️⃣ مویشی — "گائے کو بخار"\n8️⃣ پانی — "گندم 10 ایکڑ پانی"\n9️⃣ بیمہ — "گندم کا بیمہ"\n🔟 شکایت — "شکایت کریں"\n📞 ایمرجنسی: 0800-15000';
    }

    // موسم
    if (lower.includes('موسم') || lower.includes('weather')) {
        var cityMatch = text.match(/(لاہور|ملتان|کراچی|پشاور|اسلام آباد|فیصل آباد|راولپنڈی)/u);
        return await getWeather(cityMatch ? cityMatch[0] : null);
    }

    // منڈی
    if (lower.includes('منڈی') || lower.includes('قیمت') || lower.includes('بھاؤ')) {
        return getMandiPrices();
    }

    // بیماری
    if (lower.includes('بیماری') || lower.includes('علاج')) {
        var cropMatch = text.match(/(گندم|چاول|مکئی|کپاس)/u);
        if (cropMatch) return getDisease(cropMatch[0]);
        return '🔬 فصل کا نام لکھیں: گندم، چاول، مکئی، کپاس';
    }

    // کھاد
    if (lower.includes('کھاد') || lower.includes('نسخہ')) {
        var cropMatch = text.match(/(گندم|چاول|مکئی|کپاس|گنا|آلو|ٹماٹر|پیاز|سرسوں)/u);
        if (cropMatch) return getFertilizer(cropMatch[0]);
        return '🧪 فصل کا نام لکھیں۔';
    }

    // منافع
    if (lower.includes('منافع') || lower.includes('نقصان') || lower.includes('حساب')) {
        var cropMatch = text.match(/(گندم|چاول|مکئی|کپاس|گنا)/u);
        var acreMatch = text.match(/(\d+)/);
        if (cropMatch) return getProfit(cropMatch[0], acreMatch ? parseInt(acreMatch[0]) : 5);
        return '📊 مثال: "گندم 5 ایکڑ منافع"';
    }

    // اسکیمیں
    if (lower.includes('اسکیم') || lower.includes('سبسڈی') || lower.includes('قرض')) {
        var provMatch = text.match(/(پنجاب|سندھ|خیبر|بلوچستان)/u);
        return getSchemes(provMatch ? provMatch[0] : 'پنجاب');
    }

    // مویشی
    if (lower.includes('مویشی') || lower.includes('گائے') || lower.includes('بکری') || lower.includes('مرغی')) {
        var animalMatch = text.match(/(گائے|بکری|مرغی)/u);
        var symptomMatch = text.match(/(بخار|کھانا|اسہال)/u);
        if (animalMatch) return getLivestock(animalMatch[0], symptomMatch ? symptomMatch[0] : 'بیماری');
        return '🐄 جانور کا نام لکھیں۔';
    }

    // پانی
    if (lower.includes('پانی') && (lower.includes('ایکڑ') || lower.includes('فصل'))) {
        var cropMatch = text.match(/(گندم|چاول|مکئی|کپاس|گنا)/u);
        var acreMatch = text.match(/(\d+)/);
        if (cropMatch) return getWater(cropMatch[0], acreMatch ? parseInt(acreMatch[0]) : 5);
        return '💧 مثال: "گندم 10 ایکڑ پانی"';
    }

    // بیمہ
    if (lower.includes('بیمہ') || lower.includes('انشورنس')) {
        var cropMatch = text.match(/(گندم|چاول|مکئی|کپاس)/u);
        return getInsurance(cropMatch ? cropMatch[0] : 'فصل');
    }

    // شکایت
    if (lower.includes('شکایت')) {
        var issueMatch = text.match(/شکایت\s*(.*)/);
        return getComplaint(issueMatch ? issueMatch[1] : 'زرعی مسئلہ', null);
    }

    // ڈیفالٹ: AI
    var aiResponse = await callAI(text);
    if (aiResponse) return aiResponse;

    return '❌ معاف کریں، میں سمجھ نہیں پایا۔ براہ کرم "مدد" لکھیں۔';
}

// ─── میسج بھیجنا ──────────────────────────────────────────
async function sendWhatsAppMessage(to, text) {
    try {
        var url = 'https://graph.facebook.com/v18.0/' + PHONE_NUMBER_ID + '/messages';
        var payload = {
            messaging_product: 'whatsapp',
            to: to,
            type: 'text',
            text: { body: text.substring(0, 1000) }
        };
        await axios.post(url, payload, {
            headers: { 'Authorization': 'Bearer ' + WHATSAPP_TOKEN, 'Content-Type': 'application/json' }
        });
        console.log('✅ میسج بھیج دیا: ' + to);
    } catch (error) {
        console.error('❌ بھیجنے میں غلطی:', error.response ? error.response.data : error.message);
    }
}

// ─── ویب ہک ──────────────────────────────────────────────────
app.get('/webhook', function(req, res) {
    var mode = req.query['hub.mode'];
    var token = req.query['hub.verify_token'];
    var challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', function(req, res) {
    var body = req.body;
    if (body.object === 'whatsapp_business_account') {
        var entry = body.entry && body.entry[0];
        var changes = entry && entry.changes && entry.changes[0];
        var value = changes && changes.value;
        var message = value && value.messages && value.messages[0];

        if (message && message.text) {
            var from = message.from;
            var text = message.text.body;
            console.log('📩 ' + from + ': ' + text);
            processMessage(text, from).then(function(reply) {
                sendWhatsAppMessage(from, reply);
            }).catch(function(err) {
                console.error('❌ پروسیسنگ میں خرابی:', err);
            });
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// ─── ہیلتھ چیک (UptimeRobot کے لیے) ──────────────────────────
app.get('/', function(req, res) {
    res.status(200).send('OK');
});

app.get('/health', function(req, res) {
    res.status(200).send('OK');
});

// ─── سرور اسٹارٹ ──────────────────────────────────────────
app.listen(PORT, function() {
    console.log('🚀 سرور چل رہا ہے: http://localhost:' + PORT);
    console.log('📌 ویب ہک URL: https://YOUR_DOMAIN/webhook');
    console.log('🔑 Verify Token: ' + VERIFY_TOKEN);
    console.log('═══════════════════════════════════════════════');
});
