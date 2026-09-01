import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/navbar-empresa';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  StarIcon,
  ArrowTrendingUpIcon,
  CubeIcon,          
  EyeIcon,
  CurrencyDollarIcon,
  PlusIcon,
  TrashIcon,          
  XMarkIcon,          
  ArrowUpTrayIcon,    
  ChevronRightIcon,
  PencilSquareIcon,   
  CameraIcon,
  EnvelopeIcon,       
  PhoneIcon,
  CalendarIcon,
  ShieldCheckIcon,    
  ChartBarIcon,
  ShoppingBagIcon        
} from "@heroicons/react/24/outline";

type Tab = 'products' | 'orders' | 'profile' | 'stats' | 'reviews';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  sold: number;
  views: number;
  rating: number;
  stock: number;
  active: boolean;
  category: string;
}

interface CompanyOrderItem {
  id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
}

interface CompanyOrder {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  recipient: string;
  address: string;
  city: string;
  department: string;
  postal_code: string;
  created_at: string;
  estimated_delivery: string;
  delivery_progress: number;
  buyer_email: string;
  buyer_name: string;
  items: CompanyOrderItem[];
}

interface ProductForm {
  name: string;
  price: string;
  stock: string;
  category: string;
  description: string;
  brand: string;
  model: string;
  warranty: string;
  weight: string;
  dimensions: string;
  imageUrl: string;
}

interface SellerInfo {
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  rating: number;
  totalSales: number;
  totalRevenue: number;
  totalReviews: number;
  avatar: string;
  sellerLevel: string;
  levelProgress: number;
}

const INITIAL_PRODUCTS: Product[] = [];

const EMPTY_FORM: ProductForm = {
  name: '',
  price: '',
  stock: '',
  category: '',
  description: '',
  brand: '',
  model: '',
  warranty: '',
  weight: '',
  dimensions: '',
  imageUrl: '',
};

const REFERENCE_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop';

const INITIAL_SELLER_INFO: SellerInfo = {
  name: '',
  email: '',
  phone: '',
  memberSince: '',
  rating: 0,
  totalSales: 0,
  totalRevenue: 0,
  totalReviews: 0,
  avatar: '',
  sellerLevel: 'Bronze',
  levelProgress: 0,
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sellerInfo, setSellerInfo] = useState<SellerInfo>(INITIAL_SELLER_INFO);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [companyOrders, setCompanyOrders] = useState<CompanyOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [logoSuccess, setLogoSuccess] = useState<boolean | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<boolean | null>(null);
  
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(EMPTY_FORM);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchReviewsData();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [meRes, profileRes, productsRes, ordersRes] = await Promise.all([
        api.get("/company/dashboard/me"),
        api.get("/company/dashboard/my-profile"),
        api.get("/company/products"),
        api.get("/company/orders"),
      ]);

      const me = meRes.data;
      const profile = profileRes.data;

      const totalSales = me.sales || profile.completeSales || 0;
      const avgRating = me.stars || profile.averageRating || 0;

      let sellerLevel = 'Bronze';
      let levelProgress = 0;
      if (totalSales >= 500) {
        sellerLevel = 'Diamond';
        levelProgress = 100;
      } else if (totalSales >= 200) {
        sellerLevel = 'Platinum';
        levelProgress = Math.min(100, Math.round(((totalSales - 200) / 300) * 100));
      } else if (totalSales >= 50) {
        sellerLevel = 'Gold';
        levelProgress = Math.min(100, Math.round(((totalSales - 50) / 150) * 100));
      } else if (totalSales >= 10) {
        sellerLevel = 'Silver';
        levelProgress = Math.min(100, Math.round(((totalSales - 10) / 40) * 100));
      } else {
        sellerLevel = 'Bronze';
        levelProgress = Math.min(100, Math.round((totalSales / 10) * 100));
      }

      setSellerInfo({
        name: me.nameCompany || profile.nameCompany || user?.name || "",
        email: me.emailCompany || profile.emailCompany || "",
        phone: me.tellCompany || profile.tellCompany || "",
        memberSince: me.memberAT ? new Date(me.memberAT).toLocaleDateString() : "",
        rating: avgRating,
        totalSales: totalSales,
        totalRevenue: me.totalRevenue || profile.totalRevenue || 0,
        totalReviews: me.reviews || profile.totalReviews || 0,
        avatar: (me.nameCompany || "V").charAt(0).toUpperCase(),
        sellerLevel,
        levelProgress,
      });

      setProfileForm({
        name: profile.nameCompany || me.nameCompany || "",
        email: profile.emailCompany || "",
        phone: profile.tellCompany || "",
      });

      const apiProducts = (productsRes.data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.images?.[0] || REFERENCE_IMAGE,
        sold: p.sold || 0,
        views: p.views || 0,
        rating: 0,
        stock: p.stock,
        active: p.status !== "inactive",
        category: p.catalog_name || "General",
      }));
      setProducts(apiProducts);

      setCompanyOrders(ordersRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewsData = async () => {
    if (activeTab !== 'reviews') return;
    setReviewsLoading(true);
    try {
      const productsRes = await api.get("/company/products");
      const products = productsRes.data || [];
      
      // Fetch reviews for each product (limited to 3 most recent per product)
      const allReviews: any[] = [];
      for (const product of products) {
        try {
          const reviewsRes = await api.get(`/products/${product.id}/reviews`);
          const productReviews = reviewsRes.data || [];
          // Take only 3 most recent reviews per product
          const limitedReviews = productReviews.slice(0, 3);
          allReviews.push(
            ...limitedReviews.map((r: any) => ({
              ...r,
              productName: product.name,
            }))
          );
        } catch (err) {
          console.error(`Error fetching reviews for product ${product.id}:`, err);
        }
      }
      setReviews(allReviews);
    } catch (err) {
      console.error("Error fetching reviews data:", err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const totalRevenue = sellerInfo.totalRevenue || products.reduce((acc, p) => acc + p.price * p.sold, 0);
  const activeProducts = products.filter((p) => p.active);

  const toggleActive = async (id: string) => {
    try {
      await api.patch(`/company/products/${id}/status`);
      await fetchDashboardData();
    } catch (err) {
      console.error("Error toggling product status:", err);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.delete(`/company/products/${id}`);
      setShowDeleteConfirm(null);
      await fetchDashboardData();
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    setLogoSuccess(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.patch("/company/dashboard/upload-logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLogoSuccess(true);
      await fetchDashboardData();
    } catch (err: any) {
      setLogoError(err?.response?.data?.detail || "Error al subir la foto de perfil");
      console.error("Error uploading logo:", err);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    setBannerError(null);
    setBannerSuccess(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.patch("/company/dashboard/upload-banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBannerSuccess(true);
      await fetchDashboardData();
    } catch (err: any) {
      setBannerError(err?.response?.data?.detail || "Error al subir el banner");
      console.error("Error uploading banner:", err);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/company/orders/${orderId}/status`, { status: newStatus });
      await fetchDashboardData();
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const orderStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      shipped: "Enviado",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    return map[status] || status;
  };

  const orderStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
      confirmed: "bg-blue-500/20 border-blue-500/40 text-blue-300",
      shipped: "bg-purple-500/20 border-purple-500/40 text-purple-300",
      delivered: "bg-green-500/20 border-green-500/40 text-green-300",
      cancelled: "bg-red-500/20 border-red-500/40 text-red-300",
    };
    return map[status] || "bg-gray-500/20 border-gray-500/40 text-gray-300";
  };

  const resolveImageUrl = (img?: string) => {
    if (!img) return REFERENCE_IMAGE;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    const base = (import.meta.env.VITE_API_URL || "http://localhost:8002").replace(/\/$/, "");
    const path = img.startsWith("/files") ? img : `/files/${img.replace(/^\/+/, "")}`;
    return `${base}${path.replace("/files/files", "/files")}`;
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setImagePreview(localUrl);
      setForm((prev) => ({ ...prev, imageUrl: "" }));
    } else {
      setImagePreview(form.imageUrl || "");
    }
  };

  const uploadProductImage = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("/company/products/upload-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.url || res.data?.path || "";
  };

  const handleFormChange = (field: keyof ProductForm, value: string) => {
    // Validación especial para garantía: solo números
    if (field === 'warranty') {
      const clean = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, [field]: clean }));
      return;
    }
    // Para peso, permitir números y punto
    if (field === 'weight') {
      const clean = value.replace(/[^0-9.]/g, "");
      setForm((prev) => ({ ...prev, [field]: clean }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'imageUrl') {
      setImagePreview(value);
      if (value) setSelectedFile(null);
    }
  };

  const handleAddProduct = async () => {
    if (!form.name || !form.price || !form.stock) return;

    const priceNum = parseInt(form.price.replace(/\D/g, '')) || 0;
    const stockNum = parseInt(form.stock) || 0;

    try {
      setUploadingImage(true);
      let finalImage = form.imageUrl.trim();
      if (selectedFile) {
        finalImage = await uploadProductImage(selectedFile);
      }
      // Peso con unidad kg predeterminada
      const weightWithUnit = form.weight ? `${form.weight} kg` : "";
      // Garantía con meses
      const warrantyWithUnit = form.warranty ? `${form.warranty} meses` : "";
      const techSpec: Record<string, string> = {};
      if (form.brand) techSpec.brand = form.brand;
      if (form.model) techSpec.model = form.model;
      if (warrantyWithUnit) techSpec.warranty = warrantyWithUnit;
      if (weightWithUnit) techSpec.weight = weightWithUnit;
      if (form.dimensions) techSpec.dimensions = form.dimensions;

      await api.post("/company/products", {
        name: form.name,
        price: priceNum,
        images: finalImage ? [finalImage] : [],
        discount_enable: false,
        discount_value: 0,
        stock: stockNum,
        descripcion: [form.description, form.brand, form.model, warrantyWithUnit, weightWithUnit, form.dimensions].filter(Boolean).join(" · ") || form.name,
        technical_spec: Object.keys(techSpec).length ? techSpec : undefined,
        catalog_name: form.category || undefined,
      });
      setForm(EMPTY_FORM);
      setImagePreview('');
      setSelectedFile(null);
      setShowAddModal(false);
      await fetchDashboardData();
    } catch (err) {
      console.error("Error creating product:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const openEditModal = async (productId: string) => {
    try {
      const res = await api.get(`/company/products/${productId}`);
      const p = res.data;
      const spec = p.technical_spec || {};
      const warrantyNum = (spec.warranty || "").replace(/\D/g, "");
      const weightNum = (spec.weight || "").replace(/[^0-9.]/g, "");
      setEditingId(productId);
      setEditForm({
        name: p.name || "",
        price: String(p.price || ""),
        stock: String(p.stock || ""),
        category: p.catalog_name || "",
        description: p.descripcion || "",
        brand: spec.brand || "",
        model: spec.model || "",
        warranty: warrantyNum,
        weight: weightNum,
        dimensions: spec.dimensions || "",
        imageUrl: p.images?.[0] || "",
      });
      setEditImagePreview(p.images?.[0] ? resolveImageUrl(p.images[0]) : "");
      setEditSelectedFile(null);
      setShowEditModal(true);
    } catch (err) {
      console.error("Error loading product:", err);
    }
  };

  const handleEditFormChange = (field: keyof ProductForm, value: string) => {
    if (field === 'warranty') {
      const clean = value.replace(/\D/g, "");
      setEditForm((prev) => ({ ...prev, [field]: clean }));
      return;
    }
    if (field === 'weight') {
      const clean = value.replace(/[^0-9.]/g, "");
      setEditForm((prev) => ({ ...prev, [field]: clean }));
      return;
    }
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'imageUrl') {
      setEditImagePreview(value);
      if (value) setEditSelectedFile(null);
    }
  };

  const handleEditImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEditSelectedFile(file);
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setEditImagePreview(localUrl);
      setEditForm((prev) => ({ ...prev, imageUrl: "" }));
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingId || !editForm.name || !editForm.price || !editForm.stock) return;
    const priceNum = parseInt(editForm.price.replace(/\D/g, '')) || 0;
    const stockNum = parseInt(editForm.stock) || 0;
    try {
      setEditUploading(true);
      let finalImage = editForm.imageUrl.trim();
      if (editSelectedFile) {
        finalImage = await uploadProductImage(editSelectedFile);
      }
      const weightWithUnit = editForm.weight ? `${editForm.weight} kg` : "";
      const warrantyWithUnit = editForm.warranty ? `${editForm.warranty} meses` : "";
      const techSpec: Record<string, string> = {};
      if (editForm.brand) techSpec.brand = editForm.brand;
      if (editForm.model) techSpec.model = editForm.model;
      if (warrantyWithUnit) techSpec.warranty = warrantyWithUnit;
      if (weightWithUnit) techSpec.weight = weightWithUnit;
      if (editForm.dimensions) techSpec.dimensions = editForm.dimensions;

      await api.patch(`/company/products/${editingId}`, {
        name: editForm.name,
        price: priceNum,
        images: finalImage ? [finalImage] : [],
        stock: stockNum,
        descripcion: [editForm.description, editForm.brand, editForm.model, warrantyWithUnit, weightWithUnit, editForm.dimensions].filter(Boolean).join(" · ") || editForm.name,
        technical_spec: Object.keys(techSpec).length ? techSpec : undefined,
      });
      setShowEditModal(false);
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      setEditImagePreview('');
      setEditSelectedFile(null);
      await fetchDashboardData();
    } catch (err) {
      console.error("Error updating product:", err);
    } finally {
      setEditUploading(false);
    }
  };

  const openEditProfile = () => {
    setProfileForm({
      name: sellerInfo.name,
      email: sellerInfo.email,
      phone: sellerInfo.phone,
    });
    setShowProfileDrawer(true);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.name.trim()) return;

    try {
      await api.patch("/company/dashboard/upgrade-my-profile", {
        nameCompany: profileForm.name,
        emailCompany: profileForm.email,
        tellCompany: profileForm.phone,
      });

      setSellerInfo((prev) => ({
        ...prev,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        avatar: profileForm.name.charAt(0).toUpperCase() || 'V',
      }));
      setShowProfileDrawer(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'products', label: 'Mis Productos', icon: <CubeIcon className="w-4 h-4" /> },
    { id: 'orders', label: 'Pedidos', icon: <ShoppingBagIcon className="w-4 h-4" /> },
    { id: 'stats', label: 'Estadísticas', icon: <ChartBarIcon className="w-4 h-4" /> },
    { id: 'profile', label: 'Mi Perfil', icon: <ShieldCheckIcon className="w-4 h-4" /> },
    { id: 'reviews', label: 'Reseñas', icon: <StarIcon className="w-4 h-4 fill-yellow-400" /> },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Diamond': return 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300';
      case 'Platinum': return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
      case 'Gold': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
      case 'Silver': return 'bg-gray-400/20 border-gray-400/40 text-gray-300';
      default: return 'bg-orange-500/20 border-orange-500/40 text-orange-300';
    }
  };

  const getLevelBarColor = (level: string) => {
    switch (level) {
      case 'Diamond': return 'from-cyan-400 to-cyan-600';
      case 'Platinum': return 'from-purple-400 to-purple-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Silver': return 'from-gray-400 to-gray-600';
      default: return 'from-orange-400 to-orange-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 mb-8 shadow-xl shadow-green-500/20">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center text-4xl font-bold text-green-500 shadow-lg border-4 border-white/20">
                {sellerInfo.avatar}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-400 transition-colors cursor-pointer">
                <CameraIcon className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              {logoUploading && (
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center z-10">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              {logoError && (
                <div className="absolute top-0 left-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center text-white text-sm z-10">
                  {logoError}
                </div>
              )}
              {logoSuccess && (
                <div className="absolute top-0 left-0 w-full h-full bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm z-10">
                  Foto de perfil actualizada
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                <h1 className="text-3xl font-bold text-white">{sellerInfo.name}</h1>
                <span className="bg-green-500/20 border border-green-500/40 text-green-300 text-xs px-2 py-0.5 rounded-full font-medium">Vendedor</span>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-green-100 mt-2">
                <div className="flex items-center gap-1">
                  <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{sellerInfo.rating > 0 ? sellerInfo.rating : 'Sin calificación'}</span>
                  <span className="text-sm">({sellerInfo.totalReviews} reseñas)</span>
                </div>
                <div className="flex items-center gap-1">
                  <CubeIcon className="w-4 h-4" />
                  <span>{sellerInfo.totalSales} ventas</span>
                </div>
                <div className="text-sm">Miembro desde {sellerInfo.memberSince}</div>
              </div>
            </div>
            <button 
              onClick={() => setShowProfileDrawer(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-colors border border-white/20"
            >
              <PencilSquareIcon className="w-4 h-4" />
              Editar perfil
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-slate-800 text-gray-400 hover:text-gray-200 hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Mis Productos <span className="text-gray-500 font-normal text-base">({products.length})</span></h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30 hover:shadow-green-500/50"
              >
                <PlusIcon className="w-5 h-5" />
                Agregar producto
              </button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <CubeIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No tienes productos aún</p>
                <p className="text-sm mt-1">Agrega tu primer producto para empezar a vender</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-5 py-2.5 rounded-xl font-semibold transition-all"
                >
                  <PlusIcon className="w-5 h-5" />
                  Agregar producto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-slate-900 rounded-xl border transition-all overflow-hidden ${
                      product.active
                        ? 'border-slate-800 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10'
                        : 'border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="relative aspect-square bg-slate-800">
                      <img
                        src={resolveImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        product.active
                          ? 'bg-green-500/20 border-green-500/40 text-green-300'
                          : 'bg-red-500/20 border-red-500/40 text-red-300'
                      }`}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </div>
                      <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs font-semibold text-green-400 border border-slate-700">
                        Stock: {product.stock}
                      </div>
                    </div>

                    <div className="p-4">
                      <Link to={`/producto/${product.id}`} className="block mb-2">
                        <h3 className="text-gray-200 font-semibold line-clamp-2 h-11 hover:text-green-400 transition-colors text-sm">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="text-green-400 font-bold mb-3">
                        ${product.price.toLocaleString('es-CO')}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <ArrowTrendingUpIcon className="w-3.5 h-3.5" />
                          <span>{product.sold} vendidos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <EyeIcon className="w-3.5 h-3.5" />
                          <span>{product.views}</span>
                        </div>
                        {product.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <StarIcon className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-300">{product.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleActive(product.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                            product.active
                              ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20'
                              : 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20'
                          }`}
                          title={product.active ? 'Desactivar' : 'Activar'}
                        >
                          <span className={`w-6 h-3.5 flex items-center bg-slate-700 rounded-full p-0.5 duration-300 ease-in-out ${product.active ? 'bg-yellow-500/40' : 'bg-green-500/40'}`}>
                            <span className={`bg-white w-2.5 h-2.5 rounded-full shadow-md transform duration-300 ease-in-out ${product.active ? 'translate-x-0' : 'translate-x-2.5'}`}></span>
                          </span>
                          {product.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => openEditModal(product.id)}
                          className="w-9 h-9 flex items-center justify-center bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                          title="Editar producto"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(product.id)}
                          className="w-9 h-9 flex items-center justify-center bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                          title="Eliminar producto"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Pedidos recibidos ({companyOrders.length})</h2>
            {companyOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ShoppingBagIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No tienes pedidos aún</p>
                <p className="text-sm mt-1">Los pedidos de tus productos aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {companyOrders.map((order) => (
                  <div key={order.id} className="border border-slate-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="text-white font-bold text-sm truncate">{order.id.slice(0, 8)}...</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${orderStatusColor(order.status)}`}>
                            {orderStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          {order.buyer_name || order.buyer_email} · {new Date(order.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">${order.total.toLocaleString("es-CO")}</p>
                        <p className="text-gray-500 text-xs">{order.items.length} producto(s)</p>
                      </div>
                      <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${selectedOrder === order.id ? "rotate-90" : ""}`} />
                    </button>

                    {selectedOrder === order.id && (
                      <div className="border-t border-slate-800 p-5 bg-slate-950/50 space-y-5">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Productos</h3>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-gray-500">
                                  <CubeIcon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium">{item.name}</p>
                                  <p className="text-gray-500 text-xs">Cantidad: {item.quantity}</p>
                                </div>
                                <p className="text-white text-sm font-semibold">${(item.price * item.quantity).toLocaleString("es-CO")}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Resumen</h3>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="text-white">${order.subtotal.toLocaleString("es-CO")}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Envío</span><span className="text-white">{order.shipping === 0 ? 'GRATIS' : `$${order.shipping.toLocaleString("es-CO")}`}</span></div>
                              <div className="flex justify-between pt-2 border-t border-slate-800"><span className="text-gray-300 font-semibold">Total</span><span className="text-green-400 font-bold">${order.total.toLocaleString("es-CO")}</span></div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Envío y pago</h3>
                            <div className="space-y-1 text-sm text-gray-400">
                              <p>{order.recipient} · {order.address}, {order.city}</p>
                              <p>Pago: {order.payment_method === "tarjeta" ? "Tarjeta" : order.payment_method === "pse" ? "PSE" : order.payment_method}</p>
                            </div>
                          </div>
                        </div>

                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <div className="flex gap-2 pt-2 border-t border-slate-800">
                            {order.status === 'pending' && (
                              <>
                                <button onClick={() => handleOrderStatus(order.id, 'confirmed')} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-sm font-semibold transition">
                                  Confirmar pedido
                                </button>
                                <button onClick={() => handleOrderStatus(order.id, 'cancelled')} className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-semibold transition">
                                  Rechazar
                                </button>
                              </>
                            )}
                            {order.status === 'confirmed' && (
                              <button onClick={() => handleOrderStatus(order.id, 'shipped')} className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg text-sm font-semibold transition">
                                Marcar como enviado
                              </button>
                            )}
                            {order.status === 'shipped' && (
                              <button onClick={() => handleOrderStatus(order.id, 'delivered')} className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-semibold transition">
                                Marcar como entregado
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Productos activos', value: activeProducts.length, icon: <CubeIcon className="w-5 h-5 text-green-400" /> },
                { label: 'Ventas totales', value: products.reduce((a, p) => a + p.sold, 0), icon: <ArrowTrendingUpIcon className="w-5 h-5 text-blue-400" /> },
                { label: 'Ingresos totales', value: `$${(totalRevenue / 1000000).toFixed(1)}M`, icon: <CurrencyDollarIcon className="w-5 h-5 text-yellow-400" /> },
                { label: 'Calificación', value: sellerInfo.rating > 0 ? sellerInfo.rating : 'N/A', icon: <StarIcon className="w-5 h-5 text-yellow-400 fill-yellow-400" /> },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                    {stat.icon}
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="text-lg font-bold text-white mb-5">Rendimiento por producto</h2>
              {products.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay productos para mostrar</p>
              ) : (
                <div className="space-y-4">
                  {products.map((p) => {
                    const maxSold = Math.max(...products.map((x) => x.sold), 1);
                    return (
                      <div key={p.id} className="flex items-center gap-4">
                        <img src={resolveImageUrl(p.image)} alt={p.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white text-sm font-medium line-clamp-1">{p.name}</span>
                            <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{p.sold} vendidos</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${(p.sold / maxSold) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-green-400" /> Información del vendedor
              </h2>
              <div className="space-y-4">
                {[
                  { id: 'name', label: 'Nombre de tienda', value: sellerInfo.name, icon: <CubeIcon className="w-4 h-4 text-gray-400" /> },
                  { id: 'email', label: 'Correo electrónico', value: sellerInfo.email, icon: <EnvelopeIcon className="w-4 h-4 text-gray-400" /> },
                  { id: 'phone', label: 'Teléfono', value: sellerInfo.phone, icon: <PhoneIcon className="w-4 h-4 text-gray-400" /> },
                  { id: 'date', label: 'Miembro desde', value: sellerInfo.memberSince, icon: <CalendarIcon className="w-4 h-4 text-gray-400" /> },
                ].map((field) => (
                  <div key={field.label} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                    {field.icon}
                    <div className="flex-1">
                      <p className="text-gray-500 text-xs">{field.label}</p>
                      <p className="text-white text-sm font-medium">{field.value}</p>
                    </div>
                    {field.id !== 'date' && (
                      <button 
                        onClick={openEditProfile}
                        className="text-gray-500 hover:text-green-400 transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={openEditProfile}
                className="w-full mt-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
              >
                Editar Información
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-yellow-400" /> Reputación y métricas
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-gray-300">Calificación promedio</span>
                  <div className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-bold">{sellerInfo.rating > 0 ? sellerInfo.rating : 'N/A'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-gray-300">Total de reseñas</span>
                  <span className="text-white font-bold">{sellerInfo.totalReviews}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-gray-300">Ventas completadas</span>
                  <span className="text-white font-bold">{sellerInfo.totalSales}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <span className="text-gray-300">Nivel de vendedor</span>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getLevelColor(sellerInfo.sellerLevel)}`}>{sellerInfo.sellerLevel}</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-xs">Progreso nivel</span>
                  <span className="text-gray-400 text-xs">{sellerInfo.levelProgress}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className={`bg-gradient-to-r ${getLevelBarColor(sellerInfo.sellerLevel)} h-2 rounded-full transition-all duration-500`} style={{ width: `${sellerInfo.levelProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'reviews' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Reseñas de productos</h2>
          {reviewsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <StarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No hay reseñas aún</p>
              <p className="text-sm">Los clientes aún no han dejado reseñas para tus productos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-800"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-sm">
                    {review.user_name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{review.user_name}</h3>
                    <p className="text-gray-400 text-sm">{review.comment?.substring(0, 100) || ""}...</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 fill-yellow-400 text-yellow-400 ${i < review.rating ? "fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                    <span className="text-xs text-gray-400">{review.rating}/5</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("es-CO")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PlusIcon className="w-5 h-5 text-green-400" />
                Agregar nuevo producto
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM); setImagePreview(''); setSelectedFile(null); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Imagen del producto <span className="text-gray-500 font-normal">(archivo o URL)</span>
                  </label>
                  <div className="space-y-3 mb-3">
                    <label className="flex items-center justify-center gap-2 w-full bg-slate-800 border-2 border-dashed border-slate-600 hover:border-green-500 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg px-3 py-3 text-sm cursor-pointer transition text-center">
                      <ArrowUpTrayIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{selectedFile ? selectedFile.name : "Click para seleccionar archivo (JPG, PNG, WEBP)"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="o pega URL https://..."
                        value={form.imageUrl}
                        onChange={(e) => handleFormChange('imageUrl', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                    {uploadingImage && <p className="text-xs text-green-400 animate-pulse">Subiendo imagen...</p>}
                  </div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center relative">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" onError={() => setImagePreview(REFERENCE_IMAGE)} />
                    ) : (
                      <div className="text-center">
                        <img src={REFERENCE_IMAGE} alt="Referencia" className="w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                          <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
                          <p className="text-gray-400 text-xs">Vista previa</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Se guardará en MinIO y se mostrará en la tienda.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Nombre del producto <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Smartphone Samsung Galaxy S24"
                      value={form.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Precio (COP) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 3500000"
                      value={form.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Stock disponible <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 20"
                      value={form.stock}
                      onChange={(e) => handleFormChange('stock', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoría</label>
                    <select
                      value={form.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    >
                      <option value="">Selecciona una categoría</option>
                      <option value="Computadores">Computadores</option>
                      <option value="Smartphones">Smartphones</option>
                      <option value="Audio">Audio</option>
                      <option value="Fotografía">Fotografía</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Tablets">Tablets</option>
                      <option value="Accesorios">Accesorios</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Describe las características principales del producto..."
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors resize-none"
                />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <ChevronRightIcon className="w-4 h-4 text-green-400" />
                  Especificaciones técnicas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Marca</label>
                    <input
                      type="text"
                      placeholder="Ej: Samsung"
                      value={form.brand}
                      onChange={(e) => handleFormChange('brand', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ej: Galaxy S24 Ultra"
                      value={form.model}
                      onChange={(e) => handleFormChange('model', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Garantía (meses) <span className="text-gray-500 font-normal">solo números</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej: 12"
                        value={form.warranty}
                        onChange={(e) => handleFormChange('warranty', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 pr-16 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-slate-700 px-2 py-1 rounded">meses</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Peso</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ej: 0.25"
                        value={form.weight}
                        onChange={(e) => handleFormChange('weight', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">kg</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Dimensiones</label>
                    <input
                      type="text"
                      placeholder="Ej: 15 x 7 x 0.9 cm"
                      value={form.dimensions}
                      onChange={(e) => handleFormChange('dimensions', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM); setImagePreview(''); setSelectedFile(null); }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-medium transition-colors border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={!form.name || !form.price || !form.stock || uploadingImage}
                  className="flex-1 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
                >
                  {uploadingImage ? "Subiendo imagen..." : "Publicar producto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PencilSquareIcon className="w-5 h-5 text-blue-400" />
                Editar producto
              </h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingId(null); setEditForm(EMPTY_FORM); setEditImagePreview(''); setEditSelectedFile(null); }}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Imagen del producto <span className="text-gray-500 font-normal">(archivo o URL)</span>
                  </label>
                  <div className="space-y-3 mb-3">
                    <label className="flex items-center justify-center gap-2 w-full bg-slate-800 border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-lg px-3 py-3 text-sm cursor-pointer transition text-center">
                      <ArrowUpTrayIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{editSelectedFile ? editSelectedFile.name : "Click para cambiar archivo (JPG, PNG, WEBP)"}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleEditImageFileChange} />
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="o pega URL https://..."
                        value={editForm.imageUrl}
                        onChange={(e) => handleEditFormChange('imageUrl', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    {editUploading && <p className="text-xs text-blue-400 animate-pulse">Subiendo imagen...</p>}
                  </div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center relative">
                    {editImagePreview ? (
                      <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" onError={() => setEditImagePreview(REFERENCE_IMAGE)} />
                    ) : (
                      <div className="text-center">
                        <img src={REFERENCE_IMAGE} alt="Referencia" className="w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                          <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
                          <p className="text-gray-400 text-xs">Vista previa</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Nombre del producto <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Smartphone Samsung Galaxy S24"
                      value={editForm.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Precio (COP) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 3500000"
                      value={editForm.price}
                      onChange={(e) => handleEditFormChange('price', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Stock disponible <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Ej: 20"
                      value={editForm.stock}
                      onChange={(e) => handleEditFormChange('stock', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Categoría</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => handleEditFormChange('category', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Selecciona una categoría</option>
                      <option value="Computadores">Computadores</option>
                      <option value="Smartphones">Smartphones</option>
                      <option value="Audio">Audio</option>
                      <option value="Fotografía">Fotografía</option>
                      <option value="Gaming">Gaming</option>
                      <option value="Tablets">Tablets</option>
                      <option value="Accesorios">Accesorios</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Describe las características principales del producto..."
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div>
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <ChevronRightIcon className="w-4 h-4 text-blue-400" />
                  Especificaciones técnicas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Marca</label>
                    <input
                      type="text"
                      placeholder="Ej: Samsung"
                      value={editForm.brand}
                      onChange={(e) => handleEditFormChange('brand', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ej: Galaxy S24 Ultra"
                      value={editForm.model}
                      onChange={(e) => handleEditFormChange('model', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Garantía (meses) <span className="text-gray-500 font-normal">solo números</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej: 12"
                        value={editForm.warranty}
                        onChange={(e) => handleEditFormChange('warranty', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 pr-16 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-slate-700 px-2 py-1 rounded">meses</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Peso</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ej: 0.25"
                        value={editForm.weight}
                        onChange={(e) => handleEditFormChange('weight', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 pr-12 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">kg</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Dimensiones</label>
                    <input
                      type="text"
                      placeholder="Ej: 15 x 7 x 0.9 cm"
                      value={editForm.dimensions}
                      onChange={(e) => handleEditFormChange('dimensions', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowEditModal(false); setEditingId(null); setEditForm(EMPTY_FORM); setEditImagePreview(''); setEditSelectedFile(null); }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-medium transition-colors border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateProduct}
                  disabled={!editForm.name || !editForm.price || !editForm.stock || editUploading}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30"
                >
                  {editUploading ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProfileDrawer(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <PencilSquareIcon className="w-5 h-5 text-green-400" />
                Editar perfil de tienda
              </h2>
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CameraIcon className="w-4 h-4" /> Logo de la tienda
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-800 rounded-xl flex items-center justify-center text-3xl font-bold text-green-500 border-2 border-dashed border-slate-700 overflow-hidden">
                    {sellerInfo.avatar}
                  </div>
                  <label className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm text-gray-300 transition-colors">
                      <ArrowUpTrayIcon className="w-4 h-4" />
                      Cambiar logo
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CameraIcon className="w-4 h-4" /> Banner de la tienda
                </h3>
                <label className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 py-6 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-700 rounded-xl text-sm text-gray-300 transition-colors">
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    Subir banner
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                </label>
              {bannerUploading && (
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center z-10">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              )}
              {bannerError && (
                <div className="absolute top-0 left-0 w-full h-full bg-black/50 rounded-full flex items-center justify-center text-white text-sm z-10">
                  {bannerError}
                </div>
              )}
              {bannerSuccess && (
                <div className="absolute top-0 left-0 w-full h-full bg-green-500/20 rounded-full flex items-center justify-center text-green-400 text-sm z-10">
                  Banner actualizado
                </div>
              )}
            </div>

              <div className="border-t border-slate-800 pt-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Información de la tienda</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Nombre de la tienda <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      placeholder="TechStore"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      placeholder="tienda@correo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Teléfono de contacto
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                      placeholder="+57 300 000 0000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 pb-4">
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-medium transition-colors border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateProfile}
                  disabled={!profileForm.name.trim()}
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">¿Eliminar producto?</h3>
            <p className="text-gray-400 text-sm mb-6">Esta acción no se puede deshacer. El producto será removido permanentemente.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl font-medium transition-colors border border-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteProduct(showDeleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
