'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// 修復 Leaflet 預設圖標問題
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const characterAvatars: Record<string, string> = {
  '魯夫': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luffy&backgroundColor=ff6b6b',
  '索隆': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoro&backgroundColor=4ecdc4',
  '香吉士': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanji&backgroundColor=ffe66d',
  '佛朗基': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Franky&backgroundColor=95e1d3',
  '娜美': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nami&backgroundColor=ff6b9d',
  '羅賓': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robin&backgroundColor=c44569',
  '喬巴': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chopper&backgroundColor=f8b500',
  '布魯克': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Brook&backgroundColor=a8e6cf',
  '甚平': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jinbe&backgroundColor=4a90e2',
  '騙人布': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Usopp&backgroundColor=ffa07a',
  '羅': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Law&backgroundColor=9b59b6',
  '大和': 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yamato&backgroundColor=ecf0f1',
};

interface TechnicianLocation {
  technicianId: string;
  technicianName: string;
  latitude: number;
  longitude: number;
  status: 'online' | 'offline';
  currentWorkOrder?: string;
}

interface WorkOrderLocation {
  workOrderId: string;
  latitude: number;
  longitude: number;
  customerName?: string;
}

interface MapViewProps {
  center: [number, number]; // [lat, lng]
  zoom?: number;
  technicianLocations?: TechnicianLocation[];
  workOrderLocations?: WorkOrderLocation[];
  height?: string;
  focusTechnicianId?: string; // 要聚焦的技術人員 ID
}

export default function MapView({
  center,
  zoom = 12,
  technicianLocations = [],
  workOrderLocations = [],
  height = '400px',
  focusTechnicianId,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // 初始化地圖
  useEffect(() => {
    // 確保只在客戶端執行
    if (typeof window === 'undefined') return;
    if (!mapContainerRef.current || mapRef.current) return;

    let map: L.Map | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let cleanupTimers: NodeJS.Timeout[] = [];

    // 確保容器有尺寸
    const checkAndInit = () => {
      if (!mapContainerRef.current || mapRef.current) return;
      
      // 如果容器還沒有尺寸，等待一下再初始化
      if (mapContainerRef.current.offsetWidth === 0 || mapContainerRef.current.offsetHeight === 0) {
        const timer = setTimeout(checkAndInit, 100);
        cleanupTimers.push(timer);
        return;
      }

      // 初始化地圖
      map = L.map(mapContainerRef.current).setView(center, zoom);

      // 添加 OpenStreetMap 圖層（只使用亮色模式）
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;

      // 設置 ResizeObserver 監聽容器大小變化
      resizeObserver = new ResizeObserver(() => {
        // 當容器大小改變時，更新地圖大小
        requestAnimationFrame(() => {
          if (map && !(map as any)._destroyed) {
            map.invalidateSize();
          }
        });
      });

      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      // 確保地圖在初始化時正確調整大小（多次調用以確保）
      const initSize = () => {
        if (map && !(map as any)._destroyed) {
          map.invalidateSize();
        }
      };
      
      // 立即調用一次
      initSize();
      
      // 使用多個延遲確保在不同渲染階段都能正確調整
      cleanupTimers.push(setTimeout(initSize, 0));
      cleanupTimers.push(setTimeout(initSize, 100));
      cleanupTimers.push(setTimeout(initSize, 300));
    };

    checkAndInit();

    // 清理函數
    return () => {
      cleanupTimers.forEach(timer => clearTimeout(timer));
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (map && !(map as any)._destroyed) {
        map.remove();
      }
      mapRef.current = null;
    };
  }, [center, zoom]);

  // 更新標記
  useEffect(() => {
    if (!mapRef.current) return;

    // 清除舊標記
    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // 添加技術人員標記
    technicianLocations.forEach((location) => {
      const avatarUrl = characterAvatars[location.technicianName] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${location.technicianName}&backgroundColor=b6e3f4`;
      const statusColor = location.status === 'online' ? 'border-green-500' : 'border-gray-400';
      const statusRing = location.status === 'online' ? 'ring-2 ring-green-500 ring-offset-1' : 'ring-2 ring-gray-400 ring-offset-1';
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative">
            <div class="relative ${statusRing} rounded-full inline-block">
              <div class="w-9 h-9 rounded-full shadow-lg overflow-hidden">
                <img 
                  src="${avatarUrl}" 
                  alt="${location.technicianName}"
                  class="w-full h-full rounded-full object-cover"
                  style="image-rendering: -webkit-optimize-contrast;"
                  onerror="this.onerror=null; this.src='https://api.dicebear.com/7.x/avataaars/svg?seed=${location.technicianName}&backgroundColor=b6e3f4'"
                />
              </div>
              <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-white shadow-sm ${
                location.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              } flex items-center justify-center">
                <div class="w-1.5 h-1.5 rounded-full ${
                  location.status === 'online' ? 'bg-white animate-pulse' : 'bg-gray-200'
                }"></div>
              </div>
            </div>
            <div class="absolute top-11 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-md text-xs z-10 font-semibold border border-gray-200 dark:border-gray-700">
              <div class="text-gray-900 dark:text-white">${location.technicianName}</div>
              ${location.currentWorkOrder ? `<div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-normal">${location.currentWorkOrder}</div>` : ''}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([location.latitude, location.longitude], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="text-sm">
            <strong>${location.technicianName}</strong><br/>
            狀態: ${location.status === 'online' ? '在線' : '離線'}<br/>
            ${location.currentWorkOrder ? `當前工單: ${location.currentWorkOrder}` : ''}
          </div>
        `);
      
      markersRef.current.push(marker);
    });

    // 添加工單標記
    workOrderLocations.forEach((location) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative">
            <div class="w-6 h-6 rounded-full border-2 border-white shadow-lg bg-red-500 flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
            </div>
            <div class="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-red-100 dark:bg-red-900 px-2 py-1 rounded shadow text-xs z-10">
              ${location.workOrderId}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24],
      });

      const marker = L.marker([location.latitude, location.longitude], { icon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div class="text-sm">
            <strong>${location.workOrderId}</strong><br/>
            ${location.customerName ? `客戶: ${location.customerName}` : ''}
          </div>
        `);
      
      markersRef.current.push(marker);
    });
  }, [technicianLocations, workOrderLocations]);

  // 當 focusTechnicianId 改變時，移動地圖到該技術人員的位置
  useEffect(() => {
    if (!mapRef.current || !focusTechnicianId) return;

    // 等待地圖完全初始化
    const timeoutId = setTimeout(() => {
      const technician = technicianLocations.find(loc => loc.technicianId === focusTechnicianId);
      if (technician && mapRef.current) {
        mapRef.current.setView([technician.latitude, technician.longitude], 15, {
          animate: true,
          duration: 0.5,
        });
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [focusTechnicianId, technicianLocations]);

  // 當容器大小改變時，更新地圖大小
  useEffect(() => {
    if (!mapRef.current) return;

    // 使用多個延遲確保在不同渲染階段都能正確調整
    const updateSize = () => {
      mapRef.current?.invalidateSize();
    };

    // 立即調用一次
    updateSize();
    
    // 使用多個延遲確保 DOM 更新後再調整地圖大小
    const timeoutId1 = setTimeout(updateSize, 0);
    const timeoutId2 = setTimeout(updateSize, 100);
    const timeoutId3 = setTimeout(updateSize, 300);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [height]);

  // 監聽視窗大小改變，自動調整地圖大小
  useEffect(() => {
    if (!mapRef.current) return;

    const handleResize = () => {
      // 使用 requestAnimationFrame 確保在下一幀更新
      requestAnimationFrame(() => {
        mapRef.current?.invalidateSize();
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ 
        height: height === '100%' ? '100%' : height,
        minHeight: height === '100%' ? 0 : undefined,
        position: 'relative',
      }}
    />
  );
}

