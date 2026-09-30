# EduCenter CRM & Ota-onalar Portali 🎓

O‘quv markazlari uchun mo‘ljallangan to‘liq avtomatlashtirilgan boshqaruv tizimi (CRM) hamda o‘quvchilar va ularning ota-onalari uchun shaxsiy kabinet (Parent Portal).

🌐 **GitHub Repozitoriy:** [https://github.com/najimovamir36-cpu/crm](https://github.com/najimovamir36-cpu/crm)

---

## 🚀 Asosiy imkoniyatlar (Features)

### 1. 🏢 Administrator & Operator boshqaruvi
- **Boshqaruv paneli (Dashboard):** Jami o‘quvchilar, faol guruhlar, o‘qituvchilar soni, oylik tushum, qarzdorliklar statistikasi va interaktiv grafiklar.
- **O‘quvchilar boshqaruvi:** Yangi o‘quvchi qo‘shish, guruhga biriktirish, ota-ona ma’lumotlari, avtomatik ID generatsiyasi.
- **Ota-onalar uchun avtomatik login/parol:** Har bir o‘quvchi uchun avtomatik vaqtinchalik parol yaratish va Telegram orqali yuborish.
- **Guruhlar & Kurslar:** Fanlar, o‘quv xonalari, dars kunlari va soatlarini sozlash.
- **O‘qituvchilar jurnali:** O‘qituvchilar ro‘yxati, mutaxassisliklari, dars stavkalari va maosh hisob-kitoblari.
- **Elektron davomat:** Guruhlar kesimida sana bo‘yicha davomat olish (Keldi, Sababli, Sababsiz, Kechikdi).
- **Moliya & To‘lovlar:** Naqd, karta yoki bank orqali to‘lovlarni qabul qilish, to‘lov kvitansiyasini generatsiya qilish, qarzdorlar ro‘yxati.
- **Dars jadvali:** Xonalar va o‘qituvchilar kesimida to‘qnashuvsiz dars jadvallari.
- **Audit jurnali (Audit Logs):** Barcha kirishlar, o‘zgarishlar va to‘lov operatsiyalari qaydnomasi.

### 2. 👨‍👩‍👧 Ota-onalar va O‘quvchilar Portali (Parent Portal)
- **ID va Parol orqali kirish:** O‘quvchi ID raqami va berilgan parol orqali qulay kirish.
- **O‘quvchi profili:** Kurs, o‘qituvchi, guruh, dars vaqti va xonasi.
- **Davomat tarixi:** Barcha darslarga qatnashish foizi va har bir dars sanasi bo‘yicha hisobot.
- **To‘lovlar holati:** To‘langan summalar, oylik balans, qarzdorlik mavjud emasligi.
- **Guruhdagi reyting:** O‘quvchining o‘z guruhidagi o‘rni (Leaderboard).
- **Muhim e’lonlar:** O‘quv markazi ma’muriyatidan rasmiy xabarlar va yangiliklar.

---

## 🛠 Texnologiyalar to‘plami (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, TypeScript (TSX)
- **Ma’lumotlar bazasi:** Tezkor JSON DB + Firebase Firestore integratsiyasi
- **Xavfsizlik:** JWT (JSON Web Tokens), Bcrypt parollarni shifrlash, Role-Based Access Control (RBAC)

---

## 💻 Loyihani ishga tushirish (Local Setup)

### 1. Repozitoriyni klonlash:
```bash
git clone https://github.com/najimovamir36-cpu/crm.git
cd crm
```

### 2. Bog‘liqliklarni o‘rnatish:
```bash
npm install
```

### 3. Dasturni ishga tushirish:
```bash
npm run dev
```
Dastur **http://localhost:3000** manzilida ishga tushadi.

---

## 🔐 Standart kirish ma’lumotlari (Demo Login)

| Rol | Login | Parol |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `admin123` |
| **Administrator** | `admin` | `admin123` |
| **Operator** | `operator` | `operator123` |

---

## 📄 Litsenziya
MIT License © 2026 Amir Temur Najimov
