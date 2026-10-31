'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { AdminRevenueView } from '@/components/admin/AdminRevenueView';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { AdminOrdersView } from '@/components/admin/AdminOrdersView';
import { AdminProductsView } from '@/components/admin/AdminProductsView';
import { AdminStockView } from '@/components/admin/AdminStockView';
import { AdminWarrantyView } from '@/components/admin/AdminWarrantyView';
import { AdminCouponsView } from '@/components/admin/AdminCouponsView';
import { AdminSettingsView } from '@/components/admin/AdminSettingsView';

export default function AdminPage() {
  const router = useRouter();
  const { user, token, setAuthSession, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [isDirectAdmin, setIsDirectAdmin] = useState(false);
  const [hasSecret, setHasSecret] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Xác thực quyền Admin tuyệt đối qua Server (không tin cậy LocalStorage)
  useEffect(() => {
    let isCancelled = false;

    const checkAdminAccess = async () => {
      try {
        const rawToken = localStorage.getItem('dtff_auth_token') || localStorage.getItem('admin_token');
        const params = new URLSearchParams(window.location.search);
        const secret = params.get('secret') || params.get('key');

        let unlocked = false;
        if (secret === 'dtff2026') {
          sessionStorage.setItem('dtff_adm_gate', 'unlocked');
          unlocked = true;
        } else if (sessionStorage.getItem('dtff_adm_gate') === 'unlocked') {
          unlocked = true;
        }
        setHasSecret(unlocked);

        // Nếu không có token -> Chắc chắn không có quyền Admin
        if (!rawToken) {
          setIsDirectAdmin(false);
          setVerifying(false);
          setMounted(true);
          return;
        }

        // BẮT BUỘC Server xác thực token này với API /admin/bootstrap
        // Trình duyệt KHÔNG BAO GIỜ tin tưởng dtff_auth_user ở LocalStorage!
        const res = await fetch(`${API_BASE_URL}/admin/bootstrap`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${rawToken}`,
          },
        });

        if (isCancelled) return;

        if (res.ok) {
          const j = await res.json();
          if (j?.success && j.data) {
            if (j.data.dashboard) setDashboardData(j.data.dashboard);
            if (j.data.categories) setCategories(j.data.categories);
            if (j.data.products) setProducts(j.data.products);
            if (j.data.orders) setOrders(j.data.orders);
            if (j.data.revenue) setRevenueData(j.data.revenue);
            if (j.data.settings) setSettingsData(j.data.settings);
            if (j.data.warranty) setClaims(j.data.warranty);
            if (j.data.coupons) setCoupons(j.data.coupons);
            setIsDirectAdmin(true);
          } else {
            setIsDirectAdmin(false);
          }
        } else {
          // Token giả mạo hoặc user thường không có quyền admin (401 / 403)
          localStorage.removeItem('dtff_auth_token');
          localStorage.removeItem('dtff_auth_user');
          localStorage.removeItem('admin_token');
          setIsDirectAdmin(false);
        }
      } catch {
        setIsDirectAdmin(false);
      } finally {
        if (!isCancelled) {
          setVerifying(false);
          setMounted(true);
        }
      }
    };

    checkAdminAccess();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Token hoạt động hiện tại
  const activeToken = useMemo(() => {
    if (token) return token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dtff_auth_token') || localStorage.getItem('admin_token');
    }
    return null;
  }, [token]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<'dashboard' | 'revenue' | 'products' | 'stock' | 'orders' | 'warranty' | 'settings' | 'coupons'>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);

  // Modal Thêm / Sửa Mã Giảm Giá
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isEditingCoupon, setIsEditingCoupon] = useState(false);
  const [targetCouponId, setTargetCouponId] = useState<number | null>(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: 10,
    max_discount_amount: 50000,
    min_order_amount: 10000,
    usage_limit: 100,
    expires_at: '',
    is_active: true,
  });
  const [submittingCoupon, setSubmittingCoupon] = useState(false);
  const [couponModalError, setCouponModalError] = useState<string | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategoryTab, setSelectedProductCategoryTab] = useState<string>('all');
  const [valorantSubFilter, setValorantSubFilter] = useState<'all' | 'normal' | 'off'>('all');
  const [splitValorantTypes, setSplitValorantTypes] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'completed' | 'pending' | 'timeout'>('all');

  // Modal Thêm / Sửa Sản Phẩm
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [targetProductId, setTargetProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: 1,
    account_type: '',
    price: 10000,
    warranty_hours: 2,
    is_off_mode: false,
    is_active: true,
    short_description: '',
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [productModalError, setProductModalError] = useState<string | null>(null);

  // Modal & Drawer Thêm / Sửa / Quản Lý Danh Mục
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '🎯',
    sort_order: 0,
    is_active: true,
  });
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // State cấu hình cửa hàng
  const [settingsData, setSettingsData] = useState({
    store_name: 'Tạp Hóa 247',
    store_slogan: 'Shop Dịch Vụ Số & Acc Game Tự Động 24/7 Uy Tín #1',
    store_hotline: '0937809305',
    store_telegram: 'https://t.me/taphoa247_support',
    store_facebook: 'https://facebook.com/taphoa247',
    banner_active: false,
    banner_text: 'Ưu đãi đặc biệt: Tặng bảo hiểm tài khoản 5 tiếng cho toàn bộ đơn hàng hôm nay!',
    banner_gift_code: 'TAPHOA247',
    banner_gift_discount_text: 'Giảm 10% đơn hàng',
    store_real_hearts: 0,
    store_maintenance_mode: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaveMsg, setSettingsSaveMsg] = useState<string | null>(null);

  // State nạp kho
  const [importProductId, setImportProductId] = useState<number>(1);
  const [importText, setImportText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // State sửa giá nhanh
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);



  // Đăng nhập quản trị viên
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success && json.data.token) {
        if (json.data.user.role !== 'admin' && !json.data.user.is_admin) {
          setLoginError('Tò mò cái đéo gì cu em ? hacker lỏ à ?');
          return;
        }
        setAuthSession(json.data.token, json.data.user);
        setIsDirectAdmin(true);
        setEmail('');
        setPassword('');
        loadData(json.data.token);
      } else {
        setLoginError(json.message || 'Email hoặc mật khẩu không chính xác.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoggingIn(false);
    }
  };

  const authHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    Authorization: `Bearer ${activeToken || ''}`,
  }), [activeToken]);

  const loadData = (tokenOverride?: string | unknown) => {
    const t = typeof tokenOverride === 'string' ? tokenOverride : activeToken;
    if (!t) return;

    const checkStatus = (res: Response) => {
      if (res.status === 401 || res.status === 403) {
        logout();
        setIsDirectAdmin(false);
        throw new Error('404 not found 404');
      }
      return res.json();
    };

    fetch(`${API_BASE_URL}/admin/bootstrap`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization: `Bearer ${t}`,
      },
    })
      .then(checkStatus)
      .then((j) => {
        if (j?.success && j.data) {
          if (j.data.dashboard) setDashboardData(j.data.dashboard);
          if (j.data.categories) setCategories(j.data.categories);
          if (j.data.products) setProducts(j.data.products);
          if (j.data.orders) setOrders(j.data.orders);
          if (j.data.revenue) setRevenueData(j.data.revenue);
          if (j.data.settings) setSettingsData(j.data.settings);
          if (j.data.warranty) setClaims(j.data.warranty);
          if (j.data.coupons) setCoupons(j.data.coupons);
        }
      })
      .catch(() => { });
  };

  // ─── CRUD MÃ GIẢM GIÁ (COUPONS) ───
  const handleOpenCreateCouponModal = () => {
    setIsEditingCoupon(false);
    setTargetCouponId(null);
    setCouponForm({
      code: '',
      description: '',
      discount_type: 'percent',
      discount_value: 10,
      max_discount_amount: 50000,
      min_order_amount: 10000,
      usage_limit: 100,
      expires_at: '',
      is_active: true,
    });
    setCouponModalError(null);
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCouponModal = (c: any) => {
    setIsEditingCoupon(true);
    setTargetCouponId(c.id);
    setCouponForm({
      code: c.code,
      description: c.description || '',
      discount_type: c.discount_type || 'percent',
      discount_value: c.discount_value,
      max_discount_amount: c.max_discount_amount || 0,
      min_order_amount: c.min_order_amount || 0,
      usage_limit: c.usage_limit || 0,
      expires_at: c.expires_at ? c.expires_at.substring(0, 10) : '',
      is_active: Boolean(c.is_active),
    });
    setCouponModalError(null);
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      setCouponModalError('Vui lòng nhập mã giảm giá');
      return;
    }
    setSubmittingCoupon(true);
    setCouponModalError(null);
    try {
      const url = isEditingCoupon
        ? `${API_BASE_URL}/admin/coupons/${targetCouponId}`
        : `${API_BASE_URL}/admin/coupons`;
      const method = isEditingCoupon ? 'PUT' : 'POST';

      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description,
        discount_type: couponForm.discount_type,
        discount_value: Number(couponForm.discount_value),
        max_discount_amount:
          couponForm.discount_type === 'percent' && Number(couponForm.max_discount_amount) > 0
            ? Number(couponForm.max_discount_amount)
            : null,
        min_order_amount: Number(couponForm.min_order_amount) || 0,
        usage_limit: Number(couponForm.usage_limit) > 0 ? Number(couponForm.usage_limit) : null,
        expires_at: couponForm.expires_at ? `${couponForm.expires_at} 23:59:59` : null,
        is_active: couponForm.is_active,
      };

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setIsCouponModalOpen(false);
        loadData();
      } else {
        setCouponModalError(json.message || 'Lỗi khi lưu mã giảm giá');
      }
    } catch (err: any) {
      setCouponModalError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setSubmittingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: number, code: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã giảm giá "${code}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      if (json.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleCoupon = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/coupons/${id}/toggle`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      const json = await res.json();
      if (json.success) {
        setCoupons((prev) =>
          prev.map((c) => (c.id === id ? { ...c, is_active: !c.is_active } : c))
        );
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSaveMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(settingsData),
      });
      const json = await res.json();
      if (json.success) {
        setSettingsSaveMsg('✓ ĐÃ LƯU CẤU HÌNH CỬA HÀNG THÀNH CÔNG VÀO HỆ THỐNG!');
        if (json.data) {
          setSettingsData(json.data);
          if (typeof window !== 'undefined') {
            try {
              const cleanData = { ...json.data };
              delete cleanData.banner_gift_code;
              delete cleanData.banner_gift_coupon;
              delete cleanData.banner_gift_discount_text;
              delete cleanData.banner_text;
              localStorage.setItem('dtff_settings_data', JSON.stringify(cleanData));
              localStorage.setItem('dtff_settings_sync', Date.now().toString());
            } catch {}
            window.dispatchEvent(new CustomEvent('dtff_settings_updated', { detail: json.data }));
          }
        }
      } else {
        alert(json.message || 'Lỗi lưu cấu hình.');
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (!isDirectAdmin || !activeToken) return;
    loadData();

    // 1. Tự động cập nhật bảng thống kê, đơn hàng & bảo hành mỗi 20 giây
    const interval = setInterval(() => {
      loadData();
    }, 20000);

    // 2. Tự động đồng bộ ngay khi Admin bấm quay lại tab làm việc
    const onFocus = () => loadData();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isDirectAdmin, activeToken]);

  // Cập nhật giá nhanh
  const handleSavePrice = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}/price`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ price: newPrice }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setEditingPriceId(null);
        loadData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Mở modal thêm sản phẩm mới
  const openCreateProductModal = (preselectedCatId?: any, preselectedOffMode?: boolean) => {
    setIsEditingMode(false);
    setTargetProductId(null);
    const validCatId = typeof preselectedCatId === 'number' ? preselectedCatId : (categories[0]?.id || 1);
    const isOff = typeof preselectedOffMode === 'boolean' ? preselectedOffMode : false;
    setProductForm({
      name: '',
      category_id: validCatId,
      account_type: '',
      price: 10000,
      warranty_hours: isOff ? 5 : 2,
      is_off_mode: isOff,
      is_active: true,
      short_description: '',
    });
    setProductModalError(null);
    setIsProductModalOpen(true);
  };

  // Mở modal sửa chi tiết sản phẩm
  const openEditProductModal = (p: any) => {
    setIsEditingMode(true);
    setTargetProductId(p.id);
    setProductForm({
      name: p.name,
      category_id: p.category_id || p.category?.id || 1,
      account_type: p.account_type,
      price: p.price,
      warranty_hours: p.warranty_hours ?? 2,
      is_off_mode: Boolean(p.is_off_mode),
      is_active: p.is_active !== false,
      short_description: p.short_description || '',
    });
    setProductModalError(null);
    setIsProductModalOpen(true);
  };

  // Submit thêm hoặc sửa sản phẩm
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduct(true);
    setProductModalError(null);
    try {
      const url = isEditingMode
        ? `${API_BASE_URL}/admin/products/${targetProductId}`
        : `${API_BASE_URL}/admin/products`;
      const method = isEditingMode ? 'PUT' : 'POST';

      // Chuẩn hóa dữ liệu chặt chẽ tránh circular object
      const payload = {
        name: String(productForm.name || '').trim(),
        category_id: Number(productForm.category_id) || categories[0]?.id || 1,
        account_type: String(productForm.account_type || '').trim(),
        price: Number(productForm.price) || 0,
        warranty_hours: Number(productForm.warranty_hours) || 2,
        is_off_mode: Boolean(productForm.is_off_mode),
        is_active: Boolean(productForm.is_active),
        short_description: String(productForm.short_description || '').trim(),
      };

      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setIsProductModalOpen(false);
        loadData();
      } else {
        setProductModalError(json.message || 'Lỗi lưu thông tin sản phẩm.');
      }
    } catch (err: any) {
      setProductModalError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Xóa sản phẩm
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa hoặc ngưng bán sản phẩm "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      alert(json.message || 'Đã xử lý xóa sản phẩm.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối máy chủ.');
    }
  };

  // Đổi giá nhanh sản phẩm
  const handleQuickPriceUpdate = async (id: number, newPrice: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}/price`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ price: newPrice }),
      });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert(json.message || 'Lỗi cập nhật giá.');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi kết nối máy chủ.');
    }
  };

  // Bật/tắt trạng thái bán của sản phẩm
  const handleToggleActive = async (id: number, currentState: boolean) => {
    try {
      const targetProduct = products.find((p) => p.id === id);
      if (!targetProduct) return;
      const res = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: targetProduct.name,
          category_id: targetProduct.category_id || targetProduct.category?.id || 1,
          account_type: targetProduct.account_type,
          price: targetProduct.price,
          warranty_hours: targetProduct.warranty_hours,
          is_off_mode: targetProduct.is_off_mode,
          is_active: !currentState,
        }),
      });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert(json.message || 'Lỗi cập nhật trạng thái.');
      }
    } catch (e: any) {
      alert(e.message || 'Lỗi kết nối máy chủ.');
    }
  };

  // Mở modal thêm danh mục mới
  const openCreateCategoryModal = () => {
    setIsEditingCategory(false);
    setTargetCategoryId(null);
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      icon: '🎯',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setCategoryModalError(null);
    setIsCategoryModalOpen(true);
  };

  // Mở modal sửa danh mục
  const openEditCategoryModal = (cat: any) => {
    setIsEditingCategory(true);
    setTargetCategoryId(cat.id);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '🎯',
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active !== false,
    });
    setCategoryModalError(null);
    setIsCategoryModalOpen(true);
  };

  // Lưu danh mục
  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCategory(true);
    setCategoryModalError(null);
    try {
      const url = isEditingCategory
        ? `${API_BASE_URL}/admin/categories/${targetCategoryId}`
        : `${API_BASE_URL}/admin/categories`;
      const method = isEditingCategory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(categoryForm),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setIsCategoryModalOpen(false);
        loadData();
      } else {
        setCategoryModalError(json.message || 'Lỗi khi lưu danh mục.');
      }
    } catch (err: any) {
      setCategoryModalError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setSubmittingCategory(false);
    }
  };

  // Xóa danh mục
  const handleDeleteCategory = async (catId: number, catName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${catName}" không?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/categories/${catId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const json = await res.json();
      alert(json.message);
      if (json.success) {
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi kết nối khi xóa danh mục.');
    }
  };

  // Nạp kho
  const handleImportStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/admin/stock/import`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          product_id: importProductId,
          raw_text: importText,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setImportStatus(json.message);
        setImportText('');
        loadData();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Duyệt đơn thủ công
  const handleForceComplete = async (code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn duyệt thanh toán cho đơn ${code}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${code}/force-complete`, {
        method: 'POST',
        headers: authHeaders,
      });
      const json = await res.json();
      alert(json.message);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Từ chối / Hủy đơn hàng (đơn trùng, không thanh toán...)
  const handleRejectOrder = async (code: string, reason?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/orders/${code}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ reason: reason || 'Đơn hàng trùng lặp hoặc không thanh toán' }),
      });
      const json = await res.json();
      alert(json.message);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Lỗi kết nối máy chủ.');
    }
  };

  // Duyệt bảo hành
  const handleApproveClaim = async (claimId: number) => {
    if (!confirm('Bạn có chắc muốn duyệt bảo hành và cấp bù tài khoản mới từ kho cho khách hàng?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/warranty/${claimId}/approve`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ admin_note: 'Đã duyệt cấp bù tài khoản mới' }),
      });
      const json = await res.json();
      alert(json.message);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Từ chối bảo hành
  const handleRejectClaim = async (claimId: number) => {
    const reason = prompt('Nhập lý do từ chối bảo hành:', 'Tài khoản vẫn đăng nhập bình thường hoặc đã quá hạn');
    if (!reason) return;
    try {
      const res = await fetch(`${API_BASE_URL}/admin/warranty/${claimId}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ admin_note: reason }),
      });
      const json = await res.json();
      alert(json.message);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Helper helper lấy logo game theo tên/type
  const getProductGameMeta = (name: string, type: string) => {
    const s = `${name} ${type}`.toLowerCase();
    if (s.includes('cs2') || s.includes('csgo')) {
      return { logo: '/images/games/cs2-logo.png', tag: 'CS2', color: '#ff9800' };
    }
    if (s.includes('steam')) {
      return { logo: '/images/games/steam-logo.png', tag: 'Steam', color: '#38bdf8' };
    }
    if (s.includes('pubg')) {
      return { logo: '/images/games/pubg-logo.png', tag: 'PUBG', color: '#f59e0b' };
    }
    return { logo: '/images/games/valorant-logo.png', tag: 'Valorant', color: '#ff4655' };
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.account_type || '').toLowerCase().includes(q));
  }, [products, productSearch]);

  // Phân nhóm sản phẩm theo Danh Mục & Loại Sản Phẩm
  const groupedCategories = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    const searched = products.filter((p) => {
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        (p.account_type || '').toLowerCase().includes(q) ||
        (p.category?.name || '').toLowerCase().includes(q)
      );
    });

    const groups: {
      [key: string]: {
        id: number;
        slug: string;
        name: string;
        description?: string;
        icon?: string;
        logo: string;
        color: string;
        badge: string;
        items: any[];
      };
    } = {};

    // 1. Khởi tạo nhóm từ toàn bộ danh mục động trong Database
    categories.forEach((cat) => {
      let logo = '/images/games/valorant-logo.png';
      let color = '#00e5a0';
      let badge = '📦 Sản Phẩm';

      if (cat.slug === 'valorant') {
        logo = '/images/games/valorant-logo.png';
        color = '#ff4655';
        badge = '🎯 Riot Games';
      } else if (cat.slug === 'cs2') {
        logo = '/images/games/cs2-logo.png';
        color = '#ff9800';
        badge = '⚡ Valve';
      } else if (cat.slug === 'steam') {
        logo = '/images/games/steam-logo.png';
        color = '#38bdf8';
        badge = '🕹️ Valve Platform';
      } else if (cat.slug === 'pubg') {
        logo = '/images/games/pubg-logo.png';
        color = '#f59e0b';
        badge = '🪂 Krafton';
      } else if (cat.slug === 'tai-khoan-ai') {
        logo = '/images/games/steam-logo.png';
        color = '#a855f7';
        badge = '🤖 Trí Tuệ Nhân Tạo AI';
      } else if (cat.slug === 'giai-tri') {
        logo = '/images/games/steam-logo.png';
        color = '#f43f5e';
        badge = '🎞️ Giải Trí & Xem Phim';
      } else if (cat.slug === 'phan-mem') {
        logo = '/images/games/steam-logo.png';
        color = '#f59e0b';
        badge = '🗂️ Phần Mềm & Key Bản Quyền';
      } else {
        color = '#00c4ff';
        badge = `📁 ${cat.name}`;
      }

      groups[cat.slug] = {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon || '📦',
        logo,
        color,
        badge,
        items: [],
      };
    });

    // Fallback nếu categories chưa kịp load
    if (!groups.valorant) groups.valorant = { id: 1, slug: 'valorant', name: 'Valorant', logo: '/images/games/valorant-logo.png', color: '#ff4655', badge: '🎯 Riot Games', items: [] };
    if (!groups.cs2) groups.cs2 = { id: 2, slug: 'cs2', name: 'CS:GO 2', logo: '/images/games/cs2-logo.png', color: '#ff9800', badge: '⚡ Valve', items: [] };
    if (!groups.steam) groups.steam = { id: 3, slug: 'steam', name: 'Steam', logo: '/images/games/steam-logo.png', color: '#38bdf8', badge: '🕹️ Valve Platform', items: [] };
    if (!groups.pubg) groups.pubg = { id: 4, slug: 'pubg', name: 'PUBG', logo: '/images/games/pubg-logo.png', color: '#f59e0b', badge: '🪂 Krafton', items: [] };

    // 2. Đưa sản phẩm vào đúng danh mục tương ứng
    searched.forEach((p) => {
      const catSlug = (p.category?.slug || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      const pType = (p.account_type || '').toLowerCase();

      let targetKey = catSlug;
      if (!groups[targetKey]) {
        if (catSlug === 'valorant' || pName.includes('valorant') || pType.includes('valo')) targetKey = 'valorant';
        else if (catSlug === 'cs2' || pName.includes('cs2') || pName.includes('csgo') || pType.includes('cs2')) targetKey = 'cs2';
        else if (catSlug === 'steam' || pName.includes('steam') || pType.includes('steam')) targetKey = 'steam';
        else if (catSlug === 'pubg' || pName.includes('pubg') || pType.includes('pubg')) targetKey = 'pubg';
        else {
          // Tạo group ad-hoc nếu category không nằm trong categories
          groups[catSlug || 'khac'] = {
            id: p.category_id || 99,
            slug: catSlug || 'khac',
            name: p.category?.name || 'Danh mục khác',
            logo: '/images/games/valorant-logo.png',
            color: '#00e5a0',
            badge: '📁 Danh mục khác',
            items: [],
          };
          targetKey = catSlug || 'khac';
        }
      }

      if (groups[targetKey]) {
        groups[targetKey].items.push(p);
      }
    });

    return groups;
  }, [products, categories, productSearch]);

  // Helper render bảng sản phẩm chung cho từng danh mục / phân loại
  const renderProductTable = (items: any[], emptyText = 'Chưa có sản phẩm nào trong phân loại này') => {
    if (!items || items.length === 0) {
      return (
        <div className="py-8 text-center text-slate-500 font-mono text-xs bg-[#090b0f]/50 rounded-2xl border border-[#232834]/50">
          {emptyText}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-[#232834]">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#090b0f] text-slate-400 border-b border-[#232834] font-mono uppercase text-[11px]">
            <tr>
              <th className="py-3.5 px-4">Loại Sản Phẩm & Rank</th>
              <th className="py-3.5 px-4">Account Type (SKU)</th>
              <th className="py-3.5 px-4">Tồn Kho</th>
              <th className="py-3.5 px-4">Giá Bán</th>
              <th className="py-3.5 px-4">Bảo Hành</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232834]/60 font-mono">
            {items.map((p) => {
              const meta = getProductGameMeta(p.name, p.account_type || '');
              return (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 text-white font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#090b0f] border border-[#232834] p-1.5 flex items-center justify-center shrink-0">
                        <Image
                          src={meta.logo}
                          alt={meta.tag}
                          width={24}
                          height={24}
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-bold">{p.name}</span>
                          {p.is_active === false && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold">
                              Ngưng bán
                            </span>
                          )}
                          {p.is_off_mode ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center gap-1">
                              <span>💎</span> Chủ Off
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-[#00e5a0]/15 text-[#00e5a0] text-[9px] font-bold">
                              Gói Thường
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ID: #{p.id} • Slug: /{p.slug}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-1 bg-[#090b0f] border border-[#232834] rounded-lg text-[#00c4ff] text-[11px] font-bold inline-block font-mono">
                      {p.account_type || '---'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.available_stock > 0 ? (
                      <span className="px-2.5 py-1 rounded-full bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[#00e5a0] font-bold text-[11px]">
                        {p.available_stock} acc
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[11px]">
                        Hết hàng
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-amber-400 font-bold text-sm">
                    {editingPriceId === p.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                          className="bg-[#090b0f] border border-[#00e5a0] rounded-xl px-2.5 py-1 text-white w-28 text-xs font-mono outline-none"
                        />
                        <span className="text-xs text-slate-400">đ</span>
                      </div>
                    ) : (
                      `${p.price.toLocaleString('vi-VN')} đ`
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs font-semibold">
                    🛡️ {p.warranty_hours ?? 2} giờ
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {editingPriceId === p.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSavePrice(p.id)}
                          className="px-3 py-1.5 bg-[#00e5a0] hover:bg-[#00c4ff] text-[#050a14] rounded-xl font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingPriceId(null)}
                          className="px-3 py-1.5 bg-[#1a202c] text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingPriceId(p.id);
                            setNewPrice(p.price);
                          }}
                          title="Chỉnh sửa nhanh giá bán"
                          className="px-2.5 py-1.5 bg-[#1a202c] hover:bg-[#232936] text-amber-300 border border-[#2d3748] rounded-xl font-bold text-xs transition-all cursor-pointer"
                        >
                          ⚡ Đổi giá
                        </button>
                        <button
                          onClick={() => openEditProductModal(p)}
                          title="Chỉnh sửa toàn bộ thông tin sản phẩm"
                          className="px-2.5 py-1.5 bg-[#1a202c] hover:bg-[#232936] text-slate-200 border border-[#2d3748] rounded-xl font-bold text-xs transition-all cursor-pointer"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Xóa hoặc ngưng bán sản phẩm"
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-xs transition-all cursor-pointer"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !orderSearch.trim() ||
        o.order_code?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus =
        orderStatusFilter === 'all' || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Khi chưa khởi tạo xong ở client hoặc đang verify: render khung trống 0ms
  if (!mounted || verifying) {
    return <div className="min-h-[75vh]" />;
  }

  // Nếu chưa đăng nhập Admin:
  if (!isDirectAdmin) {
    // Nếu có mã bí mật (?secret=dtff2026): Cho phép hiển thị form đăng nhập Admin
    if (hasSecret) {
      return (
        <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00e5a0]/10 border border-[#00e5a0]/30 text-[#00e5a0] text-3xl shadow-[0_0_25px_rgba(0,229,160,0.2)]">
                ⚡
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Tạp Hóa 247 Control Center</h1>
              <p className="text-xs text-slate-400">Đăng nhập tài khoản Quản trị viên để quản lý hệ thống</p>
            </div>

            {loginError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-3">
                <span className="text-base">⚠️</span>
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} autoComplete="off" className="p-7 bg-[#12151c] border border-[#232834] rounded-3xl space-y-4 shadow-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Quản Trị
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@taphoa247.io.vn"
                  autoComplete="off"
                  className="w-full bg-[#090b0f] border border-[#232834] text-white p-3.5 rounded-xl text-sm outline-none focus:border-[#00e5a0] focus:ring-1 focus:ring-[#00e5a0] transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Mật Khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  className="w-full bg-[#090b0f] border border-[#232834] text-white p-3.5 rounded-xl text-sm outline-none focus:border-[#00e5a0] focus:ring-1 focus:ring-[#00e5a0] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] hover:brightness-110 active:scale-[0.99] text-[#050a14] font-black rounded-xl text-sm transition-all shadow-lg shadow-[#00e5a0]/25 disabled:opacity-50 cursor-pointer"
              >
                {loggingIn ? 'Đang xác thực quản trị...' : 'ĐĂNG NHẬP QUẢN TRỊ'}
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Nếu KHÔNG có mã bí mật: trả về 404 ngay lập tức (giấu kín hoàn toàn đường dẫn /admin)
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-[#12151c] border border-[#232834] shadow-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-3xl">
            🔒
          </div>
          <div>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500 font-mono tracking-widest">
              404
            </div>
            <h1 className="text-xl font-bold text-white mt-2">Trang Không Tồn Tại</h1>
            <p className="text-sm text-slate-400 mt-2">
              Đường dẫn này không tồn tại hoặc bạn không có quyền truy cập.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] rounded-xl text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <span>←</span> Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  // 4. Nếu là isDirectAdmin === true -> Render Admin Control Center trực tiếp!

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-[#00e5a0]/30 selection:text-white">
      {/* Mobile Top Header Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#090e1a] border-b border-[#1a2338] sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="w-9 h-9 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center hover:bg-slate-700 transition-colors cursor-pointer"
            title="Mở menu điều hướng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/images/chatbot-avatar.png" alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-black text-sm text-white">{settingsData.store_name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
            title="Làm mới"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Dedicated Left Sidebar */}
      <AdminSidebar
        activeTab={tab}
        onSelectTab={setTab}
        counts={{
          products: products.length,
          orders: orders.length,
          claims: claims.length,
          coupons: coupons.length,
        }}
        storeName={settingsData.store_name}
        userEmail={user?.email}
        onLogout={logout}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Right Main Content Workspace */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#060a12]">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-[#090e1a]/90 backdrop-blur-xl border-b border-[#1a2338] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-slate-400">
              <span className="text-slate-500">Portal</span> / <span className="text-white font-bold capitalize">{tab}</span>
            </div>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              Quản trị viên: <b className="text-white font-mono">{user?.email}</b>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* VietQR Live Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#00e5a0]/10 border border-[#00e5a0]/25 text-[#00e5a0] text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-[#00e5a0] animate-ping" />
              <span>VietQR TPBank (SePay): Sẵn Sàng</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Làm mới dữ liệu từ server"
            >
              <span>🔄</span>
              <span>Làm mới</span>
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {tab === 'dashboard' && dashboardData && (
            <AdminDashboardView
              dashboardData={dashboardData}
              onNavigateTab={(t) => setTab(t as any)}
              recentOrders={orders.slice(0, 5)}
            />
          )}

      {/* ========================================================================= */}
      {/* TAB 2: BẢNG DOANH THU (REVENUE) */}
      {/* ========================================================================= */}
      {tab === 'revenue' && revenueData && (
        <AdminRevenueView revenueData={revenueData} />
      )}

            {/* ========================================================================= */}
      {/* TAB 3: QUẢN LÝ SẢN PHẨM & BẢNG GIÁ (PRODUCTS FULL CRUD) */}
      {/* ========================================================================= */}
      {tab === 'products' && (
        <AdminProductsView
          products={products}
          categories={categories}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          isCategoryManagerOpen={isCategoryManagerOpen}
          setIsCategoryManagerOpen={setIsCategoryManagerOpen}
          openCreateProductModal={openCreateProductModal}
          openEditProductModal={openEditProductModal}
          openCreateCategoryModal={openCreateCategoryModal}
          openEditCategoryModal={openEditCategoryModal}
          handleDeleteCategory={handleDeleteCategory}
          handleDeleteProduct={handleDeleteProduct}
          handleQuickPriceUpdate={handleQuickPriceUpdate}
          handleToggleActive={handleToggleActive}
          onRefresh={loadData}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 4: NẠP KHO ACC (STOCK) */}
      {/* ========================================================================= */}
      {tab === 'stock' && (
        <AdminStockView
          products={products}
          importProductId={importProductId}
          setImportProductId={setImportProductId}
          importText={importText}
          setImportText={setImportText}
          importStatus={importStatus}
          handleImportStock={handleImportStock}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DANH SÁCH ĐƠN HÀNG (ORDERS) */}
      {/* ========================================================================= */}
      {tab === 'orders' && (
        <AdminOrdersView
          orders={orders}
          orderStatusFilter={orderStatusFilter}
          setOrderStatusFilter={(f) => setOrderStatusFilter(f as any)}
          orderSearch={orderSearch}
          setOrderSearch={setOrderSearch}
          onForceComplete={handleForceComplete}
          onRejectOrder={handleRejectOrder}
          onRefresh={loadData}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 6: QUẢN LÝ BẢO HÀNH (WARRANTY) */}
      {/* ========================================================================= */}
      {tab === 'warranty' && (
        <AdminWarrantyView
          claims={claims}
          handleApproveClaim={handleApproveClaim}
          handleRejectClaim={handleRejectClaim}
          onRefresh={loadData}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 7: CẤU HÌNH CỬA HÀNG (SETTINGS) */}
      {/* ========================================================================= */}
      {tab === 'settings' && (
        <AdminSettingsView
          settingsData={settingsData}
          setSettingsData={setSettingsData}
          handleSaveSettings={handleSaveSettings}
          savingSettings={savingSettings}
          settingsSaveMsg={settingsSaveMsg}
          coupons={coupons}
          onNavigateTab={(t) => setTab(t as any)}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 8: QUẢN LÝ MÃ GIẢM GIÁ (COUPONS & VOUCHERS) */}
      {/* ========================================================================= */}
      {tab === 'coupons' && (
        <AdminCouponsView
          coupons={coupons}
          handleOpenCreateCouponModal={handleOpenCreateCouponModal}
          handleOpenEditCouponModal={handleOpenEditCouponModal}
          handleDeleteCoupon={handleDeleteCoupon}
          handleToggleCoupon={handleToggleCoupon}
          onRefresh={loadData}
        />
      )}



      {/* Modal Thêm / Sửa Sản Phẩm (Toàn Cục) */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-xl w-full bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
              <div>
                <h3 className="text-lg font-black text-white">
                  {isEditingMode ? '✏️ Chỉnh Sửa Thông Tin Sản Phẩm' : '➕ Thêm Sản Phẩm Mới'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEditingMode ? 'Cập nhật danh mục, loại tài khoản, giá bán và bảo hành' : 'Tạo sản phẩm mới để bán trực tuyến trên hệ thống Tạp Hóa 247'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {productModalError && (
              <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{productModalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                  Tên Sản Phẩm *
                </label>
                <input
                  type="text"
                  placeholder="VD: Acc Valorant Immortal 3"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-[#050a14] border border-[#1e293b] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                    Danh Mục Game *
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: Number(e.target.value) })}
                    className="w-full bg-[#050a14] border border-[#1e293b] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                    Mã Định Danh (Account Type / SKU) *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: valo_immortal_off"
                    value={productForm.account_type}
                    onChange={(e) => setProductForm({ ...productForm, account_type: e.target.value })}
                    className="w-full bg-[#050a14] border border-[#1e293b] text-white p-3 rounded-xl text-xs font-mono outline-none focus:border-[#00e5a0] transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                    Giá Bán (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="10000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-[#050a14] border border-[#1e293b] text-amber-400 font-bold p-3 rounded-xl text-xs font-mono outline-none focus:border-[#00e5a0] transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                    Thời Gian Bảo Hành (Giờ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.warranty_hours}
                    onChange={(e) => setProductForm({ ...productForm, warranty_hours: Number(e.target.value) })}
                    className="w-full bg-[#050a14] border border-[#1e293b] text-white p-3 rounded-xl text-xs font-mono outline-none focus:border-[#00e5a0] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#050a14] border border-[#1e293b] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_off_mode}
                    onChange={(e) => setProductForm({ ...productForm, is_off_mode: e.target.checked })}
                    className="w-4 h-4 rounded text-[#00e5a0] bg-[#12151c] border-[#1e293b]"
                  />
                  <span className="text-xs text-slate-300 font-medium">Gói Chủ Off (Shield 5h)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#050a14] border border-[#1e293b] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-[#00e5a0] bg-[#12151c] border-[#1e293b]"
                  />
                  <span className="text-xs text-slate-300 font-medium">Kích hoạt bán trên Shop</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                  Mô Tả Ngắn Sản Phẩm
                </label>
                <textarea
                  rows={3}
                  placeholder="Thông tin thêm về tài khoản (server, skins, rank hiện tại...)"
                  value={productForm.short_description}
                  onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })}
                  className="w-full bg-[#050a14] border border-[#1e293b] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-black rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingProduct ? 'Đang lưu...' : isEditingMode ? 'Cập Nhật Sản Phẩm' : 'Tạo Sản Phẩm Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo / Chỉnh Sửa Danh Mục Mới (Toàn Cục) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0c1324] border border-[#1e293b] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00e5a0]/10 border border-[#00e5a0]/30 flex items-center justify-center text-xl">
                  {categoryForm.icon || '📁'}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {isEditingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isEditingCategory ? 'Cập nhật thông tin phân loại' : 'Tạo danh mục mới cho các gói sản phẩm tương lai'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {categoryModalError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{categoryModalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                  Tên Danh Mục *
                </label>
                <input
                  type="text"
                  placeholder="VD: Tài khoản Netflix, Phần Mềm Office..."
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCategoryForm((prev) => ({
                      ...prev,
                      name,
                      slug: isEditingCategory
                        ? prev.slug
                        : name
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-+|-+$/g, ''),
                    }));
                  }}
                  className="w-full bg-[#050a14] border border-[#1e293b] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                    Slug (Đường Dẫn URL)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: tai-khoan-netflix"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                    className="w-full bg-[#050a14] border border-[#1e293b] text-cyan-400 font-mono p-3 rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                    Thứ Tự Hiển Thị
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: Number(e.target.value) })}
                    className="w-full bg-[#050a14] border border-[#1e293b] text-white p-3 rounded-xl text-xs font-mono outline-none focus:border-[#00e5a0] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                  Biểu Tượng (Icon Emoji)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-16 text-center text-lg bg-[#050a14] border border-[#1e293b] text-white p-2 rounded-xl outline-none focus:border-[#00e5a0]"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['🎮', '🤖', '🎞️', '🗂️', '⚡', '💎', '🛡️', '📦', '🔑', '🚀', '⭐', '🔥'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, icon: emoji })}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                          categoryForm.icon === emoji
                            ? 'bg-[#00e5a0]/20 border border-[#00e5a0] scale-110'
                            : 'bg-[#050a14] border border-[#1e293b] hover:bg-white/5'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase font-mono">
                  Mô Tả Ngắn
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả danh mục này bán những gì..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-[#050a14] border border-[#1e293b] text-white p-3 rounded-xl text-xs outline-none focus:border-[#00e5a0] transition-colors resize-none"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#050a14] border border-[#1e293b] cursor-pointer">
                <input
                  type="checkbox"
                  checked={categoryForm.is_active}
                  onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-[#00e5a0] bg-[#12151c] border-[#1e293b]"
                />
                <span className="text-xs text-slate-300 font-medium">Kích hoạt hiển thị danh mục trên Shop</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#00e5a0] to-[#00c4ff] text-[#050a14] font-black rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submittingCategory ? 'Đang lưu...' : isEditingCategory ? 'Cập Nhật Danh Mục' : 'Tạo Danh Mục Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
{/* Modal Thêm / Sửa Mã Giảm Giá */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#12151c] border border-[#232834] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#232834] pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>🎁</span> {isEditingCoupon ? 'Chỉnh Sửa Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}
              </h3>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {couponModalError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{couponModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1">
                  Mã Code (Tự động viết hoa) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: TAPHOA247, CHAOBANMOI"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-[#090b0f] border border-[#232834] rounded-xl text-white font-mono font-black text-sm uppercase focus:border-[#00e5a0] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Mô Tả Mã</label>
                <input
                  type="text"
                  placeholder="VD: Quà tặng tân thủ giảm 10%"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#090b0f] border border-[#232834] rounded-xl text-white focus:border-[#00e5a0] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Loại Giảm Giá</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        discount_type: e.target.value as 'percent' | 'fixed',
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#090b0f] border border-[#232834] rounded-xl text-white font-semibold focus:border-[#00e5a0] outline-none cursor-pointer"
                  >
                    <option value="percent">Phần Trăm (%)</option>
                    <option value="fixed">Số Tiền Cố Định (VNĐ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Giá Trị Giảm {couponForm.discount_type === 'percent' ? '(%)' : '(VNĐ)'} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder={couponForm.discount_type === 'percent' ? '10' : '20000'}
                    value={couponForm.discount_value}
                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-[#090b0f] border border-[#232834] rounded-xl text-white font-mono font-bold focus:border-[#00e5a0] outline-none"
                    required
                  />
                </div>
              </div>

              {couponForm.discount_type === 'percent' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mức Giảm Tối Đa (VNĐ — 0 nếu không giới hạn)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 50000"
                    value={couponForm.max_discount_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-[#090b0f] border border-[#232834] rounded-xl text-white font-mono focus:border-[#00e5a0] outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Đơn Tối Thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 10000"
                    value={couponForm.min_order_amount}
                    onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-[#090b0f] border border-[#232834] rounded-xl text-white font-mono focus:border-[#00e5a0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tổng Lượt Dùng (0 = Vô hạn)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="VD: 100"
                    value={couponForm.usage_limit}
                    onChange={(e) => setCouponForm({ ...couponForm, usage_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-[#090b0f] border border-[#232834] rounded-xl text-white font-mono focus:border-[#00e5a0] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ngày Hết Hạn (Để trống = Vĩnh viễn)</label>
                <input
                  type="date"
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#090b0f] border border-[#232834] rounded-xl text-white focus:border-[#00e5a0] outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="coupon_active"
                  checked={couponForm.is_active}
                  onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-[#00e5a0] bg-[#090b0f] border-[#232834] cursor-pointer"
                />
                <label htmlFor="coupon_active" className="text-white font-semibold cursor-pointer">
                  Kích hoạt mã giảm giá ngay sau khi lưu
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#232834]">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingCoupon}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black rounded-xl shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {submittingCoupon ? 'Đang lưu...' : '💾 LƯU MÃ GIẢM GIÁ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
