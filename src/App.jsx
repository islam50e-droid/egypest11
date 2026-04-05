import React, { useState, useEffect, useMemo } from 'react';
import {
  Home, Users, Calendar, Settings, LogOut, Plus, Edit, Trash2,
  Printer, Smartphone, Download, Upload, Bell, Search, CheckCircle,
  AlertTriangle, Clock, X, MessageCircle, FileText, Sparkles, Send, Loader2,
  ClipboardList, CalendarDays, MapPin, Phone
} from 'lucide-react';

// --- Gemini API Integration ---
const apiKey = ""; 

async function callGemini(prompt, systemInstruction = "") {
  try {
    let retries = 0;
    const maxRetries = 5;
    const delays = [1000, 2000, 4000, 8000, 16000];

    while (retries < maxRetries) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] }
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "لا يمكن استخراج رد حالياً.";
      }

      if (response.status === 429 || response.status >= 500) {
        await new Promise(res => setTimeout(res, delays[retries]));
        retries++;
      } else {
        throw new Error('فشل الاتصال بـ Gemini');
      }
    }
    throw new Error('فشلت جميع المحاولات');
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ في الاتصال بالذكاء الاصطناعي.";
  }
}

// --- Helpers ---
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);

const isTomorrowOrToday = (dateString) => {
  if (!dateString) return false;
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return targetDate.getTime() === today.getTime() || targetDate.getTime() === tomorrow.getTime();
};

const isOverdue = (dateString) => {
  if (!dateString) return false;
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return targetDate.getTime() < today.getTime();
};

const format12Hour = (time24) => {
  if (!time24) return '--:--';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours);
  const ampm = h >= 12 ? 'مساءً' : 'صباحاً';
  h = h % 12;
  h = h ? h : 12; 
  return `${h}:${minutes} ${ampm}`;
};

const calculateFollowUps = (firstVisitDate) => {
  if (!firstVisitDate) return [];
  const date = new Date(firstVisitDate);
  const followUps = [];
  const intervals = [3, 6, 9, 12];
  intervals.forEach(months => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + months);
    followUps.push({ id: generateId(), date: newDate.toISOString().split('T')[0], status: 'pending', period: `${months} شهور` });
  });
  return followUps;
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [manualFollowUps, setManualFollowUps] = useState([]); 
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('pest_user');
    const storedClients = localStorage.getItem('pest_clients');
    const storedManual = localStorage.getItem('pest_manual_followups');
    
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedClients) setClients(JSON.parse(storedClients));
    if (storedManual) setManualFollowUps(JSON.parse(storedManual));

    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    localStorage.setItem('pest_clients', JSON.stringify(clients));
    localStorage.setItem('pest_manual_followups', JSON.stringify(manualFollowUps));
  }, [clients, manualFollowUps]);

  if (!user) return <LoginView onLogin={(u, p) => { 
    const userData = {username: u, role: 'admin'};
    setUser(userData); 
    localStorage.setItem('pest_user', JSON.stringify(userData));
    return true; 
  }} />;

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('pest_user');
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-[Tajawal]" dir="rtl">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 w-64 bg-green-700 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-green-600 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl"><AlertTriangle size={24}/> كلين كنترول</div>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}><X/></button>
        </div>
        <nav className="p-4 space-y-2">
          <SidebarItem icon={Home} label="لوحة القيادة" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <SidebarItem icon={Users} label="العملاء" active={currentView === 'clients'} onClick={() => setCurrentView('clients')} />
          <SidebarItem icon={Calendar} label="المتابعات الدورية" active={currentView === 'followups'} onClick={() => setCurrentView('followups')} />
          <SidebarItem icon={CalendarDays} label="المتابعات اليومية" active={currentView === 'daily_schedule'} onClick={() => setCurrentView('daily_schedule')} />
          <SidebarItem icon={Sparkles} label="مساعد الذكاء الاصطناعي" active={currentView === 'ai_assistant'} onClick={() => setCurrentView('ai_assistant')} />
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-green-600">
          <button onClick={handleLogout} className="flex items-center gap-2 text-green-100 hover:text-white transition w-full"><LogOut size={18}/> خروج</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-4 flex items-center justify-between print:hidden border-b">
          <button className="lg:hidden text-green-700" onClick={() => setIsSidebarOpen(true)}><ClipboardList/></button>
          <div className="text-xl font-bold text-green-800">
            {currentView === 'dashboard' && 'لوحة القيادة الإحصائية'}
            {currentView === 'clients' && 'إدارة قاعدة بيانات العملاء'}
            {currentView === 'followups' && 'سجل المتابعات الدورية'}
            {currentView === 'daily_schedule' && 'جدول التشغيل اليومي'}
            {currentView === 'ai_assistant' && 'المساعد الذكي Gemini ✨'}
          </div>
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 print:p-0">
          {currentView === 'dashboard' && <DashboardView clients={clients} manualFollowUps={manualFollowUps} />}
          {currentView === 'clients' && <ClientsView clients={clients} setClients={setClients} />}
          {currentView === 'followups' && <FollowUpsView clients={clients} setClients={setClients} />}
          {currentView === 'daily_schedule' && <DailyScheduleView manualFollowUps={manualFollowUps} setManualFollowUps={setManualFollowUps} />}
          {currentView === 'ai_assistant' && <AIAssistantView clients={clients} />}
        </main>
      </div>
    </div>
  );
}

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${active ? 'bg-green-800 shadow-lg scale-105' : 'hover:bg-green-600'}`}>
    <Icon size={20} /> <span className="font-medium">{label}</span>
  </button>
);

// --- Daily Schedule View ---
function DailyScheduleView({ manualFollowUps, setManualFollowUps }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({ clientName: '', phone: '', address: '', note: '', time: '' });

  const dailyTasks = useMemo(() => {
    return manualFollowUps
      .filter(item => item.date === selectedDate)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [manualFollowUps, selectedDate]);

  const handleAddEntry = (e) => {
    e.preventDefault();
    const entry = { ...newEntry, id: generateId(), date: selectedDate, completed: false };
    setManualFollowUps([...manualFollowUps, entry]);
    setNewEntry({ clientName: '', phone: '', address: '', note: '', time: '' });
    setShowAddModal(false);
  };

  const deleteEntry = (id) => {
    if (window.confirm('هل تريد حذف هذه المهمة؟')) {
      setManualFollowUps(manualFollowUps.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end print:hidden">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold text-gray-700 mb-2">اختر تاريخ اليوم للعرض:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border border-green-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-md"
        >
          <Plus size={20}/> إضافة زيارة جديدة
        </button>
        <button 
          onClick={() => window.print()}
          className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition shadow-md"
        >
          <Printer size={20}/> طباعة جدول التشغيل
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
        <div className="p-4 bg-green-50 border-b flex justify-between items-center print:bg-white print:border-b-2 print:border-black">
          <h2 className="font-bold text-lg text-green-800">قائمة زيارات يوم: {selectedDate}</h2>
          <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full font-bold print:hidden">{dailyTasks.length} زيارات</span>
        </div>
        
        <div className="overflow-x-auto">
          {dailyTasks.length === 0 ? (
            <div className="p-10 text-center text-gray-400">لا توجد زيارات مبرمجة لهذا التاريخ.</div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 border text-sm">الوقت</th>
                  <th className="p-3 border text-sm">اسم العميل</th>
                  <th className="p-3 border text-sm">رقم الهاتف</th>
                  <th className="p-3 border text-sm">العنوان</th>
                  <th className="p-3 border text-sm">ملاحظات فنية</th>
                  <th className="p-3 border text-sm print:hidden">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {dailyTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 transition border-b">
                    <td className="p-3 border font-bold text-green-700 whitespace-nowrap">{format12Hour(task.time)}</td>
                    <td className="p-3 border font-semibold">{task.clientName}</td>
                    <td className="p-3 border text-sm" dir="ltr">{task.phone}</td>
                    <td className="p-3 border text-sm">{task.address}</td>
                    <td className="p-3 border text-xs text-gray-600 max-w-xs">{task.note}</td>
                    <td className="p-3 border text-center print:hidden">
                      <button onClick={() => deleteEntry(task.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Print Specific Layout - Updated to include new fields */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-6 font-[Tajawal]" dir="rtl">
        <div className="flex justify-between items-start border-b-4 border-green-700 pb-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold text-green-700">كلين كنترول</h1>
            <p className="text-gray-600 font-bold mt-1 text-xl">تقرير التشغيل والمتابعات الميدانية</p>
          </div>
          <div className="text-left">
            <p className="text-lg font-bold">تاريخ المهمة: {selectedDate}</p>
            <p className="text-sm text-gray-500">مستخرج آلياً من النظام</p>
          </div>
        </div>

        <table className="w-full border-collapse border-2 border-black text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border-2 border-black p-2 w-12">م</th>
              <th className="border-2 border-black p-2 w-24">الوقت</th>
              <th className="border-2 border-black p-2 w-48">العميل</th>
              <th className="border-2 border-black p-2 w-32">الهاتف</th>
              <th className="border-2 border-black p-2 w-48">العنوان</th>
              <th className="border-2 border-black p-2">الملاحظات والإفادة</th>
              <th className="border-2 border-black p-2 w-32">التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {dailyTasks.map((task, idx) => (
              <tr key={task.id} className="min-h-[80px]">
                <td className="border-2 border-black p-2 text-center font-bold">{idx + 1}</td>
                <td className="border-2 border-black p-2 text-center font-bold">{format12Hour(task.time)}</td>
                <td className="border-2 border-black p-2 font-bold">{task.clientName}</td>
                <td className="border-2 border-black p-2 text-center" dir="ltr">{task.phone}</td>
                <td className="border-2 border-black p-2 text-xs">{task.address}</td>
                <td className="border-2 border-black p-2 text-xs italic">{task.note}</td>
                <td className="border-2 border-black p-2"></td>
              </tr>
            ))}
            {[...Array(Math.max(0, 10 - dailyTasks.length))].map((_, i) => (
              <tr key={i} className="h-16">
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
                <td className="border-2 border-black p-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-8 flex justify-between items-center font-bold text-lg">
          <div className="text-center w-64 border-t border-black pt-2">توقيع المشرف</div>
          <div className="text-center w-64 border-t border-black pt-2">ختم الإدارة</div>
        </div>
      </div>

      {/* Add Modal with separate fields */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
                <Plus className="bg-green-100 p-1 rounded-full text-green-700"/> إضافة زيارة للجدول
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-red-500"><X/></button>
            </div>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">اسم العميل:</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    value={newEntry.clientName}
                    onChange={e => setNewEntry({...newEntry, clientName: e.target.value})}
                    placeholder="الاسم الثلاثي"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف:</label>
                  <input 
                    type="tel" 
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-right" 
                    value={newEntry.phone}
                    onChange={e => setNewEntry({...newEntry, phone: e.target.value})}
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">العنوان بالتفصيل:</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 text-gray-400" size={18}/>
                  <input 
                    type="text" 
                    className="w-full p-2.5 pr-10 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    value={newEntry.address}
                    onChange={e => setNewEntry({...newEntry, address: e.target.value})}
                    placeholder="المنطقة - الشارع - رقم المبنى"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">وقت الزيارة:</label>
                  <input 
                    type="time" 
                    className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                    value={newEntry.time}
                    onChange={e => setNewEntry({...newEntry, time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">التاريخ المحدد:</label>
                  <input type="text" value={selectedDate} disabled className="w-full p-2.5 border rounded-xl bg-gray-50 text-gray-500"/>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">ملاحظات العمل المطلوبة:</label>
                <textarea 
                  className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" 
                  rows="3"
                  value={newEntry.note}
                  onChange={e => setNewEntry({...newEntry, note: e.target.value})}
                  placeholder="نوع الحشرات، المبيدات المطلوبة، أجهزة خاصة..."
                ></textarea>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-700">تثبيت في الجدول</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold hover:bg-gray-200">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Enhanced Dashboard View ---
function DashboardView({ clients, manualFollowUps }) {
  const today = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const todayTasks = manualFollowUps.filter(f => f.date === today).length;
    const pendingTotal = manualFollowUps.filter(f => !f.completed).length;
    const totalRev = clients.reduce((acc, curr) => acc + (parseFloat(curr.amountPaid) || 0), 0);
    
    return {
      totalClients: clients.length,
      tasksToday: todayTasks,
      pendingTasks: pendingTotal,
      totalRevenue: totalRev.toLocaleString()
    };
  }, [clients, manualFollowUps, today]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard icon={Users} title="إجمالي العملاء" value={stats.totalClients} color="blue" />
        <DashboardCard icon={CalendarDays} title="زيارات اليوم" value={stats.tasksToday} color="green" />
        <DashboardCard icon={Clock} title="مهام معلقة" value={stats.pendingTasks} color="yellow" />
        <DashboardCard icon={FileText} title="إجمالي المحصل" value={`${stats.totalRevenue} ج`} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
            <CheckCircle className="text-green-600" size={20}/> حالة العمليات اليومية
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600">الزيارات المنجزة اليوم</span>
              <span className="font-bold text-green-700">0</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600">نسبة الإنجاز</span>
              <div className="w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-0"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">تحديث ذكي متاح ✨</h3>
            <p className="text-green-100 text-sm leading-relaxed mb-4">
              يمكنك الآن استخدام Gemini لتحليل أداء الفنيين في الميدان بناءً على الملاحظات اليومية التي تدونها.
            </p>
            <button className="bg-white text-green-800 px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-green-50 transition">
              جرب التحليل الآن
            </button>
          </div>
          <Sparkles className="absolute -bottom-4 -right-4 text-green-400 opacity-20" size={120}/>
        </div>
      </div>
    </div>
  );
}

const DashboardCard = ({ icon: Icon, title, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };
  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} shadow-sm flex items-center gap-4`}>
      <div className={`p-3 rounded-xl bg-white shadow-sm`}>
        <Icon size={24}/>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-bold mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

// --- Clients, FollowUps, AI Views (Placeholders for logic already in context) ---
function ClientsView({ clients, setClients }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone?.includes(searchTerm)
  );

  const handleSaveClient = (clientData) => {
    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...clientData } : c));
    } else {
      const newClient = {
        id: generateId(),
        ...clientData,
        followUps: calculateFollowUps(clientData.firstVisit)
      };
      setClients([newClient, ...clients]);
    }
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleDeleteClient = (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل نهائياً؟')) {
      setClients(clients.filter(c => c.id !== id));
      if (selectedClient?.id === id) setSelectedClient(null);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
          <input type="text" placeholder="بحث بالاسم أو رقم الهاتف..." className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => { setEditingClient(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto justify-center shadow-md">
          <Plus size={20} />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-20">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">لا توجد نتائج مطابقة. قم بإضافة عملاء جدد.</div>
        ) : (
          filteredClients.map(client => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{client.name || 'بدون اسم'}</h3>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingClient(client); setIsModalOpen(true); }} className="text-blue-500 p-1 rounded hover:bg-blue-50"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteClient(client.id)} className="text-red-500 p-1 rounded hover:bg-red-50"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p className="flex items-center gap-2"><Smartphone size={14}/> <span dir="ltr">{client.phone || '-'}</span></p>
                <p className="flex items-center gap-2"><Calendar size={14}/> زيارة: {client.firstVisit || '-'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedClient(client)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded text-sm font-medium">التفاصيل</button>
                {client.phone && (
                  <a href={`https://wa.me/2${client.phone.replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 bg-green-100 text-green-600 hover:bg-green-200 rounded">
                    <MessageCircle size={18} />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && <ClientFormModal client={editingClient} onClose={() => setIsModalOpen(false)} onSave={handleSaveClient} />}
      {selectedClient && <ClientDetailsModal client={selectedClient} onClose={() => setSelectedClient(null)} onEdit={() => { setSelectedClient(null); setEditingClient(selectedClient); setIsModalOpen(true); }} />}
    </div>
  );
}

function ClientFormModal({ client, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: client?.name || '', phone: client?.phone || '', address: client?.address || '',
    firstVisit: client?.firstVisit || '', amountPaid: client?.amountPaid || '', notes: client?.notes || ''
  });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">{client ? 'تعديل بيانات عميل' : 'إضافة عميل جديد'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-5 space-y-4">
          <div><label className="block text-sm font-bold mb-1">اسم العميل</label><input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required /></div>
          <div><label className="block text-sm font-bold mb-1">رقم الهاتف</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-right" dir="ltr" required /></div>
          <div><label className="block text-sm font-bold mb-1">العنوان</label><input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-bold mb-1">أول زيارة</label><input type="date" value={formData.firstVisit} onChange={(e) => setFormData({...formData, firstVisit: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" disabled={!!client} /></div>
            <div><label className="block text-sm font-bold mb-1">المبلغ (ج)</label><input type="number" value={formData.amountPaid} onChange={(e) => setFormData({...formData, amountPaid: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none" /></div>
          </div>
          <div><label className="block text-sm font-bold mb-1">ملاحظات عامة</label><textarea rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"></textarea></div>
          <div className="flex gap-3 pt-4 border-t">
            <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md">حفظ البيانات</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-xl">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientDetailsModal({ client, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-w-full">
        <div className="flex justify-between items-center p-5 border-b bg-gray-50 print:hidden">
          <h2 className="text-xl font-bold text-gray-800">ملف العميل الموحد</h2>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="bg-gray-200 p-2 rounded hover:bg-gray-300"><Printer size={20} /></button>
            <button onClick={onEdit} className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200"><Edit size={20} /></button>
            <button onClick={onClose} className="text-gray-500 p-2 rounded-full hover:bg-red-50 hover:text-red-500"><X size={20} /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto print:p-8" id="print-area">
          <div className="hidden print:flex flex-col items-center mb-8 border-b-2 border-green-600 pb-4">
            <h1 className="text-3xl font-bold text-green-700">كلين كنترول</h1>
            <p className="text-gray-600">لخدمات مكافحة الحشرات</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">الاسم</p><p className="font-bold text-lg">{client.name}</p></div>
            <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">الهاتف</p><p className="font-bold text-lg" dir="ltr">{client.phone}</p></div>
            <div className="col-span-2 bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">العنوان</p><p className="font-bold">{client.address || '-'}</p></div>
          </div>
          {client.notes && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-100">
              <p className="text-xs text-yellow-800 font-bold mb-1">ملاحظات فنية</p>
              <p className="text-sm whitespace-pre-wrap text-yellow-900">{client.notes}</p>
            </div>
          )}
          <h3 className="font-bold border-b pb-2 mb-4 text-green-800">سجل المتابعات الدورية (التلقائية)</h3>
          {(!client.followUps || client.followUps.length === 0) ? (
             <p className="text-gray-500 text-sm">لم يتم تحديد تاريخ أول زيارة لإنشاء متابعات.</p>
          ) : (
            <table className="w-full text-right text-sm border-collapse">
              <thead><tr className="bg-gray-100"><th className="p-3 border">الفترة</th><th className="p-3 border">التاريخ المتوقع</th><th className="p-3 border">الحالة</th></tr></thead>
              <tbody>
                {client.followUps?.map(fu => (
                  <tr key={fu.id} className="border-b hover:bg-gray-50"><td className="p-3 border font-bold">بعد {fu.period}</td><td className="p-3 border" dir="ltr">{fu.date}</td><td className="p-3 border"><span className={`px-2 py-1 rounded text-xs font-bold ${fu.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{fu.status === 'completed' ? 'تمت الزيارة' : 'قيد الانتظار'}</span></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; } }`}</style>
    </div>
  );
}

function FollowUpsView({ clients, setClients }) {
  const [filter, setFilter] = useState('all');
  const allFollowUps = useMemo(() => {
    let list = [];
    clients.forEach(client => {
      client.followUps?.forEach(fu => {
        list.push({ ...fu, clientId: client.id, clientName: client.name, clientPhone: client.phone });
      });
    });
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [clients]);

  const filteredFollowUps = allFollowUps.filter(f => {
    if (filter === 'upcoming') return f.status === 'pending' && !isOverdue(f.date);
    if (filter === 'overdue') return f.status === 'pending' && isOverdue(f.date);
    return true;
  });

  const toggleStatus = (clientId, fuId, currentStatus) => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, followUps: c.followUps.map(f => f.id === fuId ? { ...f, status: newStatus } : f) } : c));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-2 overflow-x-auto">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'all' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>جميع المتابعات</button>
        <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'upcoming' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>متابعات قادمة</button>
        <button onClick={() => setFilter('overdue')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${filter === 'overdue' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>متابعات متأخرة</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-right min-w-[600px] border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr><th className="p-4 border-b">العميل</th><th className="p-4 border-b">التاريخ</th><th className="p-4 border-b">تواصل</th><th className="p-4 border-b text-center">إجراء</th></tr>
          </thead>
          <tbody className="divide-y">
            {filteredFollowUps.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-500">لا توجد متابعات في هذا القسم.</td></tr>
            ) : (
              filteredFollowUps.map(fu => (
                <tr key={fu.id} className={`hover:bg-gray-50 transition ${isOverdue(fu.date) && fu.status === 'pending' ? 'bg-red-50' : ''}`}>
                  <td className="p-4 font-bold">{fu.clientName}</td>
                  <td className="p-4 text-sm" dir="ltr">{fu.date}</td>
                  <td className="p-4">
                    {fu.clientPhone && <a href={`https://wa.me/2${fu.clientPhone.replace(/^0+/, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-full transition"><MessageCircle size={18} /></a>}
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => toggleStatus(fu.clientId, fu.id, fu.status)} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition shadow-sm ${fu.status === 'completed' ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                      {fu.status === 'completed' ? 'تراجع' : 'تأكيد الزيارة'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AIAssistantView({ clients }) {
  const [aiOutput, setAiOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  const handleCustomQuery = async () => {
    if (!customPrompt) return;
    setLoading(true);
    const result = await callGemini(customPrompt, "أنت خبير فني وإداري متخصص في شركات مكافحة الحشرات. أجب باللغة العربية بأسلوب احترافي ومفيد.");
    setAiOutput(result);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b flex items-center gap-3">
            <Sparkles className="text-green-600" size={28}/>
            <div>
               <h2 className="text-xl font-bold text-green-800">مساعد الذكاء الاصطناعي ✨</h2>
               <p className="text-sm text-green-600">اسأل المساعد عن أي استشارات فنية أو إدارية تخص العمل.</p>
            </div>
         </div>
         <div className="p-6 space-y-4">
           <textarea 
              placeholder="مثال: كيف أتعامل مع شكوى عميل من ظهور صراصير بعد الرش بيومين؟"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-4 border rounded-xl min-h-[120px] outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
            />
            <button 
              onClick={handleCustomQuery}
              disabled={loading || !customPrompt}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 shadow-md transition"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
              إرسال الاستفسار
            </button>
         </div>
         {aiOutput && (
           <div className="p-6 bg-gray-50 border-t">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={20} />
                الإجابة:
              </h3>
              <div className="bg-white p-5 rounded-xl border border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                {aiOutput}
              </div>
           </div>
         )}
      </div>
    </div>
  );
}

function LoginView({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 font-[Tajawal]">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md text-center border border-white">
        <div className="w-20 h-20 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
          <AlertTriangle size={40} className="text-white -rotate-3"/>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-800">كلين كنترول</h1>
        <p className="text-gray-500 mb-8">نظام الإدارة الذكي لمكافحة الحشرات</p>
        <div className="space-y-4 text-right">
           <input type="text" placeholder="اسم المستخدم" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={u} onChange={e=>setU(e.target.value)}/>
           <input type="password" placeholder="كلمة المرور" className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={p} onChange={e=>setP(e.target.value)}/>
           <button onClick={() => onLogin(u, p)} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition shadow-lg active:scale-95">دخول للنظام</button>
        </div>
      </div>
    </div>
  );
}