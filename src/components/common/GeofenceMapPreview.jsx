import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Crosshair,
  ZoomIn,
  Info,
  Search,
  X,
  Loader2,
  Building2,
} from 'lucide-react';

/**
 * Preview Peta Geofencing GPS Interaktif menggunakan OpenStreetMap & Leaflet (100% Gratis Tanpa API Key)
 * Dilengkapi Kolom Pencarian Lokasi Live di atas Peta
 */
export default function GeofenceMapPreview({
  lat = -6.2088,
  lng = 106.8456,
  radius = 200,
  institutionName = 'Lokasi Sekolah',
  onLocationChange,
  onRadiusChange,
  onDetectLiveLocation,
  isDetectingLocation = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);

  // Selalu simpan referensi callback mutakhir agar event Leaflet tidak terjebak closure usang (stale closure)
  const onLocationChangeRef = useRef(onLocationChange);
  const onRadiusChangeRef = useRef(onRadiusChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
    onRadiusChangeRef.current = onRadiusChange;
  });

  // State untuk Pencarian Lokasi Live di Peta
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Quick presets radius
  const radiusPresets = [50, 100, 200, 300, 500, 1000];

  // Cegah interaksi pada kotak pencarian tembus ke peta Leaflet
  useEffect(() => {
    if (searchContainerRef.current) {
      try {
        L.DomEvent.disableClickPropagation(searchContainerRef.current);
        L.DomEvent.disableScrollPropagation(searchContainerRef.current);
      } catch { }
    }
  }, []);

  // Tutup dropdown hasil pencarian saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Logika Pencarian Lokasi Live (Debounced) via Photon Komoot (OpenStreetMap) & Fallback Nominatim
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      // Cek jika input koordinat langsung: lat, lng
      const coordMatch = q.match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,/ ]\s*(-?\d{1,3}(?:\.\d+)?)$/);
      if (coordMatch) {
        const latVal = parseFloat(coordMatch[1]);
        const lngVal = parseFloat(coordMatch[2]);
        if (latVal >= -90 && latVal <= 90 && lngVal >= -180 && lngVal <= 180) {
          setSearchResults([
            {
              id: 'coord-direct',
              name: 'Koordinat Langsung',
              address: `Latitude: ${latVal.toFixed(6)}, Longitude: ${lngVal.toFixed(6)}`,
              lat: latVal,
              lng: lngVal,
              isCoord: true,
            },
          ]);
          setShowResults(true);
          setIsSearching(false);
          return;
        }
      }

      let results = [];
      // 1. Coba Photon Komoot API (OSM based, sangat cepat & live autocomplete dengan CORS terbuka)
      try {
        const resp = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=id`
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.features) && data.features.length > 0) {
            results = data.features.map((f, idx) => {
              const [lon, lat] = f.geometry.coordinates;
              const p = f.properties || {};
              const name = p.name || p.street || p.city || 'Lokasi Terdeteksi';
              const subDetails = [p.street, p.district, p.city, p.state]
                .filter(Boolean)
                .filter((v) => v !== name)
                .join(', ');
              return {
                id: f.properties.osm_id || `photon-${idx}`,
                name,
                address: subDetails || p.country || 'Indonesia',
                lat: parseFloat(lat.toFixed(6)),
                lng: parseFloat(lon.toFixed(6)),
                type: p.osm_value || p.type || 'place',
              };
            });
          }
        }
      } catch (err) {
        console.warn('Photon search error:', err);
      }

      // 2. Fallback ke Nominatim jika Photon tidak menghasilkan data
      if (results.length === 0) {
        try {
          const nomResp = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`
          );
          if (nomResp.ok) {
            const nomData = await nomResp.json();
            if (Array.isArray(nomData)) {
              results = nomData.map((item) => {
                const parts = (item.display_name || '').split(',');
                const name = parts[0]?.trim() || 'Lokasi';
                const address = parts.slice(1, 4).join(',').trim();
                return {
                  id: item.place_id,
                  name,
                  address: address || item.display_name,
                  lat: parseFloat(parseFloat(item.lat).toFixed(6)),
                  lng: parseFloat(parseFloat(item.lon).toFixed(6)),
                  type: item.type || 'place',
                };
              });
            }
          }
        } catch (nomErr) {
          console.warn('Nominatim search error:', nomErr);
        }
      }

      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handler saat salah satu item lokasi dipilih
  const handleSelectLocation = (item) => {
    setSearchQuery(item.name);
    setShowResults(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 17, {
        duration: 1.2,
      });
    }

    if (onLocationChangeRef.current) {
      onLocationChangeRef.current(item.lat, item.lng);
    }
  };

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Pastikan container belum diinisialisasi
    if (!mapInstanceRef.current) {
      const validLat = Number.isFinite(Number(lat)) ? Number(lat) : -6.2088;
      const validLng = Number.isFinite(Number(lng)) ? Number(lng) : 106.8456;
      const validRadius = Number.isFinite(Number(radius)) && Number(radius) > 0 ? Number(radius) : 200;

      const map = L.map(mapContainerRef.current, {
        center: [validLat, validLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: true,
      });

      // Tambahkan tile layer OpenStreetMap Gratis
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Posisi kontrol zoom di kanan bawah
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Custom icon pin sekolah yang elegan
      const schoolIcon = L.divIcon({
        className: 'custom-school-marker',
        html: `
          <div style="
            background: #18181b;
            color: #ffffff;
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.35);
            border: 2.5px solid #ffffff;
            cursor: grab;
            transition: transform 0.15s ease;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/>
              <path d="M18 22V5l-6-3-6 3v17"/>
              <path d="M4 10h4"/>
              <path d="M4 14h4"/>
              <path d="M16 10h4"/>
              <path d="M16 14h4"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      // Marker titik pusat sekolah (bisa digeser)
      const marker = L.marker([validLat, validLng], {
        icon: schoolIcon,
        draggable: true,
        title: institutionName || 'Lokasi Sekolah',
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #18181b;">
          <strong style="font-size: 13px;">${institutionName || 'Pusat Sekolah'}</strong><br/>
          <span style="color: #71717a; font-family: monospace;">Lat: ${validLat.toFixed(6)}</span><br/>
          <span style="color: #71717a; font-family: monospace;">Lng: ${validLng.toFixed(6)}</span>
        </div>
      `);

      // Event drag marker (pin sekolah digeser)
      marker.on('dragend', (e) => {
        const position = e.target.getLatLng();
        const newLat = parseFloat(position.lat.toFixed(6));
        const newLng = parseFloat(position.lng.toFixed(6));
        if (circleRef.current) {
          circleRef.current.setLatLng(position);
        }
        if (onLocationChangeRef.current) {
          onLocationChangeRef.current(newLat, newLng);
        }
      });

      // Lingkaran radius geofencing aman
      const circle = L.circle([validLat, validLng], {
        radius: validRadius,
        color: '#2563EB',
        fillColor: '#3B82F6',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);

      circle.bindTooltip(`Radius Ujian: ${validRadius} meter`, {
        permanent: false,
        direction: 'top',
        className: 'geofence-tooltip',
      });

      // Klik peta untuk memindahkan lokasi titik koordinat
      map.on('click', (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        const newLat = parseFloat(clickLat.toFixed(6));
        const newLng = parseFloat(clickLng.toFixed(6));
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        }
        if (circleRef.current) {
          circleRef.current.setLatLng(e.latlng);
        }
        if (onLocationChangeRef.current) {
          onLocationChangeRef.current(newLat, newLng);
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      // Fit bounds agar radius terlihat sempurna
      try {
        map.fitBounds(circle.getBounds(), { padding: [35, 35], maxZoom: 17 });
      } catch { }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  // Update dinamis saat Lat, Lng, atau Radius berubah
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    const circle = circleRef.current;

    if (!map || !marker || !circle) return;

    const validLat = Number.isFinite(Number(lat)) ? Number(lat) : -6.2088;
    const validLng = Number.isFinite(Number(lng)) ? Number(lng) : 106.8456;
    const validRadius = Number.isFinite(Number(radius)) && Number(radius) > 0 ? Number(radius) : 200;

    const newLatLng = L.latLng(validLat, validLng);
    marker.setLatLng(newLatLng);
    circle.setLatLng(newLatLng);
    circle.setRadius(validRadius);

    marker.setPopupContent(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #18181b;">
        <strong style="font-size: 13px;">${institutionName || 'Pusat Sekolah'}</strong><br/>
        <span style="color: #71717a; font-family: monospace;">Lat: ${validLat.toFixed(6)}</span><br/>
        <span style="color: #71717a; font-family: monospace;">Lng: ${validLng.toFixed(6)}</span><br/>
        <span style="color: #2563eb; font-weight: 600;">Radius: ${validRadius} meter</span>
      </div>
    `);

    circle.setTooltipContent(`Radius Ujian: ${validRadius} meter`);

    // Sesuaikan kamera agar seluruh radius terlihat dengan animasi mulus
    try {
      map.flyTo(newLatLng, 16, { duration: 0.8 });
    } catch {
      try {
        map.fitBounds(circle.getBounds(), { padding: [35, 35], maxZoom: 17 });
      } catch { }
    }
  }, [lat, lng, radius, institutionName]);

  // Tombol untuk memusatkan kembali peta ke koordinat sekolah
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !circleRef.current) return;
    try {
      mapInstanceRef.current.fitBounds(circleRef.current.getBounds(), {
        padding: [35, 35],
        maxZoom: 17,
      });
    } catch { }
  };

  const coverageAreaHectares = (Math.PI * Math.pow(Number(radius) || 0, 2) / 10000).toFixed(2);

  return (
    <div className="space-y-2.5">
      {/* Top Bar Informasi Peta & Preset Radius */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200/90 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Navigation className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-zinc-900 truncate">
              Preview Area Geofence: {institutionName || 'Sekolah'}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              Radius: <strong className="text-blue-700">{radius} m</strong> &bull; Cakupan: ~{coverageAreaHectares} Ha
            </div>
          </div>
        </div>

        {/* Preset Cepat Radius & Tombol Recenter & Tombol Posisi Saya */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onDetectLiveLocation && (
            <button
              type="button"
              onClick={onDetectLiveLocation}
              disabled={isDetectingLocation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[11px] font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60 mr-1"
              title="Deteksi posisi GPS satelit atau jaringan live saya saat ini"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              <span>{isDetectingLocation ? 'Mencari Lokasi...' : 'Posisi Saya (Live)'}</span>
            </button>
          )}
          <span className="text-[11px] text-zinc-400 font-medium mr-1">Preset:</span>
          {radiusPresets.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRadiusChangeRef.current ? onRadiusChangeRef.current(r) : onRadiusChange && onRadiusChange(r)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer ${Number(radius) === r
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
            >
              {r}m
            </button>
          ))}
          <button
            type="button"
            onClick={handleRecenter}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 text-[11px] font-medium shadow-2xs transition-all cursor-pointer"
            title="Pusatkan kembali peta ke lokasi sekolah"
          >
            <Navigation className="w-3 h-3 text-zinc-500" />
            <span>Pusatkan</span>
          </button>
        </div>
      </div>

      {/* Kontainer Peta Leaflet */}
      <div className="relative w-full h-80 sm:h-96 rounded-2xl border border-zinc-300 overflow-hidden shadow-2xs z-0 bg-zinc-100">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Top Controls di Atas Peta */}
          <div className="absolute top-3 inset-x-3 z-[1000] flex items-start justify-between gap-2.5 pointer-events-none">
            {/* Petunjuk Interaktif di Sudut Kiri */}
            <div className="hidden lg:flex bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-200/90 shadow-sm text-[11px] text-zinc-700 items-center gap-1.5 shrink-0 select-none">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Klik peta atau geser pin untuk mengubah koordinat</span>
            </div>

            {/* Kolom Pencarian Lokasi Live di Peta (Sudut Kanan Atas) */}
            <div
              ref={searchContainerRef}
              className="w-full sm:w-80 md:w-96 ml-auto pointer-events-auto relative"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="relative flex items-center shadow-md rounded-xl bg-white/95 backdrop-blur-md border border-zinc-300/90 hover:border-zinc-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowResults(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchResults.length > 0) {
                        handleSelectLocation(searchResults[0]);
                      }
                    } else if (e.key === 'Escape') {
                      setShowResults(false);
                    }
                  }}
                  placeholder="Cari lokasi sekolah, jalan, kota..."
                  className="w-full pl-9 pr-9 py-2 bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowResults(false);
                        searchInputRef.current?.focus();
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-600 rounded-md hover:bg-zinc-100 transition-colors"
                      title="Hapus pencarian"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Dropdown Live Search Results */}
              {showResults && (
                <div className="absolute top-full right-0 mt-1.5 w-full bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-zinc-100 z-[500] animate-in fade-in-50 duration-150">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      <span>Mencari lokasi di peta...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="px-3 py-1.5 bg-zinc-50/80 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Hasil Pencarian Live</span>
                        <span className="text-zinc-400 font-normal">Pilih untuk mengarahkan pin</span>
                      </div>
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectLocation(item)}
                          className="w-full text-left px-3.5 py-2 hover:bg-blue-50/70 active:bg-blue-100/60 transition-colors flex items-start gap-2.5 cursor-pointer group"
                        >
                          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-zinc-900 group-hover:text-blue-700 truncate">
                              {item.name}
                            </div>
                            <div className="text-[10.5px] text-zinc-500 truncate mt-0.5">
                              {item.address}
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="p-3 text-center text-xs text-zinc-500">
                      Tidak ditemukan lokasi untuk "{searchQuery}". Coba kata kunci lain atau masukkan koordinat.
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      );
}

