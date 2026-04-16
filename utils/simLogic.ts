
import { SimType } from '../types';

/**
 * Chuẩn hóa số điện thoại về dạng 10 số
 */
export const normalizePhone = (phone: any): string => {
  if (phone === null || phone === undefined) return '';
  let str = phone.toString().replace(/[^0-9]/g, '');
  
  // Logic xử lý quan trọng: Nếu độ dài < 9 -> Bỏ qua
  if (str.length < 9) return '';

  // Nếu độ dài là 9 ký tự -> Tự động thêm số '0' vào đầu
  if (str.length === 9) {
    str = '0' + str;
  }
  
  if (str.length > 10) {
    if (str.startsWith('84')) {
      str = '0' + str.substring(2);
    }
  }
  
  return str.slice(-10);
};

/**
 * Tìm vị trí bắt đầu của dãy số liên tiếp đầu tiên có độ dài n
 */
export const findConsecutiveIndex = (phone: string, n: number): number => {
  if (phone.length < n) return -1;
  for (let i = 0; i <= phone.length - n; i++) {
    let isMatch = true;
    for (let j = 0; j < n - 1; j++) {
      const current = parseInt(phone[i + j]);
      const next = parseInt(phone[i + j + 1]);
      if (next !== current + 1) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) return i;
  }
  return -1;
};

/**
 * Thông tin về dãy số tăng dần đều
 */
export interface APInfo {
  formatted: string;
  count: number;
  startIndex: number;
  endIndex: number;
  lengths: number[];
  step: number;
}

/**
 * Kiểm tra xem một chuỗi có chứa dãy số tăng dần đều không
 */
export const checkArithmeticProgression = (phone: string): APInfo | null => {
  let bestAP: APInfo | null = null;

  // Thử các vị trí bắt đầu
  for (let start = 0; start <= phone.length - 3; start++) {
    // Thử độ dài số hạng đầu tiên (1, 2 hoặc 3)
    for (let len1 = 1; len1 <= 3; len1++) {
      if (start + len1 > phone.length) continue;
      const n1 = parseInt(phone.substring(start, start + len1));
      
      // Thử độ dài số hạng thứ hai (1, 2 hoặc 3)
      for (let len2 = 1; len2 <= 3; len2++) {
        if (start + len1 + len2 > phone.length) continue;
        const n2 = parseInt(phone.substring(start + len1, start + len1 + len2));
        
        const d = n2 - n1;
        if (d <= 0) continue; // Chỉ lấy tăng dần đều
        
        let currentSequence = [n1];
        let currentSequenceStr = [phone.substring(start, start + len1)];
        
        currentSequence.push(n2);
        currentSequenceStr.push(phone.substring(start + len1, start + len1 + len2));
        
        let currentPos = start + len1 + len2;
        let nextVal = n2 + d;
        
        while (currentPos < phone.length) {
          const nextValStr = nextVal.toString();
          if (phone.startsWith(nextValStr, currentPos)) {
            currentSequence.push(nextVal);
            currentSequenceStr.push(nextValStr);
            currentPos += nextValStr.length;
            nextVal += d;
          } else {
            break;
          }
        }
        
        // Điều kiện: ít nhất 3 số
        if (currentSequence.length >= 3) {
           const totalLen = currentSequenceStr.join('').length;
           // Nếu d=1 thì yêu cầu độ dài lớn hơn để không trùng sảnh thường quá nhiều
           if (d === 1 && currentSequence.length < 5) continue;
           
           if (totalLen >= 3) {
             const info: APInfo = {
               formatted: currentSequenceStr.join('.'),
               count: currentSequence.length,
               startIndex: start,
               endIndex: currentPos,
               lengths: currentSequenceStr.map(s => s.length),
               step: d
             };
             
             // Ưu tiên dãy dài nhất hoặc ở cuối
             if (!bestAP || info.count > bestAP.count || (info.count === bestAP.count && info.endIndex > bestAP.endIndex)) {
               bestAP = info;
             }
           }
        }
      }
    }
  }
  return bestAP;
};

/**
 * Kiểm tra xem một chuỗi có phải là dãy số tiến đều (Sảnh) không
 */
export const isSequential = (str: string): boolean => {
  if (str.length < 3) return false;
  for (let i = 0; i < str.length - 1; i++) {
    const current = parseInt(str[i]);
    const next = parseInt(str[i + 1]);
    if (next !== current + 1) return false;
  }
  return true;
};

/**
 * Tìm và định dạng 2 dãy số tiến đều nằm cạnh nhau
 */
export const findSequentialPairs = (phone: string): string | null => {
  for (let i = 0; i <= phone.length - 6; i++) {
    for (let len1 of [3, 4]) {
      if (i + len1 > phone.length - 3) continue;
      const seq1 = phone.substring(i, i + len1);
      if (isSequential(seq1)) {
        for (let len2 of [3, 4]) {
          if (i + len1 + len2 > phone.length) continue;
          const seq2 = phone.substring(i + len1, i + len1 + len2);
          if (isSequential(seq2)) {
            const part1 = phone.substring(0, i);
            const part3 = phone.substring(i + len1 + len2);
            return (part1 ? part1 + "." : "") + seq1 + "." + seq2 + (part3 ? "." + part3 : "");
          }
        }
      }
    }
  }
  return null;
};

/**
 * Phân tích logic SIM đa chiều chuyên nghiệp
 */
export const analyzeSim = (phone: string): { types: SimType[], detail?: string } => {
  if (!phone || phone.length < 10) return { types: [SimType.OTHER] };
  
  const types: SimType[] = [];
  let unitDetailArr: string[] = [];

  // --- Logic TAXI ĐẦU (ABC.ABC) ---
  const abc1 = phone.substring(1, 4);
  const abc2 = phone.substring(4, 7);
  if (abc1 === abc2) {
    types.push(SimType.TAXI_DAU);
    unitDetailArr.push(`Taxi đầu (${abc1}.${abc2})`);
  }

  // --- Logic Số Cặp/Số Đảo (ABAB, ABBA) - 4 số cuối ---
  const last4Digits = phone.slice(-4);
  const d1 = last4Digits[0], d2 = last4Digits[1], d3 = last4Digits[2], d4 = last4Digits[3];
  
  // Kiểm tra d1 khác d2 để tránh trùng với Tứ Quý
  if (d1 !== d2) {
    // ABAB
    if (d1 === d3 && d2 === d4) {
      types.push(SimType.SIM_CAP_DAO);
      unitDetailArr.push("Dạng ABAB");
    } 
    // ABBA
    else if (d1 === d4 && d2 === d3) {
      types.push(SimType.SIM_CAP_DAO);
      unitDetailArr.push("Dạng ABBA");
    }
  }

  // --- 0. Logic Đầu Số Đẹp (4 số đầu) ---
  const prefix = phone.substring(0, 4);
  const pd1 = prefix[0], pd2 = prefix[1], pd3 = prefix[2], pd4 = prefix[3];
  const pv1 = parseInt(pd1), pv2 = parseInt(pd2), pv3 = parseInt(pd3), pv4 = parseInt(pd4);

  let prefixMatch = false;
  let prefixTypeLabel = "";

  if (pd2 === pd3 && pd3 === pd4) {
    prefixMatch = true;
    prefixTypeLabel = `Đầu Tam Hoa (${prefix})`;
  } else if (pv3 === pv2 + 1 && pv4 === pv3 + 1) {
    prefixMatch = true;
    prefixTypeLabel = `Đầu Tiến (${prefix})`;
  } else if (pd1 === pd3 && pd2 === pd4) {
    prefixMatch = true;
    prefixTypeLabel = `Đầu Cặp (${prefix})`;
  } else if ((pd1 === pd4 && pd2 === pd3) || (pd2 === pd4) || (pd1 === '0' && (pd2 === '3' || pd2 === '8') && pd2 === pd4)) {
    prefixMatch = true;
    prefixTypeLabel = `Đầu Gánh (${prefix})`;
  } else if ((pd3 === pd4 && pd2 !== pd3) || (pd1 === '0' && pd2 === '3' && pd3 === '3')) {
    prefixMatch = true;
    prefixTypeLabel = `Đầu Kép (${prefix})`;
  }

  if (prefixMatch) {
    types.push(SimType.DAU_SO_DEP);
    unitDetailArr.push(prefixTypeLabel);
  }

  // --- 0.1 Logic Nhóm Sim VIP & Số Độc (Lặp số) ---
  for (let i = 0; i <= 5; i++) {
    if (phone[i] === phone[i+1] && phone[i] === phone[i+2] && phone[i] === phone[i+3]) {
      types.push(SimType.TU_QUY_GIUA);
      unitDetailArr.push(`Tứ quý giữa (${phone[i].repeat(4)})`);
      break;
    }
  }

  for (let i = 0; i <= 4; i++) {
    if (phone[i] === phone[i+1] && phone[i] === phone[i+2] && phone[i] === phone[i+3] && phone[i] === phone[i+4]) {
      types.push(SimType.NGU_QUY_GIUA);
      unitDetailArr.push(`Ngũ quý giữa (${phone[i].repeat(5)})`);
      break;
    }
  }

  if (phone[5] === phone[6] && phone[6] === phone[7] && phone[7] === phone[8] && phone[8] === phone[9]) {
    types.push(SimType.NGU_QUY_DUOI);
    unitDetailArr.push(`Ngũ quý đuôi (${phone[9].repeat(5)})`);
  } else if (phone[6] === phone[7] && phone[7] === phone[8] && phone[8] === phone[9]) {
    types.push(SimType.TU_QUY_DUOI);
    unitDetailArr.push(`Tứ quý đuôi (${phone[9].repeat(4)})`);
  } else if (phone[7] === phone[8] && phone[8] === phone[9]) {
    types.push(SimType.TAM_HOA_DUOI);
    unitDetailArr.push(`Tam hoa đuôi (${phone[9].repeat(3)})`);
  }

  // --- 0.2 Logic Nhóm Sim 1 Cặp (Single Pair) ---
  // Để chuẩn hóa như yêu cầu, BCD.EAA phải đảm bảo B,C,D,E,A là 5 chữ số khác nhau.
  const isCapDao = types.includes(SimType.SIM_CAP_DAO);
  const l6 = phone.slice(-6);
  const ld1 = l6[0], ld2 = l6[1], ld3 = l6[2], ld4 = l6[3], ld5 = l6[4], ld6 = l6[5];

  // 1. BCD.EAA (Kép Đuôi)
  if (ld5 === ld6 && ld5 !== ld4) {
    types.push(SimType.KEP_DUOI_1_CAP);
    unitDetailArr.push(`Đuôi AA (${ld4}${ld5}${ld6})`);
  }
  // 2. BCD.AAx (Kép Áp Đuôi)
  if (!isCapDao && ld4 === ld5 && ld4 !== ld3 && ld4 !== ld6) {
    types.push(SimType.KEP_AP_DUOI_1_CAP);
    // unitDetailArr.push(`Kép áp đuôi (${ld4}${ld5}${ld6})`);
  }
  // 3. xAA.BCD (Kép Giữa 6 số)
  if (!isCapDao && ld2 === ld3 && ld2 !== ld1 && ld2 !== ld4) {
    types.push(SimType.KEP_GIUA_1_CAP);
    // unitDetailArr.push(`Kép giữa (${ld1}${ld2}${ld3})`);
  }
  // 4. AAB.CDE (Kép Đầu 6 số)
  if (ld1 === ld2 && ld1 !== ld3) {
    types.push(SimType.KEP_DAU_1_CAP);
    // unitDetailArr.push(`Kép đầu (${ld1}${ld2}${ld3})`);
  }
  // 5. ABA.CDE (Gánh Đầu 6 số)
  if (ld1 === ld3 && ld1 !== ld2) {
    types.push(SimType.ABA_CDE_GANH);
    unitDetailArr.push(`Gánh đầu (${ld1}${ld2}${ld3})`);
  }

  // --- 0.3 Logic Nhóm Sim Biến Thể Đuôi (AABB & ABAB) ---
  if (phone[3] === phone[4] && phone[5] === phone[6] && phone[3] !== phone[5]) {
    types.push(SimType.AABB_3_DUOI);
    unitDetailArr.push("AABB đuôi 3");
  }
  if (phone[4] === phone[5] && phone[6] === phone[7] && phone[4] !== phone[6]) {
    types.push(SimType.AABB_2_DUOI);
    unitDetailArr.push("AABB đuôi 2");
  }
  if (phone[3] === phone[5] && phone[4] === phone[6] && phone[3] !== phone[4]) {
    types.push(SimType.ABAB_3_DUOI);
    unitDetailArr.push("ABAB đuôi 3");
  }
  if (phone[4] === phone[6] && phone[5] === phone[7] && phone[4] !== phone[5]) {
    types.push(SimType.ABAB_2_DUOI);
    unitDetailArr.push("ABAB đuôi 2");
  }
  if (phone[5] === phone[7] && phone[6] === phone[8] && phone[5] !== phone[6]) {
    types.push(SimType.ABAB_1_DUOI);
    unitDetailArr.push("ABAB đuôi 1");
  }

  // --- 0.4 Logic Nhóm 2 Bộ Ba (6 số cuối) ---
  const s_d1 = phone[4], s_d2 = phone[5], s_d3 = phone[6];
  const s_d4 = phone[7], s_d5 = phone[8], s_d6 = phone[9];

  if (s_d2 === s_d3 && s_d4 === s_d5) {
    types.push(SimType.AABB_X);
    const suffix = s_d1 === s_d6 ? "(x trùng)" : "(x khác)";
    unitDetailArr.push(`Dạng AABB.x ${suffix}`);
  }
  if (s_d1 === s_d2 && s_d4 === s_d5) {
    types.push(SimType.AAB_CCD);
    unitDetailArr.push("Dạng AAB.CCD");
  }
  if (s_d1 === s_d2 && s_d5 === s_d6) {
    types.push(SimType.AAB_CDD);
    unitDetailArr.push("Dạng AAB.CDD");
  }
  if (s_d1 === s_d3 && s_d4 === s_d5) {
    types.push(SimType.ABA_CCD);
    unitDetailArr.push("Dạng ABA.CCD");
  }
  if (s_d1 === s_d3 && s_d5 === s_d6) {
    types.push(SimType.ABA_CDD);
    unitDetailArr.push("Dạng ABA.CDD");
  }
  if (s_d2 === s_d3 && s_d5 === s_d6) {
    types.push(SimType.ABB_CDD);
    unitDetailArr.push("Dạng ABB.CDD");
  }

  // --- 1. Logic Nhóm Sim Cặp AB.AD & AB.CB ---
  const sd1 = phone[6], sd2 = phone[7], sd3 = phone[8], sd4 = phone[9];
  const sv1 = parseInt(sd1), sv2 = parseInt(sd2), sv3 = parseInt(sd3), sv4 = parseInt(sd4);

  // AB.AD
  if (sd1 === sd3 && sd2 !== sd4 && sd1 !== sd2) {
    if (sv4 > sv2) {
      // Loại bỏ nếu là TIẾN 2 ĐÔI (ABAC): sv4 === sv2 + 1
      if (sv4 !== sv2 + 1) {
        types.push(SimType.AB_AD_DONG_CHUC_TIEN);
        unitDetailArr.push("AB.AD (Đồng Chục - Tiến)");
      }
    } else if (sv4 < sv2) {
      types.push(SimType.AB_AD_DONG_CHUC);
      unitDetailArr.push("AB.AD (Đồng Chục)");
    }
  }

  // AB.CB
  if (sd2 === sd4 && sd1 !== sd3 && sd1 !== sd2) {
    if (sv1 < sv3) {
      // Loại bỏ nếu là TIẾN 2 ĐÔI (ABCB): sv3 === sv1 + 1
      if (sv3 !== sv1 + 1) {
        types.push(SimType.AB_CB_DONG_DON_VI_TIEN);
        unitDetailArr.push("AB.CB (Đồng Đơn Vị - Tiến)");
      }
    } else if (sv1 > sv3) {
      types.push(SimType.AB_CB_DONG_DON_VI);
      unitDetailArr.push("AB.CB (Đồng Đơn Vị)");
    }
  }

  // --- 1.1 Logic Nhóm Sim Gánh Cặp AB.CD.AB ---
  const cp1 = phone[4] + phone[5];
  const cp2 = phone[6] + phone[7];
  const cp3 = phone[8] + phone[9];
  if (cp1 === cp3 && cp1 !== cp2) {
    types.push(SimType.AB_CD_AB_GANH_CAP);
    unitDetailArr.push("Dạng AB.CD.AB");
  }

  // --- 2. Logic Nhóm 3 Cặp Biến Đổi ---
  const c1 = phone[4], u1 = phone[5];
  const c2 = phone[6], u2 = phone[7];
  const c3 = phone[8], u3 = phone[9];

  if (c1 === c2 && c2 === c3) {
    if (u1 !== u2 && u2 !== u3 && u1 !== u3) {
      const pr1 = parseInt(u1), pr2 = parseInt(u2), pr3 = parseInt(u3);
      types.push(pr1 < pr2 && pr2 < pr3 ? SimType.AB_AC_AD_TIEN : SimType.AB_AC_AD_FREE);
      unitDetailArr.push(`Đầu ${c1}`);
    }
  }

  if (u1 === u2 && u2 === u3) {
    if (c1 !== c2 && c2 !== c3 && c1 !== c3) {
      const pr1 = parseInt(c1), pr2 = parseInt(c2), pr3 = parseInt(c3);
      types.push(pr1 < pr2 && pr2 < pr3 ? SimType.AB_CB_DB_TIEN : SimType.AB_CB_DB_FREE);
      unitDetailArr.push(`Đuôi ${u1}`);
    }
  }

  // --- 3. Logic Tiến/Lùi Đơn Vị (1-9 nút) ---
  const lastSixVal = phone.slice(-6);
  const sa = parseInt(lastSixVal[0]), sb = parseInt(lastSixVal[1]), sc = parseInt(lastSixVal[2]);
  const sx = parseInt(lastSixVal[3]), sy = parseInt(lastSixVal[4]), sz = parseInt(lastSixVal[5]);

  if (sx > sa && sb === sy && sc === sz) {
    const diff = sx - sa;
    types.push(diff === 1 ? SimType.TIEN_1_10_100 : SimType.TIEN_DON_VI);
    unitDetailArr.push(`Tiến ${diff} nút (Trăm)`);
  } else if (sy > sb && sa === sx && sc === sz) {
    const diff = sy - sb;
    types.push(diff === 1 ? SimType.TIEN_1_10_100 : SimType.TIEN_DON_VI);
    unitDetailArr.push(`Tiến ${diff} nút (Chục)`);
  } else if (sz > sc && sa === sx && sb === sy) {
    const diff = sz - sc;
    types.push(diff === 1 ? SimType.TIEN_1_10_100 : SimType.TIEN_DON_VI);
    unitDetailArr.push(`Tiến ${diff} nút (Đơn vị)`);
  }

  if (sa > sx && sb === sy && sc === sz) {
    types.push(SimType.LUI_DON_VI);
    unitDetailArr.push(`Lùi ${sa - sx} nút (Trăm)`);
  } else if (sb > sy && sa === sx && sc === sz) {
    types.push(SimType.LUI_DON_VI);
    unitDetailArr.push(`Lùi ${sb - sy} nút (Chục)`);
  } else if (sc > sz && sa === sx && sb === sy) {
    types.push(SimType.LUI_DON_VI);
    unitDetailArr.push(`Lùi ${sc - sz} nút (Đơn vị)`);
  }

  // --- 4. Nhóm TIẾN LIÊN TIẾP (Sảnh) ---
  if (findConsecutiveIndex(phone, 7) !== -1) {
    types.push(SimType.TIEN_7_LIEN_TIEP);
  } else if (findConsecutiveIndex(phone, 6) !== -1) {
    types.push(SimType.TIEN_6_LIEN_TIEP);
  } else if (findConsecutiveIndex(phone, 5) !== -1) {
    types.push(SimType.TIEN_5_LIEN_TIEP);
  } else if (findConsecutiveIndex(phone, 4) !== -1) {
    types.push(SimType.TIEN_4_LIEN_TIEP);
  } else {
    const last3 = phone.slice(-3);
    const m1 = parseInt(last3[0]), m2 = parseInt(last3[1]), m3 = parseInt(last3[2]);
    if (m2 === m1 + 1 && m3 === m2 + 1) types.push(SimType.TIEN_3_LIEN_TIEP);
  }
  
  // --- 4.1 Nhóm TĂNG DẦN ĐỀU ---
  const apResult = checkArithmeticProgression(phone);
  if (apResult) {
    types.push(SimType.TANG_DAN_DEU);
    
    const isCuoi = apResult.endIndex === phone.length;
    const isDau = apResult.startIndex === 0;
    const posLabel = isCuoi ? 'cuối' : (isDau ? 'đầu' : 'giữa');
    
    const allTwoDigits = apResult.lengths.every(l => l === 2);
    
    if (apResult.count === 3 && isCuoi && allTwoDigits && apResult.step >= 1 && apResult.step <= 4) {
      types.push(SimType.TANG_DAN_DEU_3_CUOI);
    } else if (apResult.count === 4 && isCuoi) {
      types.push(SimType.TANG_DAN_DEU_4_CUOI);
    } else if (apResult.count >= 5) {
      types.push(SimType.TANG_DAN_DEU_5_6_CAP);
    }
    
    if (apResult.count >= 5) {
      // unitDetailArr.push(`Tăng dần ${apResult.count} cặp ${posLabel} (tăng ${apResult.step})`);
    } else if (apResult.count === 3 && isCuoi && apResult.step >= 1 && apResult.step <= 4) {
      // unitDetailArr.push(`Tăng đều 3 cặp (tăng đều ${apResult.step})`);
    } else {
      // unitDetailArr.push(`Tăng dần đều ${apResult.count} cặp ${posLabel} (${apResult.formatted})`);
    }
  }

  // --- 4.2 Nhóm 2 DÃY SỐ TIẾN ĐỀU (Sảnh 3 hoặc Sảnh 4 nằm cạnh nhau) ---
  let hasDoubleSequential = false;
  for (let i = 0; i <= phone.length - 6; i++) {
    // Thử sảnh 3 hoặc sảnh 4 cho dãy đầu tiên
    for (let len1 of [3, 4]) {
      if (i + len1 > phone.length - 3) continue;
      const seq1 = phone.substring(i, i + len1);
      if (isSequential(seq1)) {
        // Thử sảnh 3 hoặc sảnh 4 cho dãy thứ hai ngay sau đó
        for (let len2 of [3, 4]) {
          if (i + len1 + len2 > phone.length) continue;
          const seq2 = phone.substring(i + len1, i + len1 + len2);
          if (isSequential(seq2)) {
            hasDoubleSequential = true;
            unitDetailArr.push(`2 dãy tiến đều (${seq1}.${seq2})`);
            break;
          }
        }
      }
      if (hasDoubleSequential) break;
    }
    if (hasDoubleSequential) {
      types.push(SimType.TIEN_DEU_2_DAY);
      break;
    }
  }

  // --- 5. Nhóm TIẾN CỐ ĐỊNH ĐUÔI ---
  const lastFour = phone.slice(-4);
  const n1 = parseInt(lastFour[0]), n2 = parseInt(lastFour[1]), n3 = parseInt(lastFour[2]), n4 = parseInt(lastFour[3]);
  if (n1 < n2 && n2 < n3 && n3 < n4) {
    if (!(n2 === n1 + 1 && n3 === n2 + 1 && n4 === n3 + 1)) types.push(SimType.TIEN_4_KHONG_DEU);
  }
  if (lastFour[0] === lastFour[2] && n4 === n2 + 1) types.push(SimType.TIEN_2_DOI_ABAC);
  if (lastFour[1] === lastFour[3] && n3 === n1 + 1) types.push(SimType.TIEN_2_DOI_ABCB);
  
  // --- 6. Nhóm GÁNH (6 số cuối) ---
  const isGanh6XYZ_full = lastSixVal[3] === lastSixVal[5];
  const isGanh6ABC = lastSixVal[0] === lastSixVal[2];
  const hasPair6ABC = lastSixVal[0] === lastSixVal[1] || lastSixVal[1] === lastSixVal[2];
  if (isGanh6XYZ_full) {
    if (isGanh6ABC) types.push(SimType.GANH_DOI);
    else if (hasPair6ABC) types.push(SimType.GANH_DEP);
    else types.push(SimType.GANH_THUONG);
  }

  // --- 7. Logic 09 Trùng chữ số (Loại trừ nếu đã thuộc nhóm khác) ---
  if (phone.startsWith('09')) {
    // Chỉ thêm nếu chưa thuộc bất kỳ nhóm chính nào (chấp nhận Đầu Số Đẹp vì nó không có nhóm riêng trong sidebar)
    if (!types.some(t => t !== SimType.DAU_SO_DEP)) {
      const last6 = phone.slice(-6);
      const digitCounts: Record<string, number> = {};
      for (const char of last6) {
        digitCounts[char] = (digitCounts[char] || 0) + 1;
      }
      
      const duplicateDigits = Object.values(digitCounts).filter(count => count >= 2).length;
      
      if (duplicateDigits === 1) {
        types.push(SimType.TRUNG_1_CHU_SO_09);
      } else if (duplicateDigits >= 2) {
        types.push(SimType.TRUNG_2_CHU_SO_09);
      }
    }
  }

  const uniqueDetails = Array.from(new Set(unitDetailArr));
  if (types.length === 0) {
    types.push(SimType.OTHER);
    if (uniqueDetails.length === 0) {
      uniqueDetails.push("Khác");
    }
  }

  return {
    types: types,
    detail: uniqueDetails.join(', ')
  };
};

/**
 * Tính Mệnh (Ngũ hành) theo thuật toán "Tổng nút rút gọn (Quái số) theo Hậu Thiên Bát Quái"
 */
export const getMenhAndColor = (phone: string): { menh: string; color: string } => {
  if (!phone) return { menh: '', color: '' };
  
  // 1. Tính tổng tất cả các chữ số
  let sum = 0;
  for (let i = 0; i < phone.length; i++) {
    const digit = parseInt(phone[i]);
    if (!isNaN(digit)) sum += digit;
  }
  
  // 2. Rút gọn về 1 chữ số (1-9)
  let quaiSo = sum % 9;
  if (quaiSo === 0 && sum > 0) quaiSo = 9;
  
  // 3. Quy đổi Ngũ Hành
  switch (quaiSo) {
    case 1:
      return { menh: 'Thủy', color: '#2563eb' }; // Blue-600
    case 2:
    case 5:
    case 8:
      return { menh: 'Thổ', color: '#78350f' }; // Brown
    case 3:
    case 4:
      return { menh: 'Mộc', color: '#16a34a' }; // Green-600
    case 6:
    case 7:
      return { menh: 'Kim', color: '#ca8a04' }; // Gold (Yellow-600)
    case 9:
      return { menh: 'Hỏa', color: '#dc2626' }; // Red-600
    default:
      return { menh: '', color: '' };
  }
};
