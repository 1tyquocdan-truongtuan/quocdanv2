
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageCircle } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import { QRCodeCanvas } from 'qrcode.react';
import { createClient } from '@supabase/supabase-js';
import { SimType, SimEntry } from './types';
import { normalizePhone, analyzeSim, findConsecutiveIndex, checkArithmeticProgression, findSequentialPairs, getMenhAndColor } from './utils/simLogic';
import CustomerView from './src/components/CustomerView';

// --- Supabase Client Initialization ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- Mapping Helpers ---
const mapToCamelCase = (item: any): SimEntry => {
  let parsedSimTypes = [];
  if (Array.isArray(item.sim_types)) {
    parsedSimTypes = item.sim_types;
  } else if (typeof item.sim_types === 'string') {
    try {
      parsedSimTypes = JSON.parse(item.sim_types);
    } catch (e) {
      parsedSimTypes = [];
    }
  }

  return {
    id: item.id,
    originalPhone: item.original_phone || '',
    normalizedPhone: item.normalized_phone || '',
    lastSix: item.last_six || '',
    simTypes: parsedSimTypes,
    unitAdvanceDetail: item.unit_advance_detail || '',
    price: item.price || '',
    menh: item.network || '',
    menhColor: item.color_code || '',
  };
};

const mapToSnakeCase = (item: SimEntry) => ({
  id: item.id,
  original_phone: item.originalPhone,
  normalized_phone: item.normalizedPhone,
  last_six: item.lastSix,
  sim_types: item.simTypes,
  unit_advance_detail: item.unitAdvanceDetail,
  price: item.price,
  network: item.menh,          // Chỉnh từ menh_ sang network
  color_code: item.menhColor,   // Chỉnh từ menh_color sang color_code
});

// --- Constants cho Lưu trữ Cố định ---
const STORAGE_KEYS = {
  PRICES: 'SIM_MASTER_PERMANENT_PRICES',
  PRESETS: 'SIM_MASTER_PERMANENT_PRESETS',
  DOT_RULES: 'SIM_MASTER_DOT_FORMAT_RULES',
  RAW_DATA: 'SIM_MASTER_RAW_DATA'
};

// --- Types for UI ---
type DensityLevel = 'compact' | 'normal' | 'relaxed';
type ViewMode = 'customer' | 'admin';

interface DotRule {
  pattern: string;
  special: string;
}

// --- Helper function to parse price string to number for comparison ---
const parsePriceToNumber = (priceStr: string | undefined): number => {
  if (!priceStr || typeof priceStr !== 'string') return 0;
  
  const cleanStr = priceStr.toLowerCase().trim();
  if (cleanStr === 'l.hệ' || cleanStr === '-' || cleanStr === '') return 0;

  let valStr = cleanStr.replace(/[^0-9.,ktr]/g, '').replace(/,/g, '');
  
  try {
    let val = 0;
    if (valStr.includes('tr')) {
      val = parseFloat(valStr.replace('tr', '')) * 1000000;
    } else if (valStr.includes('k')) {
      val = parseFloat(valStr.replace('k', '')) * 1000;
    } else {
      val = parseFloat(valStr) || 0;
      // Heuristic: if no unit and small number, assume 'k'
      if (val > 0 && val < 10000) {
        val *= 1000;
      }
    }
    return val;
  } catch (e) {
    return 0;
  }
};

// --- Helper function to apply custom pattern ---
const applyPattern = (phone: string, pattern: string): string => {
  if (!pattern) return phone;
  let result = '';
  let phoneIdx = 0;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (/[0-9xX]/.test(char)) {
      if (phoneIdx < phone.length) {
        result += phone[phoneIdx];
        phoneIdx++;
      }
    } else {
      result += char;
    }
  }
  if (phoneIdx < phone.length) {
    result += phone.substring(phoneIdx);
  }
  return result;
};

// --- Components ---

const SidebarButton: React.FC<{
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
  color?: string;
  badge?: number;
  isLarge?: boolean;
  price03?: string;
  price09?: string;
  onPrice03Change?: (val: string) => void;
  onPrice09Change?: (val: string) => void;
  showPriceInput?: boolean;
  isSpecialToggle?: boolean; 
}> = ({ 
  icon, label, active, onClick, color = "blue", badge = 0, isLarge, 
  price03, price09, onPrice03Change, onPrice09Change,
  showPriceInput, isSpecialToggle
}) => (
  <div className="flex gap-1 items-center mb-1 group/btn-container">
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-between px-3 ${isLarge ? 'py-4 shadow-sm' : 'py-2.5'} rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-viettel-red text-white shadow-lg shadow-red-200' 
          : `bg-white text-viettel-text border border-slate-200 hover:bg-slate-50`
      }`}
    >
      <div className="flex items-center overflow-hidden">
        <i className={`fa-solid ${icon} w-5 text-center mr-2 flex-shrink-0 ${active ? 'text-white' : 'text-viettel-red'}`}></i>
        <span className={`font-bold ${isLarge ? 'text-sm' : 'text-[11px]'} truncate`}>{label}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
        {active && isSpecialToggle && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
        <span className={`text-[11px] px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500 font-bold'}`}>
          {badge.toLocaleString()}
        </span>
      </div>
    </button>
    
    {showPriceInput && (
      <div className="flex flex-col gap-1 ml-1 shrink-0">
        <div className="flex items-center bg-white border border-slate-200 rounded-md px-1 hover:border-viettel-red transition-colors">
          <span className="text-[10px] font-black text-slate-400 w-4 text-center">03</span>
          <input 
            type="text"
            placeholder="Giá..."
            value={(price03 || '').replace(/k$/i, '')}
            onChange={(e) => onPrice03Change?.(e.target.value)}
            className="w-10 py-1 text-[11px] font-bold outline-none bg-transparent text-slate-700 text-center placeholder:text-[11px]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center bg-white border border-slate-200 rounded-md px-1 hover:border-viettel-red transition-colors">
          <span className="text-[10px] font-black text-slate-400 w-10 text-center">09/08</span>
          <input 
            type="text"
            placeholder="Giá..."
            value={(price09 || '').replace(/k$/i, '')}
            onChange={(e) => onPrice09Change?.(e.target.value)}
            className="w-10 py-1 text-[11px] font-bold outline-none bg-transparent text-slate-700 text-center placeholder:text-[11px]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    )}
  </div>
);

const groupedQuickFilters = {
  vip: { label: 'PHÂN LOẠI VIP (SẢNH)', icon: 'fa-crown', color: 'orange', types: [SimType.TIEN_7_LIEN_TIEP, SimType.TIEN_6_LIEN_TIEP, SimType.TIEN_5_LIEN_TIEP] },
  taxi: { label: 'ĐẦU SỐ TAXI', icon: 'fa-taxi', color: 'yellow', types: [SimType.TAXI_DAU, SimType.TANG_DAN_DEU, SimType.TANG_DAN_DEU_3_CUOI, SimType.TIEN_DEU_2_DAY, SimType.TANG_DAN_DEU_4_CUOI, SimType.TANG_DAN_DEU_5_6_CAP] },
  vipDoc: { label: 'SIM VIP & SỐ ĐỘC', icon: 'fa-fire-flame-curved', color: 'rose', types: [SimType.TU_QUY_GIUA, SimType.NGU_QUY_GIUA, SimType.TAM_HOA_DUOI, SimType.TU_QUY_DUOI, SimType.NGU_QUY_DUOI] },
  singlePair: { label: 'NHÓM 1 CẶP GÁNH', icon: 'fa-equals', color: 'sky', types: [SimType.KEP_DUOI_1_CAP, SimType.KEP_AP_DUOI_1_CAP, SimType.KEP_GIUA_1_CAP, SimType.KEP_DAU_1_CAP, SimType.ABA_CDE_GANH] },
  boBa: { label: 'NHÓM 2 CẶP GÁNH', icon: 'fa-layer-group', color: 'indigo', types: [SimType.ABB_CDD, SimType.AAB_CCD, SimType.AAB_CDD, SimType.ABA_CCD, SimType.ABA_CDD, SimType.GANH_DOI] },
  bienThe: { label: 'LỌC SIM BIẾN THỂ', icon: 'fa-shuffle', color: 'emerald', types: [SimType.AABB_3_DUOI, SimType.AABB_2_DUOI, SimType.ABAB_3_DUOI, SimType.ABAB_2_DUOI, SimType.ABAB_1_DUOI, SimType.AABB_X] },
  cap: { label: 'NHÓM SIM CẶP', icon: 'fa-vector-square', color: 'purple', types: [SimType.AB_AD_DONG_CHUC_TIEN, SimType.AB_AD_DONG_CHUC, SimType.AB_CB_DONG_DON_VI_TIEN, SimType.AB_CB_DONG_DON_VI, SimType.TIEN_2_DOI_ABAC, SimType.TIEN_2_DOI_ABCB, SimType.SIM_CAP_DAO] },
  tien: { label: 'NHÓM TIẾN/LÙI', icon: 'fa-arrow-trend-up', color: 'blue', types: [SimType.TIEN_4_LIEN_TIEP, SimType.TIEN_3_LIEN_TIEP, SimType.TIEN_1_10_100, SimType.TIEN_DON_VI, SimType.LUI_DON_VI, SimType.TIEN_4_KHONG_DEU] },
  threePair: { label: 'NHÓM 3 CẶP', icon: 'fa-layer-group', color: 'emerald', types: [SimType.AB_AC_AD_TIEN, SimType.AB_AC_AD_FREE, SimType.AB_CB_DB_FREE, SimType.AB_CB_DB_TIEN, SimType.AB_CD_AB_GANH_CAP] }
};

interface FilterState { sort: 'asc' | 'desc' | null; contains: string; notContains: string; excludedValues: string[]; prefixFilter?: 'all' | '09' | 'not09'; }

const ColumnHeader: React.FC<{
  label?: React.ReactNode;
  columnKey?: string;
  onFilterChange?: (key: string, state: FilterState) => void;
  uniqueValues?: string[];
  activeFilter?: FilterState;
  densityClass: string;
  fontSize?: string;
  width: number;
  onResizeStart?: (key: string, e: React.MouseEvent) => void;
  onAutoFit?: (key: string) => void;
  isCheckbox?: boolean;
  onToggleAll?: () => void;
  isAllSelected?: boolean;
  selectedPrefixes?: string[];
  setSelectedPrefixes?: (prefixes: string[]) => void;
  align?: 'left' | 'center' | 'right';
}> = ({ label, columnKey, onFilterChange, uniqueValues, activeFilter, densityClass, fontSize, width, onResizeStart, onAutoFit, isCheckbox, onToggleAll, isAllSelected, selectedPrefixes, setSelectedPrefixes, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  if (isCheckbox) return (
    <th style={{ minWidth: `${width}px` }} className={`${densityClass} border-r border-white/20 sticky left-0 z-40 bg-viettel-red p-0 text-center`}>
      <input 
        type="checkbox" 
        checked={isAllSelected} 
        onChange={() => onToggleAll?.()} 
        className="rounded text-white w-4 h-4 cursor-pointer accent-white" 
      />
    </th>
  );

  const hasActiveFilter = activeFilter?.sort || activeFilter?.contains || activeFilter?.notContains || (activeFilter?.excludedValues?.length ?? 0) > 0 || (activeFilter?.prefixFilter && activeFilter.prefixFilter !== 'all') || (columnKey === 'normalizedPhone' && (selectedPrefixes?.length ?? 0) > 0);

  const justifyClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';

  return (
    <th style={{ minWidth: `${width}px` }} className={`${densityClass} ${fontSize || 'text-[10px]'} font-bold text-white uppercase tracking-widest relative group border-r border-white/20 last:border-0 select-none bg-viettel-red`}>
      <div className={`flex items-center ${justifyClass} gap-1 overflow-hidden pr-1`}>
        <span className={`truncate shrink-0`}>{label}</span>
        <button onClick={() => setIsOpen(!isOpen)} className={`p-0.5 rounded hover:bg-white/20 transition-colors shrink-0 text-white`}><i className={`fa-solid ${activeFilter?.sort === 'asc' ? 'fa-sort-up' : activeFilter?.sort === 'desc' ? 'fa-sort-down' : 'fa-filter'} text-[10px]`}></i></button>
      </div>
      <div onMouseDown={(e) => columnKey && onResizeStart?.(columnKey, e)} className="absolute top-0 right-0 h-full w-4 cursor-col-resize z-10 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
        <div className="w-[2px] h-full bg-blue-400/50 group-active:bg-blue-600" />
      </div>
      {isOpen && activeFilter && columnKey && onFilterChange && (
        <div ref={popoverRef} className="absolute top-full left-0 mt-1 w-72 bg-white shadow-2xl rounded-xl border border-slate-200 z-[100] p-4 normal-case font-normal animate-in fade-in duration-200">
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase">Sắp xếp & Lọc</p>
            <div className="flex gap-2">
              <button onClick={() => onFilterChange(columnKey, { ...activeFilter, sort: 'asc' })} className={`flex-1 py-1.5 rounded-md border text-xs font-bold ${activeFilter.sort === 'asc' ? 'bg-viettel-red text-white border-viettel-red' : 'border-slate-200 text-viettel-text'}`}>A-Z</button>
              <button onClick={() => onFilterChange(columnKey, { ...activeFilter, sort: 'desc' })} className={`flex-1 py-1.5 rounded-md border text-xs font-bold ${activeFilter.sort === 'desc' ? 'bg-viettel-red text-white border-viettel-red' : 'border-slate-200 text-viettel-text'}`}>Z-A</button>
            </div>
            <div className="space-y-2">
              <input type="text" placeholder="Tìm văn bản có..." className="w-full px-3 py-2 bg-viettel-bg border rounded-lg text-xs text-viettel-text outline-none focus:border-viettel-red" value={activeFilter.contains} onChange={(e) => onFilterChange(columnKey, { ...activeFilter, contains: e.target.value })} />
              <input type="text" placeholder="Tìm văn bản không có..." className="w-full px-3 py-2 bg-viettel-bg border rounded-lg text-xs text-viettel-text outline-none focus:border-viettel-red" value={activeFilter.notContains} onChange={(e) => onFilterChange(columnKey, { ...activeFilter, notContains: e.target.value })} />
            </div>
            
            {columnKey === 'normalizedPhone' && (
              <div className="space-y-2 px-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">Lọc theo đầu số</p>
                <div className="flex flex-col gap-2">
                  {['09', '03', '08'].map(prefix => (
                    <label key={prefix} className="flex items-center gap-2 cursor-pointer group/cb">
                      <input 
                        type="checkbox" 
                        checked={selectedPrefixes?.includes(prefix) || false} 
                        onChange={(e) => {
                          const current = selectedPrefixes || [];
                          if (e.target.checked) {
                            setSelectedPrefixes?.([...current, prefix]);
                          } else {
                            setSelectedPrefixes?.(current.filter(p => p !== prefix));
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-viettel-red focus:ring-viettel-red cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600 group-hover/cb:text-viettel-red transition-colors">Đầu {prefix}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {columnKey === 'simTypes' && (
              <div className="flex items-center gap-2 px-2 py-2 bg-viettel-bg rounded-lg border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer w-full">
                  <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap">Đầu số:</span>
                  <select 
                    className="flex-1 bg-transparent text-[10px] font-bold text-viettel-text outline-none cursor-pointer h-6"
                    value={activeFilter.prefixFilter || 'all'}
                    onChange={(e) => onFilterChange(columnKey, { ...activeFilter, prefixFilter: e.target.value as any })}
                  >
                    <option value="all">Tất cả đầu số</option>
                    <option value="09">Chỉ đầu số 09</option>
                    <option value="not09">đầu 09 không chịu tác động lọc</option>
                  </select>
                </label>
              </div>
            )}

            <div className="pt-2 border-t flex justify-between gap-2">
              <button onClick={() => {
                onFilterChange(columnKey, { sort: null, contains: '', notContains: '', excludedValues: [], prefixFilter: 'all' });
                if (columnKey === 'normalizedPhone') setSelectedPrefixes?.([]);
              }} className="text-[10px] font-bold text-slate-400 uppercase">Xóa lọc</button>
              <button onClick={() => setIsOpen(false)} className="bg-viettel-red text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase hover:bg-red-700 transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </th>
  );
};

// Hàm ghi audit log
const logAudit = async (userEmail: string, userRole: string, action: string, tableName?: string, recordId?: string, details?: any) => {
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').insert([{
      user_email: userEmail,
      user_role: userRole,
      action,
      table_name: tableName || null,
      record_id: recordId ? String(recordId) : null,
      details: details || null,
    }]);
  } catch (e) {
    console.error('Audit log error:', e);
  }
};

// Component đăng nhập Admin chuyên nghiệp
const AdminLoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [attempts, setAttempts] = React.useState(0);
  const [showPassword, setShowPassword] = React.useState(false);
  const MAX_ATTEMPTS = 5;

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      setErrorMsg('Tài khoản bị khóa sau 5 lần sai. Vui lòng thử lại sau 15 phút.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setErrorMsg(`Sai mật khẩu quá ${MAX_ATTEMPTS} lần! Tài khoản bị khóa 15 phút.`);
          await supabase!.auth.signOut();
        } else {
          setErrorMsg(`Sai tài khoản hoặc mật khẩu! (${newAttempts}/${MAX_ATTEMPTS} lần)`);
        }
      } else {
        // Ghi log đăng nhập thành công
        await logAudit(data.user?.email || email, 'unknown', 'LOGIN', undefined, undefined, { ip: 'browser' });
        setAttempts(0);
        onClose();
      }
    } catch (e) {
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 to-red-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-viettel-red via-red-400 to-viettel-red rounded-t-3xl" />
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 text-viettel-red rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-red-100 rotate-3">
            <i className="fa-solid fa-shield-halved text-3xl"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Cổng Quản Trị</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">simquocdan.vn — Hệ thống nội bộ</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
            <i className="fa-solid fa-lock text-green-500"></i>
            <span>Kết nối bảo mật SSL</span>
          </div>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="relative">
            <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
              placeholder="Email đăng nhập"
              disabled={isLoading || attempts >= MAX_ATTEMPTS}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-viettel-red focus:border-viettel-red focus:bg-white outline-none text-slate-800 font-medium transition-all placeholder:text-slate-400 text-sm disabled:opacity-50"
            />
          </div>
          <div className="relative">
            <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Mật khẩu"
              disabled={isLoading || attempts >= MAX_ATTEMPTS}
              className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-viettel-red focus:border-viettel-red focus:bg-white outline-none text-slate-800 font-medium transition-all placeholder:text-slate-400 text-sm disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <i className="fa-solid fa-triangle-exclamation text-viettel-red text-sm mt-0.5 shrink-0"></i>
            <p className="text-xs text-red-700 font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {attempts > 0 && attempts < MAX_ATTEMPTS && (
          <div className="mb-4 flex justify-center gap-1.5">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i < attempts ? 'bg-viettel-red' : 'bg-slate-200'}`} />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogin}
            disabled={isLoading || attempts >= MAX_ATTEMPTS}
            className="w-full py-4 bg-gradient-to-r from-viettel-red to-red-600 text-white rounded-xl font-black uppercase text-sm tracking-widest shadow-lg shadow-red-200 hover:shadow-xl hover:from-red-600 hover:to-red-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Đang xác thực...</span></>
            ) : (
              <><i className="fa-solid fa-right-to-bracket"></i><span>Đăng nhập</span></>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-95"
          >
            ← Quay lại trang khách hàng
          </button>
        </div>

        <p className="text-center text-[10px] text-slate-300 mt-6 font-medium">
          Hệ thống chỉ dành cho nhân viên được cấp phép.<br/>
          Mọi thao tác đều được ghi lại và theo dõi.
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('customer');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const [rawData, setRawData] = useState<SimEntry[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

 useEffect(() => {
    const initAuth = async () => {
      if (!supabase) {
        console.warn("Supabase credentials missing. Running in local mode.");
        setIsDataLoaded(true);
        return;
      }

      // 1. Kiểm tra session hiện tại
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        setUserRole(profile?.role || 'staff');
        setViewMode('admin');
      }

      // 2. Lắng nghe thay đổi trạng thái đăng nhập
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          setUser(session.user);
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
          setUserRole(profile?.role || 'staff');
          setViewMode('admin');
        } else {
          setUser(null);
          setUserRole(null);
          setViewMode('customer');
        }
      });

      // 3. Tải dữ liệu SIM
      try {
        const { data, error } = await supabase.from('kho_sim').select('*');
        if (error) throw error;
        if (data) {
          setRawData(data.map(mapToCamelCase));
        }
      } catch (e) {
        console.error("Failed to load SIM data from Supabase", e);
      } finally {
        setIsDataLoaded(true);
      }

      // 4. Tải cấu hình hệ thống
      try {
        const { data: settingsData, error: settingsError } = await supabase.from('system_settings').select('*').in('setting_key', ['categoryPrices', 'dotFormattingRules', 'pricePresets']);
        if (!settingsError && settingsData) {
          settingsData.forEach(setting => {
            if (setting.setting_key === 'categoryPrices' && setting.setting_value) {
              setCategoryPrices(setting.setting_value);
            } else if (setting.setting_key === 'dotFormattingRules' && setting.setting_value) {
              setDotFormattingRules(setting.setting_value);
            } else if (setting.setting_key === 'pricePresets' && setting.setting_value) {
              setPricePresets(setting.setting_value);
            }
          });
        }
      } catch (e) {
        console.error("Failed to load system settings", e);
      }

      return () => subscription.unsubscribe();
    };

    initAuth();
  }, []);
  const [headers, setHeaders] = useState<string[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [filter, setFilter] = useState<string>(SimType.ALL);
  const [showMultiOnly, setShowMultiOnly] = useState(false); 
  const [selectedPrefixes, setSelectedPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [density] = useState<DensityLevel>('compact');

  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [visibleCount, setVisibleCount] = useState(2000);
  const [sequenceSearchValue, setSequenceSearchValue] = useState('');
  const [isSequenceSearchOpen, setIsSequenceSearchOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const SHARED_URL = "https://locsodep.vercel.app/";

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rawData.forEach(item => {
      item.simTypes.forEach(type => {
        counts[type] = (counts[type] || 0) + 1;
      });
    });
    return counts;
  }, [rawData]);

  const getDensityClasses = useCallback(() => {
    switch (density) {
      case 'compact': return { padding: 'px-3 py-0.5 text-xs', phoneFontSize: 'text-sm', priceFontSize: 'text-[12px]', headerPadding: 'px-3 py-1', headerFontSize: 'text-[10px]', badgeSize: 'px-1 py-[1px] text-[11px] leading-tight' };
      case 'relaxed': return { padding: 'px-6 py-2 text-base', phoneFontSize: 'text-lg', priceFontSize: 'text-lg', headerPadding: 'px-6 py-3', headerFontSize: 'text-[12px]', badgeSize: 'px-2 py-[2px] text-[14px] leading-tight' };
      default: return { padding: 'px-4 py-1 text-sm', phoneFontSize: 'text-base', priceFontSize: 'text-base', headerPadding: 'px-4 py-1.5', headerFontSize: 'text-[11px]', badgeSize: 'px-1.5 py-[1px] text-[13px] leading-tight' };
    }
  }, [density]);
  
  const [categoryPrices, setCategoryPrices] = useState<Record<string, { p03: string; p09: string }>>(() => {
    return { 
      [SimType.TIEN_7_LIEN_TIEP]: { p03: '950k', p09: '1900k' }, 
      [SimType.GANH_DOI]: { p03: '220k', p09: '420k' }, 
      [SimType.GANH_DEP]: { p03: '220k', p09: '520k' }, 
      [SimType.GANH_THUONG]: { p03: '220k', p09: '320k' }, 
      [SimType.TIEN_4_LIEN_TIEP]: { p03: '320k', p09: '520k' },
      [SimType.TIEN_4_KHONG_DEU]: { p03: '220k', p09: '370k' },
      [SimType.TIEN_2_DOI_ABAC]: { p03: '320k', p09: '520k' },
      [SimType.TIEN_2_DOI_ABCB]: { p03: '270k', p09: '520k' },
      [SimType.SIM_CAP_DAO]: { p03: '320k', p09: '520k' },
      [SimType.AB_AC_AD_TIEN]: { p03: '420k', p09: '620k' },
      [SimType.AB_AC_AD_FREE]: { p03: '270k', p09: '420k' },
      [SimType.AB_CB_DB_FREE]: { p03: '320k', p09: '420k' },
      [SimType.AB_CB_DB_TIEN]: { p03: '420k', p09: '620k' },
      [SimType.AB_AD_DONG_CHUC_TIEN]: { p03: '320k', p09: '520k' },
      [SimType.AB_AD_DONG_CHUC]: { p03: '270k', p09: '420k' },
      [SimType.AB_CB_DONG_DON_VI_TIEN]: { p03: '320k', p09: '520k' },
      [SimType.AB_CB_DONG_DON_VI]: { p03: '270k', p09: '420k' },
      [SimType.TANG_DAN_DEU_5_6_CAP]: { p03: '420k', p09: '620k' },
      [SimType.TANG_DAN_DEU_4_CUOI]: { p03: '370k', p09: '570k' },
      [SimType.TANG_DAN_DEU_3_CUOI]: { p03: '320k', p09: '520k' },
      [SimType.TIEN_1_10_100]: { p03: '820k', p09: '1200k' },
      [SimType.TANG_DAN_DEU]: { p03: 'L.Hệ', p09: 'L.Hệ' },
      [SimType.TRUNG_1_CHU_SO_09]: { p03: '220k', p09: '320k' },
      [SimType.TRUNG_2_CHU_SO_09]: { p03: '220k', p09: '320k' },
      [SimType.OTHER]: { p03: '220k', p09: '320k' }
    };
  });

  const [pricePresets, setPricePresets] = useState<string[]>(() => {
    return ['220k', '270k', '320k', '370k', '420k', '470k', '520k', '620k'];
  });

  const [dotFormattingRules, setDotFormattingRules] = useState<Record<string, DotRule>>(() => {
    const defaultRules: Record<string, DotRule> = {
      [SimType.GANH_DOI]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.GANH_DEP]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.GANH_THUONG]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.TIEN_4_KHONG_DEU]: { pattern: 'xxxxx.xxxx', special: '' },
      [SimType.TIEN_2_DOI_ABAC]: { pattern: 'xxxxxx.xx.xx', special: '' },
      [SimType.TIEN_2_DOI_ABCB]: { pattern: 'xxxxxx.xx.xx', special: '' },
      [SimType.TIEN_3_LIEN_TIEP]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.TIEN_4_LIEN_TIEP]: { pattern: '', special: 'chấm 2 đầu Sảnh' },
      [SimType.TIEN_5_LIEN_TIEP]: { pattern: '', special: 'chấm 2 đầu Sảnh' },
      [SimType.TIEN_6_LIEN_TIEP]: { pattern: '', special: 'chấm 2 đầu Sảnh' },
      [SimType.TIEN_7_LIEN_TIEP]: { pattern: '', special: 'chấm 2 đầu Sảnh' },
      [SimType.TIEN_1_10_100]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.TIEN_DON_VI]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.LUI_DON_VI]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.SIM_CAP_DAO]: { pattern: 'xxxx.xx.xx.xx', special: '' },
      [SimType.AB_AC_AD_FREE]: { pattern: 'xxxx.xx.xx.xx', special: '' },
      [SimType.AB_AC_AD_TIEN]: { pattern: 'xxxx.xx.xx.xx', special: '' },
      [SimType.AB_CB_DB_FREE]: { pattern: 'xxxx.xx.xx.xx', special: '' },
      [SimType.AB_CB_DB_TIEN]: { pattern: 'xxxx.xx.xx.xx', special: '' },
      [SimType.AB_AD_DONG_CHUC_TIEN]: { pattern: 'xxxx.xx.xxxx', special: '' },
      [SimType.AB_AD_DONG_CHUC]: { pattern: 'xxxx.xx.xxxx', special: '' },
      [SimType.AB_CB_DONG_DON_VI_TIEN]: { pattern: 'xxxx.xx.xxxx', special: '' },
      [SimType.AB_CB_DONG_DON_VI]: { pattern: 'xxxx.xx.xxxx', special: '' },
      [SimType.AB_CD_AB_GANH_CAP]: { pattern: 'xxxx.xx.xx.xx', special: '' },
      [SimType.DAU_SO_DEP]: { pattern: 'xxxx.xxxxxx', special: '' },
      [SimType.ABB_CDD]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.AAB_CCD]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.AAB_CDD]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.ABA_CCD]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.ABA_CDD]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.TAXI_DAU]: { pattern: 'x.xxx.xxx.xxx', special: '' },
      [SimType.TANG_DAN_DEU_3_CUOI]: { pattern: 'xxxx.xx.xx.xx', special: '' },
      [SimType.TU_QUY_GIUA]: { pattern: '', special: 'chấm 2 đầu tứ quý' },
      [SimType.NGU_QUY_GIUA]: { pattern: '', special: 'chấm 2 đầu ngũ quý' },
      [SimType.TAM_HOA_DUOI]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.TU_QUY_DUOI]: { pattern: 'xxxx.xx.xxxx', special: '' },
      [SimType.NGU_QUY_DUOI]: { pattern: 'xxxx.x.xxxxx', special: '' },
      [SimType.AABB_3_DUOI]: { pattern: 'xxx.xxxx.xxx', special: '' },
      [SimType.AABB_2_DUOI]: { pattern: 'xxxx.xxxx.xx', special: '' },
      [SimType.ABAB_3_DUOI]: { pattern: 'xxx.xxxx.xxx', special: '' },
      [SimType.ABAB_2_DUOI]: { pattern: 'xxxx.xxxx.xx', special: '' },
      [SimType.ABAB_1_DUOI]: { pattern: 'xxxx.x.xxxx.x', special: '' },
      [SimType.AABB_X]: { pattern: 'xxxx.x.xxxx.x', special: '' },
      [SimType.KEP_DUOI_1_CAP]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.KEP_AP_DUOI_1_CAP]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.KEP_GIUA_1_CAP]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.KEP_DAU_1_CAP]: { pattern: 'xxxx.xxx.xxx', special: '' },
      [SimType.TRUNG_1_CHU_SO_09]: { pattern: 'xxxx.x.x.x.x.x', special: '' },
      [SimType.TRUNG_2_CHU_SO_09]: { pattern: 'xxxx.x.x.x.x.x', special: '' },
      [SimType.OTHER]: { pattern: 'xxxx.x.x.x.x.x', special: '' }
    };

    return defaultRules;
  });

  useEffect(() => { 
    if (!supabase) return;
    
    const timeoutId = setTimeout(async () => {
      try {
        await supabase.from('system_settings').upsert([
          { setting_key: 'categoryPrices', setting_value: categoryPrices },
          { setting_key: 'pricePresets', setting_value: pricePresets },
          { setting_key: 'dotFormattingRules', setting_value: dotFormattingRules }
        ]);
      } catch (e) {
        console.error("Failed to save settings to Supabase", e);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [categoryPrices, pricePresets, dotFormattingRules]);
  
  const [selectedSimIds, setSelectedSimIds] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isSmartPriceModalOpen, setIsSmartPriceModalOpen] = useState(false);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({ 'checkbox': 44, 'simTypes': 220, 'unitAdvanceDetail': 220, 'normalizedPhone': 160, 'price': 100, 'menh': 100 });
  const [colFilters, setColFilters] = useState<Record<string, FilterState>>({});

  // Reset visibleCount khi thay đổi bộ lọc
  useEffect(() => {
    setVisibleCount(2000);
  }, [filter, colFilters, showMultiOnly, selectedPrefixes, sequenceSearchValue]);

  useEffect(() => { if (copyFeedback) { const t = setTimeout(() => setCopyFeedback(null), 2000); return () => clearTimeout(t); } }, [copyFeedback]);

  const handleFilterChange = (key: string, state: FilterState) => setColFilters(prev => ({ ...prev, [key]: state }));

  const handleResizeStart = (key: string, e: React.MouseEvent) => {
    const startX = e.pageX;
    const startWidth = columnWidths[key] || 100;
    let animationFrameId: number | null = null;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      animationFrameId = requestAnimationFrame(() => {
        const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
        setColumnWidths(prev => ({ ...prev, [key]: newWidth }));
      });
    };

    const handleMouseUp = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleSimSelection = (id: number, index: number, isShiftKey: boolean) => {
    setSelectedSimIds(prev => {
      const newSet = new Set(prev);
      if (isShiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        filteredAndSortedData.slice(start, end + 1).forEach(item => newSet.add(item.id));
      } else { if (newSet.has(id)) newSet.delete(id); else newSet.add(id); }
      return newSet;
    });
    setLastSelectedIndex(index);
  };

  const formatPhoneSmart = useCallback((item: SimEntry): string => {
    if (item.smartMatchDotted) return item.smartMatchDotted;
    const phone = item.normalizedPhone;
    const types = item.simTypes;
    if (phone.length !== 10) return phone;

    const prefix = phone.substring(0, 2);
    const priceKey = (prefix === '03') ? 'p03' : 'p09';

    const typesWithPrice = types.map(t => ({
      type: t,
      priceValue: parsePriceToNumber(categoryPrices[t]?.[priceKey])
    }));

    // Sắp xếp theo giá giảm dần, nếu bằng giá thì giữ nguyên thứ tự ban đầu (stable sort)
    const sortedTypes = typesWithPrice
      .map((t, index) => ({ ...t, index }))
      .sort((a, b) => {
        if (b.priceValue !== a.priceValue) return b.priceValue - a.priceValue;
        return a.index - b.index;
      });

    for (const tObj of sortedTypes) {
      const activeRuleKey = tObj.type;

      // 1. Kiểm tra logic đặc biệt (hardcoded) cho loại SIM này
      if (activeRuleKey === SimType.TIEN_DEU_2_DAY) {
        const sequentialInfo = findSequentialPairs(phone);
        if (sequentialInfo) return sequentialInfo;
      }

      if (activeRuleKey === SimType.TANG_DAN_DEU || 
          activeRuleKey === SimType.TANG_DAN_DEU_3_CUOI || 
          activeRuleKey === SimType.TANG_DAN_DEU_4_CUOI || 
          activeRuleKey === SimType.TANG_DAN_DEU_5_6_CAP) {
        const apInfo = checkArithmeticProgression(phone);
        if (apInfo) {
          const part1 = phone.substring(0, apInfo.startIndex);
          const part2 = apInfo.formatted;
          const part3 = phone.substring(apInfo.endIndex);
          return (part1 ? part1 + "." : "") + part2 + (part3 ? "." + part3 : "");
        }
      }

      // 2. Kiểm tra quy định dấu chấm (rule-based)
      const activeRule = dotFormattingRules[activeRuleKey];
      if (activeRule) {
        const isVipDoc = activeRuleKey.includes('Quý') || types.some(t => t.includes('Quý'));
        
        if (isVipDoc) {
          for (let n = 5; n >= 4; n--) {
            for (let i = 0; i <= phone.length - n; i++) {
              let isRepeat = true;
              for (let j = 1; j < n; j++) { if (phone[i] !== phone[i + j]) { isRepeat = false; break; } }
              if (isRepeat) {
                const part1 = phone.slice(0, i);
                const part2 = phone.slice(i, i + n);
                const part3 = phone.slice(i + n);
                return (part1 ? part1 + "." : "") + part2 + (part3 ? "." + part3 : "");
              }
            }
          }
        }

        if (activeRule.special?.toLowerCase().includes('sảnh') || activeRuleKey.toLowerCase().includes('tiến')) {
          let n = 0;
          const match = activeRuleKey.match(/\d+/);
          if (match) n = parseInt(match[0]);
          else if (activeRule.pattern.includes('7')) n = 7;
          else if (activeRule.pattern.includes('6')) n = 6;
          else if (activeRule.pattern.includes('5')) n = 5;
          else if (activeRule.pattern.includes('4')) n = 4;
          else if (activeRule.pattern.includes('3')) n = 3;

          if (n >= 3) {
            const idx = findConsecutiveIndex(phone, n);
            if (idx !== -1) {
              const part1 = phone.substring(0, idx);
              const part2 = phone.substring(idx, idx + n);
              const part3 = phone.substring(idx + n);
              return (part1 ? part1 + "." : "") + part2 + (part3 ? "." + part3 : "");
            }
          }
        }

        if (activeRule.pattern) {
          return applyPattern(phone, activeRule.pattern);
        }
      }
    }

    if (filter === SimType.AABB_X || filter === SimType.ABAB_1_DUOI) return `${phone.slice(0, 5)}.${phone.slice(5, 9)}.${phone.slice(9)}`;
    return `${phone.slice(0, 4)}.${phone.slice(4, 7)}.${phone.slice(7)}`;
  }, [dotFormattingRules, categoryPrices, filter]);

  const getAutoPrice = useCallback((item: SimEntry): string => {
    const prefix = item.normalizedPhone.substring(0, 2);
    const priceKey = (prefix === '03') ? 'p03' : 'p09';
    let maxNumericValue = 0;
    let maxPriceStr = 'L.Hệ';
    
    // Ưu tiên giá thủ công nếu có
    if (item.price && item.price !== '' && item.price.toLowerCase() !== 'l.hệ') {
      const manualNum = parsePriceToNumber(item.price);
      if (manualNum > 0) {
        maxNumericValue = manualNum;
        maxPriceStr = item.price;
      }
    }
    
    // So sánh với ma trận giá để lấy giá cao nhất
    for (const type of item.simTypes) {
      const prices = categoryPrices[type];
      if (prices && prices[priceKey]) {
        const matrixPriceStr = prices[priceKey];
        const matrixNum = parsePriceToNumber(matrixPriceStr);
        if (matrixNum > maxNumericValue) {
          maxNumericValue = matrixNum;
          maxPriceStr = matrixPriceStr;
        }
      }
    }
    return maxPriceStr;
  }, [categoryPrices]);

  const getSemiFilteredData = useCallback((excludeKey?: string) => {
    let result = filter === SimType.ALL ? rawData : rawData.filter(item => item.simTypes.includes(filter as SimType));
    if (showMultiOnly) result = result.filter(item => item.simTypes.filter(t => t !== SimType.OTHER).length > 1);
    if (selectedPrefixes.length > 0) {
      result = result.filter(item => selectedPrefixes.some(prefix => item.normalizedPhone.startsWith(prefix)));
    }
    
    if (sequenceSearchValue.trim()) {
      const patterns = sequenceSearchValue.split(',').map(s => s.trim()).filter(s => s !== '');
      
      // Pre-process patterns to avoid re-generating matches for every row
      const smartPatterns = patterns.map(p => {
        let core = p;
        let prefix = '';
        let suffix = '';
        if (core.startsWith('*') && core.endsWith('*') && core.length > 2) { core = core.slice(1, -1); }
        else if (core.startsWith('*') && core.length > 1) { core = core.slice(1); suffix = '$'; }
        else if (core.endsWith('*') && core.length > 1) { core = core.slice(0, -1); prefix = '^'; }
        
        if (/[a-z]/i.test(core) && core.includes('(')) {
          const vars = (Array.from(new Set(core.match(/[a-z]/gi) || [])) as string[]).map(v => v.toLowerCase());
          const tokens: string[] = [];
          for (let i = 0; i < core.length; i++) {
            if (core[i] === '(') {
              let end = core.indexOf(')', i);
              if (end !== -1) { tokens.push(core.substring(i, end + 1)); i = end; continue; }
            }
            tokens.push(core[i]);
          }

          // Pre-compile expressions
          const exprTokens = tokens.map(t => {
            if (t.startsWith('(') && t.endsWith(')')) {
              const expr = t.slice(1, -1);
              try {
                const fn = new Function(...vars, `"use strict"; return (${expr})`);
                return { type: 'expr', fn };
              } catch { return { type: 'invalid' }; }
            }
            return { type: 'text', value: t };
          });
          
          const matches: { raw: string, dotted: string }[] = [];
          const numVars = vars.length;
          const lengthCombinations = Math.pow(2, numVars);
          
          for (let lc = 0; lc < lengthCombinations; lc++) {
            const varLengths: number[] = [];
            let tempLc = lc;
            for (let i = 0; i < numVars; i++) {
              varLengths.push((tempLc % 2) + 1);
              tempLc = Math.floor(tempLc / 2);
            }
            
            let totalVals = 1;
            for (const len of varLengths) totalVals *= Math.pow(10, len);
            if (totalVals > 50000) continue; 

            for (let v = 0; v < totalVals; v++) {
              const varValues: Record<string, number> = {};
              const varValuesList: number[] = [];
              let tempV = v;
              for (let i = 0; i < numVars; i++) {
                const len = varLengths[i];
                const mod = Math.pow(10, len);
                const val = tempV % mod;
                varValues[vars[i]] = val;
                varValuesList.push(val);
                tempV = Math.floor(tempV / mod);
              }
              
              let candidate = "";
              let dottedCandidate = "";
              let possible = true;
              for (const et of exprTokens) {
                if (et.type === 'expr') {
                  try {
                    const val = et.fn!(...varValuesList);
                    if (val < 0) { possible = false; break; }
                    const valStr = val.toString();
                    candidate += valStr;
                    dottedCandidate += (dottedCandidate ? "." : "") + valStr;
                  } catch { possible = false; break; }
                } else if (et.type === 'text') {
                  const token = et.value!;
                  if (/[a-z]/i.test(token)) {
                    const vName = token.toLowerCase();
                    const vIdx = vars.indexOf(vName);
                    const vLen = varLengths[vIdx];
                    const valStr = varValues[vName].toString().padStart(vLen, '0');
                    candidate += valStr;
                    dottedCandidate += (dottedCandidate ? "." : "") + valStr;
                  } else {
                    candidate += token;
                    dottedCandidate += (dottedCandidate ? "." : "") + token;
                  }
                } else { possible = false; break; }
              }
              if (possible && candidate.length <= 12 && candidate.length > 0) {
                matches.push({ raw: candidate, dotted: dottedCandidate });
              }
            }
          }
          return { type: 'smart', matches, prefix, suffix };
        }
        return { type: 'other', core: core.replace(/\./g, ''), prefix, suffix };
      });

      result = result.map(item => {
        const phone = item.normalizedPhone || '';
        let smartMatchDotted = '';
        const isMatch = smartPatterns.some(sp => {
          if (sp.type === 'smart') {
            const m = sp.matches.find(m => {
              if (sp.prefix === '^') return phone.startsWith(m.raw);
              if (sp.suffix === '$') return phone.endsWith(m.raw);
              return phone.includes(m.raw);
            });
            if (m) {
              const startIdx = phone.indexOf(m.raw);
              const part1 = phone.substring(0, startIdx);
              const part2 = m.dotted;
              const part3 = phone.substring(startIdx + m.raw.length);
              smartMatchDotted = (part1 ? part1 + "." : "") + part2 + (part3 ? "." + part3 : "");
              return true;
            }
          } else {
            let { core, prefix, suffix } = sp;
            if (/[a-z]/i.test(core)) {
              try {
                let regexStr = "";
                const letterMap: Record<string, number> = {};
                let groupCount = 0;
                for (const char of core) {
                  if (/[a-z]/i.test(char)) {
                    const l = char.toLowerCase();
                    if (letterMap[l]) { regexStr += `\\${letterMap[l]}`; }
                    else { groupCount++; letterMap[l] = groupCount; regexStr += `(\\d)`; }
                  } else { regexStr += char; }
                }
                const re = new RegExp(prefix + regexStr + suffix);
                return re.test(phone);
              } catch (e) { return false; }
            } else {
              if (prefix === '^') return phone.startsWith(core);
              if (suffix === '$') return phone.endsWith(core);
              return phone.includes(core);
            }
          }
          return false;
        });
        return isMatch ? { ...item, smartMatchDotted } : null;
      }).filter((item): item is SimEntry => item !== null);
    }

    (Object.entries(colFilters) as [string, FilterState][]).forEach(([key, f]) => {
      if (excludeKey && key === excludeKey) return;
      
      if (key === 'simTypes') {
        const terms = f.contains.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
        const notTerms = f.notContains.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
        const hasTerms = terms.length > 0;
        const hasNotTerms = notTerms.length > 0;
        const prefix = f.prefixFilter || 'all';

        result = result.filter(item => {
          const is09 = item.normalizedPhone.startsWith('09');
          const itemVal = ((item as any)[key]?.toString().toLowerCase() || '');
          const matchesContains = !hasTerms || terms.some(term => itemVal.includes(term));
          const matchesNotContains = !hasNotTerms || !notTerms.some(term => itemVal.includes(term));
          const matchesText = matchesContains && matchesNotContains;
          
          if (prefix === '09') {
            return is09 && matchesText;
          } else if (prefix === 'not09') {
            // "đầu 09 không chịu tác động lọc" -> 09 bypasses text filter
            return is09 || matchesText;
          } else {
            return matchesText;
          }
        });
      } else {
        if (f.contains) {
          const terms = f.contains.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
          if (terms.length > 0) result = result.filter(item => terms.some(term => ((item as any)[key]?.toString().toLowerCase() || '').includes(term)));
        }
        if (f.notContains) {
          const notTerms = f.notContains.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== '');
          if (notTerms.length > 0) result = result.filter(item => !notTerms.some(term => ((item as any)[key]?.toString().toLowerCase() || '').includes(term)));
        }
      }
    });
    return result;
  }, [rawData, filter, colFilters, showMultiOnly, selectedPrefixes, sequenceSearchValue]);

  const filteredAndSortedData = useMemo(() => {
    let result = getSemiFilteredData();
    const activeSortCol = (Object.entries(colFilters) as [string, FilterState][]).find(([_, f]) => f?.sort);
    if (activeSortCol) {
      const [key, f] = activeSortCol;
      result = [...result].sort((a, b) => {
        const valA = (a as any)[key]?.toString() || '';
        const valB = (b as any)[key]?.toString() || '';
        return f.sort === 'asc' ? valA.localeCompare(valB, undefined, { numeric: true }) : valB.localeCompare(valA, undefined, { numeric: true });
      });
    }
    return result;
  }, [getSemiFilteredData, colFilters]);

  const displayedData = useMemo(() => {
    return filteredAndSortedData.slice(0, visibleCount);
  }, [filteredAndSortedData, visibleCount]);

  useEffect(() => {
    setVisibleCount(2000);
  }, [filter, colFilters, showMultiOnly, selectedPrefixes, sequenceSearchValue]);

  const selectedSimList = useMemo(() => {
    return rawData.filter(item => selectedSimIds.has(item.id));
  }, [rawData, selectedSimIds]);

  const toggleSelectAll = () => {
    if (filteredAndSortedData.length === 0) return;
    const allInViewIds = filteredAndSortedData.map(i => i.id);
    const isAllInViewSelected = allInViewIds.every(id => selectedSimIds.has(id));
    setSelectedSimIds(prev => {
      const newSet = new Set(prev);
      if (isAllInViewSelected) allInViewIds.forEach(id => newSet.delete(id));
      else allInViewIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const readSingleFile = (file: File): Promise<{ data: SimEntry[], headers: string[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const wb = XLSX.read(data, { type: 'array' });
          let allSheetsData: SimEntry[] = [];
          let allHeaders = new Set<string>();
          wb.SheetNames.forEach(sheetName => {
            const ws = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            if (rows.length === 0) return;
            
            let headerIdx = -1; 
            let phoneIdx = -1;
            const keywords = ["ISDN", "SỐ ĐIỆN THOẠI", "PHONE", "SIM", "SỐ SIM"];
            
            // 1. Tìm header bằng keyword
            for (let i = 0; i < Math.min(rows.length, 50); i++) {
              const row = rows[i]; 
              if (!row || !Array.isArray(row)) continue;
              const fIdx = row.findIndex(cell => {
                if (!cell) return false;
                const cellStr = cell.toString().toUpperCase();
                return keywords.some(k => cellStr.includes(k));
              });
              if (fIdx !== -1) { 
                headerIdx = i; 
                phoneIdx = fIdx; 
                break; 
              }
            }
            
            // 2. Fallback: Nếu không tìm thấy bằng keyword, tìm cột đầu tiên có dữ liệu giống số điện thoại
            if (phoneIdx === -1) {
              for (let i = 0; i < Math.min(rows.length, 20); i++) {
                const row = rows[i]; 
                if (!row || !Array.isArray(row)) continue;
                const fIdx = row.findIndex(cell => {
                  if (!cell) return false;
                  const normalized = normalizePhone(cell);
                  return normalized.length === 10;
                });
                if (fIdx !== -1) {
                  phoneIdx = fIdx;
                  headerIdx = i - 1; 
                  break;
                }
              }
            }

            if (phoneIdx !== -1) {
              const hRow = (headerIdx !== -1 && rows[headerIdx]) ? rows[headerIdx].map(h => h?.toString() || "") : [];
              const dataRows = rows.slice(headerIdx + 1);
              
              dataRows.forEach((row) => {
                if (!row || !Array.isArray(row)) return;
                const num = row[phoneIdx]?.toString() || "";
                const normalized = normalizePhone(num);
                if (!normalized) return;
                
                const { types, detail } = analyzeSim(normalized);
                const { menh, color } = getMenhAndColor(normalized);
                const obj: any = { 
                  id: Math.random(), 
                  originalPhone: num, 
                  normalizedPhone: normalized, 
                  lastSix: normalized.slice(-6),
                  simTypes: types, 
                  unitAdvanceDetail: detail, 
                  menh: menh,
                  menhColor: color,
                  price: '' 
                };
                
                if (hRow.length > 0) {
                  hRow.forEach((h, i) => { 
                    if (h) { 
                      obj[h] = row[i]; 
                      allHeaders.add(h); 
                    } 
                  });
                } else {
                  row.forEach((cell, i) => {
                    if (i === phoneIdx) return;
                    const h = `Cột ${i + 1}`;
                    obj[h] = cell;
                    allHeaders.add(h);
                  });
                }
                allSheetsData.push(obj);
              });
            }
          });
          resolve({ data: allSheetsData, headers: Array.from(allHeaders) });
        } catch (err) { reject(err); }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(Array.from(files).map((f: any) => readSingleFile(f as File)));
      let combinedData: SimEntry[] = [];
      let combinedHeaders = new Set<string>();
      results.forEach(res => { 
        combinedData = [...combinedData, ...res.data]; 
        res.headers.forEach(h => combinedHeaders.add(h)); 
      });
      setHeaders(Array.from(combinedHeaders)); 
      const nextId = rawData.length > 0 ? Math.max(...rawData.map(r => r.id)) + 1 : 0;
      const processedData = combinedData.map((d, i) => {
        const item = {...d, id: nextId + i};
        return { ...item, price: getAutoPrice(item) };
      });
      
      let insertedData: SimEntry[] = [];
      if (processedData.length > 0) {
        if (!supabase) {
          throw new Error("Chưa cấu hình Supabase (thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY)");
        }
        const snakeCaseData = processedData.map(item => {
          const { id, ...rest } = mapToSnakeCase(item);
          return rest;
        });
        const chunkSize = 1000;
        for (let i = 0; i < snakeCaseData.length; i += chunkSize) {
          const chunk = snakeCaseData.slice(i, i + chunkSize);
          const { data, error } = await supabase.from('kho_sim').insert(chunk).select();
          if (error) throw error;
          if (data) {
            insertedData = [...insertedData, ...data.map(mapToCamelCase)];
          }
        }
      }
      
      setRawData(prev => [...prev, ...insertedData]);
      await logAudit(user?.email || 'unknown', userRole || 'unknown', 'UPLOAD_SIM', 'kho_sim', undefined, { count: insertedData.length });
      setCopyFeedback(`Đã thêm ${insertedData.length} SIM từ file!`);
    } catch (err: any) { 
      console.error(err); 
      setCopyFeedback(`Lỗi khi tải file hoặc đồng bộ Supabase: ${err.message || JSON.stringify(err)}`);
    } finally { 
      setLoading(false); 
      e.target.value = ''; 
    }
  };

  const handlePasteImport = async () => {
    if (!pasteText.trim()) return;
    setLoading(true);
    try {
      const lines = pasteText.split(/[\n,\s]+/).filter(s => s.trim() !== '');
      const newEntries: SimEntry[] = [];
      const nextId = rawData.length > 0 ? Math.max(...rawData.map(r => r.id)) + 1 : 0;
      
      lines.forEach((num, index) => {
        const normalized = normalizePhone(num);
        if (!normalized) return;
        const { types, detail } = analyzeSim(normalized);
        const { menh, color } = getMenhAndColor(normalized);
        const obj: SimEntry = {
          id: nextId + index,
          originalPhone: num,
          normalizedPhone: normalized,
          lastSix: normalized.slice(-6),
          simTypes: types,
          unitAdvanceDetail: detail,
          menh: menh,
          menhColor: color,
          price: ''
        };
        obj.price = getAutoPrice(obj);
        newEntries.push(obj);
      });

      let insertedData: SimEntry[] = [];
      if (newEntries.length > 0) {
        if (!supabase) {
          throw new Error("Chưa cấu hình Supabase (thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY)");
        }
        const snakeCaseData = newEntries.map(item => {
          const { id, ...rest } = mapToSnakeCase(item);
          return rest;
        });
        const chunkSize = 1000;
        for (let i = 0; i < snakeCaseData.length; i += chunkSize) {
          const chunk = snakeCaseData.slice(i, i + chunkSize);
          const { data, error } = await supabase.from('kho_sim').insert(chunk).select();
          if (error) throw error;
          if (data) {
            insertedData = [...insertedData, ...data.map(mapToCamelCase)];
          }
        }
        
        setRawData(prev => [...prev, ...insertedData]);
        setCopyFeedback(`Đã thêm ${insertedData.length} SIM từ danh sách dán!`);
        setPasteText('');
      } else {
        setCopyFeedback("Không tìm thấy số SIM hợp lệ!");
      }
    } catch (err: any) {
      console.error(err);
      setCopyFeedback(`Lỗi đồng bộ dữ liệu lên Supabase: ${err.message || JSON.stringify(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const executeApplySmartPricing = async () => {
    setLoading(true);
    try {
      const updatedData = rawData.map(item => ({
        ...item,
        price: getAutoPrice({ ...item, price: '' }) // Reset giá thủ công để áp dụng hoàn toàn từ ma trận
      }));
      
      if (updatedData.length > 0) {
        if (!supabase) {
          throw new Error("Chưa cấu hình Supabase");
        }
        const snakeCaseData = updatedData.map(mapToSnakeCase);
        const chunkSize = 1000;
        for (let i = 0; i < snakeCaseData.length; i += chunkSize) {
          const chunk = snakeCaseData.slice(i, i + chunkSize);
          const { error } = await supabase.from('kho_sim').upsert(chunk);
          if (error) throw error;
        }
      }
      
      setRawData(updatedData);
      setCopyFeedback("Đã áp dụng giá từ ma trận!");
    } catch (err) {
      console.error(err);
      setCopyFeedback("Lỗi cập nhật giá lên Supabase!");
    } finally {
      setLoading(false);
      setIsSmartPriceModalOpen(false);
    }
  };

  const applyBulkPrice = async () => {
    if (!bulkPriceValue) return;
    setLoading(true);
    try {
      let finalPrice = bulkPriceValue.trim();
      if (/^\d+$/.test(finalPrice)) {
        finalPrice += 'k';
      }
      const targetIds = new Set(filteredAndSortedData.map(i => i.id));
      const updatedData = rawData.map(item => {
        if (targetIds.has(item.id)) { return { ...item, price: finalPrice }; }
        return item;
      });
      
      if (updatedData.length > 0) {
        if (!supabase) {
          throw new Error("Chưa cấu hình Supabase");
        }
        const snakeCaseData = updatedData.map(mapToSnakeCase);
        const chunkSize = 1000;
        for (let i = 0; i < snakeCaseData.length; i += chunkSize) {
          const chunk = snakeCaseData.slice(i, i + chunkSize);
          const { error } = await supabase.from('kho_sim').upsert(chunk);
          if (error) throw error;
        }
      }
      
      setRawData(updatedData);
      setCopyFeedback(`Đã cập nhật giá ${finalPrice} cho ${targetIds.size} SIM!`);
    } catch (err) {
      console.error(err);
      setCopyFeedback("Lỗi cập nhật giá hàng loạt lên Supabase!");
    } finally {
      setLoading(false);
      setIsBulkPriceModalOpen(false); 
      setBulkPriceValue('');
    }
  };

  const exportSelectedSales = () => {
    if (selectedSimIds.size === 0) { alert("Vui lòng chọn ít nhất một SIM để xuất file bán hàng!"); return; }
    const selectedData = rawData.filter(item => selectedSimIds.has(item.id));
    const now = new Date();
    const month = now.getMonth() + 1;
    
    // TIÊU ĐỀ BẢNG (Cập nhật merge và thêm khoảng trống)
    // Cột trống sẽ nằm ở vị trí Index 5 (giữa Loại SIM bên trái và STT bên phải)
    // Layout: STT(0), SIM(1), Giá(2), Mệnh(3), Loại(4), Gap(5), STT(6), SIM(7), Giá(8), Mệnh(9), Loại(10)
    const aoa = [
      ["SIM SỐ ĐẸP TRẢ TRƯỚC KHUYẾN MÃI 🎁 THÁNG " + month + " 🎁", "", "", "", "", "", "", "", "", "", ""],
      ["📢 MIỄN PHÍ 30 NGÀY ĐẦU: 1G/NGÀY + MIỄN PHÍ 100% TRUY CẬP TIKTOK, YTB, FB", "", "", "", "", "", "", "", "", "", ""],
      ["📢 NGHE GỌI MIỄN PHÍ 30P NGOẠI MẠNG, 10P/ NỘI MẠNG + THÊM 20K", "", "", "", "", "", "", "", "", "", ""],
      ["STT", "SIM Chuẩn hóa", "Giá Bán", "Mệnh", "LOẠI SIM ĐẸP", "", "STT", "SIM Chuẩn hóa", "Giá Bán", "Mệnh", "LOẠI SIM ĐẸP"]
    ];

    const K = 30;
    let r = 0;
    const dataRows: { left?: SimEntry; right?: SimEntry; rowIndex: number }[] = [];
    
    while (true) {
      const B = Math.floor(r / K);
      const L = r % K;
      const iLeft = 2 * B * K + L;
      const iRight = (2 * B + 1) * K + L;
      if (iLeft >= selectedData.length) break;
      const left = selectedData[iLeft];
      const right = selectedData[iRight];
      
      const getSortedSimTypesLabel = (item?: SimEntry) => {
        if (!item) return "";
        const prefix = item.normalizedPhone.substring(0, 2);
        const priceKey = (prefix === '03') ? 'p03' : 'p09';
        
        // Lọc bỏ Đầu Số Đẹp để tìm dạng số đẹp chính quyết định giá
        const otherTypes = item.simTypes.filter(t => t !== SimType.DAU_SO_DEP);
        
        // Sắp xếp theo giá giảm dần
        const sortedOther = [...otherTypes].sort((a, b) => {
          const valA = parsePriceToNumber(categoryPrices[a]?.[priceKey]);
          const valB = parsePriceToNumber(categoryPrices[b]?.[priceKey]);
          return valB - valA;
        });

        const mainType = sortedOther.length > 0 ? sortedOther[0] : (item.simTypes.includes(SimType.DAU_SO_DEP) ? SimType.DAU_SO_DEP : "");
        const hasDauSoDep = item.simTypes.includes(SimType.DAU_SO_DEP);

        if (mainType && hasDauSoDep && mainType !== SimType.DAU_SO_DEP) {
          return `${mainType}, ${SimType.DAU_SO_DEP}`;
        }
        return mainType;
      };

      // Xây dựng hàng dữ liệu có cột đệm trống ở giữa
      const row = [
        iLeft + 1,
        left ? formatPhoneSmart(left) : "",
        left ? getAutoPrice(left).replace('k', '') : "",
        left ? left.menh : "",
        getSortedSimTypesLabel(left),
        "", // CỘT TRỐNG ĐỆM Ở GIỮA
        right ? iRight + 1 : "",
        right ? formatPhoneSmart(right) : "",
        right ? getAutoPrice(right).replace('k', '') : "",
        right ? right.menh : "",
        getSortedSimTypesLabel(right)
      ];
      aoa.push(row);
      dataRows.push({ left, right, rowIndex: aoa.length - 1 });
      r++;
    }
    
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    
    // Áp dụng style cho cột Mệnh
    // Cột Mệnh L là index 3 (D), Mệnh R là index 9 (J)
    dataRows.forEach(({ left, right, rowIndex }) => {
      if (left && left.menhColor) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 3 });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            fill: { fgColor: { rgb: left.menhColor.replace('#', '') } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center", vertical: "center" }
          };
          ws[cellRef].v = left.menh;
        }
      }
      if (right && right.menhColor) {
        const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: 9 });
        if (ws[cellRef]) {
          ws[cellRef].s = {
            fill: { fgColor: { rgb: right.menhColor.replace('#', '') } },
            font: { color: { rgb: "FFFFFF" }, bold: true },
            alignment: { horizontal: "center", vertical: "center" }
          };
          ws[cellRef].v = right.menh;
        }
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DonHangSIM");
    
    // Merge tiêu đề 11 cột (từ A đến K)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }, 
      { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }, 
      { s: { r: 2, c: 0 }, e: { r: 2, c: 10 } }
    ];
    
    // Định nghĩa độ rộng cột
    ws['!cols'] = [
      { wch: 6 },  // A: STT L
      { wch: 18 }, // B: SIM L
      { wch: 10 }, // C: Giá L
      { wch: 10 }, // D: Mệnh L
      { wch: 25 }, // E: Loại L
      { wch: 4 },  // F: --- KHOẢNG TRỐNG ---
      { wch: 6 },  // G: STT R
      { wch: 18 }, // H: SIM R
      { wch: 10 }, // I: Giá R
      { wch: 10 }, // J: Mệnh R
      { wch: 25 }  // K: Loại R
    ];
    
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    XLSX.writeFile(wb, `Bang_SIM_Ban_Hang_${dateStr}_${timeStr}.xlsx`);
    setCopyFeedback("Đã xuất file bán hàng với cột Mệnh và màu sắc!");
  };

  const exportMatrixExcel = () => {
    const allSimTypes = Object.values(SimType).filter(t => t !== SimType.ALL);
    const data = allSimTypes.map(type => ({ "LOẠI SIM ĐẸP": type, "Giá 03": categoryPrices[type]?.p03 || "", "Giá 09": categoryPrices[type]?.p09 || "" }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "BangGiaMaTran");
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
    const now = new Date();
    XLSX.writeFile(wb, `Ma_Tran_Gia_SIM_${now.toISOString().slice(0, 10)}.xlsx`);
    setCopyFeedback("Đã xuất Excel ma trận giá!");
  };

  const downloadExcelTemplate = () => {
    const allSimTypes = Object.values(SimType).filter(t => t !== SimType.ALL);
    const data = allSimTypes.map(type => ({ "LOẠI SIM ĐẸP": type, "Giá 03": "", "Giá 09": "" }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MauBangGia");
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
    XLSX.writeFile(wb, "Mau_Bang_Gia_SIM_Trong.xlsx");
    setCopyFeedback("Đã tải file mẫu Excel!");
  };

  const downloadDotPatternTemplate = () => {
    const allSimTypes = Object.values(SimType).filter(t => t !== SimType.ALL);
    const data = allSimTypes.map(type => ({ 
      "LOẠI SIM ĐẸP": type, 
      "Quy định dấu chấm": dotFormattingRules[type]?.pattern || "", 
      "Chấm đặc biệt": dotFormattingRules[type]?.special || (type.includes('Sảnh') ? 'Sảnh' : '') 
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "QuyDinhDauCham");
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
    XLSX.writeFile(wb, "Mau_Quy_Dinh_Dau_Cham_SIM.xlsx");
    setCopyFeedback("Đã tải file mẫu quy định dấu chấm!");
  };

  const importDotPatternExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const fileData = evt.target?.result;
        const wb = XLSX.read(fileData, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        const newRules: Record<string, DotRule> = { ...dotFormattingRules };
        rows.forEach(row => {
          const typeName = row["LOẠI SIM ĐẸP"]?.toString().trim();
          const pattern = row["Quy định dấu chấm"]?.toString().trim();
          const special = row["Chấm đặc biệt"]?.toString().trim();
          if (typeName && Object.values(SimType).includes(typeName as SimType)) {
            newRules[typeName] = { pattern: pattern || "", special: special || "" };
          }
        });
        setDotFormattingRules(newRules);
        setCopyFeedback("Cập nhật Quy định dấu chấm thành công!");
      } catch (err) { alert("Lỗi xử lý file Excel!"); }
      finally { setLoading(false); e.target.value = ''; }
    };
    reader.readAsArrayBuffer(file);
  };

  const importExcelConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const fileData = evt.target?.result;
        const wb = XLSX.read(fileData, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws) as any[];
        const newPrices = { ...categoryPrices };
        rows.forEach(row => {
          const typeName = row["LOẠI SIM ĐẸP"]?.toString().trim();
          if (typeName && Object.values(SimType).includes(typeName as SimType)) {
            newPrices[typeName] = { p03: row["Giá 03"]?.toString().trim() || "", p09: row["Giá 09"]?.toString().trim() || "" };
          }
        });
        setCategoryPrices(newPrices);
        setCopyFeedback("Đồng bộ Ma trận từ Excel thành công!");
      } catch (err) { alert("Lỗi xử lý file Excel!"); }
      finally { setLoading(false); e.target.value = ''; }
    };
    reader.readAsArrayBuffer(file);
  };

  const currentDensity = getDensityClasses();
  const displayHeaders = headers.filter(h => !["STT", "ISDN", "SỐ ĐIỆN THOẠI"].some(hc => h.toUpperCase().includes(hc)));

  const handleAssignPrice = (simType: string, price: string, mode: 'p03' | 'p09') => {
    setCategoryPrices(prev => ({ ...prev, [simType]: { ...(prev[simType] || { p03: '', p09: '' }), [mode]: price } }));
  };

  const removeSimFromSelection = (id: number) => {
    setSelectedSimIds(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet; });
  };

  if (viewMode === 'customer') {
    return (
      <>
        <CustomerView onAdminAccess={() => setShowAdminLogin(true)} rawData={rawData} formatPhoneSmart={formatPhoneSmart} getAutoPrice={getAutoPrice} />
        {showAdminLogin && (
          <AdminLoginModal onClose={() => setShowAdminLogin(false)} />
        )}
        
        {/* Floating Action Buttons */}
        <div className="fixed bottom-24 md:bottom-16 right-6 z-50 flex flex-col gap-3">
          {/* Hotline Button */}
          <a 
            href="tel:0359247247" 
            className="w-12 h-12 bg-red-600 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform hover:bg-red-700 animate-pulse"
          >
            <Phone className="w-6 h-6" />
          </a>
          
          {/* Zalo Button */}
          <motion.a 
            href="https://zalo.me/0359247247" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-12 h-12 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform hover:bg-blue-700"
            animate={{ 
              x: [0, -2, 2, -1, 1, 0],
              rotate: [0, -5, 5, -3, 3, 0],
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <MessageCircle className="w-6 h-6" />
          </motion.a>
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-viettel-bg relative font-sans text-viettel-text">
      {/* Back to Customer View Button */}
      <button 
        onClick={() => setViewMode('customer')}
        className="fixed bottom-6 right-6 w-12 h-12 bg-viettel-red text-white rounded-full shadow-2xl z-[150] flex items-center justify-center hover:scale-110 transition-transform"
        title="Quay lại giao diện khách hàng"
      >
        <i className="fa-solid fa-user"></i>
      </button>
      {copyFeedback && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-viettel-text text-white px-6 py-3 rounded-xl shadow-2xl animate-in fade-in zoom-in duration-200"><span>{copyFeedback}</span></div>}
      
      {/* Mobile Overlays */}
      {(isLeftSidebarOpen || isRightSidebarOpen) && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-200"
          onClick={() => { setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[110] w-80 bg-viettel-panel border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        lg:my-6 lg:ml-6 lg:rounded-3xl lg:border lg:shadow-sm overflow-hidden
        ${isLeftSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b bg-viettel-red flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white text-viettel-red p-2.5 rounded-xl shadow-lg"><i className="fa-solid fa-sim-card text-2xl"></i></div>
            <div><h1 className="text-xl font-bold text-white">SIM Master</h1><p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">Viettel Store Style</p></div>
          </div>
          <button onClick={() => setIsLeftSidebarOpen(false)} className="lg:hidden w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="mb-6 space-y-3">
            <div className="relative group">
              <input type="file" accept=".xlsx, .xls" multiple onChange={handleFileUpload} disabled={userRole !== 'admin'} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
              <div className={`flex items-center justify-center w-full py-3 px-4 border border-dashed rounded-xl transition-colors ${userRole !== 'admin' ? 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed' : 'bg-slate-50 text-viettel-red border-viettel-red/20 group-hover:bg-red-50'}`}>
                <i className={`fa-solid fa-cloud-arrow-up mr-2 ${userRole !== 'admin' ? '' : ''}`}></i>
                <span className="font-bold text-sm">{userRole !== 'admin' ? '🔒 Upload SIM (Chỉ Admin)' : 'Nhập File Excel SIM'}</span>
              </div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-viettel-red uppercase tracking-widest ml-1">Dán danh sách số (Paste)</label>
                <textarea 
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Dán các số SIM vào đây... (cách nhau bởi dấu phẩy hoặc xuống dòng)"
                  className="w-full h-24 p-3 bg-viettel-bg border border-slate-200 rounded-xl text-xs outline-none focus:border-viettel-red transition-all resize-none custom-scrollbar"
                />
                <button 
                  onClick={handlePasteImport}
                  disabled={!pasteText.trim()}
                  className={`w-full py-2.5 rounded-xl font-bold text-[10px] uppercase transition-all shadow-sm ${pasteText.trim() ? 'bg-viettel-red text-white hover:bg-red-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  <i className="fa-solid fa-plus mr-2"></i> Thêm vào danh sách
                </button>
              </div>
              <div className="w-full h-[1px] bg-slate-200 my-1"></div>
            </div>
          </div>
          <div className="space-y-6">
            <SidebarButton icon="fa-list-ul" label="Tất cả SIM" active={filter === SimType.ALL} onClick={() => setFilter(SimType.ALL)} badge={rawData.length} isLarge />
            {Object.entries(groupedQuickFilters).map(([key, group]) => (
              <div key={key} className="p-2 rounded-2xl border bg-white border-slate-100">
                <label className="block text-[11px] font-black mb-3 uppercase tracking-widest ml-1 text-viettel-red">{group.label}</label>
                <div className="space-y-0.5">
                  {group.types.map(t => (
                    <SidebarButton 
                      key={t} 
                      icon={group.icon} 
                      label={t} 
                      active={filter === t} 
                      onClick={() => setFilter(t)} 
                      color={group.color} 
                      badge={categoryCounts[t] || 0} 
                      showPriceInput 
                      price03={categoryPrices[t]?.p03} 
                      price09={categoryPrices[t]?.p09} 
                      onPrice03Change={v => setCategoryPrices(p => ({
                        ...p, 
                        [t]: { ...(p[t] || { p03: '', p09: '' }), p03: v }
                      }))} 
                      onPrice09Change={v => setCategoryPrices(p => ({
                        ...p, 
                        [t]: { ...(p[t] || { p03: '', p09: '' }), p09: v }
                      }))} 
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="p-2 rounded-2xl border bg-white border-slate-100">
              <label className="block text-[10px] font-black mb-3 uppercase tracking-widest ml-1 text-viettel-red">Khác</label>
              <div className="space-y-0.5 mb-1">
                <SidebarButton 
                  icon="fa-repeat" 
                  label={SimType.TRUNG_1_CHU_SO_09} 
                  active={filter === SimType.TRUNG_1_CHU_SO_09} 
                  onClick={() => setFilter(SimType.TRUNG_1_CHU_SO_09)} 
                  color="rose" 
                  badge={categoryCounts[SimType.TRUNG_1_CHU_SO_09] || 0} 
                  showPriceInput 
                  price03={categoryPrices[SimType.TRUNG_1_CHU_SO_09]?.p03} 
                  price09={categoryPrices[SimType.TRUNG_1_CHU_SO_09]?.p09} 
                  onPrice03Change={v => setCategoryPrices(p => ({
                    ...p, 
                    [SimType.TRUNG_1_CHU_SO_09]: { ...(p[SimType.TRUNG_1_CHU_SO_09] || { p03: '', p09: '' }), p03: v }
                  }))} 
                  onPrice09Change={v => setCategoryPrices(p => ({
                    ...p, 
                    [SimType.TRUNG_1_CHU_SO_09]: { ...(p[SimType.TRUNG_1_CHU_SO_09] || { p03: '', p09: '' }), p09: v }
                  }))} 
                />
                <SidebarButton 
                  icon="fa-repeat" 
                  label={SimType.TRUNG_2_CHU_SO_09} 
                  active={filter === SimType.TRUNG_2_CHU_SO_09} 
                  onClick={() => setFilter(SimType.TRUNG_2_CHU_SO_09)} 
                  color="rose" 
                  badge={categoryCounts[SimType.TRUNG_2_CHU_SO_09] || 0} 
                  showPriceInput 
                  price03={categoryPrices[SimType.TRUNG_2_CHU_SO_09]?.p03} 
                  price09={categoryPrices[SimType.TRUNG_2_CHU_SO_09]?.p09} 
                  onPrice03Change={v => setCategoryPrices(p => ({
                    ...p, 
                    [SimType.TRUNG_2_CHU_SO_09]: { ...(p[SimType.TRUNG_2_CHU_SO_09] || { p03: '', p09: '' }), p03: v }
                  }))} 
                  onPrice09Change={v => setCategoryPrices(p => ({
                    ...p, 
                    [SimType.TRUNG_2_CHU_SO_09]: { ...(p[SimType.TRUNG_2_CHU_SO_09] || { p03: '', p09: '' }), p09: v }
                  }))} 
                />
              </div>
              <SidebarButton 
                icon="fa-ellipsis" 
                label="SIM Khác" 
                active={filter === SimType.OTHER} 
                onClick={() => setFilter(SimType.OTHER)} 
                badge={categoryCounts[SimType.OTHER] || 0} 
                isLarge 
                showPriceInput 
                price03={categoryPrices[SimType.OTHER]?.p03} 
                price09={categoryPrices[SimType.OTHER]?.p09} 
                onPrice03Change={v => setCategoryPrices(p => ({
                  ...p, 
                  [SimType.OTHER]: { ...(p[SimType.OTHER] || { p03: '', p09: '' }), p03: v }
                }))} 
                onPrice09Change={v => setCategoryPrices(p => ({
                  ...p, 
                  [SimType.OTHER]: { ...(p[SimType.OTHER] || { p03: '', p09: '' }), p09: v }
                }))} 
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-2 lg:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsLeftSidebarOpen(true)}
              title="Mở menu lọc SIM"
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="hidden sm:block overflow-hidden">
              <h2 className="text-sm lg:text-lg font-bold text-slate-800 truncate">Đang xem: <span className="text-viettel-red">{filter}</span></h2>
            </div>
            <span className="bg-slate-100 text-slate-600 text-[9px] lg:text-[10px] font-black px-2 py-1 lg:px-2.5 rounded-full shrink-0">{filteredAndSortedData.length.toLocaleString()} / {rawData.length.toLocaleString()}</span>
            {rawData.length > 0 && (
              <div className="flex items-center gap-1 lg:gap-2 ml-1 lg:ml-2">
                <div className="relative flex items-center">
                  {isSequenceSearchOpen ? (
                    <div className="flex items-center bg-white border border-viettel-red/20 rounded-lg px-2 py-1 shadow-sm animate-in slide-in-from-right-2 duration-200">
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Ví dụ: *aaa*, *a(a+2)(a+4)*"
                        value={sequenceSearchValue}
                        onChange={(e) => setSequenceSearchValue(e.target.value)}
                        className="text-[9px] lg:text-[10px] font-bold outline-none w-24 sm:w-32 lg:w-48 placeholder:text-slate-300"
                      />
                      <button onClick={() => { setIsSequenceSearchOpen(false); setSequenceSearchValue(''); }} className="text-slate-400 hover:text-rose-500 ml-1"><i className="fa-solid fa-circle-xmark"></i></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsSequenceSearchOpen(true)} 
                      title="Tìm kiếm SIM theo chuỗi số"
                      className={`flex items-center justify-center gap-1 lg:gap-2 px-6 lg:px-12 py-1.5 rounded-lg font-bold text-[9px] lg:text-[10px] uppercase transition-all active:scale-95 ${sequenceSearchValue ? 'bg-viettel-red text-white shadow-md shadow-red-100' : 'bg-white text-viettel-red border border-viettel-red hover:bg-red-50'}`}
                    >
                      <i className="fa-solid fa-magnifying-glass"></i> <span className="hidden xs:inline">{sequenceSearchValue ? `Đang tìm: ${sequenceSearchValue}` : 'Tìm sim'}</span>
                    </button>
                  )}
                </div>
                <button onClick={() => setIsBulkPriceModalOpen(true)} title="Sửa giá hàng loạt cho danh sách đang hiển thị" className="flex items-center justify-center gap-1 lg:gap-2 bg-viettel-red text-white px-6 lg:px-12 py-1.5 rounded-lg font-bold text-[9px] lg:text-[10px] uppercase shadow-md shadow-red-100 hover:bg-red-700 transition-all active:scale-95">
                  <i className="fa-solid fa-tags"></i> <span className="hidden xs:inline">Sửa giá</span>
                </button>
              </div>
            )}
          </div>
            <div className="flex gap-2 lg:gap-3 items-center">
              {rawData.length > 0 && (
                <button 
                  onClick={() => {
                    if (userRole === 'admin') setIsDeleteConfirmModalOpen(true);
                  }}
                  disabled={userRole !== 'admin'}
                  title={userRole !== 'admin' ? "Chỉ Admin mới có quyền xóa danh sách" : "Xóa danh sách đang hiển thị"}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold text-[10px] lg:text-xs transition-all shadow-md ${
                    userRole === 'admin' 
                      ? 'bg-viettel-red text-white hover:bg-red-700 active:scale-95 shadow-red-100' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70'
                  }`}
                >
                  <i className="fa-solid fa-trash-can"></i> 
                  <span className="hidden sm:inline">Xóa List đang lọc</span>
                  <span className="sm:hidden">Xóa List</span>
                </button>
              )}
              <div className="relative">
                <button 
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="flex items-center gap-2 bg-slate-100 text-slate-600 px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl font-bold text-[10px] lg:text-xs hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
                >
                  <i className="fa-solid fa-gear"></i>
                  <span className="hidden sm:inline">Cài đặt</span>
                </button>
                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button 
                        onClick={() => { setIsSmartPriceModalOpen(true); setIsSettingsOpen(false); }}
                        disabled={rawData.length === 0}
                        className={`w-full flex items-center px-4 py-3 text-left font-bold text-[11px] uppercase transition-colors ${rawData.length > 0 ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 cursor-not-allowed'}`}
                      >
                        <i className="fa-solid fa-wand-magic-sparkles w-5 mr-2 text-viettel-red"></i> Đặt giá bán cho SIM
                      </button>
                      <button 
                        onClick={() => { setIsQRCodeModalOpen(true); setIsSettingsOpen(false); }}
                        className="w-full flex items-center px-4 py-3 text-left font-bold text-[11px] uppercase text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <i className="fa-solid fa-qrcode w-5 mr-2 text-viettel-red"></i> Quét QR Code sử dụng App
                      </button>
                      <div className="px-4 py-2">
                        <div className="relative group">
                          <label className="flex items-center w-full py-2.5 px-3 bg-slate-50 text-slate-600 border border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                            <i className="fa-solid fa-file-signature w-5 mr-2 text-viettel-red"></i>
                            <span className="font-bold text-[10px] uppercase">Quy định tách số bằng dấu chấm</span>
                            <input type="file" accept=".xlsx, .xls" onChange={(e) => { importDotPatternExcel(e); setIsSettingsOpen(false); }} className="hidden" />
                          </label>
                          <button onClick={downloadDotPatternTemplate} title="Tải file mẫu quy định dấu chấm" className="absolute -right-1 -top-1 w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95"><i className="fa-solid fa-download text-[9px]"></i></button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
                          
              <div className="hidden md:flex gap-2">
                {selectedSimIds.size > 0 && <button onClick={() => setSelectedSimIds(new Set())} className="flex items-center gap-2 bg-slate-100 text-slate-500 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all active:scale-95">Bỏ chọn tất cả</button>}
              </div>
             <button 
               onClick={() => setIsRightSidebarOpen(true)}
               title="Xem danh sách SIM đã chọn"
               className="lg:hidden w-10 h-10 rounded-xl bg-red-50 text-viettel-red flex items-center justify-center relative"
             >
               <i className="fa-solid fa-cart-shopping"></i>
               {selectedSimIds.size > 0 && (
                 <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                   {selectedSimIds.size}
                 </span>
               )}
             </button>
          </div>
        </header>
        <div className="flex-1 p-2 lg:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl lg:rounded-3xl shadow-sm border h-full flex flex-col overflow-hidden">
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="text-left border-collapse w-full min-w-[800px]">
                <thead className="sticky top-0 z-30 bg-viettel-red border-b border-white/20">
                  <tr>
                    <ColumnHeader isCheckbox width={columnWidths['checkbox']} densityClass={currentDensity.headerPadding} onToggleAll={toggleSelectAll} isAllSelected={filteredAndSortedData.length > 0 && filteredAndSortedData.every(item => selectedSimIds.has(item.id))} />
                    <ColumnHeader label="Chi tiết" columnKey="unitAdvanceDetail" uniqueValues={[]} activeFilter={colFilters['unitAdvanceDetail'] || {sort:null,contains:'',notContains:'',excludedValues:[]}} onFilterChange={handleFilterChange} densityClass={currentDensity.headerPadding} fontSize={currentDensity.headerFontSize} width={columnWidths['unitAdvanceDetail']} onResizeStart={handleResizeStart} onAutoFit={()=>{}} selectedPrefixes={selectedPrefixes} setSelectedPrefixes={setSelectedPrefixes} />
                    <ColumnHeader label="Số SIM" columnKey="normalizedPhone" uniqueValues={[]} activeFilter={colFilters['normalizedPhone'] || {sort:null,contains:'',notContains:'',excludedValues:[]}} onFilterChange={handleFilterChange} densityClass={currentDensity.headerPadding} fontSize={currentDensity.headerFontSize} width={columnWidths['normalizedPhone']} onResizeStart={handleResizeStart} onAutoFit={()=>{}} selectedPrefixes={selectedPrefixes} setSelectedPrefixes={setSelectedPrefixes} />
                    <ColumnHeader label="Giá Bán" columnKey="price" uniqueValues={[]} activeFilter={colFilters['price'] || {sort:null,contains:'',notContains:'',excludedValues:[]}} onFilterChange={handleFilterChange} densityClass={currentDensity.headerPadding} fontSize={currentDensity.headerFontSize} width={columnWidths['price']} onResizeStart={handleResizeStart} onAutoFit={()=>{}} selectedPrefixes={selectedPrefixes} setSelectedPrefixes={setSelectedPrefixes} align="right" />
                    <ColumnHeader label="LOẠI SIM ĐẸP" columnKey="simTypes" uniqueValues={[]} activeFilter={colFilters['simTypes'] || {sort:null,contains:'',notContains:'',excludedValues:[]}} onFilterChange={handleFilterChange} densityClass={currentDensity.headerPadding} fontSize={currentDensity.headerFontSize} width={columnWidths['simTypes']} onResizeStart={handleResizeStart} onAutoFit={()=>{}} selectedPrefixes={selectedPrefixes} setSelectedPrefixes={setSelectedPrefixes} align="right" />
                    <ColumnHeader label="Mệnh" columnKey="menh" uniqueValues={[]} activeFilter={colFilters['menh'] || {sort:null,contains:'',notContains:'',excludedValues:[]}} onFilterChange={handleFilterChange} densityClass={currentDensity.headerPadding} fontSize={currentDensity.headerFontSize} width={columnWidths['menh']} onResizeStart={handleResizeStart} onAutoFit={()=>{}} selectedPrefixes={selectedPrefixes} setSelectedPrefixes={setSelectedPrefixes} align="right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawData.length === 0 ? (
                    <tr>
                      <td colSpan={displayHeaders.length + 6} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                            <i className="fa-solid fa-sim-card text-5xl"></i>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-xl font-bold text-viettel-text">Chưa có dữ liệu SIM</h3>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto">Vui lòng sử dụng menu bên trái để <b>Nhập file Excel</b> hoặc <b>Dán danh sách số</b> để bắt đầu lọc.</p>
                          </div>
                          <div className="flex gap-3">
                            <div className="px-4 py-2 bg-viettel-bg text-viettel-red rounded-lg text-[10px] font-bold uppercase border border-viettel-red/20">
                              <i className="fa-solid fa-file-excel mr-2"></i> Nhập Excel
                            </div>
                            <div className="px-4 py-2 bg-viettel-bg text-viettel-text rounded-lg text-[10px] font-bold uppercase border border-slate-200">
                              <i className="fa-solid fa-paste mr-2"></i> Dán số
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : displayedData.map((item, index) => {
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/80 cursor-pointer even:bg-[#F0F0F0] ${selectedSimIds.has(item.id) ? 'bg-red-50' : ''}`} onClick={(e) => toggleSimSelection(item.id, index, e.shiftKey)}>
                        <td className="text-center border-r"><input type="checkbox" checked={selectedSimIds.has(item.id)} readOnly className="rounded text-viettel-red w-4 h-4" /></td>
                        <td className={`${currentDensity.padding} font-mono font-black text-viettel-text`}>{item.unitAdvanceDetail || '-'}</td>
                        <td className={`${currentDensity.padding.replace(/text-\[?\w+\]?|text-\w+/, '')} ${currentDensity.phoneFontSize} font-mono font-black text-viettel-red`}>{formatPhoneSmart(item)}</td>
                        <td className={`${currentDensity.padding.replace(/text-\[?\w+\]?|text-\w+/, '')} ${currentDensity.priceFontSize} text-viettel-text font-bold text-right pr-6`}>{getAutoPrice(item).replace(/k$/i, '')}</td>
                        <td className={currentDensity.padding}>
                          <div className="flex flex-wrap gap-x-1 gap-y-0.5 items-center justify-end pr-4">
                            {item.simTypes.map((t, idx) => (
                              <span key={idx} className={`inline-flex items-center ${currentDensity.badgeSize} rounded font-mono font-black uppercase text-viettel-red bg-red-50 border border-red-100 whitespace-nowrap`}>
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className={`${currentDensity.padding}`}>
                          {item.menh && (
                            <div className="flex justify-end pr-4">
                              <div 
                                className="w-7 h-7 flex items-center justify-center text-white font-black text-[10px] uppercase shadow-sm"
                                style={{ 
                                  backgroundColor: item.menhColor,
                                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                  WebkitClipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                                }}
                              >
                                {item.menh}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {visibleCount < filteredAndSortedData.length && (
                    <tr>
                      <td colSpan={displayHeaders.length + 6} className="p-8 text-center bg-slate-50/30">
                        <div className="flex flex-col items-center gap-4">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang hiển thị {visibleCount.toLocaleString()} / {filteredAndSortedData.length.toLocaleString()} SIM</p>
                          <button 
                            onClick={() => setVisibleCount(prev => prev + 2000)}
                            className="px-10 py-3 bg-viettel-red text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100"
                          >
                            <i className="fa-solid fa-angles-down mr-2"></i> Xem thêm 2000 SIM tiếp theo
                          </button>
                          <button 
                            onClick={() => setVisibleCount(filteredAndSortedData.length)}
                            className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                          >
                            Hiển thị tất cả (Có thể gây chậm máy)
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <aside className={`
        fixed inset-y-0 right-0 z-[110] w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        lg:my-6 lg:mr-6 lg:rounded-3xl lg:border lg:shadow-sm overflow-hidden
        ${isRightSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}
      `}>
        <div className="p-6 border-b bg-viettel-red flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><i className="fa-solid fa-cart-shopping text-white"></i> SIM Đã Chọn</h3>
            <p className="text-[10px] text-white/80 font-bold uppercase">Chuẩn bị xuất file cho khách</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white text-viettel-red text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">{selectedSimIds.size}</span>
            <button onClick={() => setIsRightSidebarOpen(false)} className="lg:hidden w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
          <div className="flex justify-end mb-4 lg:hidden">
            {selectedSimIds.size > 0 && <button onClick={() => setSelectedSimIds(new Set())} className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-tighter bg-rose-50 px-2 py-1 rounded transition-colors">Xóa hết danh sách</button>}
          </div>
          {selectedSimList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border-2 border-dashed border-slate-200"><i className="fa-solid fa-clipboard-list text-slate-200 text-2xl"></i></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Chưa có SIM nào<br/>được chọn</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedSimList.map((item) => (
                <div key={item.id} className="group p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all flex items-center justify-between bg-white shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-slate-700 text-sm tracking-tighter">{formatPhoneSmart(item)}</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{getAutoPrice(item).replace(/k$/i, '')}</span>
                  </div>
                  <button onClick={() => removeSimFromSelection(item.id)} className="w-7 h-7 rounded-lg bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"><i className="fa-solid fa-xmark text-xs"></i></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-6 border-t bg-viettel-panel">
          <button disabled={selectedSimIds.size === 0} onClick={exportSelectedSales} className={`w-full flex items-center justify-center gap-3 py-4 rounded-[20px] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${selectedSimIds.size > 0 ? 'bg-viettel-red text-white shadow-red-100 hover:bg-red-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}><i className="fa-solid fa-file-invoice-dollar"></i> Xuất file bán hàng</button>
        </div>
      </aside>

      {isQRCodeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-200 text-center">
            <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-mobile-screen-button text-emerald-600 text-2xl"></i>
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-2">Quét mã QR</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-6 leading-relaxed">Sử dụng camera điện thoại để quét mã và mở ứng dụng</p>
            
            <div className="bg-white p-4 rounded-3xl border-4 border-slate-50 inline-block mb-6 shadow-inner">
              <QRCodeCanvas 
                value={SHARED_URL} 
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl mb-6 break-all">
              <p className="text-[9px] font-mono text-slate-500 select-all">{SHARED_URL}</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(SHARED_URL);
                  alert("Đã sao chép liên kết công khai!");
                }}
                className="flex-1 py-3 bg-viettel-bg text-viettel-red rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all border border-viettel-red/20"
              >
                <i className="fa-solid fa-copy mr-2"></i> Sao chép Link
              </button>
              <button 
                onClick={() => setIsQRCodeModalOpen(false)} 
                className="flex-1 py-3 bg-viettel-red text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-red-700 transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {isBulkPriceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[280] p-4">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-viettel-text uppercase tracking-widest mb-2 flex items-center gap-2"><i className="fa-solid fa-tags text-viettel-red"></i> Sửa giá nhóm này</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-6 leading-relaxed">Bạn đang sửa giá cho {filteredAndSortedData.length} SIM đang hiển thị.</p>
            <div className="space-y-4 mb-8">
              <input autoFocus type="text" placeholder="Ví dụ: 250, 500 hoặc 250k, 500k" value={bulkPriceValue} onChange={(e) => setBulkPriceValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyBulkPrice()} className="w-full px-6 py-4 bg-viettel-bg border border-slate-200 rounded-2xl text-lg font-black text-viettel-text outline-none focus:border-viettel-red focus:ring-4 focus:ring-viettel-red/10 transition-all text-center placeholder:text-slate-300" />
            </div>
            <div className="flex gap-3"><button onClick={() => setIsBulkPriceModalOpen(false)} className="flex-1 py-3 font-bold text-slate-400 hover:text-viettel-red uppercase text-[10px] tracking-widest">Hủy bỏ</button><button onClick={applyBulkPrice} disabled={!bulkPriceValue} className="flex-1 py-3 bg-viettel-red text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-red-700 transition-all">Cập nhật</button></div>
          </div>
        </div>
      )}

      {isSmartPriceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[250] p-2 lg:p-4">
          <div className="bg-white w-full max-w-[98vw] lg:max-w-[95vw] h-[98vh] lg:h-[95vh] rounded-2xl lg:rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 lg:p-6 border-b bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 lg:gap-4">
                <div title="Ma trận đặt giá bán SIM" className="bg-viettel-red text-white w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shrink-0"><i className="fa-solid fa-table-cells-large text-3xl lg:text-4xl"></i></div>
                <div>
                  <h3 className="text-lg lg:text-xl font-black text-white uppercase tracking-wider">Đặt giá bán cho SIM</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cấu hình ma trận giá theo đầu số</p>
                </div>
              </div>
              <div className="flex items-center gap-2 lg:gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
                 <div className="flex items-center gap-4 px-4 lg:px-6 py-2 lg:py-3 bg-white/5 rounded-xl lg:rounded-xl border border-white/10 shadow-sm shrink-0">
                    <button title="Tải mẫu Excel cấu hình giá" onClick={downloadExcelTemplate} className="flex flex-col items-center gap-1 text-[8px] lg:text-[9px] font-black uppercase text-slate-300 hover:text-white transition-colors shrink-0"><i className="fa-solid fa-file-excel text-3xl text-emerald-500 mb-1"></i> <span className="hidden xs:inline">MẪU EXCEL</span></button>
                    <div className="w-[1px] h-8 lg:h-10 bg-white/10 mx-2 lg:mx-3"></div>
                    <button title="Xuất cấu hình giá hiện tại ra Excel" onClick={exportMatrixExcel} className="flex flex-col items-center gap-1 text-[8px] lg:text-[9px] font-black uppercase text-slate-300 hover:text-white transition-colors shrink-0"><i className="fa-solid fa-file-export text-3xl text-blue-400 mb-1"></i> <span className="hidden xs:inline">XUẤT EXCEL</span></button>
                    <div className="w-[1px] h-8 lg:h-10 bg-white/10 mx-2 lg:mx-3"></div>
                    <label title="Nhập cấu hình giá từ file Excel" className="flex flex-col items-center gap-1 text-[8px] lg:text-[9px] font-black uppercase text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"><i className="fa-solid fa-file-import text-3xl text-amber-400 mb-1"></i> <span className="hidden xs:inline">NHẬP (EXCEL)</span><input type="file" accept=".xlsx, .xls" onChange={importExcelConfig} className="hidden" /></label>
                 </div>
                 <button title="Đóng cửa sổ" onClick={() => setIsSmartPriceModalOpen(false)} className="w-10 h-10 lg:w-10 lg:h-10 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-all active:scale-90 shrink-0"><i className="fa-solid fa-xmark text-lg lg:text-xl"></i></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar bg-slate-100/30 p-2 lg:p-8">
              <div className="bg-white rounded-xl lg:rounded-[32px] shadow-sm border border-slate-200 overflow-hidden min-w-[600px] lg:min-w-0">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 z-50 bg-slate-50 shadow-sm">
                    <tr className="border-b border-slate-200">
                      <th className="p-4 bg-slate-50 text-slate-500 font-black text-[10px] uppercase w-[240px] border-r border-slate-200 sticky left-0 z-20">Phân Loại SIM</th>
                      {pricePresets.map((price, idx) => (
                        <th key={idx} className="p-3 min-w-[110px] bg-slate-50 border-r border-slate-200 last:border-0">
                          <div className="relative group/input">
                            <input 
                              type="text" 
                              value={price} 
                              onChange={(e) => { const newPresets = [...pricePresets]; newPresets[idx] = e.target.value; setPricePresets(newPresets); }} 
                              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-center text-xs font-black text-viettel-text outline-none focus:border-viettel-red focus:ring-2 focus:ring-viettel-red/10 transition-all shadow-sm placeholder:text-slate-300" 
                              placeholder="Giá..." 
                            />
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-viettel-red rounded-full opacity-0 group-hover/input:opacity-100 transition-opacity"></div>
                          </div>
                        </th>
                      ))}
                      <th className="p-4 bg-slate-100 text-slate-600 font-black text-[10px] uppercase w-[160px] text-center sticky right-0 z-20 shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">Giá Đang Lưu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(groupedQuickFilters).map(([groupId, group]) => (
                      <React.Fragment key={groupId}>
                        <tr className="bg-slate-50/50">
                          <td colSpan={pricePresets.length + 2} className="px-6 py-1.5 border-y border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
                                <i className={`fa-solid ${group.icon} text-viettel-red text-[10px]`}></i>
                              </div>
                              <span className="font-black text-[9px] text-slate-500 uppercase tracking-[2px]">{group.label}</span>
                            </div>
                          </td>
                        </tr>
                        {group.types.map((type: string) => (
                          <tr key={type} className="group/row hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0">
                            <td className="px-6 py-1.5 border-r border-slate-100 bg-white sticky left-0 z-10 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-slate-700 leading-tight group-hover/row:text-viettel-red transition-colors">{type}</span>
                              </div>
                            </td>
                            {pricePresets.map((price, pIdx) => {
                               const isActive03 = categoryPrices[type]?.p03 === price && price !== '';
                               const isActive09 = categoryPrices[type]?.p09 === price && price !== '';
                               return (
                                 <td key={pIdx} className="p-1 border-r border-slate-50 last:border-0 text-center">
                                   <div className="flex flex-col gap-0.5 items-center justify-center max-w-[80px] mx-auto">
                                     <button 
                                       onClick={() => handleAssignPrice(type, price, 'p03')} 
                                       className={`w-full py-1 rounded-lg border text-[13px] font-black transition-all transform active:scale-90 ${isActive03 ? 'bg-viettel-red border-viettel-red text-white shadow-lg shadow-red-100' : 'bg-white border-slate-100 text-slate-300 hover:border-viettel-red/30 hover:text-viettel-red hover:bg-red-50/30'}`}
                                     >
                                       03
                                     </button>
                                     <button 
                                       onClick={() => handleAssignPrice(type, price, 'p09')} 
                                       className={`w-full py-1 rounded-lg border text-[13px] font-black transition-all transform active:scale-90 ${isActive09 ? 'bg-slate-800 border-slate-800 text-white shadow-lg shadow-slate-200' : 'bg-white border-slate-100 text-slate-300 hover:border-slate-800/30 hover:text-slate-800 hover:bg-slate-50'}`}
                                     >
                                       09
                                     </button>
                                   </div>
                                 </td>
                               );
                            })}
                            <td className="px-4 py-1 bg-slate-50/30 sticky right-0 z-10 shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">
                               <div className="flex flex-col gap-1">
                                  <div className="flex items-center justify-between px-2.5 py-1 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <span className="text-[11px] font-black text-viettel-red uppercase opacity-60">03</span>
                                    <span className="text-[10px] font-black text-slate-700">{(categoryPrices[type]?.p03 || '--').replace(/k$/i, '')}</span>
                                  </div>
                                  <div className="flex items-center justify-between px-2.5 py-1 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <span className="text-[11px] font-black text-slate-800 uppercase opacity-60">09</span>
                                    <span className="text-[10px] font-black text-slate-700">{(categoryPrices[type]?.p09 || '--').replace(/k$/i, '')}</span>
                                  </div>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-8 border-t bg-viettel-bg flex justify-end shrink-0">
               <button onClick={executeApplySmartPricing} className="px-16 py-4 rounded-[24px] bg-viettel-red text-white font-black uppercase text-sm tracking-[2px] shadow-2xl hover:bg-red-700 transition-all">ÁP DỤNG & LƯU</button>
            </div>
          </div>
        </div>
      )}
      
      {isDeleteConfirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[300] p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-50 text-viettel-red rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <i className="fa-solid fa-trash-can text-3xl"></i>
              </div>
              <h3 className="text-2xl font-black text-viettel-text mb-4 leading-tight">Xác nhận xóa danh sách?</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Bạn có chắc chắn muốn xóa toàn bộ danh sách SIM hiện tại không? <br/>
                <span className="font-bold text-viettel-red">Hành động này không thể hoàn tác.</span>
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      if (!supabase) {
                        throw new Error("Chưa cấu hình Supabase");
                      }
                      const { error } = await supabase.from('kho_sim').delete().not('id', 'is', null);
                      if (error) throw error;
                      await logAudit(user?.email || 'unknown', userRole || 'unknown', 'DELETE_ALL_SIM', 'kho_sim', undefined, { count: rawData.length });
                      setRawData([]);
                      setSelectedSimIds(new Set());
                      setHeaders([]);
                      setFilter(SimType.ALL);
                      setIsDeleteConfirmModalOpen(false);
                      setCopyFeedback("Đã xóa toàn bộ danh sách SIM trên Supabase!");
                    } catch (err) {
                      console.error(err);
                      setCopyFeedback("Lỗi khi xóa dữ liệu trên Supabase!");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-4 bg-viettel-red text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-700 transition-all active:scale-95"
                >
                  Đồng ý xóa sạch
                </button>
                <button 
                  onClick={() => setIsDeleteConfirmModalOpen(false)}
                  className="w-full py-4 bg-viettel-bg text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && <div className="fixed inset-0 bg-viettel-text/40 backdrop-blur-sm flex items-center justify-center z-[300]"><div className="bg-white p-10 rounded-[40px] flex flex-col items-center shadow-2xl"><div className="w-16 h-16 border-4 border-viettel-red border-t-transparent rounded-full animate-spin mb-6"></div><p className="font-black text-viettel-text">Đang xử lý...</p></div></div>}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 md:bottom-16 right-6 z-50 flex flex-col gap-3">
        {/* Hotline Button */}
        <a 
          href="tel:0359247247" 
          className="w-12 h-12 bg-red-600 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform hover:bg-red-700 animate-pulse"
        >
          <Phone className="w-6 h-6" />
        </a>
        
        {/* Zalo Button */}
        <motion.a 
          href="https://zalo.me/0359247247" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white active:scale-90 transition-transform hover:bg-blue-700"
          animate={{ 
            x: [0, -2, 2, -1, 1, 0],
            rotate: [0, -5, 5, -3, 3, 0],
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <MessageCircle className="w-6 h-6" />
        </motion.a>
      </div>
    </div>
  );
};

export default App;
