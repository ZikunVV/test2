import React, { useState, useEffect } from 'react';
import { ThemeConfig, GradientOption, House, Ticket, Entrance, StreetItem } from '../../types';
import {
  Building2,
  ArrowLeft,
  FileText,
  Layers,
  Edit,
  X,
  Check,
  Clock,
  Save,
  Building,
  MapPin,
} from 'lucide-react';
import { normalizeStreetName } from '../../utils/streets';

interface HousesViewProps {
  theme: ThemeConfig;
  gradient: GradientOption;
  showFlatFallback: boolean;
  houses: House[];
  tickets: Ticket[];
  streets?: StreetItem[];
  initialSelectedHouseId?: string | null;
  onClearInitialSelectedHouseId?: () => void;
  onShowOnMap?: (house: House) => void;
  onOpenTicket: (ticket: Ticket) => void;
  onUpdateHouse: (house: House) => void;
  onCreateHouse: (house: House) => void;
  onBackToHome: () => void;
  isAdmin?: boolean;
  canAddHouse?: boolean;
  canEditHouse?: boolean;
}

export const HousesView: React.FC<HousesViewProps> = ({
  theme,
  gradient,
  showFlatFallback,
  houses,
  tickets,
  streets = [],
  initialSelectedHouseId,
  onClearInitialSelectedHouseId,
  onShowOnMap,
  onOpenTicket,
  onUpdateHouse,
  onCreateHouse,
  onBackToHome,
  isAdmin = true,
  canAddHouse = isAdmin,
  canEditHouse = isAdmin,
}) => {
  // Search state
  const [streetQuery, setStreetQuery] = useState('');
  const [houseNumQuery, setHouseNumQuery] = useState('');
  const [buildingQuery, setBuildingQuery] = useState('');

  // Mode: 'recent' (last 20 viewed houses) vs 'all' (all houses)
  const [viewMode, setViewMode] = useState<'recent' | 'all'>('recent');

  // Track recently viewed house IDs in localStorage (up to 20 houses)
  const [viewedHouseIds, setViewedHouseIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('app_recently_viewed_houses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    // Default seed: first 20 houses from list
    return houses.slice(0, 20).map((h) => h.id);
  });

  const recordHouseView = (houseId: string) => {
    setViewedHouseIds((prev) => {
      const next = [houseId, ...prev.filter((id) => id !== houseId)].slice(0, 20);
      try {
        localStorage.setItem('app_recently_viewed_houses', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Selection & Detail view
  const [selectedHouseId, setSelectedHouseId] = useState<string | null>(null);
  const [activeHouseDetail, setActiveHouseDetail] = useState<House | null>(null);

  // Selected Tab in Technical Documentation: 'house' or entrance number
  const [selectedEntranceTab, setSelectedEntranceTab] = useState<'house' | number>('house');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewHouseModalOpen, setIsNewHouseModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Address duplicate conflict state (shows comparison between old and new house tables)
  const [duplicateConflict, setDuplicateConflict] = useState<{
    existingHouse: House;
    newHouseCandidate: House;
  } | null>(null);

  // Form state for creating a new house
  const [newStreet, setNewStreet] = useState('');
  const [newHouseNum, setNewHouseNum] = useState('');
  const [newBuilding, setNewBuilding] = useState('');
  const [newFloors, setNewFloors] = useState<number | string>(0);
  const [newApartments, setNewApartments] = useState<number | string>(0);
  const [newEntrancesCount, setNewEntrancesCount] = useState<number | string>(0);
  const [newNotes, setNewNotes] = useState('');
  const [newTechSpecs, setNewTechSpecs] = useState('');
  const [newHouseData, setNewHouseData] = useState('');
  const [newManagingOrg, setNewManagingOrg] = useState('');
  const [newEntrances, setNewEntrances] = useState<Entrance[]>([]);
  const [activeNewEntranceTab, setActiveNewEntranceTab] = useState<number>(1);
  const [activeEditEntranceTab, setActiveEditEntranceTab] = useState<number>(1);

  // Synchronize newEntrances when count changes in create house modal
  useEffect(() => {
    const count = Number(newEntrancesCount) > 0 ? Number(newEntrancesCount) : 0;
    const floorsVal = Number(newFloors) > 0 ? Number(newFloors) : 0;
    const aptsVal = Number(newApartments) > 0 ? Number(newApartments) : 0;
    const aptPerEnt = count > 0 ? Math.ceil(aptsVal / count) : 0;

    setNewEntrances((prev) => {
      const result: Entrance[] = [];
      for (let i = 1; i <= count; i++) {
        const existing = prev.find((e) => e.entrance_no === i);
        if (existing) {
          result.push({
            ...existing,
            floors: existing.floors || floorsVal,
            apartment_from: existing.apartment_from ?? ((i - 1) * aptPerEnt + 1),
            apartment_to: existing.apartment_to ?? (i === count ? aptsVal : i * aptPerEnt),
          });
        } else {
          result.push({
            entrance_no: i,
            floors: floorsVal,
            apartment_from: (i - 1) * aptPerEnt + 1,
            apartment_to: i === count ? aptsVal : i * aptPerEnt,
            description: '',
          });
        }
      }
      return result;
    });

    if (activeNewEntranceTab > count && count > 0) {
      setActiveNewEntranceTab(1);
    }
  }, [newEntrancesCount, newFloors, newApartments]);

  // Keep activeHouseDetail in sync if updated from props
  useEffect(() => {
    if (activeHouseDetail) {
      const found = houses.find((h) => h.id === activeHouseDetail.id);
      if (found) {
        setActiveHouseDetail(found);
      }
    }
  }, [houses]);

  // Handle external open house request (e.g. from MapView)
  useEffect(() => {
    if (initialSelectedHouseId) {
      const found = houses.find((h) => h.id === initialSelectedHouseId);
      if (found) {
        setActiveHouseDetail(found);
        setSelectedHouseId(found.id);
        recordHouseView(found.id);
        onClearInitialSelectedHouseId?.();
      }
    }
  }, [initialSelectedHouseId, houses, onClearInitialSelectedHouseId]);

  // Determine list of houses to show
  const baseHouses = React.useMemo(() => {
    if (viewMode === 'recent') {
      const houseMap = new Map(houses.map((h) => [h.id, h]));
      const recentList: House[] = [];
      viewedHouseIds.forEach((id) => {
        const h = houseMap.get(id);
        if (h) recentList.push(h);
      });
      // If viewed list has fewer than 20, fill up with remaining houses up to 20
      if (recentList.length < 20) {
        houses.forEach((h) => {
          if (!recentList.some((rh) => rh.id === h.id) && recentList.length < 20) {
            recentList.push(h);
          }
        });
      }
      return recentList;
    }
    // "Все дома": сортировать улицы и номер дома по алфавиту
    return [...houses].sort((a, b) => {
      const streetCmp = (a.street || '').localeCompare(b.street || '', 'ru', { numeric: true, sensitivity: 'base' });
      if (streetCmp !== 0) return streetCmp;
      const numCmp = (a.house_number || '').localeCompare(b.house_number || '', 'ru', { numeric: true, sensitivity: 'base' });
      if (numCmp !== 0) return numCmp;
      return (a.building || '').localeCompare(b.building || '', 'ru', { numeric: true, sensitivity: 'base' });
    });
  }, [houses, viewMode, viewedHouseIds]);

  // Filtered houses by search inputs
  const filteredHouses = baseHouses.filter((h) => {
    const matchStreet =
      !streetQuery || h.street.toLowerCase().includes(streetQuery.toLowerCase());
    const matchNum =
      !houseNumQuery ||
      h.house_number.toLowerCase().includes(houseNumQuery.toLowerCase());
    const matchBuilding =
      !buildingQuery ||
      (h.building || '').toLowerCase().includes(buildingQuery.toLowerCase());
    return matchStreet && matchNum && matchBuilding;
  });

  const handleHouseClick = (house: House) => {
    setSelectedHouseId((prev) => (prev === house.id ? null : house.id));
    recordHouseView(house.id);
  };

  const handleHouseDoubleClick = (house: House) => {
    setActiveHouseDetail(house);
    setSelectedEntranceTab('house'); // Default to 'Дом' tab
    recordHouseView(house.id);
  };

  const handleStartEdit = (house: House) => {
    // Ensure entrances array contains items up to entrances_count
    const count = Math.max(1, house.entrances_count || 1);
    const existingEntrances = house.entrances || [];
    const populatedEntrances: Entrance[] = [];

    for (let i = 1; i <= count; i++) {
      const existing = existingEntrances.find((e) => e.entrance_no === i);
      if (existing) {
        populatedEntrances.push({ ...existing });
      } else {
        const aptPerEntrance = Math.ceil(house.apartments / count) || 36;
        populatedEntrances.push({
          entrance_no: i,
          floors: house.floors || 9,
          apartment_from: (i - 1) * aptPerEntrance + 1,
          apartment_to: i * aptPerEntrance,
          description: '',
        });
      }
    }

    setEditingHouse({
      ...house,
      entrances: populatedEntrances,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHouse) return;

    if (!editingHouse.street.trim() || !editingHouse.house_number.trim()) {
      alert('Укажите улицу и номер дома.');
      return;
    }

    const count = Math.max(1, editingHouse.entrances_count || 1);
    const existingEntrances = editingHouse.entrances || [];
    const finalEntrances: Entrance[] = [];

    for (let i = 1; i <= count; i++) {
      const existing = existingEntrances.find((e) => e.entrance_no === i);
      if (existing) {
        finalEntrances.push({ ...existing });
      } else {
        const aptPerEntrance = Math.ceil(editingHouse.apartments / count) || 36;
        finalEntrances.push({
          entrance_no: i,
          floors: editingHouse.floors || 9,
          apartment_from: (i - 1) * aptPerEntrance + 1,
          apartment_to: i * aptPerEntrance,
          description: '',
        });
      }
    }

    const normalized = normalizeStreetName(editingHouse.street, streets);
    const finalStreet = normalized.officialName || editingHouse.street.trim();

    const savedHouse: House = {
      ...editingHouse,
      street: finalStreet,
      house_number: editingHouse.house_number.trim(),
      building: editingHouse.building?.trim() || undefined,
      floors: Math.max(0, Number(editingHouse.floors) || 0),
      apartments: Math.max(0, Number(editingHouse.apartments) || 0),
      entrances_count: count,
      notes: editingHouse.notes?.trim() || undefined,
      house_data: editingHouse.house_data?.trim() || undefined,
      technical_specs: editingHouse.technical_specs?.trim() || undefined,
      managing_organization: editingHouse.managing_organization?.trim() || undefined,
      entrances: finalEntrances,
    };

    onUpdateHouse(savedHouse);
    setActiveHouseDetail(savedHouse);
    setIsEditModalOpen(false);

    if (normalized.isNormalized) {
      setToastMessage(
        `Старое название улицы «${normalized.matchedOldName}» автоматически заменено на «${normalized.officialName}»!`
      );
    } else {
      setToastMessage('Данные дома успешно сохранены!');
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateNewHouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim() || !newHouseNum.trim()) {
      alert('Пожалуйста, заполните улицу и номер дома.');
      return;
    }

    const normalized = normalizeStreetName(newStreet, streets);
    const finalStreet = normalized.officialName || newStreet.trim();

    const count = Number(newEntrancesCount) > 0 ? Number(newEntrancesCount) : 0;
    const floorsVal = Number(newFloors) > 0 ? Number(newFloors) : 0;
    const aptsVal = Number(newApartments) > 0 ? Number(newApartments) : 0;
    const aptPerEnt = count > 0 ? Math.ceil(aptsVal / count) : 0;

    const generatedEntrances: Entrance[] = [];
    if (count > 0) {
      for (let i = 1; i <= count; i++) {
        generatedEntrances.push({
          entrance_no: i,
          floors: floorsVal,
          apartment_from: (i - 1) * aptPerEnt + 1,
          apartment_to: i === count ? aptsVal : i * aptPerEnt,
          description: '',
        });
      }
    }

    const finalEntrancesToSave = newEntrances.length > 0 ? newEntrances : generatedEntrances;

    const newHouse: House = {
      id: `h-${Date.now()}`,
      street: finalStreet,
      house_number: newHouseNum.trim(),
      building: newBuilding.trim() || undefined,
      floors: floorsVal,
      apartments: aptsVal,
      entrances_count: count,
      notes: newNotes.trim() || undefined,
      technical_specs: newTechSpecs.trim() || undefined,
      house_data: newHouseData.trim() || undefined,
      managing_organization: newManagingOrg.trim() || undefined,
      latitude: 51.5032 + (Math.random() - 0.5) * 0.008,
      longitude: 31.3045 + (Math.random() - 0.5) * 0.008,
      entrances: finalEntrancesToSave,
    };

    // Check if address already exists (street + house number + building)
    const existingDuplicate = houses.find((h) => {
      const normH = normalizeStreetName(h.street, streets).officialName || h.street;
      const sameStreet = normH.trim().toLowerCase() === finalStreet.trim().toLowerCase();
      const sameNum = (h.house_number || '').trim().toLowerCase() === newHouseNum.trim().toLowerCase();
      const sameBuilding = (h.building || '').trim().toLowerCase() === newBuilding.trim().toLowerCase();
      return sameStreet && sameNum && sameBuilding;
    });

    if (existingDuplicate) {
      setDuplicateConflict({
        existingHouse: existingDuplicate,
        newHouseCandidate: newHouse,
      });
      return;
    }

    onCreateHouse(newHouse);
    recordHouseView(newHouse.id);
    setSelectedHouseId(newHouse.id);
    setIsNewHouseModalOpen(false);

    // Reset create form
    setNewStreet('');
    setNewHouseNum('');
    setNewBuilding('');
    setNewFloors(0);
    setNewApartments(0);
    setNewEntrancesCount(0);
    setNewNotes('');
    setNewTechSpecs('');
    setNewHouseData('');
    setNewManagingOrg('');
    setNewEntrances([]);
    setActiveNewEntranceTab(1);

    if (normalized.isNormalized) {
      setToastMessage(
        `Дом добавлен! Старое название улицы «${normalized.matchedOldName}» автоматически заменено на актуальное «${normalized.officialName}».`
      );
    } else {
      setToastMessage(`Дом ул. ${newHouse.street}, ${newHouse.house_number} успешно добавлен!`);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleChooseExisting = () => {
    if (duplicateConflict) {
      setSelectedHouseId(duplicateConflict.existingHouse.id);
      recordHouseView(duplicateConflict.existingHouse.id);
      setActiveHouseDetail(duplicateConflict.existingHouse);
    }
    setDuplicateConflict(null);
    setIsNewHouseModalOpen(false);
    setToastMessage('Сохранена текущая (старая) версия карточки дома.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleChooseNew = () => {
    if (duplicateConflict) {
      const updated: House = {
        ...duplicateConflict.newHouseCandidate,
        id: duplicateConflict.existingHouse.id,
        latitude: duplicateConflict.existingHouse.latitude,
        longitude: duplicateConflict.existingHouse.longitude,
      };
      onUpdateHouse(updated);
      setSelectedHouseId(updated.id);
      setActiveHouseDetail(updated);
      recordHouseView(updated.id);
    }
    setDuplicateConflict(null);
    setIsNewHouseModalOpen(false);
    // Reset create form
    setNewStreet('');
    setNewHouseNum('');
    setNewBuilding('');
    setNewFloors(0);
    setNewApartments(0);
    setNewEntrancesCount(0);
    setNewNotes('');
    setNewTechSpecs('');
    setNewHouseData('');
    setNewEntrances([]);
    setToastMessage('Карточка дома успешно обновлена новой версией!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
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
          {activeHouseDetail ? (
            <>
              <button
                onClick={() => setActiveHouseDetail(null)}
                className="font-semibold text-purple-700 hover:text-purple-900"
              >
                Дома в управлении
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-800">
                ул. {activeHouseDetail.street}, {activeHouseDetail.house_number}
                {activeHouseDetail.building ? ` к. ${activeHouseDetail.building}` : ''}
              </span>
            </>
          ) : (
            <span className="font-bold text-slate-800">Дома в управлении</span>
          )}
        </div>

        {/* Action Button: "Добавить дом" (without "+") */}
        {canAddHouse && !activeHouseDetail && (
          <button
            onClick={() => setIsNewHouseModalOpen(true)}
            className="px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:opacity-95 transition-opacity"
            style={{
              background: showFlatFallback ? '#7652B5' : gradient.cssGradient,
            }}
          >
            <span>Добавить дом</span>
          </button>
        )}
      </div>

      {/* DETAILED CARD VIEW OF SELECTED HOUSE */}
      {activeHouseDetail ? (
        <div className="space-y-6">
          {/* Card Header: NO text under the house title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-purple-200/80 shadow-xs">
            <div>
              <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
                Карточка дома
              </div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-purple-700" />
                <span>
                  ул. {activeHouseDetail.street}, д. {activeHouseDetail.house_number}
                  {activeHouseDetail.building ? ` корп. ${activeHouseDetail.building}` : ''}
                </span>
              </h2>
              <div className="mt-1.5">
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200">
                  {activeHouseDetail.managing_organization
                    ? `В управлении (${activeHouseDetail.managing_organization})`
                    : 'В управлении'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onShowOnMap?.(activeHouseDetail)}
                className="px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Показать этот дом на интерактивной карте"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Показать дом на карте</span>
              </button>

              {canEditHouse && (
                <button
                  type="button"
                  onClick={() => handleStartEdit(activeHouseDetail)}
                  className="px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Изменить данные дома</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveHouseDetail(null)}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Закрыть карточку дома"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick House Summary stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-purple-200/80 text-center">
              <span className="text-slate-400 block text-[11px] font-semibold">Подъездов</span>
              <strong className="text-lg font-black text-slate-900">
                {activeHouseDetail.entrances_count}
              </strong>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-purple-200/80 text-center">
              <span className="text-slate-400 block text-[11px] font-semibold">Этажей</span>
              <strong className="text-lg font-black text-slate-900">
                {activeHouseDetail.floors}
              </strong>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-purple-200/80 text-center">
              <span className="text-slate-400 block text-[11px] font-semibold">Квартир</span>
              <strong className="text-lg font-black text-slate-900">
                {activeHouseDetail.apartments}
              </strong>
            </div>
          </div>

          {/* Section: Примечания (if any) */}
          {activeHouseDetail.notes && (
            <div className="p-4 rounded-2xl border border-purple-200/80 bg-white space-y-1.5 text-xs">
              <div className="font-bold text-purple-950 uppercase tracking-wider text-[11px]">
                Примечания
              </div>
              <div className="text-slate-700 leading-relaxed bg-purple-50/40 p-3 rounded-xl border border-purple-100">
                {activeHouseDetail.notes}
              </div>
            </div>
          )}

          {/* Section: Техническая документация: Подъезды */}
          {/* Tabs: "Дом" is FIRST, followed by ALL entrances up to entrances_count */}
          <div className="p-5 rounded-2xl border border-purple-200/80 bg-white space-y-4">
            <div>
              <div className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                Техническая документация
              </div>
            </div>

            {/* Entrance Tabs list: "Дом" tab first, then every entrance */}
            <div className="flex flex-wrap items-center gap-2 border-b border-purple-100 pb-3">
              {/* Tab 1: ДОМ */}
              <button
                type="button"
                onClick={() => setSelectedEntranceTab('house')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                  selectedEntranceTab === 'house'
                    ? 'bg-purple-100/90 text-purple-950 border-purple-400 shadow-xs ring-2 ring-purple-300'
                    : 'bg-white hover:bg-purple-50 text-slate-700 border-purple-200'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-purple-700" />
                <span>Дом</span>
              </button>

              {/* Tabs for all entrances: from 1 up to entrances_count */}
              {Array.from(
                {
                  length: Math.max(
                    activeHouseDetail.entrances_count,
                    activeHouseDetail.entrances?.length || 0,
                    1
                  ),
                },
                (_, idx) => {
                  const entNo = idx + 1;
                  const isSelected = selectedEntranceTab === entNo;
                  return (
                    <button
                      key={entNo}
                      type="button"
                      onClick={() => setSelectedEntranceTab(entNo)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-purple-100/90 text-purple-950 border-purple-400 shadow-xs ring-2 ring-purple-300'
                          : 'bg-white hover:bg-purple-50 text-slate-700 border-purple-200'
                      }`}
                    >
                      Подъезд {entNo}
                    </button>
                  );
                }
              )}
            </div>

            {/* Tab Content */}
            {selectedEntranceTab === 'house' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-purple-200 bg-[#FAF8FE] space-y-3 text-xs">
                  <div className="font-bold text-sm text-purple-950 flex items-center gap-2">
                    <Building className="w-4 h-4 text-purple-700" />
                    <span>Общие данные и паспорт дома</span>
                  </div>
                  <div>
                    <strong className="text-slate-800 block mb-1">Данные по дому:</strong>
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-purple-100">
                      {activeHouseDetail.house_data || 'Данные паспорта дома пока не внесены.'}
                    </div>
                  </div>
                  <div>
                    <strong className="text-slate-800 block mb-1">Технические характеристики дома:</strong>
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-purple-100">
                      {activeHouseDetail.technical_specs || 'Техническое описание конструкций не заполнено.'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Selected Entrance Details */
              (() => {
                const entNo = selectedEntranceTab as number;
                const curEntrance = activeHouseDetail.entrances?.find(
                  (e) => e.entrance_no === entNo
                );
                const aptPerEnt = Math.ceil(
                  activeHouseDetail.apartments / Math.max(1, activeHouseDetail.entrances_count)
                );
                const fallbackFrom = (entNo - 1) * aptPerEnt + 1;
                const fallbackTo = Math.min(entNo * aptPerEnt, activeHouseDetail.apartments);

                const aptFrom = curEntrance?.apartment_from ?? fallbackFrom;
                const aptTo = curEntrance?.apartment_to ?? fallbackTo;
                const floors = curEntrance?.floors ?? activeHouseDetail.floors;
                const description = curEntrance?.description;

                return (
                  <div className="p-4 rounded-xl border border-purple-200 bg-[#FAF8FE] space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-purple-950">
                      <span className="text-sm">Подъезд №{entNo}</span>
                      <span className="font-mono text-xs text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                        {floors} этажей · квартиры {aptFrom}–{aptTo}
                      </span>
                    </div>
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-purple-100 min-h-[60px]">
                      {description || 'Техническое описание для этого подъезда пока не заполнено.'}
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Section: Заявки по данному дому */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                Заявки по дому
              </h3>
            </div>

            {(() => {
              const houseTickets = tickets.filter(
                (t) =>
                  t.address.toLowerCase().includes(activeHouseDetail.street.toLowerCase()) &&
                  t.address.includes(activeHouseDetail.house_number)
              );

              if (houseTickets.length === 0) {
                return (
                  <div className="p-6 rounded-2xl border border-purple-100 bg-white text-center text-xs text-slate-500">
                    Активных заявок по этому дому нет.
                  </div>
                );
              }

              return (
                <div className="space-y-2.5">
                  {houseTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedHouseId(t.id)}
                      onDoubleClick={() => onOpenTicket(t)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer bg-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        selectedHouseId === t.id
                          ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-300'
                          : 'border-purple-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-900">
                            {t.number}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              t.status === 'in_waiting'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : t.status === 'in_progress'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {t.status === 'in_waiting'
                              ? 'В ожидании'
                              : t.status === 'in_progress'
                              ? 'В работе'
                              : 'Выполнено'}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900">{t.title}</div>
                      </div>

                      <div className="text-slate-500 text-[11px] sm:text-right shrink-0">
                        <div>Исполнитель: <strong>{t.assignee}</strong></div>
                        <div className="text-slate-400">{t.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* HOUSES LIST VIEW: Sequential row-by-row ("по очереди") */
        <div className="space-y-4">
          {/* Header Title & Switch: Recent 20 vs All Houses */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                Дома в управлении
              </h2>
            </div>

            {/* View Mode Toggle: Last 20 viewed vs All */}
            <div className="flex items-center gap-1.5 p-1 bg-purple-50/70 border border-purple-200 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('recent')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'recent'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-800 hover:bg-purple-100/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Последние 20 просмотренных ({Math.min(20, baseHouses.length)})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'all'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'text-purple-800 hover:bg-purple-100/60'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Все дома ({houses.length})</span>
              </button>
            </div>
          </div>

          {/* Search filter: Улица, № дома, Корпус */}
          <div className="p-4 rounded-2xl border border-purple-200/80 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Улица
              </label>
              <input
                type="text"
                value={streetQuery}
                onChange={(e) => setStreetQuery(e.target.value)}
                placeholder="Например: Доценка"
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                № дома
              </label>
              <input
                type="text"
                value={houseNumQuery}
                onChange={(e) => setHouseNumQuery(e.target.value)}
                placeholder="1, 3, 5..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Корпус
              </label>
              <input
                type="text"
                value={buildingQuery}
                onChange={(e) => setBuildingQuery(e.target.value)}
                placeholder="а, б..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>
          </div>

          {/* Sequential List of Houses: "все описания дома идут по очереди" */}
          <div className="space-y-3">
            {filteredHouses.length === 0 ? (
              <div className="p-8 rounded-2xl border border-purple-100 bg-white text-center text-xs text-slate-500">
                Дома по заданным критериям не найдены.
              </div>
            ) : (
              filteredHouses.map((house) => {
                const isSelected = selectedHouseId === house.id;
                const relatedTickets = tickets.filter(
                  (t) =>
                    t.address.toLowerCase().includes(house.street.toLowerCase()) &&
                    t.address.includes(house.house_number)
                );
                const activeCount = relatedTickets.filter(
                  (t) => t.status !== 'completed'
                ).length;

                return (
                  <div
                    key={house.id}
                    onClick={() => handleHouseClick(house)}
                    onDoubleClick={() => handleHouseDoubleClick(house)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden group flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-5 ${
                      isSelected
                        ? 'ring-2 ring-purple-400 shadow-md scale-[1.006]'
                        : 'border-purple-200 hover:border-purple-300 hover:bg-slate-50/40 shadow-2xs hover:shadow-xs'
                    }`}
                    style={{
                      backgroundColor: isSelected ? '#FAF5FF' : '#FFFFFF',
                      borderColor: isSelected ? '#C084FC' : undefined,
                    }}
                  >
                    {/* Left Accent indicator stripe like on Main TicketCard */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${
                        isSelected ? 'w-2.5 shadow-xs' : 'w-1.5'
                      }`}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(180deg, #E9D5FF 0%, #A855F7 50%, #6B21A8 100%)'
                          : 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 100%)',
                      }}
                    />

                    {/* Left: House Identity & Address */}
                    <div className="space-y-1 sm:min-w-[240px]">
                      <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">
                        {house.managing_organization
                          ? `В управлении (${house.managing_organization})`
                          : 'В управлении'}
                      </div>
                      <h3
                        className="font-extrabold text-base flex items-center gap-1.5 transition-colors"
                        style={{
                          color: isSelected ? '#3B126D' : '#0F172A',
                        }}
                      >
                        <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
                        <span>
                          ул. {house.street}, {house.house_number}
                          {house.building ? ` корп. ${house.building}` : ''}
                        </span>
                      </h3>
                      {house.notes && (
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {house.notes}
                        </p>
                      )}
                    </div>

                    {/* Middle: Technical specs parameters */}
                    <div className="flex items-center gap-6 text-xs text-slate-600 sm:border-x sm:border-purple-100 sm:px-6">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          Этажей
                        </span>
                        <strong className="text-slate-800 text-sm">{house.floors}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          Квартир
                        </span>
                        <strong className="text-slate-800 text-sm">{house.apartments}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          Подъездов
                        </span>
                        <strong className="text-slate-800 text-sm">
                          {house.entrances_count}
                        </strong>
                      </div>
                    </div>

                    {/* Right: Status badge & Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          activeCount > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {activeCount > 0 ? `Заявок: ${activeCount}` : 'В норме'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW HOUSE MODAL */}
      {isNewHouseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-xl p-3.5 sm:p-6 border border-purple-200 shadow-2xl space-y-3.5 sm:space-y-4 text-xs my-auto max-h-[90vh] overflow-y-auto overflow-x-hidden box-border">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Добавление нового дома
                </h3>
                <p className="text-[11px] text-slate-500">
                  Минимально укажите улицу и номер дома для регистрации в реестре.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewHouseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewHouse} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="min-w-0">
                  <label className="font-bold text-slate-700 block mb-1">
                    Улица *
                  </label>
                  <input
                    type="text"
                    required
                    list="create-house-street-suggestions"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="Например: Доценка"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                  <datalist id="create-house-street-suggestions">
                    {streets.map((s) => (
                      <option key={s.id} value={s.current_name}>
                        {s.current_name} {s.old_names ? `(ранее: ${s.old_names})` : ''}
                      </option>
                    ))}
                  </datalist>
                  {(() => {
                    const norm = normalizeStreetName(newStreet, streets);
                    if (norm.isNormalized) {
                      return (
                        <div className="mt-1 text-[10px] text-purple-800 bg-purple-50 p-1 rounded-md border border-purple-200">
                          Прежнее название («{norm.matchedOldName}»). Дом будет сохранён как «{norm.officialName}».
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    № дома *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHouseNum}
                    onChange={(e) => setNewHouseNum(e.target.value)}
                    placeholder="1, 5, 12..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Корпус
                  </label>
                  <input
                    type="text"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                    placeholder="а, б (необязательно)"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Подъездов
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newEntrancesCount}
                    onChange={(e) =>
                      setNewEntrancesCount(
                        e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      )
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Этажей
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newFloors}
                    onChange={(e) =>
                      setNewFloors(
                        e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      )
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Квартир
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newApartments}
                    onChange={(e) =>
                      setNewApartments(
                        e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                      )
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
              </div>

              {/* Detailed Entrance Description in Create House Modal */}
              {Number(newEntrancesCount) > 0 && newEntrances.length > 0 && (
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 text-xs">
                      Описание каждого подъезда (всего: {newEntrances.length})
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold bg-white px-2 py-0.5 rounded-md border border-purple-200">
                      Укажите данные по каждому подъезду
                    </span>
                  </div>

                  {/* Entrance Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-purple-200/70 pb-2">
                    {newEntrances.map((ent) => (
                      <button
                        key={ent.entrance_no}
                        type="button"
                        onClick={() => setActiveNewEntranceTab(ent.entrance_no)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          activeNewEntranceTab === ent.entrance_no
                            ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-purple-100/60 border-purple-200'
                        }`}
                      >
                        Подъезд №{ent.entrance_no}
                      </button>
                    ))}
                  </div>

                  {/* Active Entrance Form */}
                  {(() => {
                    const currentEntrance =
                      newEntrances.find((e) => e.entrance_no === activeNewEntranceTab) ||
                      newEntrances[0];
                    if (!currentEntrance) return null;

                    return (
                      <div className="space-y-2.5 bg-white p-3 rounded-xl border border-purple-100">
                        <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                          <span>Подъезд №{currentEntrance.entrance_no}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-600 font-bold block mb-1">
                              Этажей
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentEntrance.floors}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setNewEntrances((prev) =>
                                  prev.map((item) =>
                                    item.entrance_no === currentEntrance.entrance_no
                                      ? { ...item, floors: val }
                                      : item
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-purple-200"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-600 font-bold block mb-1">
                              Квартиры с №
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentEntrance.apartment_from ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setNewEntrances((prev) =>
                                  prev.map((item) =>
                                    item.entrance_no === currentEntrance.entrance_no
                                      ? { ...item, apartment_from: val }
                                      : item
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-purple-200"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-600 font-bold block mb-1">
                              Квартиры по №
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentEntrance.apartment_to ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setNewEntrances((prev) =>
                                  prev.map((item) =>
                                    item.entrance_no === currentEntrance.entrance_no
                                      ? { ...item, apartment_to: val }
                                      : item
                                  )
                                );
                              }}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-purple-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-600 font-bold block mb-1">
                            Техническое описание подъезда №{currentEntrance.entrance_no}
                          </label>
                          <textarea
                            rows={2}
                            value={currentEntrance.description || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewEntrances((prev) =>
                                prev.map((item) =>
                                  item.entrance_no === currentEntrance.entrance_no
                                    ? { ...item, description: val }
                                    : item
                                )
                              );
                            }}
                            placeholder="Состояние дверей, остекление, отделка стен, освещение, мусоропровод, тех. помещения..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-200"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Данные по дому (паспорт дома, договор)
                </label>
                <textarea
                  rows={2}
                  value={newHouseData}
                  onChange={(e) => setNewHouseData(e.target.value)}
                  placeholder="Паспорт дома, договор управления..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Технические характеристики
                </label>
                <textarea
                  rows={2}
                  value={newTechSpecs}
                  onChange={(e) => setNewTechSpecs(e.target.value)}
                  placeholder="Материал стен, кровля, лифты..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Обслуживающая организация / Управляющая компания
                </label>
                <input
                  type="text"
                  value={newManagingOrg}
                  onChange={(e) => setNewManagingOrg(e.target.value)}
                  placeholder="Например: ООО «ЖЭК-1», КП «Новозаводское», ОСМД..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Примечания
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Особые отметки, ключи, контакты..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsNewHouseModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors shadow-2xs"
                >
                  Добавить дом
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HOUSE MODAL: Full fields & correct saving */}
      {isEditModalOpen && editingHouse && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-xl p-3.5 sm:p-6 border border-purple-200 shadow-2xl space-y-3.5 sm:space-y-4 text-xs my-auto max-h-[90vh] overflow-y-auto overflow-x-hidden box-border">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Изменение данных дома
                </h3>
                <p className="text-[11px] text-slate-500">
                  ул. {editingHouse.street}, д. {editingHouse.house_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="min-w-0">
                  <label className="font-bold text-slate-700 block mb-1">
                    Улица *
                  </label>
                  <input
                    type="text"
                    required
                    list="edit-house-street-suggestions"
                    value={editingHouse.street}
                    onChange={(e) =>
                      setEditingHouse({ ...editingHouse, street: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                  <datalist id="edit-house-street-suggestions">
                    {streets.map((s) => (
                      <option key={s.id} value={s.current_name}>
                        {s.current_name} {s.old_names ? `(ранее: ${s.old_names})` : ''}
                      </option>
                    ))}
                  </datalist>
                  {(() => {
                    const norm = normalizeStreetName(editingHouse.street, streets);
                    if (norm.isNormalized) {
                      return (
                        <div className="mt-1 text-[10px] text-purple-800 bg-purple-50 p-1 rounded-md border border-purple-200">
                          Прежнее название («{norm.matchedOldName}»). Будет сохранено как «{norm.officialName}».
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    № дома *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingHouse.house_number}
                    onChange={(e) =>
                      setEditingHouse({
                        ...editingHouse,
                        house_number: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Корпус
                  </label>
                  <input
                    type="text"
                    value={editingHouse.building || ''}
                    onChange={(e) =>
                      setEditingHouse({
                        ...editingHouse,
                        building: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Подъездов
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingHouse.entrances_count}
                    onChange={(e) => {
                      const newCount = Math.max(0, Number(e.target.value));
                      const curEntrances = editingHouse.entrances || [];
                      const updatedEntrances: Entrance[] = [];
                      const aptPerEnt = newCount > 0 ? Math.ceil(editingHouse.apartments / newCount) : 0;
                      for (let i = 1; i <= newCount; i++) {
                        const existing = curEntrances.find((ent) => ent.entrance_no === i);
                        if (existing) {
                          updatedEntrances.push(existing);
                        } else {
                          updatedEntrances.push({
                            entrance_no: i,
                            floors: editingHouse.floors,
                            apartment_from: (i - 1) * aptPerEnt + 1,
                            apartment_to: i === newCount ? editingHouse.apartments : i * aptPerEnt,
                            description: '',
                          });
                        }
                      }
                      setEditingHouse({
                        ...editingHouse,
                        entrances_count: newCount,
                        entrances: updatedEntrances,
                      });
                      if (activeEditEntranceTab > newCount && newCount > 0) {
                        setActiveEditEntranceTab(1);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Этажей
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingHouse.floors}
                    onChange={(e) =>
                      setEditingHouse({
                        ...editingHouse,
                        floors: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Квартир
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingHouse.apartments}
                    onChange={(e) =>
                      setEditingHouse({
                        ...editingHouse,
                        apartments: Math.max(0, Number(e.target.value)),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  />
                </div>
              </div>

              {/* Detailed Entrance Description in Edit House Modal */}
              {editingHouse.entrances && editingHouse.entrances.length > 0 && (
                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-950 text-xs">
                      Редактирование каждого подъезда (всего: {editingHouse.entrances.length})
                    </span>
                    <span className="text-[10px] text-purple-700 font-semibold bg-white px-2 py-0.5 rounded-md border border-purple-200">
                      Укажите данные по каждому подъезду
                    </span>
                  </div>

                  {/* Entrance Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-purple-200/70 pb-2">
                    {editingHouse.entrances.map((ent) => (
                      <button
                        key={ent.entrance_no}
                        type="button"
                        onClick={() => setActiveEditEntranceTab(ent.entrance_no)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                          activeEditEntranceTab === ent.entrance_no
                            ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                            : 'bg-white text-slate-700 hover:bg-purple-100/60 border-purple-200'
                        }`}
                      >
                        Подъезд №{ent.entrance_no}
                      </button>
                    ))}
                  </div>

                  {/* Active Entrance Form */}
                  {(() => {
                    const currentEntrance =
                      editingHouse.entrances.find((e) => e.entrance_no === activeEditEntranceTab) ||
                      editingHouse.entrances[0];
                    if (!currentEntrance) return null;

                    return (
                      <div className="space-y-2.5 bg-white p-3 rounded-xl border border-purple-100">
                        <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                          <span>Подъезд №{currentEntrance.entrance_no}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-600 font-bold block mb-1">
                              Этажей
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentEntrance.floors}
                              onChange={(e) => {
                                const val = Math.max(0, Number(e.target.value));
                                setEditingHouse({
                                  ...editingHouse,
                                  entrances: editingHouse.entrances?.map((item) =>
                                    item.entrance_no === currentEntrance.entrance_no
                                      ? { ...item, floors: val }
                                      : item
                                  ),
                                });
                              }}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-purple-200"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-600 font-bold block mb-1">
                              Квартиры с №
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentEntrance.apartment_from ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingHouse({
                                  ...editingHouse,
                                  entrances: editingHouse.entrances?.map((item) =>
                                    item.entrance_no === currentEntrance.entrance_no
                                      ? { ...item, apartment_from: val }
                                      : item
                                  ),
                                });
                              }}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-purple-200"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-600 font-bold block mb-1">
                              Квартиры по №
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={currentEntrance.apartment_to ?? ''}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditingHouse({
                                  ...editingHouse,
                                  entrances: editingHouse.entrances?.map((item) =>
                                    item.entrance_no === currentEntrance.entrance_no
                                      ? { ...item, apartment_to: val }
                                      : item
                                  ),
                                });
                              }}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-purple-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-600 font-bold block mb-1">
                            Техническое описание подъезда №{currentEntrance.entrance_no}
                          </label>
                          <textarea
                            rows={2}
                            value={currentEntrance.description || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingHouse({
                                ...editingHouse,
                                entrances: editingHouse.entrances?.map((item) =>
                                  item.entrance_no === currentEntrance.entrance_no
                                    ? { ...item, description: val }
                                    : item
                                ),
                              });
                            }}
                            placeholder="Состояние дверей, остекление, отделка стен, освещение, мусоропровод, тех. помещения..."
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-purple-200"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Данные по дому
                </label>
                <textarea
                  rows={2}
                  value={editingHouse.house_data || ''}
                  onChange={(e) =>
                    setEditingHouse({ ...editingHouse, house_data: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200"
                  placeholder="Паспорт дома, договор управления..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Технические характеристики
                </label>
                <textarea
                  rows={2}
                  value={editingHouse.technical_specs || ''}
                  onChange={(e) =>
                    setEditingHouse({
                      ...editingHouse,
                      technical_specs: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200"
                  placeholder="Материал стен, кровля, лифты..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Обслуживающая организация / Управляющая компания
                </label>
                <input
                  type="text"
                  value={editingHouse.managing_organization || ''}
                  onChange={(e) =>
                    setEditingHouse({
                      ...editingHouse,
                      managing_organization: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200 font-medium"
                  placeholder="Например: ООО «ЖЭК-1», КП «Новозаводское», ОСМД..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Примечания
                </label>
                <textarea
                  rows={2}
                  value={editingHouse.notes || ''}
                  onChange={(e) =>
                    setEditingHouse({ ...editingHouse, notes: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-purple-200"
                  placeholder="Особые примечания..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUPLICATE ADDRESS CONFLICT COMPARISON MODAL */}
      {duplicateConflict && (
        <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-start sm:items-center justify-center px-3 py-3 sm:p-4 overflow-y-auto overflow-x-hidden">
          <div className="bg-white rounded-2xl w-full max-w-[calc(100vw-24px)] sm:max-w-4xl p-3.5 sm:p-6 border border-purple-200 shadow-2xl space-y-4 sm:space-y-5 text-xs my-auto max-h-[92vh] overflow-y-auto overflow-x-hidden box-border">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-purple-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                  Внимание: Обнаружен существующий адрес
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Дом по адресу «ул. {duplicateConflict.existingHouse.street}, д. {duplicateConflict.existingHouse.house_number}
                  {duplicateConflict.existingHouse.building ? ` корп. ${duplicateConflict.existingHouse.building}` : ''}» уже есть в базе
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  Сравните старую и новую карточки дома и выберите ту версию, которая вас устраивает:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDuplicateConflict(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TABLE 1: EXISTING (OLD) VERSION */}
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-slate-600" />
                      <span>Старая карточка (в базе)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold">
                      Текущая
                    </span>
                  </div>

                  <table className="w-full text-[11px] border-collapse">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500 w-1/3">Адрес:</td>
                        <td className="py-1.5 font-bold text-slate-900">
                          ул. {duplicateConflict.existingHouse.street}, {duplicateConflict.existingHouse.house_number}
                          {duplicateConflict.existingHouse.building ? ` корп. ${duplicateConflict.existingHouse.building}` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500">Организация:</td>
                        <td className="py-1.5 font-bold text-purple-900">
                          {duplicateConflict.existingHouse.managing_organization || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500">Этажей:</td>
                        <td className="py-1.5 font-bold text-slate-900">
                          {duplicateConflict.existingHouse.floors || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500">Квартир:</td>
                        <td className="py-1.5 font-bold text-slate-900">
                          {duplicateConflict.existingHouse.apartments || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500">Подъездов:</td>
                        <td className="py-1.5 font-bold text-slate-900">
                          {duplicateConflict.existingHouse.entrances_count || duplicateConflict.existingHouse.entrances?.length || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500">Примечания:</td>
                        <td className="py-1.5 text-slate-700">
                          {duplicateConflict.existingHouse.notes || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500">Тех. характеристики:</td>
                        <td className="py-1.5 text-slate-700">
                          {duplicateConflict.existingHouse.technical_specs || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500">Сведения о доме:</td>
                        <td className="py-1.5 text-slate-700">
                          {duplicateConflict.existingHouse.house_data || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-slate-500">Список подъездов:</td>
                        <td className="py-1.5 text-slate-700">
                          {duplicateConflict.existingHouse.entrances && duplicateConflict.existingHouse.entrances.length > 0 ? (
                            <span className="font-mono">
                              {duplicateConflict.existingHouse.entrances.length} подъезд(ов)
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleChooseExisting}
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-800 font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-4 h-4 text-slate-600" />
                    <span>Оставить старую версию</span>
                  </button>
                </div>
              </div>

              {/* TABLE 2: NEW CANDIDATE VERSION */}
              <div className="rounded-2xl border-2 border-purple-400 bg-purple-50/50 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                    <span className="font-extrabold text-sm text-purple-950 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-700" />
                      <span>Новая карточка (введённая)</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 font-bold">
                      Новая
                    </span>
                  </div>

                  <table className="w-full text-[11px] border-collapse">
                    <tbody className="divide-y divide-purple-200/60">
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70 w-1/3">Адрес:</td>
                        <td className="py-1.5 font-bold text-slate-900">
                          ул. {duplicateConflict.newHouseCandidate.street}, {duplicateConflict.newHouseCandidate.house_number}
                          {duplicateConflict.newHouseCandidate.building ? ` корп. ${duplicateConflict.newHouseCandidate.building}` : ''}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70">Организация:</td>
                        <td className="py-1.5 font-bold text-purple-900">
                          {duplicateConflict.newHouseCandidate.managing_organization || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70">Этажей:</td>
                        <td className="py-1.5 font-bold text-slate-900">
                          {duplicateConflict.newHouseCandidate.floors || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70">Квартир:</td>
                        <td className="py-1.5 font-bold text-slate-900">
                          {duplicateConflict.newHouseCandidate.apartments || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70">Подъездов:</td>
                        <td className="py-1.5 font-bold text-slate-900">
                          {duplicateConflict.newHouseCandidate.entrances_count || duplicateConflict.newHouseCandidate.entrances?.length || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70">Примечания:</td>
                        <td className="py-1.5 text-slate-700">
                          {duplicateConflict.newHouseCandidate.notes || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70">Тех. характеристики:</td>
                        <td className="py-1.5 text-slate-700">
                          {duplicateConflict.newHouseCandidate.technical_specs || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70">Сведения о доме:</td>
                        <td className="py-1.5 text-slate-700">
                          {duplicateConflict.newHouseCandidate.house_data || '—'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-semibold text-purple-800/70">Список подъездов:</td>
                        <td className="py-1.5 text-slate-700">
                          {duplicateConflict.newHouseCandidate.entrances && duplicateConflict.newHouseCandidate.entrances.length > 0 ? (
                            <span className="font-mono">
                              {duplicateConflict.newHouseCandidate.entrances.length} подъезд(ов)
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-purple-200">
                  <button
                    type="button"
                    onClick={handleChooseNew}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition-all flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Выбрать и применить новую версию</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Close */}
            <div className="flex items-center justify-end pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setDuplicateConflict(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
              >
                Отмена (вернуться к редактированию)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
