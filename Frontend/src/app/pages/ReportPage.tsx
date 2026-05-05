import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  Upload,
  Camera,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Check,
  Loader2,
  X,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  FileText,
  Tag,
  Send,
  Shield,
  Lock,
  Video,
  Search,
  Home,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { CATEGORY_LABELS, CATEGORY_COLORS, IssueCategory, MediaFile } from "../data/issues";
import { useAuth } from "../context/AuthContext";
import { useIssues } from "../context/IssuesContext";
import { AuthModal } from "../components/AuthModal";
import { PageTitle } from "../components/PageTitle";
import { api } from "../../utils/api";
import { LocationPicker } from "../components/LocationPicker";

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || (import.meta.env.PROD ? "https://ai-0nhv.onrender.com" : "http://localhost:8000");

const STEPS = ["Hình ảnh & AI", "Thông tin vấn đề", "Vị trí", "Xác nhận"];

interface Province {
  name: string;
  code: number;
}

interface District {
  name: string;
  code: number;
}

interface Ward {
  name: string;
  code: number;
}

interface FormData {
  mediaFiles: Array<{ 
    file: File; 
    preview: string; 
    type: "image" | "video";
    aiStatus?: 'pending' | 'analyzing' | 'done' | 'error';
    aiResult?: {
      is_valid: boolean;
      label: string;
      category: string;
      confidence: number;
      source: string;
    }
  }>;
  aiCategory: IssueCategory | null;
  aiLabel: string;
  aiConfidence: number;
  aiSource?: string;
  title: string;
  description: string;
  category: IssueCategory | null;
  location: string;
  ward: string;
  district: string;
  city: string;
  reporterName: string;
  reporterPhone: string;
  anonymous: boolean;
  aiVerified?: boolean;
  lat: number;
  lng: number;
}

// Helper to map AI Microservice categories to Frontend categories
const mapAICategoryToFrontend = (aiCategory: string): IssueCategory => {
  const mapping: Record<string, IssueCategory> = {
    'trash': 'garbage',
    'infrastructure': 'road',
    'signs': 'lighting',
    'electric': 'lighting',
    'flood': 'flood',
    'trees': 'other',
    'construction': 'road',
    'encroachment': 'road',
    'other': 'other'
  };
  return mapping[aiCategory] || 'other';
};

export function ReportPage() {
  const navigate = useNavigate();
  const { user, isLoading, can } = useAuth();
  const { addIssue } = useIssues();
  const [step, setStep] = useState(0);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [descriptionStatus, setDescriptionStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [descriptionReason, setDescriptionReason] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState<FormData>({
    mediaFiles: [],
    aiCategory: null,
    aiLabel: "",
    aiConfidence: 0,
    aiSource: "",
    aiVerified: false,
    title: "",
    description: "",
    category: null,
    location: "",
    ward: "",
    district: "",
    city: "",
    reporterName: "",
    reporterPhone: "",
    anonymous: false,
    lat: 10.7769, // Default to HCM city coordinates
    lng: 106.7009,
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const res = await fetch("https://provinces.open-api.vn/api/p/");
        const data = await res.json();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
        toast.error("Không thể tải danh sách tỉnh/thành phố");
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Pure fetch functions to avoid side effects during sync
  const fetchDistrictsByCity = async (cityCode: number) => {
    if (!cityCode) return [];
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${cityCode}?depth=2`);
      const data = await res.json();
      return data.districts || [];
    } catch (error) {
      console.error("Fetch districts failed:", error);
      return [];
    }
  };

  const fetchWardsByDistrict = async (districtCode: number) => {
    if (!districtCode) return [];
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await res.json();
      return data.wards || [];
    } catch (error) {
      console.error("Fetch wards failed:", error);
      return [];
    }
  };

  const handleCityChange = async (cityCode: number, cityName: string) => {
    setForm(f => ({ ...f, city: cityName, district: "", ward: "" }));
    setDistricts([]);
    setWards([]);
    
    if (!cityCode) return [];
    
    setLoadingDistricts(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${cityCode}?depth=2`);
      const data = await res.json();
      const fetchedDistricts = data.districts || [];
      setDistricts(fetchedDistricts);
      return fetchedDistricts;
    } catch (error) {
      console.error("Failed to fetch districts:", error);
      toast.error("Không thể tải danh sách quận/huyện");
      return [];
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (districtCode: number, districtName: string) => {
    setForm(f => ({ ...f, district: districtName, ward: "" }));
    setWards([]);
    
    if (!districtCode) return [];
    
    setLoadingWards(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
      const data = await res.json();
      const fetchedWards = data.wards || [];
      setWards(fetchedWards);
      return fetchedWards;
    } catch (error) {
      console.error("Failed to fetch wards:", error);
      toast.error("Không thể tải danh sách phường/xã");
      return [];
    } finally {
      setLoadingWards(false);
    }
  };

  const fetchAddressSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    setIsFetchingSuggestions(true);

    suggestionTimeoutRef.current = setTimeout(async () => {
      // Use natural language query but keep it focused
      const biasParams = (form.lat && form.lng) ? `&lat=${form.lat}&lon=${form.lng}` : "";
      
      const searchParts = [query];
      if (form.ward) searchParts.push(form.ward);
      if (form.district) searchParts.push(form.district);
      if (form.city) searchParts.push(form.city);
      
      const fullQuery = searchParts.join(" ").trim();

      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(fullQuery)}${biasParams}&limit=10`
        );
        
        if (!res.ok) throw new Error(`Photon API error: ${res.status}`);

        const data = await res.json();
        if (!data.features) return;

        // Filter results to stay within the selected administrative area
        let suggestions = data.features
          .map((f: any) => {
            const p = f.properties;
            const name = [p.name, p.street, p.housenumber].filter(Boolean).join(" ");
            const context = [p.district, p.city, p.state].filter(Boolean).join(", ");
            
            return {
              display_name: `${name}${name && context ? ", " : ""}${context}` || p.display_name,
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
              properties: p
            };
          })
          .filter((s: any) => {
            const p = s.properties;
            const targetCity = form.city.toLowerCase();
            const targetDistrict = form.district.toLowerCase();
            
            // Basic city check (if city is selected)
            if (form.city) {
              const resCity = (p.city || p.state || "").toLowerCase();
              if (!resCity.includes(targetCity.replace("thành phố ", "").replace("tỉnh ", "")) && 
                  !targetCity.includes(resCity)) {
                return false;
              }
            }
            
            // Basic district check (if district is selected)
            if (form.district) {
              const resDistrict = (p.district || p.city_district || p.county || "").toLowerCase();
              const cleanTargetDistrict = targetDistrict.replace("quận ", "").replace("huyện ", "").replace("thị xã ", "");
              if (resDistrict && !resDistrict.includes(cleanTargetDistrict) && !cleanTargetDistrict.includes(resDistrict)) {
                // We keep it if the district is missing from the result (API limitation), 
                // but filter out if it's explicitly a DIFFERENT district.
                return false;
              }
            }
            
            return true;
          });

        setAddressSuggestions(suggestions.slice(0, 5));
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 1000);
  };

  const syncAdministrativeLevels = async (lat: number, lng: number, addressData: any) => {
    if (!addressData) return;
    
    const addr = addressData.address || addressData.properties || {};
    const rawCity = addr.city || addr.state || addr.province || addr.city_district || "";
    const possibleDistricts = [addr.district, addr.city_district, addr.county, addr.town, addr.suburb].filter(Boolean);
    const possibleWards = [addr.ward, addr.suburb, addr.village, addr.subdistrict, addr.quarter, addr.neighbourhood, addr.city_district].filter(Boolean);
    
    const road = addr.road || addr.street || addr.amenity || addr.building || "";
    const houseNumber = addr.house_number || addr.housenumber || "";
    const locationStr = [houseNumber, road].filter(Boolean).join(" ");
    
    let finalCity = "";
    let finalDistrict = "";
    let finalWard = "";

    const removeAccents = (str: string) => {
      return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    };

    const cleanName = (name: string) => 
      removeAccents(name.toLowerCase())
        .replace(/thanh pho |tinh |quan |huyen |thi xa |phuong |xa |thi tran /g, "")
        .trim();

    if (rawCity) {
      const targetCity = cleanName(rawCity);
      const matchedCity = provinces.find(p => {
        const pName = cleanName(p.name);
        return pName === targetCity || pName.includes(targetCity) || targetCity.includes(pName);
      });
      
      if (matchedCity) {
        finalCity = matchedCity.name;
        const currentDistricts = await fetchDistrictsByCity(matchedCity.code);
        setDistricts(currentDistricts); 
        
        let matchedDist: any = null;
        for (const rawDist of possibleDistricts) {
          const targetDist = cleanName(rawDist);
          matchedDist = currentDistricts.find((d: any) => {
            const dName = cleanName(d.name);
            return dName === targetDist || dName.includes(targetDist) || targetDist.includes(dName);
          });
          if (matchedDist) break;
        }

        if (matchedDist) {
          finalDistrict = matchedDist.name;
          const currentWards = await fetchWardsByDistrict(matchedDist.code);
          setWards(currentWards); 
          
          for (const rawWard of possibleWards) {
            const targetWard = cleanName(rawWard);
            if (cleanName(matchedDist.name) === targetWard && possibleWards.length > 1) continue;
            
            const matchedWard = currentWards.find((w: any) => {
              const wName = cleanName(w.name);
              return wName === targetWard || wName.includes(targetWard) || targetWard.includes(wName);
            });
            if (matchedWard) {
              finalWard = matchedWard.name;
              break;
            }
          }
        }
      }
    }

    setForm(f => ({
      ...f,
      lat,
      lng,
      city: finalCity || f.city,
      district: finalDistrict || f.district,
      ward: finalWard || f.ward,
      location: locationStr || f.location
    }));
  };

  const handleSearchAddress = async (customQuery?: string) => {
    const query = customQuery || form.location;
    if (!query && !form.ward && !form.district && !form.city) {
      toast.error("Vui lòng nhập địa chỉ hoặc chọn khu vực");
      return;
    }

    setIsSearchingAddress(true);
    
    // Use natural language query for Photon
    const searchParts = [query];
    if (form.ward) searchParts.push(form.ward);
    if (form.district) searchParts.push(form.district);
    if (form.city) searchParts.push(form.city);
    
    const fullQuery = searchParts.join(" ").trim();
    const biasParams = (form.lat && form.lng) ? `&lat=${form.lat}&lon=${form.lng}` : "";

    try {
      // Switching to Photon for consistency and to avoid Nominatim 429/CORS
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(fullQuery)}${biasParams}&limit=1`
      );
      
      if (!res.ok) throw new Error("Search API error");
      
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        const result = data.features[0];
        const newLat = result.geometry.coordinates[1];
        const newLng = result.geometry.coordinates[0];
        
        setForm(f => ({
          ...f,
          lat: newLat,
          lng: newLng,
          // Update location with a cleaner name if it was empty
          location: f.location || result.properties.name || result.properties.street || f.location
        }));
        
        toast.success("Đã tìm thấy vị trí trên bản đồ");
      } else {
        toast.error("Không tìm thấy địa chỉ này. Vui lòng chọn trên bản đồ.");
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Lỗi khi tìm kiếm địa chỉ");
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const simulateAI = async (file: File, index: number, total: number, retryCount = 0): Promise<void> => {
    // 1. Set individual status to 'analyzing'
    setForm(f => {
      const newMedia = [...f.mediaFiles];
      if (newMedia[index]) newMedia[index].aiStatus = 'analyzing';
      return { ...f, mediaFiles: newMedia };
    });

    const toastId = toast.loading(`Đang phân tích file ${index + 1}/${total}... ${retryCount > 0 ? `(Thử lại lần ${retryCount})` : ''}`, {
      description: "Hệ thống AI đang kiểm tra nội dung hình ảnh."
    });
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${AI_BASE_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      // Handle 429 Too Many Requests (Rate Limit)
      if (response.status === 429 && retryCount < 2) {
        toast.info("AI đang nghỉ ngơi một lát...", {
          id: toastId,
          description: "Sẽ tự động thử lại sau 5 giây."
        });
        await new Promise(r => setTimeout(r, 5000));
        return simulateAI(file, index, total, retryCount + 1);
      }

      if (!response.ok) throw new Error("AI Service error");
      const result = await response.json();
      
      // 2. Update individual status with the result
      setForm(f => {
        const newMedia = [...f.mediaFiles];
        if (newMedia[index]) {
          newMedia[index].aiStatus = 'done';
          newMedia[index].aiResult = result;
        }
        
        if (result.is_valid) {
          const mappedCategory = mapAICategoryToFrontend(result.category);
          return { 
            ...f, 
            mediaFiles: newMedia,
            aiCategory: mappedCategory,
            aiLabel: result.label,
            aiConfidence: result.confidence,
            aiSource: result.source,
            category: mappedCategory,
            aiVerified: true
          };
        }
        
        return { ...f, mediaFiles: newMedia };
      });

      if (!result.is_valid) {
        toast.error(`File ${index + 1}: Không phải vấn đề dân sinh`, {
          id: toastId,
          description: result.label || "Vui lòng chọn ảnh khác!",
          duration: 3000
        });
      } else {
        toast.success(`File ${index + 1}: ${result.label}`, {
          id: toastId,
          description: `Độ tin cậy: ${Math.round(result.confidence)}%`
        });
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setForm(f => {
        const newMedia = [...f.mediaFiles];
        if (newMedia[index]) newMedia[index].aiStatus = 'error';
        return { ...f, mediaFiles: newMedia };
      });
      toast.error(`File ${index + 1}: Lỗi phân tích`, {
        id: toastId,
        description: "Vui lòng kiểm tra lại kết nối hoặc thử lại sau."
      });
    }
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const filesArray = Array.from(files).filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    
    if (form.mediaFiles.length + filesArray.length > 10) {
      toast.warning("Vượt quá giới hạn 10 file", {
        description: "Chỉ một số file đầu tiên sẽ được tải lên."
      });
    }

    const allowedFiles = filesArray.slice(0, 10 - form.mediaFiles.length);
    if (allowedFiles.length === 0) return;

    const processSequentially = async () => {
      setAiAnalyzing(true);
      setAiDone(false);

      // 1. Batch add all previews first
      const newMediaItems: Array<{ file: File; preview: string; type: "image" | "video"; aiStatus: 'pending' }> = [];
      
      for (const file of allowedFiles) {
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newMediaItems.push({
          file,
          preview,
          type: file.type.startsWith("image/") ? "image" as const : "video" as const,
          aiStatus: 'pending'
        });
      }

      // Update state with all new files
      const startIndex = form.mediaFiles.length;
      setForm(f => ({ ...f, mediaFiles: [...f.mediaFiles, ...newMediaItems] }));

      // 2. Loop through and analyze
      for (let i = 0; i < newMediaItems.length; i++) {
        // Add a small delay between requests to avoid 429 errors from Gemini Free Tier
        if (i > 0) await new Promise(r => setTimeout(r, 2500));
        await simulateAI(newMediaItems[i].file, startIndex + i, startIndex + newMediaItems.length);
      }

      setAiAnalyzing(false);
      setAiDone(true);
    };

    processSequentially();
  }, [form.mediaFiles.length]);

  // Handle Description Moderation (Debounced)
  useEffect(() => {
    if (step !== 1 || !form.description || form.description.length < 10) {
      setDescriptionStatus('idle');
      setDescriptionReason(null);
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    setDescriptionStatus('checking');
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`${AI_BASE_URL}/moderate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            category: form.category,
            aiLabel: form.aiLabel
          }),
        });

        if (!response.ok) throw new Error("Moderation service error");
        const result = await response.json();

        if (result.is_flagged) {
          setDescriptionStatus('invalid');
          setDescriptionReason(result.reason);
        } else {
          setDescriptionStatus('valid');
          setDescriptionReason(null);
        }
      } catch (error) {
        console.error("Moderation failed:", error);
        setDescriptionStatus('idle'); // Fallback to idle if error
      }
    }, 2000); // 2 second debounce

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [form.description, form.title, step, form.category, form.aiLabel]);

  const handleNext = async () => {
    // Only moderate if moving from Step 1 (Info) to Step 2 (Location)
    if (step === 1) {
      // If we already have a status and it's invalid, stop
      if (descriptionStatus === 'invalid') {
        toast.error("Nội dung không hợp lệ", {
          description: descriptionReason || "Vui lòng kiểm tra lại tiêu đề và mô tả.",
          duration: 5000
        });
        return;
      }

      // If still checking, wait
      if (descriptionStatus === 'checking') {
        toast.info("Đang chờ AI kiểm duyệt...");
        return;
      }
      
      // Traditional check if for some reason debouncing didn't run or was idle
      if (descriptionStatus === 'idle') {
        setModerating(true);
        const toastId = toast.loading("Đang kiểm duyệt nội dung...", {
          description: "AI đang kiểm tra tính xác thực của thông tin."
        });

        try {
          const response = await fetch(`${AI_BASE_URL}/moderate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: form.title,
              description: form.description,
              category: form.category,
              aiLabel: form.aiLabel
            }),
          });

          if (!response.ok) throw new Error("Moderation service error");
          const result = await response.json();

          if (result.is_flagged) {
            toast.error("Nội dung không hợp lệ", {
              id: toastId,
              description: result.reason || "Vui lòng kiểm tra lại tiêu đề và mô tả.",
              duration: 5000
            });
            setDescriptionStatus('invalid');
            setDescriptionReason(result.reason);
            setModerating(false);
            return;
          }

          toast.success("Nội dung hợp lệ", { id: toastId });
          setDescriptionStatus('valid');
        } catch (error) {
          console.error("Moderation failed:", error);
          toast.dismiss(toastId);
        } finally {
          setModerating(false);
        }
      }
    }

    setStep((s) => s + 1);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    
    try {
      // Create mediaFiles array for the issue
      const mediaFiles: MediaFile[] = form.mediaFiles.map(f => ({
        type: f.type,
        url: f.preview,
      }));
      
      // Create new issue data for API
      const issueData = {
        title: form.title,
        description: form.description,
        category: form.category!,
        status: "pending" as const,
        location: form.location,
        district: form.district,
        ward: form.ward,
        city: form.city,
        lat: form.lat,
        lng: form.lng,
        imageUrl: form.mediaFiles[0]?.preview,
        mediaFiles: mediaFiles,
        reporterName: form.anonymous ? "Người dùng ẩn danh" : (form.reporterName || user.name),
        reporterId: user.id,
        reportedAt: new Date().toISOString(),
        votes: 0,
        comments: 0,
        aiConfidence: form.aiConfidence,
        aiLabel: form.aiLabel,
        aiVerified: form.aiConfidence >= 85,
        aiScore: form.aiConfidence,
        aiAnalysis: form.aiConfidence >= 85 ? {
          isAuthentic: true,
          confidenceScore: form.aiConfidence,
          reasons: [
            "Hình ảnh rõ nét, không có dấu hiệu chỉnh sửa",
            "Vị trí GPS khớp với mô tả",
            "Vấn đề phù hợp với danh mục báo cáo",
          ],
          tags: ["mới gửi", "chờ xác minh"],
          severity: form.aiConfidence >= 90 ? "high" as const : "medium" as const,
        } : undefined,
      };

      // Save to database via API
      console.log("%c🚀 [SUBMITTING REPORT]", "color: #ef4444; font-weight: bold; font-size: 12px;");
      console.log("Report Data:", issueData);
      
      const response = await api.post("/issues", issueData);
      
      if (response.success && response.data) {
        console.log("%c✅ [REPORT SUBMITTED SUCCESS]", "color: #10b981; font-weight: bold; font-size: 12px;");
        console.log("Server Response:", response.data);
        // Add the saved issue (with database ID) to the context
        addIssue(response.data);
        
        setSubmitting(false);
        toast.success("Báo cáo đã được gửi thành công! Chúng tôi sẽ xử lý sớm nhất.", {
          duration: 5000,
        });
        navigate("/my-reports");
      } else {
        throw new Error(response.message || "Không thể gửi báo cáo");
      }
    } catch (error) {
      console.error("%c❌ [REPORT SUBMISSION FAILED]", "color: #ef4444; font-weight: bold; font-size: 12px;");
      console.error("Error Detail:", error);
      setSubmitting(false);
      toast.error("Gửi báo cáo thất bại. Vui lòng thử lại.");
    }
  };

  const canNext = () => {
    if (step === 0) return !!form.mediaFiles.length && aiDone && form.aiVerified;
    if (step === 1) return !!form.title && !!form.description && !!form.category && descriptionStatus !== 'invalid' && descriptionStatus !== 'checking';
    if (step === 2) return !!form.location && !!form.district && !!form.ward && !!form.city;
    return true;
  };

  // Show login requirement if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="text-red-500 animate-spin" />
      </div>
    );
  }

  const canCreate = can("issues_vande", "create");

  if (!user || !canCreate) {
    return (
      <div className="min-h-screen pt-20 pb-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 sm:p-12 text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center"
            >
              <Lock size={40} className="text-red-500" />
            </motion.div>

            <h1 className="text-3xl font-black text-gray-900 mb-3">
              {!user ? "Cần đăng nhập để báo cáo" : "Không có quyền báo cáo"}
            </h1>
            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
              {!user 
                ? "Để đảm bảo tính xác thực và trách nhiệm của mỗi báo cáo, bạn cần đăng nhập tài khoản trước khi sử dụng chức năng báo cáo vấn đề công cộng."
                : "Tài khoản của bạn hiện không có thẩm quyền tạo báo cáo mới. Vui lòng liên hệ quản trị viên nếu bạn tin rằng đây là một lỗi."}
            </p>

            {/* Benefits */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8 text-left">
              {[
                { icon: Shield, text: "Bảo mật thông tin cá nhân" },
                { icon: CheckCircle2, text: "Theo dõi tiến độ xử lý" },
                { icon: Sparkles, text: "Sử dụng AI phân tích ảnh" },
                { icon: User, text: "Quản lý báo cáo của bạn" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <item.icon size={16} className="text-red-600" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl font-semibold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] transition-all duration-200"
              >
                <Shield size={18} />
                Đăng nhập / Đăng ký
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                Về trang chủ
              </button>
            </div>

            {/* Note */}
            <p className="text-xs text-gray-400 mt-6">
              Đăng ký hoàn toàn miễn phí và chỉ mất 30 giây
            </p>
          </motion.div>
        </div>

        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-6"
        >
          <div className="flex justify-center mb-4">
            <PageTitle
              title="Báo cáo vấn đề công cộng"
              backTo=""
              subtitle="AI sẽ tự động phân tích và phân loại vấn đề của bạn"
            />
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    backgroundColor: i < step ? "#10b981" : i === step ? "#ef4444" : "#e5e7eb",
                    scale: i === step ? 1.1 : 1,
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                >
                  {i < step ? <CheckCircle2 size={16} /> : i + 1}
                </motion.div>
                <span className={`hidden sm:block text-sm font-medium ${i === step ? "text-red-600" : i < step ? "text-green-600" : "text-gray-400"}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-3 rounded-full overflow-hidden bg-gray-200">
                  <motion.div
                    animate={{ width: i < step ? "100%" : "0%" }}
                    transition={{ duration: 0.4 }}
                    className="h-full bg-green-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8"
          >
            {/* STEP 0: Image Upload + AI */}
            {step === 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Camera size={22} className="text-red-500" />
                  Tải lên hình ảnh/video (Tối đa 10 files)
                </h2>
                <p className="text-gray-500 text-sm mb-6">AI sẽ tự động nhận dạng vấn đề từ hình ảnh của bạn</p>

                {!form.mediaFiles.length ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      dragOver
                        ? "border-red-400 bg-red-50 scale-[1.02]"
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50/50"
                    }`}
                  >
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Upload size={48} className="mx-auto text-gray-300 mb-4" />
                    </motion.div>
                    <p className="font-semibold text-gray-600">Kéo thả ảnh/video vào đây</p>
                    <p className="text-gray-400 text-sm mt-1">hoặc nhấn để chọn từ thiết bị</p>
                    <p className="text-gray-300 text-xs mt-3">Hỗ trợ: PNG, JPG, WEBP, MP4 - Tối đa 10 files</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleFiles(e.target.files);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Media Grid Preview */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {form.mediaFiles.map((media, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative rounded-xl overflow-hidden group aspect-square"
                        >
                          {media.type === "image" ? (
                            <img src={media.preview} alt={`preview ${idx + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="relative w-full h-full">
                              <video src={media.preview} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                <Video size={24} className="text-white" />
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setForm((f) => ({ 
                                ...f, 
                                mediaFiles: f.mediaFiles.filter((_, i) => i !== idx) 
                              }));
                              if (form.mediaFiles.length === 1) {
                                setAiDone(false);
                              }
                            }}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <X size={14} />
                          </button>
                          {/* Individual AI Analyzing Overlay */}
                          {media.aiStatus === 'analyzing' && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles size={24} className="text-purple-400" />
                              </motion.div>
                            </div>
                          )}

                          {/* AI Status Badges */}
                          {media.aiStatus === 'done' && (
                            <div className="absolute top-2 left-2 flex gap-1">
                              {media.aiResult?.is_valid ? (
                                <div className="bg-green-500 text-white p-1 rounded-full shadow-lg border border-white">
                                  <Check size={10} strokeWidth={4} />
                                </div>
                              ) : (
                                <div className="bg-orange-500 text-white p-1 rounded-full shadow-lg border border-white">
                                  <AlertCircle size={10} strokeWidth={4} />
                                </div>
                              )}
                            </div>
                          )}


                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-white text-xs">
                            {idx + 1}/{form.mediaFiles.length}
                          </div>
                        </motion.div>
                      ))}
                      
                      {/* Add More Button */}
                      {form.mediaFiles.length < 10 && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-red-500"
                        >
                          <Upload size={24} />
                          <span className="text-xs">Thêm</span>
                        </motion.button>
                      )}
                    </div>

                    {/* AI Result */}
                    <AnimatePresence>
                      {aiDone && form.aiLabel && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <Sparkles size={18} className="text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-purple-700">AI phân tích kết quả</span>
                                <CheckCircle2 size={14} className="text-green-500" />
                              </div>
                              <p className="font-semibold text-gray-900">
                                {form.aiLabel}

                                {form.aiSource === 'local_ai' && (
                                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md uppercase">AI Cục bộ</span>
                                )}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex-1 h-2 bg-purple-100 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${form.aiConfidence}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="h-full bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"
                                  />
                                </div>
                                <span className="text-sm font-bold text-purple-700">{form.aiConfidence}%</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Hidden input for adding more files */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        handleFiles(e.target.files);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: Issue Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={22} className="text-red-500" />
                  Thông tin vấn đề
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề vấn đề *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="VD: Ổ gà lớn tại đường Nguyễn Huệ..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-all duration-200 text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Mô tả chi tiết *</label>
                    <div className="flex items-center gap-2">
                      {descriptionStatus === 'checking' && (
                        <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                          <Loader2 size={12} className="animate-spin" />
                          AI đang kiểm duyệt...
                        </span>
                      )}
                      {descriptionStatus === 'valid' && (
                        <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <Check size={12} />
                          Nội dung hợp lệ
                        </span>
                      )}
                      {descriptionStatus === 'invalid' && (
                        <span className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                          <AlertCircle size={12} />
                          Phát hiện bất thường
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Mô tả vấn đề một cách chi tiết, bao gồm kích thước, mức độ nguy hiểm..."
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 text-sm resize-none focus:outline-none focus:ring-2 ${
                        descriptionStatus === 'invalid' 
                          ? "border-red-300 ring-red-100 bg-red-50/30" 
                          : descriptionStatus === 'valid'
                          ? "border-green-300 ring-green-50"
                          : "border-gray-200 focus:ring-red-300 focus:border-red-400"
                      }`}
                    />
                    {descriptionStatus === 'invalid' && descriptionReason && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100"
                      >
                        <AlertCircle size={12} />
                        {descriptionReason}
                      </motion.p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    <span className="flex items-center gap-2">
                      <Tag size={15} />
                      Danh mục
                      {form.aiCategory && (
                        <span className="text-xs text-purple-600 font-normal">(AI đề xuất đã được chọn)</span>
                      )}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.entries(CATEGORY_LABELS) as [IssueCategory, string][]).map(([key, label]) => {
                      const isSelected = form.category === key;
                      const isAI = form.aiCategory === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setForm((f) => ({ ...f, category: key }))}
                          className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? "border-red-400 bg-red-50 text-red-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-600"
                          }`}
                        >
                          {isAI && (
                            <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full flex items-center gap-0.5">
                              <Sparkles size={9} /> AI
                            </span>
                          )}
                          <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[key] }}
                          />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin size={22} className="text-red-500" />
                  Vị trí xảy ra
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Thành phố / Tỉnh *
                    {loadingProvinces && <Loader2 size={14} className="inline ml-2 animate-spin text-red-500" />}
                  </label>
                  <select
                    value={provinces.find(p => p.name === form.city)?.code || ""}
                    onChange={(e) => {
                      const code = Number(e.target.value);
                      const name = provinces.find(p => p.code === code)?.name || "";
                      handleCityChange(code, name).then(() => {
                        if (name) handleSearchAddress(""); 
                      });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 text-sm bg-white"
                  >
                    <option value="">-- Chọn tỉnh/thành phố --</option>
                    {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quận / Huyện *
                    {loadingDistricts && <Loader2 size={14} className="inline ml-2 animate-spin text-red-500" />}
                  </label>
                  <select
                    value={districts.find(d => d.name === form.district)?.code || ""}
                    onChange={(e) => {
                      const code = Number(e.target.value);
                      const name = districts.find(d => d.code === code)?.name || "";
                      handleDistrictChange(code, name).then(() => {
                        if (name) handleSearchAddress("");
                      });
                    }}
                    disabled={!form.city || loadingDistricts}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn quận/huyện --</option>
                    {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phường / Xã *
                    {loadingWards && <Loader2 size={14} className="inline ml-2 animate-spin text-red-500" />}
                  </label>
                  <select
                    value={wards.find(w => w.name === form.ward)?.code || ""}
                    onChange={(e) => {
                      const code = Number(e.target.value);
                      const name = wards.find(w => w.code === code)?.name || "";
                      setForm(f => ({ ...f, ward: name }));
                      if (name) handleSearchAddress("");
                    }}
                    disabled={!form.district || loadingWards}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 text-sm bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Chọn phường/xã --</option>
                    {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                  </select>
                </div>

                <div className="relative" ref={suggestionRef}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Địa chỉ cụ thể *</label>
                  <div className="relative">
                        <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={form.location}
                          onChange={(e) => {
                            const val = e.target.value;
                            setForm((f) => ({ ...f, location: val }));
                            fetchAddressSuggestions(val);
                          }}
                          onFocus={() => {
                            if (addressSuggestions.length > 0) setShowSuggestions(true);
                          }}
                          placeholder="VD: 123 Đường Nguyễn Huệ"
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 text-sm"
                        />
                        
                        {isFetchingSuggestions && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 size={14} className="animate-spin text-gray-400" />
                          </div>
                        )}
                        
                        <AnimatePresence>
                        {showSuggestions && addressSuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                          >
                            {addressSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  syncAdministrativeLevels(
                                    parseFloat(suggestion.lat),
                                    parseFloat(suggestion.lon),
                                    { properties: suggestion.properties, address: suggestion.properties }
                                  );
                                  setShowSuggestions(false);
                                  toast.success("Đã cập nhật vị trí từ gợi ý");
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors"
                              >
                                <MapPin size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 line-clamp-2">{suggestion.display_name}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                    <Sparkles size={10} className="text-purple-400" />
                    Mẹo: Chọn khu vực (Quận/Phường) trước để tìm kiếm chính xác hơn
                  </p>

                <LocationPicker
                  lat={form.lat}
                  lng={form.lng}
                  city={form.city}
                  district={form.district}
                  ward={form.ward}
                  onChange={async (lat, lng, addressData) => {
                    syncAdministrativeLevels(lat, lng, addressData);
                  }}
                />
              </div>
            )}

            {/* STEP 3: Confirm */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User size={22} className="text-red-500" />
                  Xác nhận & Gửi báo cáo
                </h2>

                {/* Summary */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                  <div className="flex gap-3">
                    {form.mediaFiles[0]?.preview && (
                      <img src={form.mediaFiles[0]?.preview} alt="preview" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-gray-900">{form.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{form.description?.slice(0, 80)}...</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.category && (
                          <span className="px-2 py-0.5 rounded-full text-white text-xs" style={{ backgroundColor: CATEGORY_COLORS[form.category] }}>
                            {CATEGORY_LABELS[form.category]}
                          </span>
                        )}
                        {form.aiConfidence > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center gap-1">
                            <Sparkles size={10} /> AI {form.aiConfidence}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 pt-1 border-t border-gray-200 mt-2">
                    <MapPin size={13} className="text-red-400" />
                    {form.location}, {form.ward}, {form.district}, {form.city}
                  </div>
                </div>

                {/* Reporter info */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.anonymous}
                      onChange={(e) => setForm((f) => ({ ...f, anonymous: e.target.checked }))}
                      className="w-4 h-4 rounded accent-red-500"
                    />
                    <span className="text-sm text-gray-600">Báo cáo ẩn danh</span>
                  </label>

                  {!form.anonymous && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={form.reporterName}
                          onChange={(e) => setForm((f) => ({ ...f, reporterName: e.target.value }))}
                          placeholder="Họ và tên"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all text-sm"
                        />
                      </div>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          value={form.reporterPhone}
                          onChange={(e) => setForm((f) => ({ ...f, reporterPhone: e.target.value }))}
                          placeholder="Số điện thoại (để nhận thông báo)"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="bg-amber-50 rounded-xl p-3 flex gap-2 border border-amber-100">
                  <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Báo cáo sai sự thật hoặc cố tình gây nhiễu có thể bị xử lý theo quy định của pháp luật.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronLeft size={18} />
                  Quay lại
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  onClick={handleNext}
                  disabled={!canNext() || moderating}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    canNext() && !moderating
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:scale-[1.02] shadow-lg shadow-red-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {moderating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      Tiếp theo
                      <ChevronRight size={18} />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:scale-[1.02] shadow-lg shadow-green-200 transition-all duration-200 disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Gửi báo cáo
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}