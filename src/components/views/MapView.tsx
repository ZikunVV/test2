import React, { useState, useEffect, useRef } from 'react';
import { ThemeConfig, GradientOption, House } from '../../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Search,
  ArrowLeft,
  Navigation,
  Check,
  Building2,
  AlertCircle,
  Save,
  Layers,
  Info,
} from 'lucide-react';

interface MapViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  houses: House[];
  initialSelectedHouseId?: string | null;
  onClearInitialSelectedHouseId?: () => void;
  onOpenHouse: (house: House) => void;
  onUpdateCoordinates: (houseId: string, lat: number, lng: number) => void;
  onBackToHome: () => void;
  isAdmin?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  houses,
  initialSelectedHouseId,
  onClearInitialSelectedHouseId,
  onOpenHouse,
  onUpdateCoordinates,
  onBackToHome,
  isAdmin = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<House | null>(
    houses[0] || null
  );

  // Form for editing coordinates
  const [editLat, setEditLat] = useState<string>(
    houses[0]?.latitude?.toString() || '51.5032'
  );
  const [editLng, setEditLng] = useState<string>(
    houses[0]?.longitude?.toString() || '31.3045'
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [houseId: string]: L.Marker }>({});

  // Sync when initialSelectedHouseId is provided (e.g. from HousesView "Показать дом на карте")
  useEffect(() => {
    if (initialSelectedHouseId) {
      const found = houses.find((h) => h.id === initialSelectedHouseId);
      if (found) {
        setSelectedHouse(found);
        setEditLat(found.latitude?.toString() || '51.5032');
        setEditLng(found.longitude?.toString() || '31.3045');
        if (mapInstanceRef.current && found.latitude && found.longitude) {
          mapInstanceRef.current.setView([found.latitude, found.longitude], 17);
        }
        onClearInitialSelectedHouseId?.();
      }
    }
  }, [initialSelectedHouseId, houses, onClearInitialSelectedHouseId]);

  // Helper to create clean custom pin icon
  const createPinIcon = (houseNumber: string, isSelected: boolean) => {
    return L.divIcon({
      className: 'custom-house-pin',
      html: `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translate(-50%, -100%);
          cursor: pointer;
        ">
          <div style="
            background: ${
              isSelected
                ? 'linear-gradient(135deg, #7652B5, #4E1B85)'
                : '#FFFFFF'
            };
            color: ${isSelected ? '#FFFFFF' : '#4E1B85'};
            font-weight: 800;
            font-size: 11px;
            font-family: ui-sans-serif, system-ui, sans-serif;
            padding: 4px 8px;
            border-radius: 8px;
            border: 2px solid ${isSelected ? '#C084FC' : '#7652B5'};
            box-shadow: 0 4px 14px rgba(78, 27, 133, 0.4);
            white-space: nowrap;
          ">
            <span>д. ${houseNumber}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${isSelected ? '#4E1B85' : '#7652B5'};
            margin-top: -1px;
          "></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  // 1. Initialize Map upon mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center around the first house or Chernihiv/Dotsenka coordinates
    const initialLat = houses[0]?.latitude || 51.5032;
    const initialLng = houses[0]?.longitude || 31.3045;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initialLat, initialLng], 15);

    // OpenStreetMap standard tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Fix possible leaflet sizing glitch when rendered in dynamic containers
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render and update markers whenever houses or selectedHouse changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add markers for all houses
    houses.forEach((h) => {
      const lat = h.latitude || 51.5032;
      const lng = h.longitude || 31.3045;
      const isSelected = selectedHouse?.id === h.id;

      const marker = L.marker([lat, lng], {
        icon: createPinIcon(
          `${h.house_number}${h.building ? ' к.' + h.building : ''}`,
          isSelected
        ),
      }).addTo(map);

      // Popup
      marker.bindPopup(`
        <div style="font-family: ui-sans-serif, system-ui, sans-serif; font-size: 12px; line-height: 1.4;">
          <div style="font-weight: 800; font-size: 13px; color: #18202F; margin-bottom: 2px;">
            ул. ${h.street}, д. ${h.house_number}${
        h.building ? ' корп. ' + h.building : ''
      }
          </div>
          <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">
            Подъездов: ${h.entrances?.length || 1} · Квартир: ${h.apartments} · Этажей: ${
        h.floors
      }
          </div>
          <div style="color: #6B21A8; font-weight: 700; font-size: 11px; margin-top: 3px;">
            ${h.managing_organization ? `В управлении (${h.managing_organization})` : 'В управлении'}
          </div>
          ${h.notes ? `<div style="color: #64748B; font-size: 11px; margin-top: 2px;">${h.notes}</div>` : ''}
        </div>
      `);

      marker.on('click', () => {
        setSelectedHouse(h);
        setEditLat(h.latitude?.toString() || '');
        setEditLng(h.longitude?.toString() || '');
      });

      markersRef.current[h.id] = marker;
    });
  }, [houses, selectedHouse]);

  // 3. Pan map when selectedHouse changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedHouse) return;

    const lat = selectedHouse.latitude || 51.5032;
    const lng = selectedHouse.longitude || 31.3045;

    map.flyTo([lat, lng], 16, {
      duration: 1.2,
    });

    const marker = markersRef.current[selectedHouse.id];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedHouse]);

  // Search logic matching v48.1 / v48.3: exact pair street + house number
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSelectedHouse(houses[0] || null);
      return;
    }

    const found = houses.find((h) => {
      const full1 = `${h.street} ${h.house_number}${h.building || ''}`.toLowerCase();
      const full2 = `${h.street}, ${h.house_number}`.toLowerCase();
      const streetNum = `${h.street.toLowerCase()} ${h.house_number.toLowerCase()}`;
      return (
        full1.includes(q) ||
        full2.includes(q) ||
        streetNum === q ||
        `${h.house_number.toLowerCase()}` === q
      );
    });

    if (found) {
      setSelectedHouse(found);
      setEditLat(found.latitude?.toString() || '');
      setEditLng(found.longitude?.toString() || '');
    } else {
      setSelectedHouse(null);
    }
  };

  const handleSaveCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouse) return;

    const lat = parseFloat(editLat.replace(',', '.'));
    const lng = parseFloat(editLng.replace(',', '.'));

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      alert(
        'Введите корректные координаты (широта от -90 до 90, долгота от -180 до 180).'
      );
      return;
    }

    onUpdateCoordinates(selectedHouse.id, lat, lng);
    setSelectedHouse({
      ...selectedHouse,
      latitude: lat,
      longitude: lng,
    });
    setSaveSuccessMsg('Координаты успешно сохранены!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-purple-100">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Главная</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800">Карта</span>
        </div>
      </div>

      {/* Header and Search */}
      <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-700" />
              <span>Карта объектов</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Поиск выполняется только по списку «Дома в управлении» — улица и номер дома.
            </p>
          </div>
        </div>

        {/* Search bar matching v48.3: placeholder "улица №дома" */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="улица №дома (например: Доценка 1, Доценка 5а)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-white font-bold text-xs shadow-xs transition-opacity hover:opacity-95"
            style={{
              background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
            }}
          >
            Найти
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedHouse(houses[0]);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
            >
              Сброс
            </button>
          )}
        </form>

        {/* If searched and not found message from v48.1 */}
        {searchQuery && !selectedHouse && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Такая улица, дом отсутствует в списке, за достоверной информацией обратиться к Администратору.
            </span>
          </div>
        )}
      </div>

      {/* Main Map View & House Coordinator Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Leaflet OpenStreetMap Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-purple-200/80 shadow-xs p-3.5 flex flex-col justify-between h-[480px] relative overflow-hidden">
          <div
            ref={mapContainerRef}
            className="w-full h-full rounded-xl overflow-hidden relative z-0"
            style={{ minHeight: '440px' }}
          />

          {/* Floating Map Info Pill */}
          <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-purple-200 shadow-sm flex items-center gap-2 text-xs font-semibold text-purple-900">
            <MapPin className="w-3.5 h-3.5 text-purple-700" />
            <span>
              {selectedHouse
                ? `Выбран дом: ул. ${selectedHouse.street}, ${selectedHouse.house_number}`
                : 'Кликните на маркер дома для информации'}
            </span>
          </div>
        </div>

        {/* Right Info and Coordinates Panel */}
        <div className="space-y-4">
          {selectedHouse ? (
            <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    Карточка объекта
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    ул. {selectedHouse.street}, д. {selectedHouse.house_number}
                    {selectedHouse.building
                      ? ` корп. ${selectedHouse.building}`
                      : ''}
                  </h3>
                  <div className="mt-1">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                      {selectedHouse.managing_organization
                        ? `В управлении (${selectedHouse.managing_organization})`
                        : 'В управлении'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onOpenHouse(selectedHouse)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold border border-purple-300 transition-colors shadow-2xs flex items-center gap-1"
                  title="Перейти к полной карточке дома в разделе «Дома в управлении»"
                >
                  <span>Открыть дом</span>
                  <span>→</span>
                </button>
              </div>

              {/* House parameters */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">
                    Подъездов
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedHouse.entrances?.length || 1}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">
                    Квартир
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedHouse.apartments}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">
                    Этажей
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedHouse.floors}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">
                    Площадь
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedHouse.area ? `${selectedHouse.area} м²` : '—'}
                  </span>
                </div>
              </div>

              {selectedHouse.notes && (
                <div className="text-xs text-slate-600 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                  <strong>Примечание:</strong> {selectedHouse.notes}
                </div>
              )}

              {/* Coordinates Editor: visible ONLY to moderators with access rights */}
              {isAdmin && (
                <form
                  onSubmit={handleSaveCoordinates}
                  className="pt-3 border-t border-purple-100 space-y-3"
                >
                  <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                    <span>Координаты на карте</span>
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold">
                      Права: Модератор
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                        Широта (Latitude)
                      </label>
                      <input
                        type="text"
                        value={editLat}
                        onChange={(e) => setEditLat(e.target.value)}
                        placeholder="51.5032"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                        Долгота (Longitude)
                      </label>
                      <input
                        type="text"
                        value={editLng}
                        onChange={(e) => setEditLng(e.target.value)}
                        placeholder="31.3045"
                        className="w-full px-2.5 py-1.5 rounded-xl border border-purple-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {saveSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Сохранить координаты дома</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs p-6 text-center text-xs text-slate-500 space-y-2">
              <Building2 className="w-8 h-8 text-purple-300 mx-auto" />
              <div className="font-bold text-slate-800">Дом не выбран</div>
              <p>
                Выберите дом из списка ниже или воспользуйтесь строкой поиска в формате «улица №дома».
              </p>
            </div>
          )}

          {/* Quick list of managed houses */}
          <div className="bg-white rounded-2xl border border-purple-200/80 shadow-xs p-4 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between pb-1 border-b border-purple-100">
              <span>Дома в управлении ({houses.length})</span>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-purple-50 text-xs">
              {houses.map((h) => {
                const isCurrent = selectedHouse?.id === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => {
                      setSelectedHouse(h);
                      setEditLat(h.latitude?.toString() || '');
                      setEditLng(h.longitude?.toString() || '');
                    }}
                    className={`w-full text-left py-2 px-2 rounded-lg flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-purple-100 text-purple-950 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>
                      ул. {h.street}, {h.house_number}
                      {h.building ? ` к. ${h.building}` : ''}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {h.apartments} кв.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
