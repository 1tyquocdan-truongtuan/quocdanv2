
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimType, SimEntry } from '../../types';
import { getMenhAndColor } from '../../utils/simLogic';
import { customerNames } from '../constants/customerNames';
import { supabase } from '../../App';

interface CustomerViewProps {
  onAdminAccess: () => void;
  rawData: SimEntry[];
  formatPhoneSmart: (item: SimEntry) => string;
  getAutoPrice: (item: SimEntry) => string;
}

const SidebarBanners = () => {
  const [orders, setOrders] = useState<{ name: string; phone: string; time: string }[]>([]);

  useEffect(() => {
    const abbreviateName = (fullName: string) => {
      const parts = fullName.split(' ');
      if (parts.length > 1) {
        return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
      }
      return fullName;
    };

    const generateOrders = () => {
      const now = Date.now();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      const viettelPrefixes = ['098', '097', '096', '086', '032', '033', '034', '035', '036', '037', '038', '039'];
      
      // Get last used names from localStorage
      let usedNames: Record<string, number> = {};
      try {
        const stored = localStorage.getItem('sim_used_names');
        if (stored) usedNames = JSON.parse(stored);
      } catch (e) {
        console.error('Error reading used names', e);
      }

      // Filter names that haven't been used in the last 7 days
      let availableNames = customerNames.filter(name => {
        const lastUsed = usedNames[name] || 0;
        return (now - lastUsed) > sevenDaysInMs;
      });

      // If not enough names, pick the ones used longest ago
      if (availableNames.length < 6) {
        availableNames = [...customerNames].sort((a, b) => (usedNames[a] || 0) - (usedNames[b] || 0));
      }

      // Shuffle available names
      availableNames.sort(() => Math.random() - 0.5);

      const newOrders = [];
      let currentTime = new Date();
      
      for (let i = 0; i < 6; i++) {
        const fullName = availableNames[i];
        usedNames[fullName] = now; // Update last used time

        const prefix = viettelPrefixes[Math.floor(Math.random() * viettelPrefixes.length)];
        const suffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const middle = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const phone = `${prefix}${middle}***${suffix}`;
        
        // Random interval between 29-61 minutes
        const interval = Math.floor(Math.random() * (61 - 29 + 1)) + 29;
        currentTime = new Date(currentTime.getTime() - interval * 60000);
        
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        
        newOrders.push({
          name: abbreviateName(fullName),
          phone,
          time: `${hours}h${minutes}`
        });
      }

      // Save back to localStorage
      try {
        localStorage.setItem('sim_used_names', JSON.stringify(usedNames));
      } catch (e) {
        console.error('Error saving used names', e);
      }

      return newOrders;
    };

    setOrders(generateOrders());
    const interval = setInterval(() => {
      setOrders(generateOrders());
    }, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex flex-col gap-6 w-[320px] shrink-0">
    {/* Hướng dẫn */}
    <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6">
      <h3 className="text-base font-black text-slate-800 uppercase mb-6 tracking-wider border-b border-red-50 pb-3 flex items-center gap-2">
        <i className="fa-solid fa-book-open text-viettel-red"></i> HƯỚNG DẪN
      </h3>
      <div className="space-y-5">
        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 hover:shadow-md transition-shadow">
          <p className="text-sm font-black text-viettel-red mb-3 flex items-center gap-2">
            <i className="fa-solid fa-sim-card text-lg"></i>
            Mua sim số đẹp
          </p>
          <ul className="text-xs text-slate-600 space-y-2 list-none ml-0 font-medium">
            <li className="flex gap-2 items-start"><span className="text-viettel-red mt-0.5"><i className="fa-solid fa-check-circle"></i></span> <span>Bước 1: Chọn gói cước phù hợp.</span></li>
            <li className="flex gap-2 items-start"><span className="text-viettel-red mt-0.5"><i className="fa-solid fa-check-circle"></i></span> <span>Bước 2: Lựa chọn số đẹp yêu thích.</span></li>
            <li className="flex gap-2 items-start"><span className="text-viettel-red mt-0.5"><i className="fa-solid fa-check-circle"></i></span> <span>Bước 3: Bấm "MUA" để hoàn tất.</span></li>
          </ul>
        </div>
        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 hover:shadow-md transition-shadow">
          <p className="text-sm font-black text-viettel-red mb-3 flex items-center gap-2">
            <i className="fa-solid fa-box-open text-lg"></i>
            Đăng ký gói cước
          </p>
          <ul className="text-xs text-slate-600 space-y-2 list-none ml-0 font-medium">
            <li className="flex gap-2 items-start"><span className="text-viettel-red mt-0.5"><i className="fa-solid fa-check-circle"></i></span> <span>Bước 1: Chọn gói cước mong muốn.</span></li>
            <li className="flex gap-2 items-start"><span className="text-viettel-red mt-0.5"><i className="fa-solid fa-check-circle"></i></span> <span>Bước 2: Bấm "ĐĂNG KÝ NGAY".</span></li>
            <li className="flex gap-2 items-start"><span className="text-viettel-red mt-0.5"><i className="fa-solid fa-check-circle"></i></span> <span>Bước 3: Nhập SĐT để xác nhận.</span></li>
          </ul>
        </div>
      </div>
    </div>

    {/* Thủ tục đăng ký sim */}
    <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6">
      <h3 className="text-base font-black text-slate-800 uppercase mb-6 tracking-wider border-b border-red-50 pb-3 flex items-center gap-2">
        <i className="fa-solid fa-file-signature text-viettel-red"></i> THỦ TỤC ĐĂNG KÝ
      </h3>
      <div className="text-xs text-slate-600 space-y-3 leading-relaxed font-medium">
        <p className="font-black text-slate-800 text-sm">Thủ tục hòa mạng bao gồm:</p>
        <p className="flex gap-2 items-start"><span className="text-viettel-red mt-0.5"><i className="fa-solid fa-id-card"></i></span> <span>Người VN: Bản chính CCCD còn hạn.</span></p>
        <p className="flex gap-2 items-start"><span className="text-viettel-red mt-0.5"><i className="fa-solid fa-passport"></i></span> <span>Người nước ngoài: Hộ chiếu còn hạn.</span></p>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mt-4">
          <p className="text-viettel-red font-black mb-2 flex items-center gap-2"><i className="fa-solid fa-triangle-exclamation"></i> Lưu ý quan trọng:</p>
          <p className="text-[11px] mb-1">• 01 CCCD đặt tối đa 3 đơn/ngày, 10 đơn/tháng.</p>
          <p className="text-[11px]">• 01 CCCD đăng ký không quá 3 sim trả trước.</p>
        </div>
      </div>
    </div>

    {/* BÁN HÀNG ONLINE */}
    <div className="bg-white rounded-3xl shadow-sm border border-red-100 overflow-hidden">
      <div className="bg-gradient-to-r from-viettel-red to-red-500 p-4 text-center">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
          <i className="fa-solid fa-headset"></i> HỖ TRỢ TRỰC TUYẾN
        </h3>
      </div>
      <div className="p-6 space-y-4">
        <a href="tel:0359247247" className="w-full py-4 bg-white border-2 border-viettel-red text-viettel-red rounded-full flex items-center justify-center gap-3 shadow-sm hover:bg-viettel-red hover:text-white transition-all active:scale-95">
          <i className="fa-solid fa-phone-volume text-xl"></i>
          <span className="text-lg font-black tracking-tight">0359 247 247</span>
        </a>
        <a href="https://zalo.me/0359247247" target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-blue-500 text-white rounded-full flex items-center justify-center gap-3 shadow-md hover:bg-blue-600 transition-all active:scale-95">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-500 text-xs font-black">Zalo</div>
          <span className="text-base font-black tracking-tight">Chat tư vấn Zalo</span>
        </a>
        <div className="text-center pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">GÓP Ý, KHIẾU NẠI:</p>
          <p className="text-xl font-black text-viettel-red tracking-tight">0359 247 247</p>
        </div>
      </div>
    </div>

    {/* ĐƠN HÀNG MỚI */}
    <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 py-4 text-center">
        <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center justify-center gap-2">
          <i className="fa-solid fa-cart-shopping"></i> ĐƠN HÀNG MỚI
        </h3>
      </div>
      <div className="divide-y divide-blue-50">
        {orders.map((order, idx) => (
          <div key={idx} className="p-4 hover:bg-blue-50/30 transition-colors group">
            <div className="flex flex-col gap-1.5">
              <h4 className="text-[15px] font-black text-slate-800 group-hover:text-blue-700 transition-colors shimmer-effect inline-block">{order.name}</h4>
              <p className="text-[14px] font-bold text-slate-500 tracking-tight shimmer-effect inline-block">{order.phone}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-1 bg-blue-600 text-white text-[11px] font-black rounded-md uppercase tracking-wider shadow-sm shimmer-effect">
                  Đã đặt mua
                </span>
                <span className="text-[11px] text-slate-400 font-bold italic opacity-80">({order.time})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* CÁC DỊCH VỤ NỔI BẬT KHÁC */}
    <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-red-50 p-8">
      <h3 className="text-lg font-black text-slate-900 uppercase mb-8 tracking-tighter border-b border-red-50 pb-4 flex items-center gap-3">
        <div className="w-2 h-6 bg-viettel-red rounded-full shadow-[0_0_10px_rgba(238,0,51,0.3)]"></div>
        DỊCH VỤ NỔI BẬT
      </h3>
      <div className="grid grid-cols-2 gap-y-10 gap-x-6">
        {[
          { icon: 'fa-wifi', label: 'Internet - TV', color: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-200' },
          { icon: 'fa-file-invoice-dollar', label: 'Thanh toán', color: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200' },
          { icon: 'fa-shield-halved', label: 'Bảo hiểm', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-200' },
          { icon: 'fa-hand-holding-dollar', label: 'Vay tiền mặt', color: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-200' },
          { icon: 'fa-building-columns', label: 'Ngân hàng', color: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-200' },
          { icon: 'fa-money-bill-transfer', label: 'Chuyển tiền', color: 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-200' },
        ].map((item, idx) => (
          <div key={idx} className="flex flex-col items-center text-center gap-4 group cursor-pointer">
            <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-4xl shadow-[0_15px_35px_rgba(0,0,0,0.15)] transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-[0_25px_50px_rgba(0,0,0,0.2)] ${item.color}`}>
              <i className={`fa-solid ${item.icon} drop-shadow-lg`}></i>
            </div>
            <span className="text-sm font-black text-slate-800 leading-tight px-1 group-hover:text-viettel-red transition-colors tracking-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Bài viết liên quan */}
    <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-6">
      <h3 className="text-sm font-black text-slate-800 uppercase mb-6 tracking-wider border-b border-red-50 pb-3 flex items-center gap-2">
        <i className="fa-solid fa-newspaper text-viettel-red"></i> TIN TỨC MỚI
      </h3>
      <div className="space-y-5">
        {[
          { title: 'Ưu đãi mua kèm pháo hoa dành cho khách hàng mua sắm SIM số đẹp tại Viettel Store', date: '08/12/2025 | 05:26 PM', img: 'https://picsum.photos/seed/news1/100/60' },
          { title: 'Viettel Store mở bán SIM du lịch quốc tế ưu đãi chỉ từ 70k', date: '08/12/2025 | 09:11 AM', img: 'https://picsum.photos/seed/news2/100/60' },
          { title: 'Viettel Store chính thức mở bán vé Sao Nhập Ngũ Concert 2025', date: '18/08/2025 | 10:36 AM', img: 'https://picsum.photos/seed/news3/100/60' },
        ].map((news, idx) => (
          <div key={idx} className="flex gap-4 group cursor-pointer items-center">
            <div className="w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
              <img src={news.img} alt="News" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[12px] font-black text-slate-800 line-clamp-2 group-hover:text-viettel-red transition-colors leading-snug">{news.title}</h4>
              <p className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1"><i className="fa-regular fa-clock"></i> {news.date}</p>
            </div>
          </div>
        ))}
        <button className="w-full py-4 text-xs font-black text-viettel-red bg-red-50 rounded-2xl hover:bg-viettel-red hover:text-white transition-all border border-red-100">
          Xem tất cả tin tức
        </button>
      </div>
    </div>
  </div>
  );
};

const CustomerView: React.FC<CustomerViewProps> = ({ onAdminAccess, rawData, formatPhoneSmart, getAutoPrice }) => {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'category', 'promo', 'store', 'news'
  const [activeCategory, setActiveCategory] = useState('sim'); // 'internet', 'sim', 'camera', 'tv', 'utility'
  const [showSimList, setShowSimList] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menhFilter, setMenhFilter] = useState('Tất cả');
  const [simTypeFilter, setSimTypeFilter] = useState('Tất cả');
  const [priceFilters, setPriceFilters] = useState<string[]>([]);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSimForPurchase, setSelectedSimForPurchase] = useState<SimEntry | null>(null);
  const [purchaseFormData, setPurchaseFormData] = useState({
    fullName: '',
    cccd: '',
    contactPhone: '',
    address: '',
    note: ''
  });
  const [isPurchaseSuccess, setIsPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [cart, setCart] = useState<SimEntry[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [phoneNumberToScore, setPhoneNumberToScore] = useState('');
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [phongThuyResult, setPhongThuyResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activePackageTab, setActivePackageTab] = useState('all'); // 'all', 'internet', 'tv', 'combo', 'camera'
  const [selectedPackageForDetail, setSelectedPackageForDetail] = useState<any | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAll5GPlans, setShowAll5GPlans] = useState(false);
  const [showAllComboPlans, setShowAllComboPlans] = useState(false);
  const [showAllSuperDataPlans, setShowAllSuperDataPlans] = useState(false);
  const [showAllSocialPlans, setShowAllSocialPlans] = useState(false);
  const [showAllTravelPlans, setShowAllTravelPlans] = useState(false);
  const [showSimSelectionMenu, setShowSimSelectionMenu] = useState<string | null>(null); // Store plan ID or unique key
  const [simFilter, setSimFilter] = useState<'all' | 'dep' | 'phongthuy'>('all');
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const packageDetails: Record<string, any> = {
    'V120B': {
      name: 'V120B',
      benefits: [
        'Miễn phí 10 phút đầu tiên /cuộc gọi nội mạng.',
        'Miễn phí 50 phút ngoại mạng.',
        'Miễn phí 45GB data tốc độ cao /tháng (1.5GB/ngày) Sử dụng hết 1.5GB lưu lượng tốc độ cao dừng truy cập'
      ],
      cycle: '30 ngày tính từ ngày đăng ký/ gia hạn thành công',
      price: '120.000đ/30 ngày',
      renewal: 'Có tính năng gia hạn hạ bậc: Được gia hạn với phí tương ứng với số dư tài khoản gốc tại thời điểm gia hạn thất bại, tối thiểu bằng 10% phí gói và là bội số của 10.000đ.',
      syntax: [
        'Kiểm tra lưu lượng Data: KTTK gửi 191',
        'Hủy gia hạn gói: HUY gửi 191'
      ]
    },
    'V150B': {
      name: 'V150B',
      benefits: [
        'Miễn phí 10 phút đầu tiên /cuộc gọi nội mạng.',
        'Miễn phí 80 phút ngoại mạng.',
        'Miễn phí 60GB data tốc độ cao /tháng (2GB/ngày) Sử dụng hết 2GB lưu lượng tốc độ cao dừng truy cập'
      ],
      cycle: '30 ngày tính từ ngày đăng ký/ gia hạn thành công',
      price: '150.000đ/30 ngày',
      renewal: 'Có tính năng gia hạn hạ bậc tương tự V120B.',
      syntax: [
        'Kiểm tra lưu lượng Data: KTTK gửi 191',
        'Hủy gia hạn gói: HUY gửi 191'
      ]
    },
    '5G160B': {
      name: '5G160B',
      benefits: [
        'Miễn phí 10 phút đầu tiên /cuộc gọi nội mạng.',
        'Miễn phí 100 phút ngoại mạng.',
        'Miễn phí 120GB data tốc độ cao /tháng (4GB/ngày) Sử dụng hết 4GB lưu lượng tốc độ cao dừng truy cập',
        'Miễn phí data xem TV360 gói Standard'
      ],
      cycle: '30 ngày tính từ ngày đăng ký/ gia hạn thành công',
      price: '160.000đ/30 ngày',
      renewal: 'Tự động gia hạn khi hết chu kỳ.',
      syntax: [
        'Kiểm tra lưu lượng Data: KTTK gửi 191',
        'Hủy gia hạn gói: HUY gửi 191'
      ]
    },
    '5G180B': {
      name: '5G180B',
      benefits: [
        'Miễn phí 10 phút đầu tiên /cuộc gọi nội mạng.',
        'Miễn phí 100 phút ngoại mạng.',
        'Miễn phí 180GB data tốc độ cao /tháng (6GB/ngày) Sử dụng hết 6GB lưu lượng tốc độ cao dừng truy cập',
        'Miễn phí data xem TV360 gói Standard'
      ],
      cycle: '30 ngày tính từ ngày đăng ký/ gia hạn thành công',
      price: '180.000đ/30 ngày',
      renewal: 'Tự động gia hạn khi hết chu kỳ.',
      syntax: [
        'Kiểm tra lưu lượng Data: KTTK gửi 191',
        'Hủy gia hạn gói: HUY gửi 191'
      ]
    },
    '5G135N': {
      name: '5G135N',
      benefits: [
        'Miễn phí 180GB data tốc độ cao /tháng (6GB/ngày)',
        'Miễn phí data xem TV360 gói Standard',
        'Sử dụng hết data dừng truy cập'
      ],
      cycle: '30 ngày',
      price: '135.000đ/30 ngày',
      renewal: 'Tự động gia hạn.',
      syntax: [
        'Kiểm tra lưu lượng Data: KTTK gửi 191',
        'Hủy gia hạn gói: HUY gửi 191'
      ]
    },
    'MXH120': {
      name: 'MXH120',
      benefits: [
        'Miễn phí 30GB data tốc độ cao /tháng (1GB/ngày)',
        'Miễn phí data truy cập Facebook, Tiktok, Youtube',
        'Miễn phí gọi nội mạng < 10p, 30p ngoại mạng'
      ],
      cycle: '30 ngày',
      price: '120.000đ/30 ngày',
      renewal: 'Tự động gia hạn.',
      syntax: [
        'Kiểm tra lưu lượng Data: KTTK gửi 191',
        'Hủy gia hạn gói: HUY gửi 191'
      ]
    }
  };

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, menhFilter, simTypeFilter, priceFilters]);

  const availableSimTypes = useMemo(() => {
    const types = new Set<string>();
    rawData.forEach(sim => {
      if (sim.simTypes) {
        sim.simTypes.forEach(t => types.add(t));
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [rawData]);

  const filteredSims = useMemo(() => {
    let cleanQuery = searchQuery.trim().replace(/[\s.]/g, '');
    
    let prefix = '';
    let suffix = '';
    if (cleanQuery.startsWith('*') && cleanQuery.endsWith('*') && cleanQuery.length > 2) {
      cleanQuery = cleanQuery.slice(1, -1);
    } else if (cleanQuery.startsWith('*') && cleanQuery.length > 1) {
      cleanQuery = cleanQuery.slice(1);
      suffix = '$';
    } else if (cleanQuery.endsWith('*') && cleanQuery.length > 1) {
      cleanQuery = cleanQuery.slice(0, -1);
      prefix = '^';
    }

    const isNumericQuery = /^\d+$/.test(cleanQuery);

    return rawData.filter(sim => {
      let matchesSearch = true;
      if (cleanQuery) {
        if (isNumericQuery) {
          const regex = new RegExp(prefix + cleanQuery + suffix);
          matchesSearch = regex.test(sim.normalizedPhone);
        } else {
          // Search in sim types or detail if not numeric
          const queryLower = cleanQuery.toLowerCase();
          matchesSearch = 
            sim.simTypes.some(t => t.toLowerCase().includes(queryLower)) ||
            (sim.unitAdvanceDetail?.toLowerCase().includes(queryLower) ?? false);
        }
      }
      
      const matchesMenh = menhFilter === 'Tất cả' || sim.menh === menhFilter;
      const matchesSimType = simTypeFilter === 'Tất cả' || (sim.simTypes && sim.simTypes.includes(simTypeFilter as any));
      
      // Price filtering logic
      let matchesPrice = true;
      if (priceFilters.length > 0) {
        const currentPrice = getAutoPrice(sim);
        let priceNum = parseInt(currentPrice?.replace(/\D/g, '') || '0');
        // Normalize price: if price is less than 10000, assume it's in thousands (e.g., 620 -> 620,000)
        if (priceNum > 0 && priceNum < 10000) priceNum *= 1000;
        
        matchesPrice = priceFilters.some(filter => {
          if (filter === 'Dưới 300k') return priceNum < 300000;
          if (filter === '300k-400k') return priceNum >= 300000 && priceNum <= 400000;
          if (filter === '400k-600k') return priceNum > 400000 && priceNum <= 600000;
          if (filter === '600k-1 triệu') return priceNum > 600000 && priceNum <= 1000000;
          if (filter === '1 triệu - 2 triệu') return priceNum > 1000000 && priceNum <= 2000000;
          if (filter === 'Trên 2tr') return priceNum > 2000000;
          return false;
        });
      }

      // Sim Filter logic (Số Đẹp / Phong Thủy)
      let matchesSimFilter = true;
      if (simFilter === 'dep') {
        matchesSimFilter = sim.simTypes.some(t => t.includes('Số Đẹp') || t.includes('VIP') || t.includes('Tứ Quý') || t.includes('Tam Hoa'));
      } else if (simFilter === 'phongthuy') {
        matchesSimFilter = sim.menh !== 'Không xác định';
      }

      return matchesSearch && matchesMenh && matchesSimType && matchesPrice && matchesSimFilter;
    });
  }, [rawData, searchQuery, menhFilter, simTypeFilter, priceFilters, getAutoPrice, simFilter]);

  const highlightSearchText = (formattedPhone: string, query: string) => {
    if (!query) return <>{formattedPhone}</>;
    
    const cleanQuery = query.trim().replace(/[\s.]/g, '');
    if (!cleanQuery) return <>{formattedPhone}</>;

    const unformattedPhone = formattedPhone.replace(/\./g, '');
    const matchIndex = unformattedPhone.indexOf(cleanQuery);

    if (matchIndex === -1) return <>{formattedPhone}</>;

    let formattedStartIndex = -1;
    let formattedEndIndex = -1;
    let unformattedCurrentIndex = 0;

    for (let i = 0; i < formattedPhone.length; i++) {
      if (formattedPhone[i] !== '.') {
        if (unformattedCurrentIndex === matchIndex) {
          formattedStartIndex = i;
        }
        if (unformattedCurrentIndex === matchIndex + cleanQuery.length - 1) {
          formattedEndIndex = i;
          break;
        }
        unformattedCurrentIndex++;
      }
    }

    if (formattedStartIndex !== -1 && formattedEndIndex !== -1) {
      const before = formattedPhone.substring(0, formattedStartIndex);
      const match = formattedPhone.substring(formattedStartIndex, formattedEndIndex + 1);
      const after = formattedPhone.substring(formattedEndIndex + 1);

      return (
        <>
          {before}
          <span className="text-viettel-red">{match}</span>
          {after}
        </>
      );
    }

    return <>{formattedPhone}</>;
  };

  const renderColoredPhone = (sim: SimEntry) => {
    const formatted = formatPhoneSmart(sim);
    const lastDotIndex = formatted.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return <span className="text-green-600">{formatted}</span>;
    }
    const prefix = formatted.substring(0, lastDotIndex);
    const suffix = formatted.substring(lastDotIndex);
    return (
      <>
        <span className="text-green-600">{prefix}</span>
        <span className="text-red-500">{suffix}</span>
      </>
    );
  };

  const totalPages = Math.ceil(filteredSims.length / itemsPerPage);
  const currentSims = filteredSims.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderInternetTabContent = () => {
    return (
      <div className="space-y-0 -mt-4 -mx-4">
        {/* Breadcrumb & Banner */}
        <div className="bg-gradient-to-r from-viettel-red to-red-700 pt-6 pb-12 px-6 text-white relative overflow-hidden">
          <div className="flex items-center gap-2 text-[10px] font-medium opacity-90 mb-8 relative z-10">
            <span>Trang chủ</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
            <span>Internet-TV360-Camera</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
            <span className="font-bold opacity-100">Internet</span>
          </div>
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-black leading-tight mb-2 tracking-tight uppercase">
              ĐĂNG KÝ INTERNET CHO<br />NGÔI NHÀ CỦA BẠN
            </h2>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none flex items-center justify-center">
             <i className="fa-solid fa-earth-asia text-[200px] rotate-12"></i>
          </div>
        </div>

        {/* Section 1: Mesh Wifi */}
        <div className="bg-white py-10 px-4">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-lg font-black text-slate-800 uppercase leading-tight max-w-[250px]">
              Các gói cước tốc độ cao, tích hợp giải pháp Mesh wifi
            </h3>
            <button className="text-viettel-red text-xs font-bold hover:underline">Xem tất cả</button>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x snap-mandatory px-2">
            {[
              { 
                id: 'MESHVT1_T', 
                speed: '300 Mbps', 
                price: '210.000đ', 
                desc: 'Áp dụng tại 32 Tỉnh và ngoại thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng. Thiết bị: 01 Modem Wifi6 + 01 thiết bị MeshWifi' 
              },
              { 
                id: 'MESHVT2_T', 
                speed: 'Từ 500Mbps đến 1Gbps', 
                price: '245.000đ', 
                desc: 'Áp dụng tại 32 Tỉnh và ngoại thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng. Thiết bị: 01 Modem Wifi6 + 01 thiết bị MeshWifi' 
              },
              { 
                id: 'MESHVT3_T', 
                speed: 'Từ 500Mbps đến 1Gbps', 
                price: '299.000đ', 
                desc: 'Áp dụng tại 32 Tỉnh và ngoại thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng. Thiết bị: 01 Modem Wifi6 + 01 thiết bị MeshWifi' 
              },
              { 
                id: 'MESHVT1_H', 
                speed: '300 Mbps', 
                price: '255.000đ', 
                desc: 'Áp dụng tại Nội thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng. Thiết bị: 01 Modem Wifi6 + 01 thiết bị MeshWifi' 
              },
            ].map(pkg => (
              <div key={pkg.id} className="min-w-[280px] bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-viettel-red flex flex-col snap-center transition-all group">
                <div className="bg-red-50 p-4 flex justify-center items-center border-b border-red-100 group-hover:bg-viettel-red transition-colors">
                  <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/50 shadow-sm">
                    <div className="text-viettel-red font-black tracking-widest text-sm group-hover:text-red-700 transition-colors">{pkg.id}</div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl group-hover:bg-red-50/50 transition-colors">
                      <div className="w-6 h-6 flex items-center justify-center text-viettel-red mt-0.5">
                        <i className="fa-solid fa-gauge-high text-lg"></i>
                      </div>
                      <div className="text-sm font-black text-slate-800">Tốc độ: {pkg.speed}</div>
                    </div>
                    <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl group-hover:bg-red-50/50 transition-colors">
                      <div className="w-6 h-6 flex items-center justify-center text-viettel-red mt-0.5">
                        <i className="fa-solid fa-display text-base"></i>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        {pkg.desc}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto text-center">
                    <div className="text-2xl font-black text-viettel-red mb-4">
                      {pkg.price}<span className="text-xs font-bold text-slate-400">/tháng</span>
                    </div>
                    <button className="w-full py-4 bg-viettel-red text-white rounded-xl text-sm font-black shadow-md shadow-red-200 hover:bg-red-700 transition-colors">
                      Đăng ký
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Wifi 6 (Red Background) */}
        <div className="bg-gradient-to-r from-viettel-red to-red-700 py-12 px-4 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 px-2 relative z-10">
            <h3 className="text-lg font-black text-white uppercase leading-tight">
              Gói cước WIFI 6 tốc độ cao
            </h3>
            <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-lg p-1">
              <img src="https://picsum.photos/seed/robot/50/50" alt="Robot" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
            </div>
          </div>
          
          <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x snap-mandatory w-full relative z-10">
            {[
              { id: 'NETVT01_T', speed: '300 Mbps', price: '195.000đ', desc: 'KH tại 32 Tỉnh và Ngoại thành HNI, HCM Tặng 1 tháng khi đóng 12 tháng' },
              { id: 'NETVT2_T', speed: 'Từ 500Mbps đến 1Gbps', price: '240.000đ', desc: 'Áp dụng tại 32 Tỉnh và ngoại thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng.' },
              { id: 'NETVT01_H', speed: '300 Mbps', price: '235.000đ', desc: 'KH tại Nội thành HNI, HCM. HCMTặng 1 tháng khi đóng 12 tháng' },
              { id: 'NETVT2_H', speed: 'Từ 500Mbps đến 1Gbps', price: '265.000đ', desc: 'Áp dụng tại Nội thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng.' },
            ].map(pkg => (
              <div key={pkg.id} className="min-w-[280px] bg-white rounded-3xl overflow-hidden shadow-xl flex flex-col snap-center hover:-translate-y-1 transition-transform">
                 <div className="p-6 flex-1 flex flex-col">
                  <div className="text-center mb-6">
                     <div className="text-lg font-black text-viettel-red mb-2">{pkg.id}</div>
                     <div className="w-12 h-1 bg-red-100 mx-auto rounded-full"></div>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3 bg-red-50/50 p-3 rounded-xl">
                      <div className="w-6 h-6 flex items-center justify-center text-viettel-red mt-0.5">
                        <i className="fa-solid fa-gauge-high text-lg"></i>
                      </div>
                      <div className="text-sm font-black text-slate-800">Tốc độ: {pkg.speed}</div>
                    </div>
                    <div className="flex items-start gap-3 bg-red-50/50 p-3 rounded-xl">
                      <div className="w-6 h-6 flex items-center justify-center text-viettel-red mt-0.5">
                        <i className="fa-solid fa-display text-base"></i>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        {pkg.desc}
                      </p>
                    </div>
                  </div>
                  <div className="mt-auto text-center">
                    <div className="text-2xl font-black text-viettel-red mb-4">
                      {pkg.price}<span className="text-xs font-bold text-slate-400">/tháng</span>
                    </div>
                    <button className="w-full py-4 border-2 border-viettel-red text-viettel-red rounded-xl text-sm font-black hover:bg-viettel-red hover:text-white transition-colors">
                      Đăng ký
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Why Viettel? */}
        <div className="bg-slate-50 py-16 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
               <div className="relative">
                 <img src="https://picsum.photos/seed/viettel-quality/600/450" alt="Viettel Quality" className="w-full h-auto rounded-3xl shadow-xl relative z-10 border-4 border-white" referrerPolicy="no-referrer" />
                 <div className="absolute -top-6 -left-6 w-32 h-32 bg-red-100 rounded-full -z-0"></div>
                 <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-white rounded-full shadow-sm -z-0"></div>
               </div>
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight tracking-tight">
                Điều gì khiến khách hàng luôn tin tưởng và sử dụng Internet Viettel?
              </h3>
              <div className="w-16 h-1.5 bg-viettel-red rounded-full"></div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Tốc độ truy cập internet cao và ổn định. Sở hữu hơn 365.000 km cáp quang và nhiều đường truyền cáp quang kết nối quốc tế trên biển và đất liền, đảm bảo tốt nhất dịch vụ cho Khách hàng. Áp dụng các công nghệ tiên tiến nhất nhằm mang lại trải nghiệm tối đa cho Khách hàng trong quá trình sử dụng dịch vụ (mesh wifi, xGSPON, Camera AI...)
              </p>
              <div className="pt-4">
                <button className="px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-black text-sm hover:border-viettel-red hover:text-viettel-red transition-all shadow-sm">Tìm hiểu thêm</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTVTabContent = () => {
    return (
      <div className="space-y-0 -mt-4 -mx-4 bg-slate-50 min-h-screen">
        {/* Breadcrumb & Banner */}
        <div className="bg-gradient-to-r from-viettel-red to-red-700 pt-6 pb-12 px-6 text-white relative overflow-hidden">
          <div className="flex items-center gap-2 text-[10px] font-medium opacity-90 mb-8 relative z-10">
            <span>Trang chủ</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
            <span>Internet-TV360-Camera</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
            <span className="font-bold opacity-100">TV360</span>
          </div>
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-black leading-tight mb-2 tracking-tight uppercase">
              ĐĂNG KÝ TRUYỀN HÌNH<br />CHO NGÔI NHÀ CỦA BẠN
            </h2>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none flex items-center justify-center">
             <i className="fa-solid fa-tv text-[200px] rotate-12"></i>
          </div>
        </div>

        {/* TV360 App Packages */}
        <div className="bg-white py-10 px-4">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-lg font-black text-slate-800 uppercase leading-tight max-w-[250px]">
              Gói cước Ứng dụng TV360
            </h3>
            <button className="text-viettel-red text-xs font-bold hover:underline">Xem tất cả</button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x snap-mandatory px-2">
            {[
              { id: 'TV360_APP_20', price: '20.000đ', channels: '100 kênh truyền hình' },
              { id: 'TV360_APP_40', price: '40.000đ', channels: '150 kênh truyền hình' },
              { id: 'TV360_APP_60', price: '60.000đ', channels: '200 kênh truyền hình' },
            ].map(pkg => (
              <div key={pkg.id} className="min-w-[280px] bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-viettel-red flex flex-col snap-center transition-all group">
                {/* Card Header with Red Gradient */}
                <div className="bg-red-50 p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[160px] border-b border-red-100 group-hover:bg-viettel-red transition-colors">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-4 text-viettel-red group-hover:text-white transition-colors">
                      <span className="text-4xl font-black italic tracking-tighter">TV</span>
                      <div className="bg-white text-viettel-red rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
                        <i className="fa-solid fa-play text-lg ml-1"></i>
                      </div>
                      <span className="text-4xl font-black italic tracking-tighter">360</span>
                      <span className="text-3xl font-light ml-1">App</span>
                    </div>
                    <div className="px-6 py-1.5 bg-white/80 backdrop-blur-md border border-white/50 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm text-viettel-red group-hover:text-red-700 transition-colors">
                      GIẢI TRÍ
                    </div>
                  </div>
                </div>

                {/* Red Bar */}
                <div className="bg-red-100 py-2 px-4 text-center group-hover:bg-red-200 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-800">
                    Miễn phí data 4G Viettel khi xem trên di động
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-6 text-center">
                    <div className="text-3xl font-black text-viettel-red mb-1">{pkg.price}<span className="text-xs font-bold text-slate-400 ml-1">/tháng</span></div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl group-hover:bg-red-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-viettel-red shadow-sm">
                        <i className="fa-solid fa-tv text-sm"></i>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{pkg.channels}</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl group-hover:bg-red-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-viettel-red shadow-sm">
                        <i className="fa-solid fa-display text-sm"></i>
                      </div>
                      <span className="text-sm font-bold text-slate-700">Cài đặt trên Smart TV</span>
                    </div>
                  </div>

                  <button className="w-full py-4 bg-viettel-red text-white rounded-xl text-sm font-black shadow-md shadow-red-200 hover:bg-red-700 transition-colors mt-auto">
                    Đăng ký
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Combo Section */}
        <div className="bg-slate-50 py-12 px-4 border-t border-slate-100">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">GÓI COMBO</h3>
            <button className="text-viettel-red text-xs font-bold hover:underline">Xem tất cả</button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-8 no-scrollbar snap-x snap-mandatory px-2">
            {[
              { id: 'COMBO_1', name: 'NETVT01T_GIAITRI_CAM1', price: '299.000đ' },
              { id: 'COMBO_2', name: 'NETVT02T_GIAITRI_CAM2', price: '349.000đ' },
            ].map(combo => (
              <div key={combo.id} className="min-w-[300px] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-viettel-red flex flex-col snap-center border border-slate-100 transition-all group">
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/${combo.id}/400/200`} alt="Combo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-viettel-red text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      HOT
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-white flex-1 flex flex-col">
                  <h4 className="text-sm font-black mb-4 text-slate-800 uppercase tracking-tight group-hover:text-viettel-red transition-colors">{combo.name}</h4>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-viettel-red"></div>
                      <span className="text-[11px] font-bold text-slate-500">01 thiết bị Wifi 6 đời mới</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-viettel-red"></div>
                      <span className="text-[11px] font-bold text-slate-500">Truyền hình trên Smart TV</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-viettel-red"></div>
                      <span className="text-[11px] font-bold text-slate-500">+ Camera</span>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="text-xl font-black text-viettel-red mb-4">
                      {combo.price}<span className="text-xs font-bold text-slate-400">/tháng</span>
                    </div>
                    <button className="w-full py-4 bg-red-50 text-viettel-red rounded-xl text-sm font-black hover:bg-viettel-red hover:text-white transition-colors">
                      Đăng ký
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCameraTabContent = () => {
    return (
      <div className="space-y-0 -mt-4 -mx-4 bg-slate-50 min-h-screen">
        {/* Breadcrumb & Banner */}
        <div className="bg-gradient-to-r from-viettel-red to-red-700 pt-6 pb-12 px-6 text-white relative overflow-hidden">
          <div className="flex items-center gap-2 text-[10px] font-medium opacity-90 mb-8 relative z-10">
            <span>Trang chủ</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
            <span>Internet-TV360-Camera</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
            <span className="font-bold opacity-100">Camera</span>
          </div>
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-black leading-tight mb-2 tracking-tight uppercase">
              ĐĂNG KÝ SỬ DỤNG CAMERA VIETTEL<br />CHO NGÔI NHÀ BẠN
            </h2>
            <p className="text-xs font-medium opacity-90 mt-4 max-w-md mx-auto">
              Trang bị miễn phí Camera an ninh cho tất cả khách hàng sử dụng Internet Viettel
            </p>
          </div>
          {/* Decorative background element */}
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none flex items-center justify-center">
             <i className="fa-solid fa-video text-[200px] rotate-12"></i>
          </div>
        </div>

        {/* Section 1: Gói Combo Internet Camera */}
        <div className="py-10 bg-white">
          <div className="flex justify-between items-center mb-8 px-6">
            <h3 className="text-lg font-black text-slate-800 uppercase leading-tight max-w-[250px]">
              Gói Combo Internet Camera
            </h3>
            <button className="text-viettel-red text-xs font-bold hover:underline">Xem tất cả</button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-8 no-scrollbar snap-x snap-mandatory px-6">
            {[
              { id: 'NETVT01T_CAM1', speed: '350Mbps + 1 ng...', price: '215.000đ', desc: '01 thiết bị Wifi 6 đời mới' },
              { id: 'NETVT2T_CAM1', speed: '500Mbps đến 1...', price: '260.000đ', desc: 'Áp dụng tại thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng.' },
              { id: 'MESHVT1T_CAM1', speed: '350Mbps + 1 ng...', price: '230.000đ', desc: 'Áp dụng tại 32 Tỉnh và ngoại thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng.' },
              { id: 'MESHVT2T_CAM1', speed: '500Mbps đến 1...', price: '265.000đ', desc: 'Áp dụng tại 32 Tỉnh và ngoại thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng.' },
              { id: 'MESHVT3T_CAM1', speed: '500Mbps đến 1...', price: '319.000đ', desc: 'Áp dụng tại 32 Tỉnh và ngoại thành HNI, HCM. Tặng 1 tháng cước khi đóng cước trước 12 tháng.' },
            ].map(pkg => (
              <div key={pkg.id} className="min-w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-viettel-red border border-slate-100 flex flex-col snap-center transition-all group">
                <div className="bg-red-50 p-4 text-center border-b border-red-100 group-hover:bg-viettel-red transition-colors">
                  <span className="text-viettel-red font-black text-sm tracking-wider uppercase group-hover:text-white transition-colors">{pkg.id}</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="bg-slate-50 rounded-2xl p-5 mb-6 flex-1 group-hover:bg-red-50/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-viettel-red shadow-sm">
                        <i className="fa-solid fa-gauge-high text-sm"></i>
                      </div>
                      <div className="text-sm font-black text-slate-800">Tốc độ {pkg.speed}</div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{pkg.desc}</p>
                  </div>
                  <div className="mb-6 text-center">
                    <div className="text-2xl font-black text-viettel-red">{pkg.price}<span className="text-xs text-slate-400 ml-1">/tháng</span></div>
                  </div>
                  <button 
                    onClick={() => setSelectedPackageForDetail(pkg)}
                    className="w-full py-4 bg-viettel-red text-white rounded-xl text-sm font-black hover:bg-red-700 transition-colors shadow-md shadow-red-200"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === 0 ? 'bg-viettel-red w-8' : 'bg-slate-200'}`}></div>
            ))}
          </div>
        </div>

        {/* Section 2: Gói lưu trữ Cloud */}
        <div className="py-12 bg-slate-50 border-t border-slate-100">
          <div className="text-center mb-10 px-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight">Gói lưu trữ Cloud</h3>
            <div className="w-16 h-1 bg-viettel-red mx-auto rounded-full mb-6"></div>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Dành cho KH đang sử dụng Internet Viettel có nhu cầu trang bị thêm Camera hoặc đang sử dụng Camera Viettel có nhu cầu mua gói lưu trữ Cloud. Dữ liệu camera được bảo mật tuyệt đối trên cloud của Viettel.
            </p>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-8 no-scrollbar snap-x snap-mandatory px-6">
            {[
              { id: 'CAMERA CL1', price: '20.000đ', desc: 'Lưu trữ 1 ngày' },
              { id: 'CAMERA CL3', price: '30.000đ', desc: 'Lưu trữ 3 ngày' },
              { id: 'CAMERA CL7', price: '40.000đ', desc: 'Lưu trữ 7 ngày' },
              { id: 'CAMERA CL15', price: '60.000đ', desc: 'Lưu trữ 15 ngày' },
              { id: 'CAMERA CL30', price: '90.000đ', desc: 'Lưu trữ 30 ngày' },
            ].map(pkg => (
              <div key={pkg.id} className="min-w-[260px] bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-viettel-red border border-slate-100 flex flex-col snap-center transition-all group">
                <div className="bg-red-50 p-4 text-center border-b border-red-100 group-hover:bg-viettel-red transition-colors">
                  <span className="text-viettel-red font-black text-sm tracking-wider uppercase group-hover:text-white transition-colors">{pkg.id}</span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="bg-slate-50 rounded-2xl p-6 mb-6 flex-1 flex flex-col items-center justify-center group-hover:bg-red-50/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-viettel-red shadow-sm mb-4">
                      <i className="fa-solid fa-cloud text-xl"></i>
                    </div>
                    <p className="text-base text-slate-800 font-black leading-relaxed text-center">{pkg.desc}</p>
                  </div>
                  <div className="mb-6 text-center">
                    <div className="text-2xl font-black text-viettel-red">{pkg.price}<span className="text-xs text-slate-400 ml-1">/tháng</span></div>
                  </div>
                  <button className="w-full py-4 border-2 border-viettel-red text-viettel-red rounded-xl text-sm font-black hover:bg-viettel-red hover:text-white transition-colors shadow-sm">
                    Đăng ký
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === 0 ? 'bg-viettel-red w-8' : 'bg-slate-200'}`}></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderComboTVTabContent = () => {
    return (
      <div className="space-y-0 -mt-4 -mx-4 bg-slate-50 min-h-screen">
        {/* Breadcrumb & Header */}
        <div className="bg-gradient-to-r from-viettel-red to-red-700 pt-6 pb-12 px-6 text-white relative overflow-hidden">
          <div className="flex items-center gap-2 text-[10px] font-medium opacity-90 mb-8 relative z-10">
            <span>Trang chủ</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
            <span>Internet-TV360-Camera</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
            <span className="font-bold opacity-100">Combo Internet - TV360</span>
          </div>
          <div className="text-center relative z-10">
            <h2 className="text-2xl font-black leading-tight mb-2 tracking-tight uppercase">
              GÓI CƯỚC COMBO INTERNET + TV360
            </h2>
            <p className="text-xs font-medium opacity-90 mt-4 max-w-md mx-auto">
              Tận hưởng internet tốc độ cao cùng kho nội dung giải trí khổng lồ từ TV360
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none flex items-center justify-center">
             <i className="fa-solid fa-network-wired text-[200px] rotate-12"></i>
          </div>
        </div>

        {/* Combo Packages Section */}
        <div className="py-10 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { id: 'COMBO_TV_1', name: 'HOME TV1', speed: '150 Mbps', price: '215.000đ', tv: 'TV360 App' },
              { id: 'COMBO_TV_2', name: 'HOME TV2', speed: '250 Mbps', price: '245.000đ', tv: 'TV360 App' },
              { id: 'COMBO_TV_3', name: 'SUN1 TV', speed: '150 Mbps', price: '230.000đ', tv: 'TV360 Box' },
              { id: 'COMBO_TV_4', name: 'SUN2 TV', speed: '250 Mbps', price: '260.000đ', tv: 'TV360 Box' },
            ].map(pkg => (
              <div key={pkg.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-viettel-red border border-slate-100 flex flex-col transition-all group">
                <div className="bg-red-50 p-4 text-center border-b border-red-100 group-hover:bg-viettel-red transition-colors">
                  <span className="text-viettel-red font-black text-sm tracking-wider uppercase group-hover:text-white transition-colors">{pkg.name}</span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center group-hover:bg-red-50/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-viettel-red shadow-sm mb-2">
                        <i className="fa-solid fa-wifi text-lg"></i>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tốc độ</div>
                      <div className="text-sm font-black text-slate-800">{pkg.speed}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center group-hover:bg-red-50/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-viettel-red shadow-sm mb-2">
                        <i className="fa-solid fa-tv text-lg"></i>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Truyền hình</div>
                      <div className="text-sm font-black text-slate-800">{pkg.tv}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center mb-6">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Giá cước</div>
                    <div className="text-3xl font-black text-viettel-red">{pkg.price}<span className="text-xs font-bold text-slate-400 ml-1">/tháng</span></div>
                  </div>
                  <div className="flex gap-3 mt-auto mb-6">
                    <button 
                      onClick={() => setSelectedPackageForDetail(pkg)}
                      className="flex-1 py-4 border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:border-viettel-red hover:text-viettel-red transition-colors shadow-sm"
                    >
                      Chi tiết
                    </button>
                    <button className="flex-1 py-4 bg-viettel-red text-white rounded-xl text-xs font-black shadow-md shadow-red-200 hover:bg-red-700 transition-colors">
                      Đăng ký
                    </button>
                  </div>
                  <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-medium leading-relaxed text-center">
                    Tặng 1-2 tháng cước khi đóng trước 6-12 tháng. Miễn phí lắp đặt và trang bị Modem Wifi.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderComboTabContent = () => {
    return (
      <div className="space-y-0 -mt-4 -mx-4 bg-slate-50 min-h-screen">
        {/* Banner */}
        <div className="bg-gradient-to-r from-viettel-red to-red-700 py-12 px-6 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black uppercase mb-2 tracking-tight">Gói Combo Tiết Kiệm</h2>
            <p className="text-sm text-red-100 font-medium">Internet + Truyền hình + Camera</p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none flex items-center justify-center">
            <i className="fa-solid fa-layer-group text-[150px] -rotate-12"></i>
          </div>
        </div>

        {/* Combo List */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Combo Basic', price: '229.000đ', speed: '150 Mbps', tv: '100+ Kênh' },
              { name: 'Combo Standard', price: '299.000đ', speed: '300 Mbps', tv: '150+ Kênh', isHot: true },
              { name: 'Combo Pro', price: '399.000đ', speed: '500 Mbps', tv: '200+ Kênh' },
            ].map(combo => (
              <div key={combo.name} className={`bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col gap-6 border-2 ${combo.isHot ? 'border-viettel-red relative' : 'border-slate-100 hover:border-red-200'}`}>
                {combo.isHot && (
                  <div className="absolute -top-4 -right-4 bg-viettel-red text-white w-14 h-14 rounded-full flex items-center justify-center font-black text-sm shadow-lg shadow-red-200 rotate-12 border-4 border-white">
                    HOT
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="w-full text-center">
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-wider mb-2">{combo.name}</h4>
                    <div className="text-viettel-red font-black text-3xl">{combo.price}<span className="text-[10px] text-slate-400 ml-1">/tháng</span></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl group-hover:bg-red-50/50 transition-colors">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-viettel-red shadow-sm mb-2">
                      <i className="fa-solid fa-wifi text-lg"></i>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tốc độ</span>
                    <span className="text-sm font-black text-slate-800">{combo.speed}</span>
                  </div>
                  <div className="flex flex-col items-center text-center border-l border-slate-200 pl-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-viettel-red shadow-sm mb-2">
                      <i className="fa-solid fa-tv text-lg"></i>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Truyền hình</span>
                    <span className="text-sm font-black text-slate-800">{combo.tv}</span>
                  </div>
                </div>

                <button className="w-full py-4 bg-viettel-red text-white rounded-xl font-black text-sm shadow-md shadow-red-200 hover:bg-red-700 transition-colors mt-auto">
                  Đăng ký ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const categories = [
    { id: 'sim', label: 'SIM SỐ ĐẸP', icon: 'fa-sim-card' },
    { id: 'internet-tv-camera', label: 'Internet-TV360-Camera', icon: 'fa-wifi' },
    { id: 'utility', label: 'Dịch vụ & Tiện ích', icon: 'fa-wallet' },
  ];

  const calculatePhongThuy = () => {
    if (!birthDay || !birthMonth || !birthYear) {
      alert("Vui lòng nhập đầy đủ ngày tháng năm sinh!");
      return;
    }
    
    setIsCalculating(true);
    
    // Simulate complex calculation
    setTimeout(() => {
      const score = Math.floor(Math.random() * 41) + 60; // 60-100
      
      const result = {
        phoneNumber: phoneNumberToScore || "098***888",
        score: score,
        summary: score >= 80 ? "Đại Cát" : score >= 70 ? "Cát" : "Bình Hòa",
        details: [
          {
            title: "1. Âm Dương Tương Phối",
            score: 2,
            maxScore: 2,
            content: "Dãy số có sự cân bằng Âm Dương rất tốt, mang lại sự ổn định và hài hòa trong cuộc sống."
          },
          {
            title: "2. Ngũ Hành Bản Mệnh",
            score: 2,
            maxScore: 2.5,
            content: "Ngũ hành của sim tương sinh với bản mệnh của bạn, giúp gia tăng tài lộc và may mắn."
          },
          {
            title: "3. Cửu Tinh Đồ Pháp",
            score: 1.5,
            maxScore: 2,
            content: "Dãy số chứa các con số mang vượng khí của thời kỳ hiện tại, thu hút năng lượng tích cực."
          },
          {
            title: "4. Hành Quẻ Bát Quái",
            score: 2.5,
            maxScore: 3,
            content: "Quẻ chủ là quẻ Đại Cát, quẻ hỗ là quẻ Cát. Tổng thể mang ý nghĩa hanh thông, thuận lợi trong công việc."
          },
          {
            title: "5. Quan Niệm Dân Gian",
            score: 0.5,
            maxScore: 0.5,
            content: "Tổng số nút cao, chứa các cặp số mang ý nghĩa tốt lành theo quan niệm dân gian."
          }
        ]
      };
      
      setPhongThuyResult(result);
      setIsCalculating(false);
    }, 1500);
  };

  const renderSimTable = () => (
    <div className="mt-8 bg-white rounded-[32px] shadow-[0_8px_25px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Kết quả tìm kiếm</h3>
        <div className="text-sm font-bold text-slate-500">
          Có <span className="text-viettel-red">{filteredSims.length.toLocaleString()}</span> số
        </div>
      </div>
      <div className="w-full">
        <div className="w-full">
          {/* Table Header */}
          <div className={`grid ${simFilter === 'dep' ? 'grid-cols-[105px_50px_60px_auto] md:grid-cols-[2.5fr_2fr_1.5fr_3fr]' : simFilter === 'phongthuy' ? 'grid-cols-[105px_40px_60px_auto] md:grid-cols-[3fr_1fr_2fr_1.5fr]' : 'grid-cols-[105px_40px_50px_60px_auto] md:grid-cols-[2.5fr_1fr_2fr_1.5fr_3fr]'} px-2 md:px-8 py-3 md:py-5 bg-slate-50 text-[9px] md:text-[13px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100`}>
            <div>Sim số</div>
            {simFilter !== 'dep' && <div className="text-center">Mệnh</div>}
            <div className="text-center">Giá</div>
            <div className="text-center">Hành động</div>
            {simFilter !== 'phongthuy' && <div className="text-left pl-2 md:pl-6">LOẠI SIM ĐẸP</div>}
          </div>

          {/* Sim List */}
          <div className="divide-y divide-slate-50">
            {currentSims.length > 0 ? (
              currentSims.map(sim => {
                const displayMenh = sim.menh || getMenhAndColor(sim.normalizedPhone).menh;
                const displayColor = sim.menhColor || getMenhAndColor(sim.normalizedPhone).color;
                
                return (
                  <div key={sim.id} className={`grid ${simFilter === 'dep' ? 'grid-cols-[105px_50px_60px_auto] md:grid-cols-[2.5fr_2fr_1.5fr_3fr]' : simFilter === 'phongthuy' ? 'grid-cols-[105px_40px_60px_auto] md:grid-cols-[3fr_1fr_2fr_1.5fr]' : 'grid-cols-[105px_40px_50px_60px_auto] md:grid-cols-[2.5fr_1fr_2fr_1.5fr_3fr]'} px-2 md:px-8 py-3 md:py-5 items-center hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group`}>
                    <div className="font-black text-slate-800 text-sm md:text-lg tracking-tighter whitespace-nowrap group-hover:text-viettel-red transition-colors">{highlightSearchText(formatPhoneSmart(sim), searchQuery)}</div>
                    
                    {simFilter !== 'dep' && (
                      <div className="flex justify-center">
                        {displayMenh ? (
                          <div 
                            className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-white font-black text-[8px] md:text-[10px] uppercase shadow-sm transition-transform group-hover:scale-110"
                            style={{ 
                              backgroundColor: displayColor,
                              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                              WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                            }}
                          >
                            {displayMenh}
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[8px] text-slate-300 font-bold">
                            N/A
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-center font-black text-viettel-red text-xs md:text-base whitespace-nowrap">
                      {getAutoPrice(sim).replace(/k$/i, '')}
                    </div>
                    <div className="flex justify-center">
                      <button 
                        onClick={() => setSelectedSimForPurchase(sim)}
                        className="px-3 py-1.5 md:px-8 md:py-2.5 bg-gradient-to-r from-viettel-red to-red-600 text-white rounded-full text-[9px] md:text-[13px] font-black hover:from-red-600 hover:to-red-700 transition-all active:scale-95 shadow-[0_4px_10px_rgba(238,0,51,0.3)] hover:shadow-[0_6px_15px_rgba(238,0,51,0.4)]"
                      >
                        Mua
                      </button>
                    </div>
                    
                    {simFilter !== 'phongthuy' && (
                      <div className="flex flex-wrap gap-1 md:gap-2 justify-start pl-2 md:pl-6">
                        {sim.simTypes.map((t, idx) => (
                          <span key={idx} className="inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[8px] md:text-[10px] font-black uppercase text-viettel-red bg-red-50 border border-red-100 whitespace-nowrap shadow-sm">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center text-slate-400 text-sm font-medium">Không tìm thấy SIM phù hợp</div>
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {filteredSims.length > 0 && (
        <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <span>Hiển thị</span>
            <select 
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-viettel-red focus:ring-1 focus:ring-viettel-red transition-all cursor-pointer font-bold text-slate-700"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>SIM/trang</span>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-white transition-colors"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
              <div className="flex gap-1.5">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  if (pageNum <= 0) return null;
                  
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                        currentPage === pageNum 
                          ? 'bg-viettel-red text-white shadow-lg shadow-red-100 scale-110' 
                          : 'bg-white text-slate-500 border border-slate-100 hover:border-viettel-red hover:text-viettel-red'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-white transition-colors"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'sim':
        const simSubItems = [
          { label: 'SIM ĐẸP THEO GIÁ', icon: 'fa-tags', color: 'from-blue-500 to-blue-600' },
          { label: 'SIM PHONG THỦY', icon: 'fa-yin-yang', color: 'from-purple-500 to-purple-600' },
          { label: 'SIM MAY MẮN', icon: 'fa-clover', color: 'from-emerald-500 to-emerald-600' },
          { label: 'SIM TRẢ SAU', icon: 'fa-file-invoice-dollar', color: 'from-red-500 to-red-600' },
          { label: 'SIM 500GB/THÁNG MIỄN PHÍ 12 THÁNG', icon: 'fa-gift', color: 'from-pink-500 to-pink-600' },
          { label: 'CHỌN GÓI KHUYẾN MÃI TIẾT KIỆM NHẤT CHO SIM ĐANG SỬ DỤNG', icon: 'fa-fire', color: 'from-orange-500 to-orange-600' }
        ];

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {simSubItems.map((item, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    setActiveTab('category');
                    if (item.label === 'SIM PHONG THỦY') {
                      setActiveCategory('phongthuy');
                      setShowSimList(false);
                    } else if (item.label === 'SIM ĐẸP THEO GIÁ') {
                      setActiveCategory('sim-price');
                      setShowSimList(false);
                    } else {
                      setActiveCategory('sim');
                      setShowSimList(true);
                    }
                  }}
                  className="bg-white py-4 px-4 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-slate-100 hover:border-viettel-red/30 transition-all duration-500 group flex flex-row items-center gap-4 text-left h-full relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-50/50 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${item.color} shadow-[0_5px_10px_rgba(0,0,0,0.1)] flex items-center justify-center text-white transition-all duration-500 text-xl group-hover:shadow-[0_10px_20px_rgba(238,0,51,0.25)] group-hover:-translate-y-1 z-10`}>
                    <i className={`fa-solid ${item.icon} drop-shadow-md`}></i>
                  </div>
                  <span className="font-black text-slate-700 group-hover:text-viettel-red transition-colors text-[10px] md:text-xs uppercase tracking-wider leading-snug z-10 line-clamp-2">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            {/* TÌM SIM THEO YÊU CẦU */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_25px_rgba(0,0,0,0.05)] border border-slate-100 mt-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-50/30 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-50/30 rounded-full -ml-20 -mb-20 pointer-events-none"></div>
              
              <h3 className="font-black text-slate-800 mb-8 text-2xl uppercase tracking-tight flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-viettel-red/10 flex items-center justify-center text-viettel-red">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </div>
                Tìm sim theo yêu cầu
              </h3>
              
              <div className="space-y-6 relative z-10">
                {/* Nhập số sim */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nhập dãy số muốn tìm</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Nhập số sim..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setHasSearched(true);
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-viettel-red focus:ring-1 focus:ring-viettel-red transition-all"
                    />
                    <i className="fa-solid fa-keyboard absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Chọn mệnh */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Chọn mệnh</label>
                    <div className="relative">
                      <select 
                        value={menhFilter}
                        onChange={(e) => setMenhFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-viettel-red focus:ring-1 focus:ring-viettel-red transition-all appearance-none cursor-pointer"
                      >
                        <option value="Tất cả">Tất cả Mệnh</option>
                        <option value="Kim">Mệnh Kim</option>
                        <option value="Mộc">Mệnh Mộc</option>
                        <option value="Thủy">Mệnh Thủy</option>
                        <option value="Hỏa">Mệnh Hỏa</option>
                        <option value="Thổ">Mệnh Thổ</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                    </div>
                  </div>

                  {/* Chọn mức giá */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Mức giá</label>
                    <div className="relative">
                      <select 
                        value={priceFilters.length > 0 ? priceFilters[0] : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            setPriceFilters([e.target.value]);
                          } else {
                            setPriceFilters([]);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-viettel-red focus:ring-1 focus:ring-viettel-red transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Tất cả mức giá</option>
                        <option value="Dưới 300k">Dưới 300k</option>
                        <option value="300k-400k">300k - 400k</option>
                        <option value="400k-600k">400k - 600k</option>
                        <option value="600k-1 triệu">600k - 1 triệu</option>
                        <option value="1 triệu - 2 triệu">1 triệu - 2 triệu</option>
                        <option value="Trên 2 triệu">Trên 2 triệu</option>
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                    </div>
                  </div>

                  {/* Chọn loại sim */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Loại sim đẹp</label>
                    <div className="relative">
                      <select 
                        value={simTypeFilter}
                        onChange={(e) => setSimTypeFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:outline-none focus:border-viettel-red focus:ring-1 focus:ring-viettel-red transition-all appearance-none cursor-pointer"
                      >
                        <option value="Tất cả">Tất cả loại sim</option>
                        {availableSimTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs"></i>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center relative z-10">
                <button 
                  onClick={() => {
                    setHasSearched(true);
                  }}
                  className="bg-gradient-to-r from-viettel-red to-red-600 text-white font-black py-4 px-12 rounded-full shadow-[0_10px_25px_rgba(238,0,51,0.3)] hover:shadow-[0_15px_35px_rgba(238,0,51,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-sm flex items-center gap-3 group"
                >
                  <span>TÌM KIẾM NGAY</span>
                  <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
            </div>
            
            {hasSearched && renderSimTable()}
          </div>
        );
      case 'sim-price':
        return (
          <div className="space-y-8">
            <section>
              <h3 className="font-black text-slate-800 mb-4 text-xl uppercase tracking-tight">Chọn theo mức giá</h3>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {[
                  { label: 'Dưới 300k', icon: 'fa-coins', color: 'bg-gradient-to-br from-blue-500 to-blue-600' }, 
                  { label: '300k-400k', icon: 'fa-wallet', color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' }, 
                  { label: '400k-600k', icon: 'fa-money-bill-1', color: 'bg-gradient-to-br from-amber-500 to-amber-600' }, 
                  { label: '600k-1 triệu', icon: 'fa-money-bill-trend-up', color: 'bg-gradient-to-br from-orange-500 to-orange-600' }, 
                  { label: '1 triệu - 2 triệu', icon: 'fa-money-check-dollar', color: 'bg-gradient-to-br from-purple-500 to-purple-600' }, 
                  { label: 'Trên 2 triệu', icon: 'fa-sack-dollar', color: 'bg-gradient-to-br from-red-500 to-red-600' }
                ].map(item => (
                  <button 
                    key={item.label} 
                    onClick={() => {
                      setPriceFilters(prev => prev.includes(item.label) ? prev.filter(p => p !== item.label) : [...prev, item.label]);
                    }}
                    className={`py-3 px-2 md:py-5 md:px-5 border-2 rounded-[24px] md:rounded-[32px] text-sm font-bold transition-all shadow-[0_8px_20px_rgba(0,0,0,0.04)] flex items-center gap-2 md:gap-4 group ${priceFilters.includes(item.label) ? 'border-viettel-red text-viettel-red bg-red-50 shadow-[0_15px_30px_rgba(238,0,51,0.15)]' : 'border-slate-100 text-slate-600 bg-white hover:border-viettel-red hover:text-viettel-red hover:shadow-[0_15px_30px_rgba(0,0,0,0.12)]'}`}
                  >
                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex-shrink-0 flex items-center justify-center text-xl md:text-2xl text-white shadow-lg transition-all group-hover:scale-110 group-hover:rotate-3 ${item.color} ${priceFilters.includes(item.label) ? 'scale-110 rotate-3 shadow-red-200' : ''}`}>
                      <i className={`fa-solid ${item.icon} drop-shadow-sm`}></i>
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[13px] md:text-xl font-black tracking-tighter md:tracking-tight whitespace-nowrap">{item.label}</span>
                      <span className="text-[10px] md:text-[12px] font-bold text-slate-400 uppercase tracking-tight md:tracking-widest mt-0.5 whitespace-nowrap">Chọn ngay</span>
                    </div>
                    <i className={`fa-solid fa-circle-check text-base md:text-xl ml-auto transition-opacity flex-shrink-0 ${priceFilters.includes(item.label) ? 'opacity-100 text-viettel-red' : 'opacity-0 group-hover:opacity-20'}`}></i>
                  </button>
                ))}
                
                {/* Nút BẤM XEM */}
                <div className="col-span-2 mt-4 flex justify-center">
                  <button 
                    onClick={() => {
                      setSimFilter('dep');
                      setShowSimList(true);
                    }}
                    className="bg-viettel-red text-white font-black py-4 px-12 rounded-full shadow-[0_10px_25px_rgba(238,0,51,0.3)] hover:shadow-[0_15px_35px_rgba(238,0,51,0.4)] hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] text-sm md:text-lg flex items-center gap-3 group"
                  >
                    <i className="fa-solid fa-magnifying-glass group-hover:animate-bounce"></i>
                    BẤM XEM
                  </button>
                </div>
              </div>
            </section>
          </div>
        );
      case 'phongthuy':
        return (
          <div className="flex flex-col gap-8">
            <div className="w-full space-y-8">
              <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-8 md:p-12">
                <div className="max-w-4xl mx-auto space-y-16">
                  {/* Zodiac Section */}
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 mb-10 text-center" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>Sim Hợp Theo Con Giáp</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-y-10 gap-x-6">
                      {[
                        { name: 'Tuổi Tý', icon: 'fa-otter' },
                        { name: 'Tuổi Sửu', icon: 'fa-cow' },
                        { name: 'Tuổi Dần', icon: 'fa-cat' },
                        { name: 'Tuổi Mão', icon: 'fa-cat' },
                        { name: 'Tuổi Thìn', icon: 'fa-dragon' },
                        { name: 'Tuổi Tỵ', icon: 'fa-staff-snake' },
                        { name: 'Tuổi Ngọ', icon: 'fa-horse' },
                        { name: 'Tuổi Mùi', icon: 'fa-sheep' },
                        { name: 'Tuổi Thân', icon: 'fa-user-ninja' },
                        { name: 'Tuổi Dậu', icon: 'fa-crow' },
                        { name: 'Tuổi Tuất', icon: 'fa-dog' },
                        { name: 'Tuổi Hợi', icon: 'fa-piggy-bank' }
                      ].map((zodiac, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => {
                            setPriceFilters([]);
                            setSimFilter('phongthuy');
                            setShowSimList(true);
                          }}
                          className="flex flex-col items-center gap-4 group"
                        >
                          <div className="w-16 h-16 rounded-full border border-viettel-red flex items-center justify-center text-viettel-red text-2xl shadow-[0_4px_15px_rgba(238,0,51,0.2)] bg-white group-hover:bg-red-50 transition-colors">
                            <i className={`fa-solid ${zodiac.icon} animate-sway inline-block`}></i>
                          </div>
                          <span className="font-bold text-slate-800 group-hover:text-viettel-red transition-colors" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{zodiac.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Element Section */}
                  <div className="pt-12 border-t border-slate-100">
                    <h3 className="text-2xl font-black text-slate-800 mb-10 text-center" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>Sim Theo Mệnh</h3>
                    <div className="flex flex-wrap justify-center gap-10">
                      {[
                        { name: 'Mệnh Kim', icon: 'fa-gem', color: 'text-yellow-500', border: 'border-yellow-500', shadow: 'shadow-[0_4px_20px_rgba(234,179,8,0.3)]' },
                        { name: 'Mệnh Mộc', icon: 'fa-leaf', color: 'text-green-600', border: 'border-green-600', shadow: 'shadow-[0_4px_20px_rgba(22,163,74,0.3)]' },
                        { name: 'Mệnh Thủy', icon: 'fa-water', color: 'text-blue-500', border: 'border-blue-500', shadow: 'shadow-[0_4px_20px_rgba(59,130,246,0.3)]' },
                        { name: 'Mệnh Hỏa', icon: 'fa-fire', color: 'text-red-600', border: 'border-red-600', shadow: 'shadow-[0_4px_20px_rgba(220,38,38,0.3)]' },
                        { name: 'Mệnh Thổ', icon: 'fa-mountain', color: 'text-amber-700', border: 'border-amber-700', shadow: 'shadow-[0_4px_20px_rgba(180,83,9,0.3)]' }
                      ].map((element, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => {
                            setPriceFilters([]);
                            setSimFilter('phongthuy');
                            setMenhFilter(element.name.replace('Mệnh ', ''));
                            setShowSimList(true);
                          }}
                          className="flex flex-col items-center gap-4 group"
                        >
                          <div className={`w-20 h-20 rounded-full border-2 ${element.border} flex items-center justify-center ${element.color} text-3xl ${element.shadow} bg-white group-hover:scale-105 transition-transform`}>
                            <i className={`fa-solid ${element.icon} animate-sway inline-block`}></i>
                          </div>
                          <span className="font-bold text-slate-800 text-lg group-hover:text-viettel-red transition-colors" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{element.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        );
      case 'internet-tv-camera':
        if (activePackageTab === 'internet') {
          return renderInternetTabContent();
        }
        if (activePackageTab === 'tv') {
          return renderTVTabContent();
        }
        if (activePackageTab === 'combo') {
          return renderComboTabContent();
        }
        if (activePackageTab === 'combo-tv') {
          return renderComboTVTabContent();
        }
        if (activePackageTab === 'camera' || activePackageTab === 'combo-camera') {
          return renderCameraTabContent();
        }
        // If not 'internet', 'tv' or 'combo', show the general overview
        return (
          <div className="space-y-8 pb-10">
            {/* Main Grid Section */}
            <div className="grid grid-cols-2 gap-4 px-1 pt-2">
              {[
                { 
                  name: 'Internet', 
                  desc: 'Hệ thống gói cước Internet đa dạng đáp ứng mọi nhu cầu.', 
                  icon: 'fa-wifi',
                  tab: 'internet'
                },
                { 
                  name: 'Truyền hình TV360', 
                  desc: 'Mang cả thế giới giải trí đến ngôi nhà của bạn.', 
                  icon: 'fa-tv',
                  tab: 'tv'
                },
                { 
                  name: 'Camera Viettel', 
                  desc: 'Trang bị camera giám sát an toàn cho ngôi nhà của bạn.', 
                  icon: 'fa-video',
                  tab: 'camera'
                },
                { 
                  name: 'Combo', 
                  desc: 'Trải nghiệm trọn vẹn Internet, TV360 và Camera.', 
                  icon: 'fa-layer-group',
                  tab: 'combo'
                },
              ].map(item => (
                <div 
                  key={item.name} 
                  className="bg-white rounded-[32px] p-5 shadow-sm border-2 border-slate-100 flex flex-col items-center text-center cursor-pointer hover:shadow-lg hover:border-viettel-red group transition-all"
                  onClick={() => {
                    if (item.tab) setActivePackageTab(item.tab);
                  }}
                >
                  <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-red-50 group-hover:text-viettel-red transition-colors shadow-inner">
                    <i className={`fa-solid ${item.icon} text-2xl group-hover:scale-110 transition-transform`}></i>
                  </div>
                  <div className="text-sm font-black text-slate-800 mb-2 group-hover:text-viettel-red transition-colors">{item.name}</div>
                  <div className="text-[10px] leading-relaxed text-slate-500 font-medium px-2 line-clamp-3">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'utility':
        return (
          <div className="space-y-8">
            <section>
              <h3 className="font-black text-slate-800 mb-6 text-lg uppercase tracking-tight">Dịch vụ & Tiện ích</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Thu hộ (Chiết khấu)', icon: 'fa-money-bill-transfer' },
                  { name: 'Nạp thẻ điện thoại', icon: 'fa-mobile-screen' },
                  { name: 'Đổi điểm Viettel++', icon: 'fa-gift' },
                  { name: 'Đăng ký Chính chủ', icon: 'fa-id-card' },
                ].map(item => (
                  <div key={item.name} className="p-5 border-2 border-slate-100 rounded-3xl bg-white flex flex-col items-center gap-4 shadow-sm text-center hover:shadow-md hover:border-viettel-red transition-all group cursor-pointer">
                    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-2xl group-hover:bg-red-50 group-hover:text-viettel-red transition-colors shadow-inner">
                      <i className={`fa-solid ${item.icon} group-hover:scale-110 transition-transform`}></i>
                    </div>
                    <div className="text-xs font-black text-slate-800 group-hover:text-viettel-red transition-colors">{item.name}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );
      default:
        return <div className="text-center py-20 text-slate-400">Đang cập nhật nội dung...</div>;
    }
  };

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const banners = [
    {
      id: 1,
      type: 'promo',
      badge: 'HẠ TẦNG 5G VƯỢT TRỘI',
      title: 'Internet Cáp Quang',
      highlight: 'Tốc Độ 1Gbps',
      desc: 'Miễn phí lắp đặt, tặng modem wifi 6 thế hệ mới khi đăng ký gói cước Internet + Truyền hình.',
      buttonText: 'ĐĂNG KÝ NHẬN ƯU ĐÃI',
      bgClass: 'bg-gradient-to-r from-viettel-red to-red-600'
    },
    {
      id: 2,
      type: 'search',
      title: 'KHO SIM SỐ ĐẸP',
      highlight: 'LỚN NHẤT VIỆT NAM',
      desc: 'Tìm kiếm và sở hữu ngay sim số đẹp Viettel với hàng ngàn ưu đãi hấp dẫn, gói cước data tốc độ cao.',
      bgClass: 'bg-gradient-to-r from-red-600 to-red-500'
    },
    {
      id: 3,
      type: 'promo',
      badge: 'ƯU ĐÃI ĐẶC BIỆT',
      title: 'Gói Cước 5G',
      highlight: 'Siêu Tốc Độ',
      desc: 'Trải nghiệm công nghệ mạng không dây thế hệ mới với dung lượng data khủng và độ trễ cực thấp.',
      buttonText: 'KHÁM PHÁ NGAY',
      bgClass: 'bg-gradient-to-r from-red-500 to-rose-500'
    },
    {
      id: 4,
      type: 'promo',
      badge: 'KHUYẾN MÃI',
      title: 'Gói Cước 5G Mới',
      highlight: 'Trải Nghiệm 5G',
      desc: 'Trải nghiệm tốc độ vượt trội cùng Viettel 5G với nhiều ưu đãi hấp dẫn dành cho thuê bao đăng ký mới.',
      buttonText: 'XEM CHI TIẾT',
      bgClass: 'bg-gradient-to-r from-rose-500 to-red-500'
    },
    {
      id: 5,
      type: 'promo',
      badge: 'ƯU ĐÃI',
      title: 'Lắp Đặt Internet',
      highlight: 'Tặng 2 Tháng Cước',
      desc: 'Tặng tới 2 tháng cước khi đóng trước. Miễn phí lắp đặt và trang bị modem wifi 2 băng tần.',
      buttonText: 'ĐĂNG KÝ NGAY',
      bgClass: 'bg-gradient-to-r from-red-600 to-viettel-red'
    }
  ];

  const [isHoveringBanner, setIsHoveringBanner] = useState(false);

  useEffect(() => {
    if (isHoveringBanner) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, isHoveringBanner]);

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPurchaseError(null);

    if (!selectedSimForPurchase || !selectedSimForPurchase.id) {
      setPurchaseError("Không tìm thấy thông tin SIM.");
      setIsSubmitting(false);
      return;
    }

    const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    const simNumber = formatPhoneSmart(selectedSimForPurchase);
    const priceAtPurchase = getAutoPrice(selectedSimForPurchase);
    const price = priceAtPurchase ? priceAtPurchase.replace(/k$/i, '.000 đ') : 'Liên hệ';

    try {
      if (!supabase) {
        throw new Error("Chưa cấu hình Supabase");
      }

      // 1. Insert order into Supabase
      const { error: insertError } = await supabase.from('orders').insert({
        sim_id: selectedSimForPurchase.id,
        customer_name: purchaseFormData.fullName,
        customer_phone: purchaseFormData.contactPhone,
        cccd: purchaseFormData.cccd,
        address: purchaseFormData.address,
        note: purchaseFormData.note,
        price_at_purchase: priceAtPurchase
      });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error("Lỗi khi lưu đơn hàng vào hệ thống.");
      }

      // 2. Update SIM status to 'reserved'
      const { error: updateError } = await supabase.from('kho_sim')
        .update({ status: 'reserved' })
        .eq('id', selectedSimForPurchase.id);

      if (updateError) {
        console.error("Supabase update error:", updateError);
        // We might still want to continue to send Telegram message even if status update fails,
        // but the user requested "Cập nhật state isPurchaseSuccess nếu tất cả đều thành công. Báo lỗi nếu Supabase insert thất bại."
        // Let's throw an error to be caught.
        throw new Error("Lỗi khi cập nhật trạng thái SIM.");
      }

      // 3. Send Telegram message
      const message = `🚨 ĐƠN HÀNG SIM MỚI!
👤 Khách hàng: ${purchaseFormData.fullName}
📱 Số điện thoại: ${purchaseFormData.contactPhone}
📍 Địa chỉ: ${purchaseFormData.address}
----------------------
🔢 Số SIM: ${simNumber}
💰 Giá tiền: ${price}`;

      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
        }),
      });

      if (response.ok) {
        setIsPurchaseSuccess(true);
      } else {
        setPurchaseError("Có lỗi xảy ra khi gửi đơn hàng qua Telegram. Vui lòng thử lại sau.");
      }
    } catch (error: any) {
      console.error("Error processing order:", error);
      setPurchaseError(error.message || "Có lỗi xảy ra khi xử lý đơn hàng. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHomeContent = () => {
    return (
      <div className="space-y-8 pb-20">
        {/* Hero Banner Section */}
        <section 
          className="relative rounded-3xl overflow-hidden shadow-2xl shadow-red-100 group h-[315px]"
          onMouseEnter={() => setIsHoveringBanner(true)}
          onMouseLeave={() => setIsHoveringBanner(false)}
        >
          {banners.map((banner, idx) => (
            <div 
              key={idx}
              className={`absolute inset-0 transition-transform duration-700 ease-in-out ${banner.bgClass} p-8 md:p-12 flex flex-col justify-center`}
              style={{ 
                transform: `translateX(${(idx - currentBannerIndex) * 100}%)`,
                zIndex: idx === currentBannerIndex ? 10 : 0
              }}
            >
              <div className="relative z-10 max-w-3xl">
                {banner.badge && (
                  <span className="inline-block px-3 py-1 bg-viettel-red text-white text-[10px] font-black rounded-full mb-4 uppercase tracking-widest">
                    {banner.badge}
                  </span>
                )}
                
                <h1 className="text-3xl md:text-6xl font-black mb-4 leading-tight tracking-tight text-white uppercase drop-shadow-lg">
                  {banner.title}<br />
                  <span className={banner.type === 'search' ? 'text-white' : 'text-viettel-red'}>
                    {banner.highlight}
                  </span>
                </h1>
                
                <p className="text-sm md:text-lg font-medium text-white/90 mb-10 max-w-2xl leading-relaxed drop-shadow-md">
                  {banner.desc}
                </p>
                
                {banner.type === 'search' ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        placeholder="Nhập số sim bạn muốn tìm..." 
                        className="w-full pl-5 pr-12 py-5 bg-white text-slate-800 border-none rounded-2xl text-base font-medium outline-none shadow-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setShowSimList(true);
                        }}
                      />
                      <i className="fa-solid fa-magnifying-glass absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 text-xl"></i>
                    </div>
                    <button 
                      onClick={() => setShowSimList(true)}
                      className="px-10 py-5 bg-slate-900 text-white rounded-2xl text-base font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      TÌM KIẾM
                    </button>
                  </div>
                ) : (
                  <button 
                    className="px-10 py-5 bg-viettel-red text-white rounded-2xl text-base font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all w-fit"
                  >
                    {banner.buttonText}
                  </button>
                )}
                
                {banner.type === 'search' && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <span className="text-xs font-black uppercase tracking-widest text-white/70 drop-shadow-md">Gợi ý:</span>
                    {['Sim Tứ Quý', 'Sim Thần Tài', 'Sim Lộc Phát', 'Sim Năm Sinh'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => {
                          setSearchQuery(tag);
                          setShowSimList(true);
                        }}
                        className="text-xs font-bold px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 text-white transition-colors backdrop-blur-sm"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Pagination Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentBannerIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 shadow-md ${
                  currentBannerIndex === idx ? 'bg-white w-8' : 'bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xl z-20 backdrop-blur-sm"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <button 
            onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xl z-20 backdrop-blur-sm"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </section>


        {/* Navigation Buttons Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-0">
          {[
            { id: 'sim', label: 'SIM SỐ ĐẸP', icon: 'fa-tags', color: 'from-red-500 to-orange-600', shadow: 'shadow-red-200' },
            { id: 'internet', label: 'INTERNET - TV - CAMERA', icon: 'fa-wifi', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-200' },
            { id: 'promo', label: 'KHUYẾN MÃI', icon: 'fa-gift', color: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-200' },
            { id: 'viettel', label: 'DỊCH VỤ VIETTEL TOÀN DIỆN', icon: 'fa-layer-group', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => {
                if (item.id === 'sim') {
                  setActiveTab('category');
                  setActiveCategory('sim');
                  setShowSimList(false);
                }
              }}
              className="bg-white py-4 px-4 md:py-6 md:px-6 rounded-[20px] md:rounded-[24px] border border-slate-50 shadow-[0_8px_25px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] hover:border-viettel-red/20 transition-all duration-500 flex flex-row items-center gap-4 text-left group active:scale-95 relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-bl-full"></div>
              <div className={`w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-xl md:text-2xl group-hover:scale-110 group-hover:-translate-y-1 group-hover:rotate-3 transition-all duration-500 text-white shadow-xl ${item.shadow} z-10`}>
                <i className={`fa-solid ${item.icon} drop-shadow-lg`}></i>
              </div>
              <h3 className="text-[11px] md:text-sm font-black text-slate-800 uppercase tracking-tighter leading-snug group-hover:text-viettel-red transition-colors duration-300 line-clamp-2 z-10">{item.label}</h3>
            </button>
          ))}
        </section>

        {/* CHỌN SIM ĐẸP THEO GIÁ */}
        <section className="bg-white rounded-[40px] p-8 md:p-10 border-2 border-slate-100 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-viettel-red text-2xl shadow-inner border border-red-100">
              <i className="fa-solid fa-tags"></i>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">CHỌN SIM ĐẸP THEO GIÁ</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 relative z-10">
            {rawData.slice(0, 30).map((sim, idx) => (
              <div 
                key={sim.id} 
                className={`items-center justify-between p-2 sm:p-3 bg-white rounded-2xl border border-slate-200 hover:border-viettel-red hover:shadow-md transition-all group cursor-pointer ${idx >= 20 ? 'hidden md:flex' : 'flex'}`} 
                onClick={() => setSelectedSimForPurchase(sim)}
              >
                {/* Left: Logo */}
                <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[6px] sm:text-[9px] font-black text-viettel-red tracking-tighter">viettel</span>
                </div>
                
                {/* Right: Number and Price */}
                <div className="flex flex-col items-end min-w-0 ml-1">
                  <div className="text-[11px] min-[375px]:text-[12px] sm:text-[16px] font-bold tracking-tight whitespace-nowrap">
                    {renderColoredPhone(sim)}
                  </div>
                  <div className="text-[9px] min-[375px]:text-[10px] sm:text-[13px] text-slate-600 font-medium mt-0.5">
                    {getAutoPrice(sim)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CHỌN SIM PHONG THỦY */}
        <section className="bg-white rounded-[40px] p-8 md:p-10 border-2 border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-viettel-red text-2xl shadow-inner border border-red-100">
              <i className="fa-solid fa-yin-yang"></i>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">CHỌN SIM PHONG THỦY</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 relative z-10">
            {rawData.slice(30, 60).map((sim, idx) => {
              const displayMenh = sim.menh || getMenhAndColor(sim.normalizedPhone).menh;
              const displayColor = sim.menhColor || getMenhAndColor(sim.normalizedPhone).color;
              return (
                <div 
                  key={sim.id} 
                  className={`items-center justify-between p-2 sm:p-3 bg-white rounded-2xl border border-slate-200 hover:border-viettel-red hover:shadow-md transition-all group cursor-pointer ${idx >= 20 ? 'hidden md:flex' : 'flex'}`} 
                  onClick={() => setSelectedSimForPurchase(sim)}
                >
                  {/* Left: Logo & Mệnh */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-100 flex items-center justify-center shadow-sm">
                      <span className="text-[6px] sm:text-[8px] font-black text-viettel-red tracking-tighter">viettel</span>
                    </div>
                    {displayMenh && (
                      <span 
                        className="text-[7px] sm:text-[9px] font-bold uppercase bg-slate-50 px-1 py-0.5 rounded"
                        style={{ color: displayColor }}
                      >
                        {displayMenh}
                      </span>
                    )}
                  </div>
                  
                  {/* Right: Number and Price */}
                  <div className="flex flex-col items-end min-w-0 ml-1">
                    <div className="text-[11px] min-[375px]:text-[12px] sm:text-[16px] font-bold tracking-tight whitespace-nowrap">
                      {renderColoredPhone(sim)}
                    </div>
                    <div className="text-[9px] min-[375px]:text-[10px] sm:text-[13px] text-slate-600 font-medium mt-0.5">
                      {getAutoPrice(sim)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        {/* DANH SÁCH GÓI INTERNET - TRUYỀN HÌNH TV360 - CAMERA */}
        <section className="bg-white rounded-[40px] p-8 md:p-10 border-2 border-slate-100 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
          <div className="flex flex-col items-center justify-center mb-12 relative z-10">
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 text-center uppercase tracking-tight flex items-center gap-4">
               <i className="fa-solid fa-globe text-viettel-red text-3xl md:text-4xl"></i> INTERNET - TV360 - CAMERA
            </h2>
            <div className="w-32 h-2 bg-gradient-to-r from-viettel-red to-red-500 rounded-full mt-6"></div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mb-14 relative z-10">
            {['Gói Internet', 'Gói truyền hình', 'Camera'].map(tab => (
              <button key={tab} className="px-8 py-4 bg-white border-2 border-slate-100 rounded-full text-sm font-bold text-slate-600 hover:border-viettel-red hover:text-viettel-red transition-all shadow-sm hover:shadow-md">
                {tab}
              </button>
            ))}
            <button className="px-8 py-4 bg-gradient-to-r from-viettel-red to-red-600 text-white rounded-full text-sm font-bold shadow-lg shadow-red-200 hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all">
              Gói combo Internet - Truyền hình
            </button>
          </div>

          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10 snap-x snap-mandatory hide-scrollbar">
            {[
              {
                name: 'MESHV3_H_TV',
                speed: '500Mbps',
                desc: 'Áp dụng tại 32 tỉnh và ngoại thành HN/HCM. Trang bị thiết bị Mesh Wifi 6 phủ sóng toàn diện.',
                price: '439.000đ'
              },
              {
                name: 'NETVT01_H_TV',
                speed: '150Mbps',
                desc: 'Gói cước tiết kiệm dành cho cá nhân, hộ gia đình. Tốc độ ổn định, kèm truyền hình TV360 cơ bản.',
                price: '275.000đ'
              },
              {
                name: 'NETVT2_H_TV',
                speed: '500Mbps',
                desc: 'Dành riêng cho khu vực nội thành HN/HCM. Băng thông cực cao, phù hợp giải trí đa phương tiện 4K.',
                price: '305.000đ'
              },
              {
                name: 'MESHVT1_H_TV',
                speed: '300Mbps',
                desc: 'Áp dụng 32 tỉnh và ngoại thành HN/HCM. Miễn phí thiết bị Wifi Mesh thế hệ mới nhất.',
                price: '295.000đ'
              }
            ].map((pkg, idx) => (
              <div key={idx} className="bg-white rounded-[32px] border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-viettel-red transition-all group relative min-w-[85vw] sm:min-w-0 snap-center shrink-0 h-full">
                <div className="bg-gradient-to-br from-red-50 to-white p-6 text-center relative overflow-hidden border-b border-slate-100 group-hover:from-viettel-red group-hover:to-red-600 transition-colors duration-500 shrink-0">
                  <span className="relative z-10 text-xl font-black tracking-wider text-viettel-red group-hover:text-white transition-colors">{pkg.name}</span>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/50 rounded-full -mr-10 -mt-10 group-hover:bg-white/10 transition-colors duration-500"></div>
                </div>
                <div className="p-6 sm:p-8 flex-1 flex flex-col relative z-10">
                  <div className="flex items-center justify-center gap-3 mb-6 bg-slate-50 py-3 rounded-2xl group-hover:bg-red-50 transition-colors shrink-0">
                    <i className="fa-solid fa-gauge-high text-viettel-red text-xl"></i>
                    <h4 className="text-xl font-black text-slate-800">Tốc độ {pkg.speed}</h4>
                  </div>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 flex-1 text-center">
                    {pkg.desc}
                  </p>
                  <div className="mt-auto shrink-0">
                    <div className="mb-6 text-center">
                      <span className="text-3xl sm:text-4xl font-black text-viettel-red">{pkg.price}</span>
                      <span className="text-sm text-slate-400 font-bold ml-1">/tháng</span>
                    </div>
                    <button className="w-full py-4 border-2 border-slate-200 rounded-2xl text-sm font-black text-slate-600 hover:border-viettel-red hover:bg-viettel-red hover:text-white transition-all shadow-sm group-hover:shadow-md">
                      ĐĂNG KÝ NGAY
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center relative z-10">
            <button className="px-10 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-full text-sm font-black uppercase tracking-widest hover:border-viettel-red hover:text-viettel-red transition-all shadow-sm flex items-center gap-3 group">
              Xem tất cả gói cước <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>
        </section>

        {/* DỊCH VỤ VIETTEL TOÀN DIỆN */}
        <section className="bg-white rounded-[40px] p-8 md:p-10 border-2 border-slate-100 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
          <div className="flex flex-col items-center justify-center mb-16 relative z-10">
            <h2 className="text-2xl md:text-4xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4 text-center">
              <i className="fa-solid fa-layer-group text-viettel-red text-3xl md:text-4xl"></i> DỊCH VỤ VIETTEL TOÀN DIỆN
            </h2>
            <div className="w-32 h-2 bg-gradient-to-r from-viettel-red to-red-500 rounded-full mt-6 mb-6"></div>
            <p className="text-slate-500 max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-medium text-center">
              Chúng tôi cung cấp đầy đủ các giải pháp viễn thông cho gia đình và doanh nghiệp với hạ tầng ổn định nhất Việt Nam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {[
              {
                title: 'Địa điểm cập nhật CMT lên CCCD miễn phí',
                desc: 'Hỗ trợ chuẩn hóa thông tin thuê bao chính chủ theo quy định mới nhất của Bộ TT&TT hoàn toàn miễn phí.',
                items: ['Thực hiện nhanh chóng 5-10 phút', 'Không làm gián đoạn liên lạc'],
                btnText: 'Xem chi tiết',
                icon: 'fa-id-card-clip',
              },
              {
                title: 'Địa điểm hỗ trợ Cấp lại Sim bị thu hồi, cháy, hỏng nhanh chóng',
                desc: 'Khôi phục số điện thoại cũ, đổi sim 4G/5G mới khi gặp sự cố kỹ thuật hoặc mất máy chỉ trong tích tắc.',
                items: ['Giữ nguyên danh bạ và gói cước', 'Thủ tục đơn giản, thuận tiện'],
                btnText: 'Hỗ trợ ngay',
                icon: 'fa-sim-card',
              },
              {
                title: 'Địa điểm ĐKTT chính chủ cho khách mua SIM ONLINE',
                desc: 'Điểm giao dịch tin cậy để hoàn tất thủ tục đăng ký thông tin cho các đơn hàng SIM số đẹp đặt mua trực tuyến.',
                items: ['Kích hoạt SIM sử dụng ngay', 'Đảm bảo quyền sở hữu tuyệt đối'],
                btnText: 'Tư vấn thủ tục',
                icon: 'fa-file-signature',
              }
            ].map((service, idx) => (
              <div key={idx} className="bg-white rounded-[40px] border-2 border-slate-100 p-10 shadow-sm hover:shadow-xl hover:border-viettel-red transition-all flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center text-4xl mb-8 group-hover:scale-110 group-hover:bg-red-50 group-hover:text-viettel-red transition-all shadow-inner relative z-10">
                  <i className={`fa-solid ${service.icon}`}></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-4 leading-snug group-hover:text-viettel-red transition-colors relative z-10">{service.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-1 font-medium relative z-10">
                  {service.desc}
                </p>
                <ul className="space-y-3 mb-10 relative z-10">
                  {service.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium bg-slate-50 p-3 rounded-xl group-hover:bg-white transition-colors">
                      <i className="fa-solid fa-check text-viettel-red mt-1"></i>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-4 border-2 border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:border-viettel-red hover:bg-viettel-red hover:text-white transition-all shadow-sm group-hover:shadow-md relative z-10">
                  {service.btnText}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* GHÉ THĂM CỬA HÀNG CHUYÊN VIETTEL */}
        <section className="mt-16 mb-20">
          <div className="bg-slate-100 rounded-[40px] p-8 md:p-10 text-slate-900 overflow-hidden relative shadow-xl border border-slate-200">
            <div className="absolute top-0 right-0 w-96 h-96 bg-viettel-red rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600 rounded-full blur-[120px] opacity-5 pointer-events-none"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Content */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-xl md:text-3xl lg:text-4xl font-black uppercase leading-[1.1] tracking-tight">
                    <span className="text-viettel-red flex items-center gap-2 mb-1 text-lg md:text-xl">
                      <i className="fa-solid fa-store"></i> GHÉ THĂM
                    </span>
                    <span className="whitespace-nowrap">CỬA HÀNG CHUYÊN VIETTEL</span>
                  </h2>
                  <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-lg font-medium">
                    Trải nghiệm dịch vụ trực tiếp và nhận tư vấn chuyên sâu tại điểm giao dịch chính thức của chúng tôi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      icon: 'fa-location-dot',
                      title: 'ĐỊA CHỈ',
                      content: '311 Hồng Lạc, Phường Bảy Hiền, TPHCM'
                    },
                    {
                      icon: 'fa-clock',
                      title: '',
                      content: 'MỞ CỬA:\nT2-T7: 08:00 - 20:00\nCN: 08:00 - 18:00'
                    },
                    {
                      icon: 'fa-phone-volume',
                      title: 'HOTLINE',
                      content: '0359 247 247'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-3 hover:bg-slate-50 hover:shadow-md transition-all group cursor-pointer flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                      <div className="w-9 h-9 bg-gradient-to-br from-viettel-red to-red-600 rounded-xl flex items-center justify-center text-sm shadow-md group-hover:scale-110 transition-transform shrink-0 text-white">
                        <i className={`fa-solid ${item.icon}`}></i>
                      </div>
                      <div className="overflow-hidden w-full">
                        {item.title && <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{item.title}</h4>}
                        <p className="text-xs font-bold text-slate-900 leading-tight break-words whitespace-pre-line">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Content - Map Mockup */}
              <div className="lg:col-span-5 h-full">
                <a 
                  href="https://maps.app.goo.gl/ocL8AkJkh17HYPZE9" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="relative h-44 lg:h-full min-h-[220px] bg-slate-200 rounded-[32px] border-2 border-white overflow-hidden shadow-lg group cursor-pointer block"
                >
                  {/* Map Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity mix-blend-multiply"
                    style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Vietnam_location_map.svg/1024px-Vietnam_location_map.svg.png")' }}
                  />
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/60 group-hover:bg-slate-900/50 transition-colors">
                    <div className="w-14 h-14 bg-viettel-red/30 rounded-full flex items-center justify-center mb-3 animate-pulse">
                      <div className="w-10 h-10 bg-viettel-red rounded-full flex items-center justify-center shadow-lg">
                        <i className="fa-solid fa-location-dot text-white text-lg"></i>
                      </div>
                    </div>
                    <h3 className="text-sm md:text-base font-black text-white group-hover:text-red-200 transition-colors uppercase">
                      XEM TRÊN GOOGLE MAPS<br/>và NHẬN HƯỚNG DẪN ĐƯỜNG ĐẾN CỬA HÀNG
                    </h3>
                    <p className="text-slate-200 text-[10px] font-bold mt-2 uppercase tracking-wider">
                      311 Hồng Lạc, Phường Bảy Hiền, TPHCM
                    </p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderPurchaseModal = () => {
    if (!selectedSimForPurchase) return null;

    const handleBack = () => {
      setPurchaseError(null);
      if (isPurchaseSuccess) {
        setIsPurchaseSuccess(false);
        setSelectedSimForPurchase(null);
        setPurchaseFormData({ fullName: '', cccd: '', contactPhone: '', address: '', note: '' });
      } else {
        setShowSaveConfirm(true);
      }
    };

    const handleConfirmSave = (save: boolean) => {
      if (save && selectedSimForPurchase) {
        setCart(prev => [...prev, selectedSimForPurchase]);
      }
      setShowSaveConfirm(false);
      setSelectedSimForPurchase(null);
      setPurchaseFormData({ fullName: '', cccd: '', contactPhone: '', address: '', note: '' });
      setPurchaseError(null);
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-[400px] rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col max-h-[95vh]">
          {showSaveConfirm ? (
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-50 text-viettel-red rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                <i className="fa-solid fa-cart-plus"></i>
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-slate-800">Lưu vào giỏ hàng?</h4>
                <p className="text-slate-500 text-sm font-medium px-4">Bạn có muốn lưu số SIM này vào giỏ hàng để xem lại sau không?</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => handleConfirmSave(false)}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-200 transition-colors"
                >
                  Không, cảm ơn
                </button>
                <button 
                  onClick={() => handleConfirmSave(true)}
                  className="flex-1 py-3.5 bg-gradient-to-r from-viettel-red to-red-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-red-200 hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all"
                >
                  Lưu ngay
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-viettel-red to-red-600 p-5 text-white relative flex items-center shrink-0 shadow-md z-10">
                <button 
                  onClick={handleBack}
                  className="mr-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-sm"
                  title="Quay lại"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className="flex-1">
                  <h3 className="text-lg font-black tracking-tight drop-shadow-sm">Đăng ký mua SIM</h3>
                  <p className="text-white/90 text-[10px] mt-0.5 font-bold uppercase tracking-widest">Thông tin đơn hàng</p>
                </div>
                <button 
                  onClick={handleBack}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-sm"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                {isPurchaseSuccess ? (
                  <div className="py-6 text-center space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-full flex items-center justify-center text-5xl mx-auto shadow-[0_10px_25px_rgba(16,185,129,0.4)]">
                      <i className="fa-solid fa-check"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-slate-800 tracking-tight">Đặt hàng thành công!</h4>
                      <p className="text-slate-500 text-sm font-medium px-4">Viettel sẽ liên hệ với bạn trong vòng 30 phút để xác nhận đơn hàng.</p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 inline-block text-left w-full shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Số thuê bao</span>
                        <span className="text-lg font-black text-slate-800 tracking-tighter">{formatPhoneSmart(selectedSimForPurchase)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng tiền</span>
                        <span className="text-lg font-black text-viettel-red">
                          {getAutoPrice(selectedSimForPurchase) 
                            ? getAutoPrice(selectedSimForPurchase).replace(/k$/i, '.000 đ') 
                            : 'L.Hệ'}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setIsPurchaseSuccess(false);
                        setSelectedSimForPurchase(null);
                        setPurchaseFormData({ fullName: '', cccd: '', contactPhone: '', address: '', note: '' });
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-viettel-red to-red-600 text-white rounded-xl font-black text-sm shadow-[0_8px_20px_rgba(238,0,51,0.3)] hover:shadow-[0_12px_25px_rgba(238,0,51,0.4)] hover:from-red-600 hover:to-red-700 transition-all active:scale-[0.98] leading-tight"
                    >
                      CHÚC MỪNG QUÝ KHÁCH<br/>CHỌN ĐƯỢC SIM ĐẸP NHƯ Ý
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                    {/* SIM Info Card */}
                    <div className="bg-red-50/80 p-4 rounded-2xl border border-red-100 flex justify-between items-center shadow-sm">
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Số thuê bao</div>
                        <div className="text-xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{formatPhoneSmart(selectedSimForPurchase)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Giá tiền</div>
                        <div className="text-lg font-black text-viettel-red drop-shadow-sm">
                          {getAutoPrice(selectedSimForPurchase) 
                            ? getAutoPrice(selectedSimForPurchase).replace(/k$/i, '.000 đ') 
                            : 'L.Hệ'}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1">Họ và tên khách hàng</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Nhập họ tên của bạn"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-viettel-red focus:bg-white focus:shadow-[0_0_0_2px_rgba(238,0,51,0.1)] transition-all"
                          value={purchaseFormData.fullName}
                          onChange={(e) => setPurchaseFormData({...purchaseFormData, fullName: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1">GIẤY TỜ ĐĂNG KÝ THÔNG TIN CHÍNH CHỦ</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Số CCCD"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-viettel-red focus:bg-white focus:shadow-[0_0_0_2px_rgba(238,0,51,0.1)] transition-all"
                          value={purchaseFormData.cccd}
                          onChange={(e) => setPurchaseFormData({...purchaseFormData, cccd: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1">Số điện thoại liên hệ</label>
                        <input 
                          required
                          type="tel" 
                          placeholder="Nhập số điện thoại nhận sim"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-viettel-red focus:bg-white focus:shadow-[0_0_0_2px_rgba(238,0,51,0.1)] transition-all"
                          value={purchaseFormData.contactPhone}
                          onChange={(e) => setPurchaseFormData({...purchaseFormData, contactPhone: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1">Địa chỉ nhận SIM</label>
                        <textarea 
                          required
                          rows={2}
                          placeholder="Địa chỉ chi tiết (Số nhà, đường, phường/xã...)"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-viettel-red focus:bg-white focus:shadow-[0_0_0_2px_rgba(238,0,51,0.1)] transition-all resize-none"
                          value={purchaseFormData.address}
                          onChange={(e) => setPurchaseFormData({...purchaseFormData, address: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 ml-1">Ghi chú (nếu có)</label>
                        <input 
                          type="text" 
                          placeholder="Ví dụ: Giao giờ hành chính"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-viettel-red focus:bg-white focus:shadow-[0_0_0_2px_rgba(238,0,51,0.1)] transition-all"
                          value={purchaseFormData.note}
                          onChange={(e) => setPurchaseFormData({...purchaseFormData, note: e.target.value})}
                        />
                      </div>
                    </div>

                    {purchaseError && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
                        <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                        <span>{purchaseError}</span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-3.5 bg-gradient-to-r from-viettel-red to-red-600 text-white rounded-xl font-black text-sm shadow-[0_8px_20px_rgba(238,0,51,0.3)] hover:shadow-[0_12px_25px_rgba(238,0,51,0.4)] hover:from-red-600 hover:to-red-700 transition-all active:scale-[0.98] uppercase tracking-wider ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? 'Đang gửi đơn...' : 'XÁC NHẬN ĐẶT HÀNG'}
                      </button>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium px-1 space-y-1 pt-1">
                      <p className="flex items-center gap-1.5"><i className="fa-solid fa-headset text-viettel-red"></i> Tư vấn bán hàng: <a href="tel:0359247247" className="text-viettel-red font-black hover:underline">0359.247.247</a></p>
                      <p className="flex items-start gap-1.5"><i className="fa-solid fa-clock text-viettel-red mt-0.5"></i> <span>Thời gian giữ số trong 24 tiếng kể từ thời điểm đặt hàng thành công.</span></p>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderPackageDetailModal = () => {
    if (!selectedPackageForDetail) return null;

    const details = packageDetails[selectedPackageForDetail.id] || {
      name: selectedPackageForDetail.id,
      benefits: ['Đang cập nhật thông tin ưu đãi...'],
      cycle: '30 ngày',
      price: selectedPackageForDetail.price + '/30 ngày',
      renewal: 'Tự động gia hạn.',
      syntax: ['Kiểm tra: KTTK gửi 191', 'Hủy: HUY gửi 191']
    };

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-slate-100">
          <div className="bg-gradient-to-r from-[#f1c40f] to-[#f39c12] p-6 text-center relative">
            <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">{details.name}</h3>
            <button 
              onClick={() => setSelectedPackageForDetail(null)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <table className="w-full border-collapse text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="w-1/3 p-5 font-black text-slate-500 uppercase tracking-widest text-xs bg-slate-50 text-right border-r border-slate-100 rounded-tl-2xl">Ưu đãi</td>
                  <td className="p-5 text-slate-700 font-medium">
                    <ul className="space-y-2">
                      {details.benefits.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <i className="fa-solid fa-check text-[#f39c12] mt-1 text-xs"></i>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-5 font-black text-slate-500 uppercase tracking-widest text-xs bg-slate-50 text-right border-r border-slate-100">Chu kỳ</td>
                  <td className="p-5 text-slate-700 font-bold">{details.cycle}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-5 font-black text-slate-500 uppercase tracking-widest text-xs bg-slate-50 text-right border-r border-slate-100">Phí gói</td>
                  <td className="p-5 text-viettel-red font-black text-lg">{details.price}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="p-5 font-black text-slate-500 uppercase tracking-widest text-xs bg-slate-50 text-right border-r border-slate-100">Gia hạn gói cước</td>
                  <td className="p-5 text-slate-700 font-medium">{details.renewal}</td>
                </tr>
                <tr>
                  <td className="p-5 font-black text-slate-500 uppercase tracking-widest text-xs bg-slate-50 text-right border-r border-slate-100 rounded-bl-2xl">Cú pháp kiểm tra</td>
                  <td className="p-5 text-slate-700 font-medium">
                    <ul className="space-y-2">
                      {details.syntax.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <i className="fa-solid fa-terminal text-slate-400 mt-1 text-xs"></i>
                          <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-800 font-mono text-xs">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderCartModal = () => {
    if (!isCartModalOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-[400px] rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col max-h-[95vh]">
          <div className="bg-gradient-to-r from-viettel-red to-red-600 p-5 text-white relative flex items-center shrink-0 shadow-md z-10">
            <div className="flex-1">
              <h3 className="text-lg font-black tracking-tight drop-shadow-sm flex items-center gap-2">
                <i className="fa-solid fa-cart-shopping"></i> Giỏ hàng của bạn
              </h3>
              <p className="text-white/90 text-[10px] mt-0.5 font-bold uppercase tracking-widest">{cart.length} SIM đã chọn</p>
            </div>
            <button 
              onClick={() => setIsCartModalOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors text-sm"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center text-3xl mx-auto">
                  <i className="fa-solid fa-cart-shopping"></i>
                </div>
                <p className="text-slate-500 font-medium text-sm">Giỏ hàng của bạn đang trống</p>
                <button 
                  onClick={() => setIsCartModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-200 transition-colors"
                >
                  Tiếp tục chọn SIM
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((sim, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex justify-between items-center group hover:border-red-100 hover:shadow-md transition-all">
                    <div>
                      <div className="text-lg font-black text-slate-800 tracking-tighter group-hover:text-viettel-red transition-colors">{formatPhoneSmart(sim)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-viettel-red">{getAutoPrice(sim) ? getAutoPrice(sim).replace(/k$/i, '.000 đ') : 'L.Hệ'}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">{sim.mang}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setIsCartModalOpen(false);
                          setSelectedSimForPurchase(sim);
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-viettel-red hover:bg-viettel-red hover:text-white transition-colors"
                        title="Mua ngay"
                      >
                        <i className="fa-solid fa-credit-card"></i>
                      </button>
                      <button 
                        onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                        title="Xóa khỏi giỏ hàng"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-500">Tổng tiền:</span>
                <span className="text-xl font-black text-viettel-red drop-shadow-sm">
                  {cart.reduce((total, sim) => total + (parseInt(getAutoPrice(sim)) || 0), 0)}.000 đ
                </span>
              </div>
              <button 
                onClick={() => {
                  setIsCartModalOpen(false);
                  if (cart.length > 0) {
                    setSelectedSimForPurchase(cart[0]);
                  }
                }}
                className="w-full py-3.5 bg-gradient-to-r from-viettel-red to-red-600 text-white rounded-xl font-black text-sm shadow-[0_8px_20px_rgba(238,0,51,0.3)] hover:shadow-[0_12px_25px_rgba(238,0,51,0.4)] hover:from-red-600 hover:to-red-700 transition-all active:scale-[0.98] uppercase tracking-wider"
              >
                Tiến hành thanh toán
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSelectNumberButton = (planId: string) => {
    return (
      <div className="flex-1 relative">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowSimSelectionMenu(showSimSelectionMenu === planId ? null : planId);
          }}
          className="w-full py-2.5 bg-[#E60023] text-white rounded-xl text-sm font-black shadow-md hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Chọn số <i className={`fa-solid fa-chevron-${showSimSelectionMenu === planId ? 'up' : 'down'} text-[10px]`}></i>
        </button>
        {showSimSelectionMenu === planId && (
          <div className="absolute bottom-full left-0 mb-2 w-full min-w-[160px] bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button 
              onClick={() => {
                setShowSimSelectionMenu(null);
                setSimFilter('dep');
                setShowSimList(true);
              }}
              className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-50"
            >
              <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-500">
                <i className="fa-solid fa-tags"></i>
              </div>
              SIM ĐẸP THEO GIÁ
            </button>
            <button 
              onClick={() => {
                setShowSimSelectionMenu(null);
                setSimFilter('phongthuy');
                setShowSimList(true);
              }}
              className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-500">
                <i className="fa-solid fa-yin-yang"></i>
              </div>
              Sim Phong Thủy
            </button>
          </div>
        )}
      </div>
    );
  };

  if (showSimList) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 font-sans text-viettel-text overflow-hidden">
        {renderPurchaseModal()}
        {renderPackageDetailModal()}
        {renderCartModal()}
        {/* Header SIM List */}
        <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSimList(false)} className="text-slate-500 text-xl hover:text-viettel-red transition-colors">
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-viettel-red rounded-lg flex items-center justify-center text-white">
                <i className={simFilter === 'phongthuy' ? "fa-solid fa-yin-yang" : simFilter === 'dep' ? "fa-solid fa-tags" : "fa-solid fa-star"}></i>
              </div>
              <span className="font-black text-viettel-red tracking-tighter text-lg uppercase">
                {simFilter === 'dep' ? 'SIM ĐẸP THEO GIÁ' : simFilter === 'phongthuy' ? 'SIM PHONG THỦY' : 'VIETTEL STORE'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-slate-500">
            <div 
              className="relative cursor-pointer hover:text-viettel-red transition-colors"
              onClick={() => setIsCartModalOpen(true)}
            >
              <i className="fa-solid fa-cart-shopping"></i>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-viettel-red text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-20 scroll-smooth">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0 flex flex-col gap-8">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Search Bar matching reference */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        placeholder="Nhập sim số bạn cần tìm ..." 
                        className="w-full pl-5 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-viettel-red transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setShowSimList(true);
                          }
                        }}
                      />
                      <i className="fa-solid fa-magnifying-glass absolute right-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    </div>
                    <button 
                      onClick={() => setShowSimList(true)}
                      className="px-8 py-4 bg-viettel-red text-white rounded-2xl text-sm font-black shadow-lg shadow-red-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <i className="fa-solid fa-magnifying-glass"></i>
                      TÌM KIẾM
                    </button>
                  </div>

                  {/* Filters Row */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lọc theo:</span>
                      <div className="flex gap-2">
                        {simFilter !== 'dep' && (
                          <select 
                            className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-viettel-red transition-colors cursor-pointer"
                            value={menhFilter}
                            onChange={(e) => setMenhFilter(e.target.value)}
                          >
                            <option value="Tất cả">Tất cả Mệnh</option>
                            <option value="Kim">Mệnh Kim</option>
                            <option value="Mộc">Mệnh Mộc</option>
                            <option value="Thủy">Mệnh Thủy</option>
                            <option value="Hỏa">Mệnh Hỏa</option>
                            <option value="Thổ">Mệnh Thổ</option>
                          </select>
                        )}
                        {simFilter !== 'phongthuy' && (
                          <select 
                            className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-viettel-red transition-colors cursor-pointer"
                            value={simTypeFilter}
                            onChange={(e) => setSimTypeFilter(e.target.value)}
                          >
                            <option value="Tất cả">Loại sim đẹp</option>
                            {availableSimTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        )}
                        
                        <div className="relative">
                          <button 
                            onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                            className="p-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none text-left flex items-center gap-2 hover:border-viettel-red transition-colors"
                          >
                            <span className="max-w-[100px] truncate">
                              {priceFilters.length === 0 ? 'Giá' : priceFilters.join(', ')}
                            </span>
                            <i className={`fa-solid fa-chevron-${showPriceDropdown ? 'up' : 'down'} text-[8px]`}></i>
                          </button>
                          {showPriceDropdown && (
                            <>
                              <div className="fixed inset-0 z-[55]" onClick={() => setShowPriceDropdown(false)}></div>
                              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] py-2 min-w-[180px] max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                {[
                                  'Dưới 300k', 
                                  '300k-400k', 
                                  '400k-600k', 
                                  '600k-1 triệu', 
                                  '1 triệu - 2 triệu', 
                                  'Trên 2tr'
                                ].map(range => (
                                  <label key={range} className="flex items-center px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                                    <input 
                                      type="checkbox"
                                      checked={priceFilters.includes(range)}
                                      onChange={() => setPriceFilters(prev => prev.includes(range) ? prev.filter(p => p !== range) : [...prev, range])}
                                      className="mr-3 w-4 h-4 accent-viettel-red rounded border-slate-300"
                                    />
                                    <span className="text-[11px] font-bold text-slate-600">{range}</span>
                                  </label>
                                ))}
                                {priceFilters.length > 0 && (
                                  <button 
                                    onClick={() => setPriceFilters([])}
                                    className="w-full mt-2 py-2.5 text-[10px] font-black text-viettel-red border-t border-slate-100 hover:bg-red-50 transition-colors"
                                  >
                                    Xóa lọc
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Có <span className="text-viettel-red">{filteredSims.length.toLocaleString()}</span> số
                    </div>
                  </div>
                </div>

                {/* Table Header & List Container with Horizontal Scroll */}
                <div className="w-full">
                  <div className="w-full">
                    {/* Table Header */}
                    <div className={`grid ${simFilter === 'dep' ? 'grid-cols-[105px_50px_60px_auto] md:grid-cols-[2.5fr_2fr_1.5fr_3fr]' : simFilter === 'phongthuy' ? 'grid-cols-[105px_40px_60px_auto] md:grid-cols-[3fr_1fr_2fr_1.5fr]' : 'grid-cols-[105px_40px_50px_60px_auto] md:grid-cols-[2.5fr_1fr_2fr_1.5fr_3fr]'} px-2 md:px-8 py-3 md:py-5 bg-slate-50 text-[9px] md:text-[13px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100`}>
                      <div>Sim số</div>
                      {simFilter !== 'dep' && <div className="text-center">Mệnh</div>}
                      <div className="text-center">Giá</div>
                      <div className="text-center">Hành động</div>
                      {simFilter !== 'phongthuy' && <div className="text-left pl-2 md:pl-6">LOẠI SIM ĐẸP</div>}
                    </div>

                    {/* Sim List */}
                    <div className="divide-y divide-slate-50">
                      {currentSims.length > 0 ? (
                        currentSims.map(sim => {
                          const displayMenh = sim.menh || getMenhAndColor(sim.normalizedPhone).menh;
                          const displayColor = sim.menhColor || getMenhAndColor(sim.normalizedPhone).color;
                          
                          return (
                            <div key={sim.id} className={`grid ${simFilter === 'dep' ? 'grid-cols-[105px_50px_60px_auto] md:grid-cols-[2.5fr_2fr_1.5fr_3fr]' : simFilter === 'phongthuy' ? 'grid-cols-[105px_40px_60px_auto] md:grid-cols-[3fr_1fr_2fr_1.5fr]' : 'grid-cols-[105px_40px_50px_60px_auto] md:grid-cols-[2.5fr_1fr_2fr_1.5fr_3fr]'} px-2 md:px-8 py-3 md:py-5 items-center hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-0 group`}>
                              <div className="font-black text-slate-800 text-sm md:text-lg tracking-tighter whitespace-nowrap group-hover:text-viettel-red transition-colors">{highlightSearchText(formatPhoneSmart(sim), searchQuery)}</div>
                              
                              {simFilter !== 'dep' && (
                                <div className="flex justify-center">
                                  {displayMenh ? (
                                    <div 
                                      className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-white font-black text-[8px] md:text-[10px] uppercase shadow-sm transition-transform group-hover:scale-110"
                                      style={{ 
                                        backgroundColor: displayColor,
                                        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                        WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                      }}
                                    >
                                      {displayMenh}
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[8px] text-slate-300 font-bold">
                                      N/A
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="text-center font-black text-viettel-red text-xs md:text-base whitespace-nowrap">
                                {getAutoPrice(sim).replace(/k$/i, '')}
                              </div>
                              <div className="flex justify-center">
                                <button 
                                  onClick={() => setSelectedSimForPurchase(sim)}
                                  className="px-3 py-1.5 md:px-8 md:py-2.5 bg-gradient-to-r from-viettel-red to-red-600 text-white rounded-full text-[9px] md:text-[13px] font-black hover:from-red-600 hover:to-red-700 transition-all active:scale-95 shadow-[0_4px_10px_rgba(238,0,51,0.3)] hover:shadow-[0_6px_15px_rgba(238,0,51,0.4)]"
                                >
                                  Mua
                                </button>
                              </div>
                              
                              {simFilter !== 'phongthuy' && (
                                <div className="flex flex-wrap gap-1 md:gap-2 justify-start pl-2 md:pl-6">
                                  {sim.simTypes.map((t, idx) => (
                                    <span key={idx} className="inline-flex items-center px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[8px] md:text-[10px] font-black uppercase text-viettel-red bg-red-50 border border-red-100 whitespace-nowrap shadow-sm">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-24 text-center text-slate-400 text-sm font-medium">Không tìm thấy SIM phù hợp</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {filteredSims.length > 0 && (
                  <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                      <span>Hiển thị</span>
                      <select 
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-viettel-red focus:ring-1 focus:ring-viettel-red transition-all cursor-pointer font-bold text-slate-700"
                      >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>SIM/trang</span>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-white transition-colors"
                        >
                          <i className="fa-solid fa-chevron-left"></i>
                        </button>
                        <div className="flex gap-1.5">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                            if (pageNum <= 0) return null;
                            
                            return (
                              <button 
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-black transition-all ${
                                  currentPage === pageNum 
                                    ? 'bg-viettel-red text-white shadow-lg shadow-red-100 scale-110' 
                                    : 'bg-white text-slate-500 border border-slate-100 hover:border-viettel-red hover:text-viettel-red'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 disabled:opacity-30 hover:bg-white transition-colors"
                        >
                          <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

          {/* COMBO THOẠI + DATA Section */}
          <div className="mt-10 bg-[#0056B3] rounded-[32px] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <h3 className="text-white text-2xl sm:text-3xl font-black text-center mb-8 uppercase tracking-tight relative z-10">
              COMBO THOẠI + DATA
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
              {[
                { 
                  id: 'V120B', 
                  data: '45GB', 
                  dataLabel: 'Data',
                  intCalls: 'Miễn phí',
                  intCallsLabel: 'nội mạng',
                  extCalls: '50 phút',
                  extCallsLabel: 'ngoại mạng',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '120.000 đ' 
                },
                { 
                  id: 'V150B', 
                  data: '60GB', 
                  dataLabel: 'Data',
                  intCalls: 'Miễn phí',
                  intCallsLabel: 'nội mạng',
                  extCalls: '80 phút',
                  extCallsLabel: 'ngoại mạng',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '150.000 đ' 
                },
                { 
                  id: 'V160B', 
                  data: '120GB', 
                  dataLabel: 'Data',
                  intCalls: 'Miễn phí',
                  intCallsLabel: 'nội mạng',
                  extCalls: '100 phút',
                  extCallsLabel: 'ngoại mạng',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '160.000 đ' 
                },
                { 
                  id: 'V180B', 
                  data: '180GB', 
                  dataLabel: 'Data',
                  intCalls: 'Miễn phí',
                  intCallsLabel: 'nội mạng',
                  extCalls: '100 phút',
                  extCallsLabel: 'ngoại mạng',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '180.000 đ' 
                },
                { 
                  id: 'V200B', 
                  data: '240GB', 
                  dataLabel: 'Data',
                  intCalls: 'Miễn phí',
                  intCallsLabel: 'nội mạng',
                  extCalls: '100 phút',
                  extCallsLabel: 'ngoại mạng',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '200.000 đ' 
                },
              ].slice(0, showAllComboPlans ? 5 : 2).map((plan) => (
                <div key={plan.id} className="bg-white rounded-[24px] p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-shadow">
                  {/* Left: Package Graphic */}
                  <div className="relative w-full sm:w-48 shrink-0 aspect-[4/3] sm:aspect-[4/5]">
                    <div className="absolute inset-0 bg-[#E60023] rounded-[20px] flex flex-col items-center justify-center text-white p-4 overflow-hidden">
                      {/* Decorative curves */}
                      <div className="absolute -top-10 -left-10 w-32 h-32 border-[1px] border-white/20 rounded-full"></div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 border-[1px] border-white/20 rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[1px] border-white/10 rounded-full"></div>
                      
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Viettel_logo_2021.svg/1200px-Viettel_logo_2021.svg.png" 
                        alt="Viettel" 
                        className="w-20 mb-2 brightness-0 invert"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-4xl font-black tracking-tighter drop-shadow-md">{plan.id}</div>
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="flex-1 flex flex-col pt-2">
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <div className="flex flex-col items-center text-center">
                        <i className="fa-solid fa-arrow-up-down text-[#00B14F] text-lg mb-2"></i>
                        <div className="text-sm font-black text-[#00B14F] leading-tight">{plan.data}</div>
                        <div className="text-xs text-[#00B14F] font-medium">{plan.dataLabel}</div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <i className="fa-solid fa-phone-volume text-[#00B14F] text-lg mb-2"></i>
                        <div className="text-sm font-black text-[#00B14F] leading-tight">{plan.intCalls}</div>
                        <div className="text-xs text-[#00B14F] font-medium">{plan.intCallsLabel}</div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <i className="fa-solid fa-phone text-[#00B14F] text-lg mb-2"></i>
                        <div className="text-sm font-black text-[#00B14F] leading-tight">{plan.extCalls}</div>
                        <div className="text-xs text-[#00B14F] font-medium">{plan.extCallsLabel}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {plan.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#FF6A00] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <i className="fa-solid fa-check text-[10px]"></i>
                          </div>
                          <span className="text-sm font-bold text-slate-800 leading-tight">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto">
                      <div className="text-sm font-medium text-slate-600 mb-3">
                        Giá từ: <span className="text-[#E60023] text-xl font-black">{plan.price}</span>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setSelectedPackageForDetail(plan)}
                          className="flex-1 py-2.5 rounded-xl border border-[#0056B3] text-[#0056B3] text-sm font-black hover:bg-blue-50 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        {renderSelectNumberButton(plan.id)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAllComboPlans(!showAllComboPlans)}
              className="w-full mt-8 text-white text-sm font-black flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            >
              {showAllComboPlans ? 'Thu gọn' : 'Xem thêm'} <i className={`fa-solid fa-chevron-${showAllComboPlans ? 'up' : 'down'} text-xs`}></i>
            </button>
          </div>

          {/* Super DATA Section */}
          <div className="mt-10 bg-gradient-to-br from-[#FF8C00] via-[#E60023] to-[#C71585] rounded-[32px] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <h3 className="text-white text-2xl sm:text-3xl font-black text-center mb-8 uppercase tracking-tight relative z-10">
              Super DATA
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
              {[
                { 
                  id: '5G135N', 
                  data: '180GB', 
                  dataLabel: 'Data/tháng',
                  tv: 'Miễn phí TV360',
                  benefits: [
                    'Tặng 01 tháng cước khi mua Sim từ 400k đến 990k',
                    'Tặng PMH giảm giá 50% phụ kiện'
                  ],
                  price: '135.000 đ',
                  badge: 'NEW'
                },
                { 
                  id: '12T5G125', 
                  data: '500GB', 
                  dataLabel: 'Data/tháng',
                  desc: 'Data trong 12 tháng',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '1.500.000 đ',
                  badge: 'GÓI NĂM'
                },
                { 
                  id: '5G150N', 
                  data: '240GB', 
                  dataLabel: 'Data/tháng',
                  tv: 'Miễn phí TV360',
                  benefits: [
                    'Tặng PMH giảm giá 50% phụ kiện'
                  ],
                  price: '150.000 đ',
                  badge: 'NEW'
                },
                { 
                  id: 'SD125T', 
                  data: '300GB', 
                  dataLabel: 'Data 5G /tháng',
                  benefits: [
                    'Áp dụng tại 08 tỉnh'
                  ],
                  price: '125.000 đ' 
                },
                { 
                  id: 'SD125Z', 
                  data: '10GB/ngày', 
                  dataLabel: 'Ưu đãi tối đa',
                  benefits: [
                    'Ưu đãi lên tới 10GB Data/ngày khi tham gia đóng trước 12 tháng',
                    'Áp dụng tại 9 tỉnh'
                  ],
                  price: '125.000 đ' 
                },
                { 
                  id: 'SD90', 
                  data: '45GB', 
                  dataLabel: 'Data/tháng (1.5GB/ngày)',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '90.000 đ' 
                },
                { 
                  id: 'SD120', 
                  data: '60GB', 
                  dataLabel: 'Data/tháng (2GB/ngày)',
                  tv: 'Free TV360',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '120.000 đ' 
                },
                { 
                  id: 'SD135', 
                  data: '150GB', 
                  dataLabel: 'Data/tháng (5GB/ngày)',
                  tv: 'Free TV360 Basic',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '135.000 đ',
                  badge: 'HOT'
                },
                { 
                  id: 'SD150', 
                  data: '90GB', 
                  dataLabel: 'Data/tháng (3GB/ngày)',
                  tv: 'Free TV360',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '150.000 đ' 
                },
              ].slice(0, showAllSuperDataPlans ? 9 : 2).map((plan) => (
                <div key={plan.id} className="bg-white rounded-[24px] p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-shadow">
                  {/* Left: Package Graphic */}
                  <div className="relative w-full sm:w-48 shrink-0 aspect-[4/3] sm:aspect-[4/5]">
                    {plan.badge && (
                      <div className="absolute top-2 left-2 bg-[#FFD400] text-slate-900 text-[10px] font-black px-3 py-1 rounded-full z-20 shadow-sm">
                        {plan.badge}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-[#E60023] rounded-[20px] flex flex-col items-center justify-center text-white p-4 overflow-hidden">
                      {/* Decorative curves */}
                      <div className="absolute -top-10 -left-10 w-32 h-32 border-[1px] border-white/20 rounded-full"></div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 border-[1px] border-white/20 rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[1px] border-white/10 rounded-full"></div>
                      
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Viettel_logo_2021.svg/1200px-Viettel_logo_2021.svg.png" 
                        alt="Viettel" 
                        className="w-20 mb-2 brightness-0 invert"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-4xl font-black tracking-tighter drop-shadow-md">{plan.id}</div>
                    </div>
                  </div>

                  {/* Right: Info */}
                  <div className="flex-1 flex flex-col pt-2">
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      <div className="flex flex-col items-center text-center">
                        <i className="fa-solid fa-arrow-up-down text-[#00B14F] text-lg mb-2"></i>
                        <div className="text-sm font-black text-[#00B14F] leading-tight">{plan.data}</div>
                        <div className="text-xs text-[#00B14F] font-medium">{plan.dataLabel}</div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <i className="fa-solid fa-tv text-[#00B14F] text-lg mb-2"></i>
                        <div className="text-sm font-black text-[#00B14F] leading-tight">{plan.tv || 'Miễn phí'}</div>
                        <div className="text-xs text-[#00B14F] font-medium">{plan.desc || 'TV360'}</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {plan.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#FF6A00] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <i className="fa-solid fa-check text-[10px]"></i>
                          </div>
                          <span className="text-sm font-bold text-slate-800 leading-tight">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto">
                      <div className="text-sm font-medium text-slate-600 mb-3">
                        Giá từ: <span className="text-[#E60023] text-xl font-black">{plan.price}</span>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setSelectedPackageForDetail(plan)}
                          className="flex-1 py-2.5 rounded-xl border border-[#0056B3] text-[#0056B3] text-sm font-black hover:bg-blue-50 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        {renderSelectNumberButton(plan.id)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAllSuperDataPlans(!showAllSuperDataPlans)}
              className="w-full mt-8 text-white text-sm font-black flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            >
              {showAllSuperDataPlans ? 'Thu gọn' : 'Xem thêm'} <i className={`fa-solid fa-chevron-${showAllSuperDataPlans ? 'up' : 'down'} text-xs`}></i>
            </button>
          </div>

          {/* GÓI 5G - TỐC ĐỘ VƯỢT TRỘI Section - Redesigned to match competitor */}
          <div className="mt-10 bg-[#E60023] rounded-[32px] p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
            
            <h3 className="text-white text-2xl sm:text-3xl font-black text-center mb-8 uppercase tracking-tight relative z-10">
              5G - TỐC ĐỘ VƯỢT TRỘI
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
              {[
                { 
                  id: '5G160B', 
                  data: '120GB', 
                  dataLabel: 'Data/tháng',
                  calls: '1000p nội, 100p ngoại mạng',
                  tv: 'Free TV360',
                  benefits: [
                    'Miễn phí tháng cước đầu tiên khi mua Sim từ 1trđ',
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '160.000 đ' 
                },
                { 
                  id: '5G180B', 
                  data: '180GB', 
                  dataLabel: 'Data/tháng',
                  calls: '1000p nội, 100p ngoại mạng',
                  tv: 'Free TV360',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '180.000 đ' 
                },
                { 
                  id: '5G230B', 
                  data: '240GB', 
                  dataLabel: 'Data/tháng',
                  calls: '1000p nội, 150p ngoại mạng',
                  tv: 'Free TV360',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '230.000 đ' 
                },
                { 
                  id: '5G280B', 
                  data: '300GB', 
                  dataLabel: 'Data/tháng',
                  calls: '1000p nội, 200p ngoại mạng',
                  tv: 'Free TV360',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '280.000 đ' 
                },
                { 
                  id: '5G330B', 
                  data: '360GB', 
                  dataLabel: 'Data/tháng',
                  calls: '1000p nội, 300p ngoại mạng',
                  tv: 'Free TV360',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '330.000 đ' 
                },
                { 
                  id: '5G380B', 
                  data: '450GB', 
                  dataLabel: 'Data/tháng',
                  calls: '1000p nội, 300p ngoại mạng',
                  tv: 'Free TV360 và 150GB Mybox',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '380.000 đ' 
                },
                { 
                  id: '5G480B', 
                  data: '600GB', 
                  dataLabel: 'Data/tháng',
                  calls: '1000p nội, 300p ngoại mạng',
                  tv: 'Free TV360 và 200GB Mybox',
                  benefits: [
                    'Tặng PMH giảm 50% phụ kiện'
                  ],
                  price: '480.000 đ' 
                },
              ].slice(0, showAll5GPlans ? 7 : 2).map((plan) => (
                <div key={plan.id} className="bg-white rounded-[24px] p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-shadow">
                  {/* Left: Package Graphic */}
                  <div className="relative w-full sm:w-48 shrink-0 aspect-[4/3] sm:aspect-[4/5]">
                    <div className="absolute top-2 left-2 bg-[#FFD400] text-slate-900 text-[10px] font-black px-3 py-1 rounded-full z-20 shadow-sm">
                      NEW
                    </div>
                    <div className="w-full h-full bg-[#E60023] rounded-[20px] flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
                      {/* Decorative curves */}
                      <div className="absolute -top-10 -left-10 w-32 h-32 border-[1px] border-white/20 rounded-full"></div>
                      <div className="absolute -bottom-10 -right-10 w-40 h-40 border-[1px] border-white/20 rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[1px] border-white/10 rounded-full"></div>

                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Viettel_logo_2021.svg/1200px-Viettel_logo_2021.svg.png" 
                        alt="Viettel" 
                        className="w-20 mb-2 brightness-0 invert"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-4xl font-black tracking-tighter leading-none">{plan.id}</div>
                    </div>
                  </div>

                  {/* Right: Plan Details */}
                  <div className="flex-1 flex flex-col pt-2">
                    {/* Icons Row */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      <div className="flex flex-col items-center text-center">
                        <i className="fa-solid fa-arrow-up-down text-[#00B14F] text-lg mb-2"></i>
                        <div className="text-sm font-black text-[#00B14F] leading-tight">{plan.data}</div>
                        <div className="text-xs font-medium text-[#00B14F]">{plan.dataLabel}</div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <i className="fa-solid fa-phone-volume text-[#00B14F] text-lg mb-2"></i>
                        <div className="text-xs font-medium text-[#00B14F] leading-tight line-clamp-2">{plan.calls}</div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <i className="fa-solid fa-tv text-[#00B14F] text-lg mb-2"></i>
                        <div className="text-xs font-medium text-[#00B14F] leading-tight">{plan.tv}</div>
                      </div>
                    </div>

                    {/* Benefits List */}
                    <div className="space-y-2 mb-6">
                      {plan.benefits.map((benefit, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#FF6A00] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <i className="fa-solid fa-check text-[10px]"></i>
                          </div>
                          <span className="text-sm font-bold text-slate-800 leading-tight">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price and Buttons */}
                    <div className="mt-auto">
                      <div className="mb-3">
                        <span className="text-sm font-medium text-slate-600">Giá từ: </span>
                        <span className="text-xl font-black text-[#E60023]">{plan.price}</span>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setSelectedPackageForDetail(plan)}
                          className="flex-1 py-2.5 border border-[#0056B3] text-[#0056B3] rounded-xl text-sm font-black hover:bg-blue-50 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        {renderSelectNumberButton(plan.id)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAll5GPlans(!showAll5GPlans)}
              className="w-full mt-8 text-white text-sm font-black flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            >
              {showAll5GPlans ? 'Thu gọn' : 'Xem thêm'} <i className={`fa-solid fa-chevron-${showAll5GPlans ? 'up' : 'down'} text-xs`}></i>
            </button>
          </div>

          {/* MẠNG XÃ HỘI Section - Redesigned */}
          <div className="mt-10 bg-gradient-to-br from-[#D81B60] to-[#8E24AA] rounded-[32px] p-1 sm:p-2 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white"></div>
              <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full border-8 border-white"></div>
            </div>
            
            <div className="relative z-10 py-6 text-center">
              <h3 className="text-white text-2xl sm:text-3xl font-black uppercase tracking-tight drop-shadow-md">
                MẠNG XÃ HỘI
              </h3>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-[28px] p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    id: 'MXH120',
                    name: 'MXH120',
                    data: '30GB',
                    dataLabel: 'Data',
                    benefits: ['Free Facebook, Tiktok, Youtube', 'Free nội mạng & 30p ngoại mạng'],
                    price: '120.000 đ',
                    promo: 'Tặng PMH giảm 50% phụ kiện',
                    badge: 'HOT'
                  },
                  {
                    id: 'MXH150',
                    name: 'MXH150',
                    data: '45GB',
                    dataLabel: 'Data',
                    benefits: ['Free Facebook, Tiktok, Youtube', 'Free nội mạng & 50p ngoại mạng'],
                    price: '150.000 đ',
                    promo: 'Tặng PMH giảm 50% phụ kiện'
                  }
                ].map((plan, idx) => (
                  <div key={idx} className="bg-white rounded-[24px] p-4 shadow-lg border border-slate-100 flex flex-col sm:flex-row gap-4 hover:shadow-2xl hover:border-viettel-red transition-all group relative">
                    {plan.badge && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-[#FFD700] text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg shadow-sm uppercase tracking-wider">
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    
                    {/* Left: Red Block */}
                    <div className="w-full sm:w-40 h-48 sm:h-auto bg-[#E60023] rounded-2xl p-4 flex flex-col justify-center items-center text-white relative overflow-hidden shrink-0">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8"></div>
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Viettel_logo_2021.svg/2560px-Viettel_logo_2021.svg.png" 
                        alt="Viettel" 
                        className="w-20 mb-2 brightness-0 invert"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-4xl font-black tracking-tighter drop-shadow-md">{plan.name}</div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 flex flex-col pt-2">
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="flex flex-col items-center text-center">
                          <i className="fa-solid fa-arrow-up-down text-[#00B14F] text-lg mb-1"></i>
                          <div className="text-sm font-black text-[#00B14F] leading-tight">{plan.data}</div>
                          <div className="text-[10px] text-[#00B14F] font-medium uppercase">{plan.dataLabel}</div>
                        </div>
                        <div className="flex flex-col items-center text-center col-span-2">
                          <i className="fa-solid fa-globe text-[#00B14F] text-lg mb-1"></i>
                          <div className="text-[10px] font-black text-[#00B14F] leading-tight uppercase">Free Facebook, Tiktok, Youtube</div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {plan.benefits.map((benefit, bIdx) => (
                          <div key={bIdx} className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-[#FF6A00] text-white flex items-center justify-center shrink-0 mt-0.5">
                              <i className="fa-solid fa-check text-[8px]"></i>
                            </div>
                            <span className="text-xs font-bold text-slate-800 leading-tight">{benefit}</span>
                          </div>
                        ))}
                        {plan.promo && (
                          <div className="flex items-center gap-2 text-[#E60023]">
                            <i className="fa-solid fa-circle-check text-xs"></i>
                            <span className="text-xs font-black">{plan.promo}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto">
                        <div className="text-xs font-medium text-slate-600 mb-2">
                          Giá từ: <span className="text-[#E60023] text-lg font-black">{plan.price}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedPackageForDetail(plan)}
                            className="flex-1 py-2 rounded-xl border border-[#0056B3] text-[#0056B3] text-xs font-black hover:bg-blue-50 transition-colors"
                          >
                            Xem chi tiết
                          </button>
                          {renderSelectNumberButton(plan.id)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIM DU LỊCH QUỐC TẾ Section - Redesigned */}
          <div className="mt-10 bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] rounded-[32px] p-1 sm:p-2 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <i className="fa-solid fa-plane absolute top-10 right-10 text-6xl text-white -rotate-45"></i>
              <i className="fa-solid fa-earth-americas absolute bottom-10 left-10 text-6xl text-white"></i>
            </div>
            
            <div className="relative z-10 py-6 text-center">
              <h3 className="text-white text-2xl sm:text-3xl font-black uppercase tracking-tight drop-shadow-md">
                Sim Du lịch Quốc tế
              </h3>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-[28px] p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    id: 'ASEAN15',
                    name: 'ASEAN15',
                    data: '5GB Data',
                    dataLabel: 'roaming /15 ngày',
                    location: '9 Nước ASEAN',
                    price: '250.000 đ',
                    originalPrice: '300.000đ',
                    promo: 'Combo Sim kèm gói chỉ 300.000d',
                    badge: 'MỚI'
                  },
                  {
                    id: 'DR15',
                    name: 'DR15',
                    data: '5GB Data',
                    dataLabel: 'roaming /15 ngày',
                    location: '155 Quốc gia /Vùng lãnh thổ',
                    price: '550.000 đ',
                    originalPrice: '600.000đ',
                    promo: 'Combo Sim kèm gói chỉ 600.000d',
                    badge: 'MỚI'
                  },
                  {
                    id: 'DRU7',
                    name: 'DRU7',
                    data: '7GB Data',
                    dataLabel: 'Roaming /7 ngày',
                    location: '80 Quốc gia /Vùng lãnh thổ',
                    price: '350.000 đ',
                    originalPrice: '400.000đ',
                    promo: 'Combo Sim kèm gói chỉ 400.000d',
                    badge: 'MỚI'
                  }
                ].map((plan, idx) => (
                  <div key={idx} className="bg-white rounded-[24px] p-4 shadow-lg border border-slate-100 flex flex-col hover:shadow-2xl hover:border-viettel-red transition-all group relative">
                    {plan.badge && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="bg-[#FFD700] text-slate-900 text-[10px] font-black px-3 py-1 rounded-lg shadow-sm uppercase tracking-wider">
                          {plan.badge}
                        </span>
                      </div>
                    )}
                    
                    {/* Top: Red Block */}
                    <div className="w-full h-40 bg-[#E60023] rounded-2xl p-4 flex flex-col justify-center items-center text-white relative overflow-hidden mb-4">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Viettel_logo_2021.svg/2560px-Viettel_logo_2021.svg.png" 
                        alt="Viettel" 
                        className="w-16 mb-2 brightness-0 invert"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-3xl font-black tracking-tighter drop-shadow-md">{plan.name}</div>
                      <div className="text-[10px] font-bold opacity-90">{plan.dataLabel}</div>
                      <div className="absolute bottom-0 left-0 w-full h-12 bg-white/10 flex items-center justify-center">
                        <img src="https://viettelstore.vn/Content/images/roaming-icon.png" alt="" className="h-8 opacity-50" />
                      </div>
                    </div>

                    {/* Bottom: Info */}
                    <div className="flex-1 flex flex-col">
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="flex flex-col items-center text-center">
                          <i className="fa-solid fa-arrow-up-down text-[#00B14F] text-lg mb-1"></i>
                          <div className="text-sm font-black text-[#00B14F] leading-tight">{plan.data}</div>
                          <div className="text-[10px] text-[#00B14F] font-medium uppercase leading-tight">roaming /15 ngày</div>
                        </div>
                        <div className="flex flex-col items-center text-center">
                          <i className="fa-solid fa-location-dot text-[#E60023] text-lg mb-1"></i>
                          <div className="text-[10px] font-black text-slate-800 leading-tight uppercase">{plan.location}</div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-[#E60023]">
                          <i className="fa-solid fa-circle-check text-xs"></i>
                          <span className="text-xs font-black">{plan.promo}</span>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="text-xs font-medium text-slate-600 mb-2">
                          Giá từ: <span className="text-[#E60023] text-lg font-black">{plan.price}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedPackageForDetail(plan)}
                            className="flex-1 py-2 rounded-xl border border-[#0056B3] text-[#0056B3] text-xs font-black hover:bg-blue-50 transition-colors"
                          >
                            Xem chi tiết
                          </button>
                          {renderSelectNumberButton(plan.id)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </div>
            <SidebarBanners />
          </div>
        </main>

        {/* Bottom Navigation (Keep it visible) */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-1 flex justify-around items-center z-50">
          {[
            { id: 'home', label: 'Trang chủ', icon: 'fa-house' },
            { id: 'category', label: 'Danh mục', icon: 'fa-grip' },
            { id: 'promo', label: 'Khuyến mãi', icon: 'fa-tags' },
            { id: 'store', label: 'Cửa hàng', icon: 'fa-store' },
            { id: 'news', label: 'Tin tức', icon: 'fa-newspaper' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setShowSimList(false);
              }}
              className={`flex flex-col items-center gap-1 py-1 px-2 min-w-[64px] transition-colors ${
                activeTab === item.id ? 'text-viettel-red' : 'text-slate-400'
              }`}
            >
              <div className={`text-lg ${activeTab === item.id ? 'scale-110 transition-transform' : ''}`}>
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-viettel-text">
      {renderPurchaseModal()}
      {renderPackageDetailModal()}
      {renderCartModal()}
      {/* Header */}
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 bg-viettel-red rounded-lg flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform" 
            onClick={(e) => {
              const now = Date.now();
              const lastClick = (window as any)._lastLogoClick || 0;
              const clickCount = (window as any)._logoClickCount || 0;
              
              if (now - lastClick < 500) {
                (window as any)._logoClickCount = clickCount + 1;
              } else {
                (window as any)._logoClickCount = 1;
              }
              
              (window as any)._lastLogoClick = now;
              
              if ((window as any)._logoClickCount === 3) {
                onAdminAccess();
                (window as any)._logoClickCount = 0;
              }
            }}
          >
            <i className="fa-solid fa-star"></i>
          </div>
          <span className="font-black text-viettel-red tracking-tighter text-lg">VIETTEL STORE</span>
        </div>

        {/* Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-8 ml-12">
          {[
            { 
              label: 'SIM SỐ ĐẸP', 
              hasDropdown: true,
              subItems: [
                'SIM ĐẸP THEO GIÁ',
                'SIM PHONG THỦY',
                'SIM MAY MẮN',
                'SIM TRẢ SAU',
                'SIM 500GB/THÁNG MIỄN PHÍ 12 THÁNG',
                'CHỌN GÓI KHUYẾN MÃI TIẾT KIỆM NHẤT CHO SIM ĐANG SỬ DỤNG'
              ]
            },
            { 
              label: 'INTERNET - TRUYỀN HÌNH TV360 - CAMERA', 
              hasDropdown: true,
              subItems: [
                'Internet',
                'Camera',
                'Truyền hình TV360',
                'Combo Internet',
                'Internet Doanh nghiệp'
              ]
            },
            { label: 'KHUYỄN MÃI - HƯỚNG DẪN', hasDropdown: true },
            { 
              label: 'DỊCH VỤ VIETTEL TOÀN DIỆN', 
              hasDropdown: true,
              subItems: [
                'Cập nhật CMT lên CCCD miễn phí',
                'Cấp lại Sim bị Thu hồi, cháy, hỏng',
                'Hỗ trợ ĐKTT chính chủ miễn phí'
              ]
            },
          ].map((item, idx) => (
            <div key={idx} className="relative group py-4">
              <button 
                onClick={() => {
                  if (item.label === 'SIM SỐ ĐẸP') {
                    setActiveTab('category');
                    setActiveCategory('sim');
                    setShowSimList(false);
                  }
                }}
                className="flex items-center gap-1.5 text-[13px] font-black text-slate-800 hover:text-viettel-red transition-colors"
              >
                <span>{item.label}</span>
                {item.hasDropdown && (
                  <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-viettel-red transition-colors"></i>
                )}
              </button>
              
              {item.subItems && (
                <div className="absolute top-full left-0 w-64 bg-white shadow-xl border border-slate-100 rounded-md py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  {item.subItems.map((sub, sIdx) => (
                    <button 
                      key={sIdx} 
                      onClick={() => {
                        setActiveTab('category');
                        if (sub === 'SIM PHONG THỦY') {
                          setActiveCategory('phongthuy');
                          setShowSimList(false);
                        } else if (sub === 'SIM ĐẸP THEO GIÁ') {
                          setActiveCategory('sim-price');
                          setShowSimList(false);
                        } else {
                          setActiveCategory('sim');
                          setShowSimList(true);
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-viettel-red transition-colors border-b border-slate-50 last:border-0"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-slate-500">
          <i className="fa-solid fa-magnifying-glass"></i>
          <div 
            className="relative cursor-pointer hover:text-viettel-red transition-colors"
            onClick={() => setIsCartModalOpen(true)}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-viettel-red text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {isSidebarOpen && activeTab === 'category' && (
          <div 
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar - Only for Category Tab */}
        {activeTab === 'category' && (
          <aside className={`fixed md:relative inset-y-0 left-0 w-24 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            {categories.map(cat => (
              <div 
                key={cat.id} 
                className="relative"
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button
                  onClick={() => {
                    setActiveCategory(cat.id);
                    if (cat.id === 'internet-tv-camera') {
                      setActivePackageTab('all');
                    } else {
                      setIsSidebarOpen(false);
                    }
                    setShowSimList(false);
                  }}
                  className={`w-full py-4 px-2 flex flex-col items-center gap-2 transition-all relative ${
                    (activeCategory === cat.id || (cat.id === 'sim' && (activeCategory === 'sim-price' || activeCategory === 'phongthuy')))
                      ? 'text-viettel-red bg-slate-50' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {(activeCategory === cat.id || (cat.id === 'sim' && (activeCategory === 'sim-price' || activeCategory === 'phongthuy'))) && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-viettel-red"></div>
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    (activeCategory === cat.id || (cat.id === 'sim' && (activeCategory === 'sim-price' || activeCategory === 'phongthuy'))) ? 'bg-viettel-red/10' : 'bg-slate-100'
                  }`}>
                    <i className={`fa-solid ${cat.icon}`}></i>
                  </div>
                  <span className="text-[10px] font-bold text-center leading-tight">{cat.label}</span>
                </button>

                {/* Sub-menu for internet-tv-camera */}
                {cat.id === 'internet-tv-camera' && hoveredCategory === 'internet-tv-camera' && (
                  <div 
                    className="absolute left-full top-0 ml-0 w-60 bg-white shadow-[20px_0_40px_rgba(0,0,0,0.12)] border border-slate-100 rounded-r-[32px] py-6 z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
                    onMouseEnter={() => setHoveredCategory('internet-tv-camera')}
                    onMouseLeave={() => setHoveredSubCategory(null)}
                  >
                    {[
                      { label: 'Internet', tab: 'internet' },
                      { label: 'Truyền hình TV360', tab: 'tv' },
                      { label: 'Camera Viettel', tab: 'camera' },
                      { 
                        label: 'Combo', 
                        tab: 'combo',
                        subItems: [
                          { label: 'Combo Internet – TV360', tab: 'combo-tv' },
                          { label: 'Combo internet – Camera', tab: 'combo-camera' }
                        ]
                      }
                    ].map(sub => (
                      <div 
                        key={sub.label} 
                        className="relative"
                        onMouseEnter={() => sub.subItems ? setHoveredSubCategory(sub.label) : setHoveredSubCategory(null)}
                      >
                        <button 
                          className={`w-full text-left px-8 py-4 text-[13px] font-black transition-all flex items-center justify-between group/item ${
                            (sub.tab === activePackageTab || (sub.tab === null && activePackageTab === 'all'))
                              ? 'text-viettel-red bg-red-50/50' 
                              : 'text-slate-700 hover:bg-slate-50 hover:text-viettel-red'
                          }`}
                          onClick={() => {
                            if (!sub.subItems) {
                              setActiveCategory('internet-tv-camera');
                              if (sub.tab) setActivePackageTab(sub.tab);
                              else setActivePackageTab('all');
                              setHoveredCategory(null);
                              setHoveredSubCategory(null);
                              setIsSidebarOpen(false); // Close sidebar on mobile
                            }
                          }}
                        >
                          <span>{sub.label}</span>
                          <i className={`fa-solid fa-chevron-right text-[10px] transition-all ${
                            (sub.tab === activePackageTab || (sub.tab === null && activePackageTab === 'all') || sub.subItems)
                              ? 'opacity-100 translate-x-0' 
                              : 'opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0'
                          }`}></i>
                        </button>

                        {sub.subItems && hoveredSubCategory === sub.label && (
                          <div 
                            className="absolute left-full top-0 ml-0 w-64 bg-white shadow-[20px_0_40px_rgba(0,0,0,0.12)] border border-slate-100 rounded-r-[32px] py-6 z-[110] animate-in fade-in slide-in-from-left-2 duration-200"
                          >
                            {sub.subItems.map(item => (
                              <button
                                key={item.label}
                                className={`w-full text-left px-8 py-4 text-[13px] font-black transition-all ${
                                  activePackageTab === item.tab ? 'text-viettel-red bg-red-50/50' : 'text-slate-700 hover:bg-slate-50 hover:text-viettel-red'
                                }`}
                                onClick={() => {
                                  setActiveCategory('internet-tv-camera');
                                  setActivePackageTab(item.tab);
                                  setHoveredCategory(null);
                                  setHoveredSubCategory(null);
                                  setIsSidebarOpen(false);
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </aside>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 scroll-smooth">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {activeTab === 'home' ? (
                  <motion.div 
                    key="home"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full"
                  >
                    {renderHomeContent()}
                  </motion.div>
                ) : (
                  <motion.div 
                    key={activeCategory + activePackageTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onPanEnd={(e, info) => {
                      // Detect right swipe (swipe back)
                      if (info.offset.x > 80 && Math.abs(info.offset.y) < 50) {
                        if (activeCategory === 'sim-price' || activeCategory === 'phongthuy') {
                          setActiveCategory('sim');
                        } else if (activeCategory === 'internet-tv-camera' && activePackageTab !== 'all') {
                          setActivePackageTab('all');
                        }
                      }
                    }}
                    className="w-full"
                  >
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Back Button for Sub-categories */}
                        {((activeCategory === 'sim-price' || activeCategory === 'phongthuy') || 
                          (activeCategory === 'internet-tv-camera' && activePackageTab !== 'all')) && (
                          <button 
                            onClick={() => {
                              if (activeCategory === 'sim-price' || activeCategory === 'phongthuy') {
                                setActiveCategory('sim');
                              } else if (activeCategory === 'internet-tv-camera') {
                                setActivePackageTab('all');
                              }
                            }}
                            className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-500 hover:text-viettel-red hover:border-viettel-red transition-all active:scale-90"
                            title="Quay lại"
                          >
                            <i className="fa-solid fa-arrow-left"></i>
                          </button>
                        )}
                        <div className="w-3 h-10 bg-gradient-to-b from-viettel-red to-red-700 rounded-full shadow-[0_0_15px_rgba(238,0,51,0.4)]"></div>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase drop-shadow-sm flex items-center gap-3">
                          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                            {activeCategory === 'sim-price' ? 'SIM ĐẸP THEO GIÁ' : activeCategory === 'phongthuy' ? 'SIM PHONG THỦY' : categories.find(c => c.id === activeCategory)?.label}
                          </span>
                          {activeCategory === 'sim' && (
                            <span className="text-[10px] bg-viettel-red text-white px-2 py-0.5 rounded-full tracking-widest font-bold animate-pulse">HOT</span>
                          )}
                        </h2>
                      </div>
                    </div>
                    {renderCategoryContent()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Sidebar Banners (Visible on Home and Category PC) */}
            {(activeTab === 'home' || activeTab === 'category') && (
              <SidebarBanners />
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-1 flex justify-around items-center z-50">
        {[
          { id: 'home', label: 'Trang chủ', icon: 'fa-house' },
          { id: 'category', label: 'Danh mục', icon: 'fa-grip' },
          { id: 'promo', label: 'Khuyến mãi', icon: 'fa-tags' },
          { id: 'store', label: 'Cửa hàng', icon: 'fa-store' },
          { id: 'news', label: 'Tin tức', icon: 'fa-newspaper' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'category') {
                if (activeTab !== 'category') {
                  setActiveTab('category');
                  setIsSidebarOpen(true);
                } else {
                  setIsSidebarOpen(!isSidebarOpen);
                }
              } else {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2 min-w-[64px] transition-colors ${
              (activeTab === item.id || (item.id === 'category' && isSidebarOpen)) ? 'text-viettel-red' : 'text-slate-400'
            }`}
          >
            <div className={`text-lg ${activeTab === item.id ? 'scale-110 transition-transform' : ''}`}>
              <i className={`fa-solid ${item.icon}`}></i>
            </div>
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CustomerView;
