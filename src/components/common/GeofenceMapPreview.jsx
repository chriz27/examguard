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
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Maximize2,
} from 'lucide-react';

/**
 * Menghitung jarak lurus (Great-circle distance) antara 2 titik koordinat
 * menggunakan formula Haversine dalam satuan meter.
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (!Number.isFinite(lat1) || !Number.isFinite(lon1) || !Number.isFinite(lat2) || !Number.isFinite(lon2)) {
    return null;
  }
  const R = 6371e3; // radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Preview Peta Geofencing GPS Interaktif menggunakan OpenStreetMap & Leaflet
 * Fitur:
 * 1. Pin Sekolah: Menggunakan Logo Resmi Sekolah jika ada, atau Ikon Bangunan jika tidak ada.
 * 2. Pin Merah Real-time: Melacak dan menampilkan posisi perangkat saat ini secara live via GPS/Geolocation.
 * 3. Garis Jarak (Polyline): Garis putus-putus berjarak presisi yang menghubungkan titik sekolah dan titik perangkat.
 * 4. Indikator jarak real-time dari posisi perangkat ke titik pusat sekolah beserta status radius.
 * 5. Pencarian lokasi live & preset radius cepat.
 */
export default function GeofenceMapPreview({
  lat = -6.2088,
  lng = 106.8456,
  radius = 200,
  institutionName = 'Lokasi Sekolah',
  logoUrl = '',
  userLat = null,
  userLng = null,
  userAccuracy = null,
  allowSetUserLocation = false, // Kunci: Peserta tidak dapat mengubah koordinat secara manual
  onLocationChange,
  onRadiusChange,
  onDetectLiveLocation,
  isDetectingLocation = false,
  showDistanceLine = false,
  disableDragSchool = false,
  showPresets = true,
  showSearch = true,
  heightClass = 'h-84 sm:h-96',
  onDeviceLocationDetected,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const schoolMarkerRef = useRef(null);
  const schoolCircleRef = useRef(null);
  const deviceMarkerRef = useRef(null);
  const deviceAccuracyCircleRef = useRef(null);
  const distanceLineRef = useRef(null);
  const hasAutoFittedRef = useRef(false);

  // Selalu simpan referensi callback mutakhir agar event Leaflet tidak terjebak closure usang (stale closure)
  const onLocationChangeRef = useRef(onLocationChange);
  const onRadiusChangeRef = useRef(onRadiusChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
    onRadiusChangeRef.current = onRadiusChange;
  });

  // State untuk Real-time GPS Perangkat
  const [deviceLocation, setDeviceLocation] = useState(() => {
    if (Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng))) {
      return {
        lat: parseFloat(Number(userLat).toFixed(6)),
        lng: parseFloat(Number(userLng).toFixed(6)),
        accuracy: Number(userAccuracy) || 20,
        timestamp: Date.now(),
      };
    }
    return null;
  });
  const [deviceGpsStatus, setDeviceGpsStatus] = useState(() => {
    return Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng)) ? 'active' : 'searching';
  });
  const [deviceGpsError, setDeviceGpsError] = useState(null);

  // Sinkronisasi jika props userLat/userLng berubah dari luar
  useEffect(() => {
    if (Number.isFinite(Number(userLat)) && Number.isFinite(Number(userLng))) {
      const locObj = {
        lat: parseFloat(Number(userLat).toFixed(6)),
        lng: parseFloat(Number(userLng).toFixed(6)),
        accuracy: Number(userAccuracy) || 20,
        timestamp: Date.now(),
      };
      setDeviceLocation(locObj);
      setDeviceGpsStatus('active');
    }
  }, [userLat, userLng, userAccuracy]);

  // State untuk Pencarian Lokasi Live di Peta
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Quick presets radius
  const radiusPresets = [50, 100, 200, 300, 500, 1000];

  // Hitung jarak real-time antara posisi perangkat saat ini dan titik pusat sekolah
  const currentDistance = deviceLocation
    ? calculateDistanceMeters(deviceLocation.lat, deviceLocation.lng, Number(lat), Number(lng))
    : null;
  const isInsideGeofence = currentDistance !== null ? currentDistance <= Number(radius) : null;

  // Fungsi pembuat ikon custom Leaflet untuk Titik Sekolah (Logo atau Bangunan)
  const createSchoolIcon = (logo) => {
    const hasLogo = typeof logo === 'string' && logo.trim().length > 0;

    if (hasLogo) {
      return L.divIcon({
        className: 'custom-school-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));">
            <div style="
              width: 44px;
              height: 44px;
              background: #ffffff;
              border: 3px solid #2563eb;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              padding: 2px;
              cursor: ${disableDragSchool ? 'default' : 'grab'};
              transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
              <img
                src="${logo}"
                alt="Logo Sekolah"
                style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%; pointer-events: none;"
                onerror="this.onerror=null; this.parentElement.innerHTML='<svg width=\\'22\\' height=\\'22\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'#2563eb\\' stroke-width=\\'2.2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><path d=\\'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\\'/><path d=\\'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\\'/><path d=\\'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\\'/><path d=\\'M10 6h4\\'/><path d=\\'M10 10h4\\'/><path d=\\'M10 14h4\\'/><path d=\\'M10 18h4\\'/></svg>';"
              />
            </div>
            <!-- Pin Pointer Segitiga di Bawah Logo -->
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 7px solid #2563eb;
            "></div>
          </div>
        `,
        iconSize: [44, 50],
        iconAnchor: [22, 50],
        popupAnchor: [0, -48],
      });
    }

    // Default jika tidak ada logo: Icon Bangunan Sekolah (Building2)
    return L.divIcon({
      className: 'custom-school-marker',
      html: `
        <div style="position: relative; width: 42px; height: 42px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3));">
          <div style="
            width: 42px;
            height: 42px;
            background: #1e3a8a;
            border: 2.5px solid #ffffff;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            cursor: ${disableDragSchool ? 'default' : 'grab'};
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
              <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
              <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
              <path d="M10 6h4"/>
              <path d="M10 10h4"/>
              <path d="M10 14h4"/>
              <path d="M10 18h4"/>
            </svg>
          </div>
          <!-- Pin Pointer Segitiga di Bawah Icon Bangunan -->
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid #1e3a8a;
          "></div>
        </div>
      `,
      iconSize: [42, 48],
      iconAnchor: [21, 48],
      popupAnchor: [0, -46],
    });
  };

  // Fungsi pembuat ikon custom Leaflet untuk Posisi Perangkat Saat Ini (Pin Merah Live)
  const createDeviceIcon = () => {
    return L.divIcon({
      className: 'custom-device-live-marker',
      html: `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <!-- Gelombang Radar Pulsa Merah (Ping Ripple) -->
          <div style="
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.45);
            animation: liveGpsPulse 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          "></div>
          <!-- Pin Utama Berwarna Merah Terang -->
          <div style="
            position: relative;
            z-index: 2;
            width: 26px;
            height: 26px;
            background: #ef4444;
            color: #ffffff;
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 0 12px rgba(239, 68, 68, 0.7), 0 3px 8px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="6"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -18],
    });
  };

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
      try {
        const resp = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=id`
        );
        if (resp.ok) {
          const data = await resp.json();
          if (data && Array.isArray(data.features) && data.features.length > 0) {
            results = data.features.map((f, idx) => {
              const [lon, latCoord] = f.geometry.coordinates;
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
                lat: parseFloat(latCoord.toFixed(6)),
                lng: parseFloat(lon.toFixed(6)),
                type: p.osm_value || p.type || 'place',
              };
            });
          }
        }
      } catch (err) {
        console.warn('Photon search error:', err);
      }

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

  // Fungsi untuk membaca koordinat murni dari hardware/sensor GPS perangkat (Terkunci & Anti-Manipulasi)
  const requestDeviceLocation = () => {
    if (!navigator.geolocation) {
      setDeviceGpsStatus('unsupported');
      setDeviceGpsError('Perangkat atau browser tidak mendukung sensor Geolocation GPS.');
      return;
    }

    setDeviceGpsStatus('searching');
    setDeviceGpsError(null);

    const onPosSuccess = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      const fixedLat = parseFloat(latitude.toFixed(6));
      const fixedLng = parseFloat(longitude.toFixed(6));

      const locObj = {
        lat: fixedLat,
        lng: fixedLng,
        accuracy: Math.round(accuracy || 0),
        source: 'gps',
        timestamp: pos.timestamp || Date.now(),
      };

      setDeviceLocation(locObj);
      setDeviceGpsStatus('active');
      setDeviceGpsError(null);

      if (onDeviceLocationDetected) {
        onDeviceLocationDetected(locObj);
      }
    };

    const onPosError = (err) => {
      console.warn('GPS hardware read error:', err);
      if (err.code === 1) {
        setDeviceGpsStatus('denied');
        setDeviceGpsError('Izin akses lokasi GPS ditolak oleh browser/pengguna.');
      } else if (err.code === 3) {
        // Jika high-accuracy timeout, coba sekali lagi dengan standard accuracy
        navigator.geolocation.getCurrentPosition(
          onPosSuccess,
          (err2) => {
            setDeviceGpsStatus('error');
            setDeviceGpsError('Sinyal GPS perangkat tidak dapat ditemukan (Timeout).');
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
        );
      } else {
        setDeviceGpsStatus('error');
        setDeviceGpsError(err.message || 'Gagal membaca sensor GPS perangkat.');
      }
    };

    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      onPosError,
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 5000 }
    );
  };

  // Pelacakan GPS Real-time Perangkat Saat Ini
  useEffect(() => {
    let isMounted = true;

    // Jalankan deteksi segera saat komponen pertama kali di-mount jika belum ada deviceLocation
    if (!deviceLocation) {
      requestDeviceLocation(false);
    }

    // Pasang watchPosition untuk pembaruan realtime posisi GPS
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isMounted) return;
          const { latitude, longitude, accuracy } = pos.coords;
          const locObj = {
            lat: parseFloat(latitude.toFixed(6)),
            lng: parseFloat(longitude.toFixed(6)),
            accuracy: Math.round(accuracy || 15),
            source: 'gps',
            timestamp: pos.timestamp || Date.now(),
          };
          setDeviceLocation(locObj);
          setDeviceGpsStatus('active');
          setDeviceGpsError(null);
          if (onDeviceLocationDetected) onDeviceLocationDetected(locObj);
        },
        () => {},
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
      );
    }

    return () => {
      isMounted = false;
      if (navigator.geolocation && watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Inisialisasi Peta Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let t1, t2, t3;
    let handleWindowResize;

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

      // Tile layer OpenStreetMap Gratis
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Posisi kontrol zoom di kanan bawah
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Marker titik pusat sekolah
      const schoolIcon = createSchoolIcon(logoUrl);
      const marker = L.marker([validLat, validLng], {
        icon: schoolIcon,
        draggable: !disableDragSchool,
        title: institutionName || 'Lokasi Sekolah',
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #18181b;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <strong style="font-size: 13px; color: #1e3a8a;">${institutionName || 'Pusat Sekolah'}</strong>
          </div>
          <div style="color: #52525b; font-family: monospace; font-size: 11px;">Lat: ${validLat.toFixed(6)}</div>
          <div style="color: #52525b; font-family: monospace; font-size: 11px;">Lng: ${validLng.toFixed(6)}</div>
          <div style="margin-top: 4px; color: #2563eb; font-weight: 600; font-size: 11px;">Radius Toleransi: ${validRadius} meter</div>
        </div>
      `);

      // Event drag marker (hanya jika drag diizinkan)
      if (!disableDragSchool) {
        marker.on('dragend', (e) => {
          const position = e.target.getLatLng();
          const newLat = parseFloat(position.lat.toFixed(6));
          const newLng = parseFloat(position.lng.toFixed(6));
          if (schoolCircleRef.current) {
            schoolCircleRef.current.setLatLng(position);
          }
          if (onLocationChangeRef.current) {
            onLocationChangeRef.current(newLat, newLng);
          }
        });
      }

      // Lingkaran radius geofencing sekolah
      const circle = L.circle([validLat, validLng], {
        radius: validRadius,
        color: '#2563EB',
        fillColor: '#3B82F6',
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '5, 5',
      }).addTo(map);

      circle.bindTooltip(`Radius Ujian: ${validRadius} meter`, {
        permanent: false,
        direction: 'top',
        className: 'geofence-tooltip',
      });

      // Klik peta hanya untuk mengubah posisi sekolah jika disableDragSchool = false (Mode Admin)
      // Peserta dilarang mengubah titik lokasi secara manual!
      if (!disableDragSchool) {
        map.on('click', (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          const newLat = parseFloat(clickLat.toFixed(6));
          const newLng = parseFloat(clickLng.toFixed(6));
          if (schoolMarkerRef.current) {
            schoolMarkerRef.current.setLatLng(e.latlng);
          }
          if (schoolCircleRef.current) {
            schoolCircleRef.current.setLatLng(e.latlng);
          }
          if (onLocationChangeRef.current) {
            onLocationChangeRef.current(newLat, newLng);
          }
        });
      }

      mapInstanceRef.current = map;
      schoolMarkerRef.current = marker;
      schoolCircleRef.current = circle;

      try {
        map.fitBounds(circle.getBounds(), { padding: [35, 35], maxZoom: 17 });
      } catch { }

      // Pastikan Leaflet selalu me-render ukuran tile secara utuh saat berada dalam modal / popup beranimasi
      t1 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 120);
      t2 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 350);
      t3 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 700);

      handleWindowResize = () => {
        try { map.invalidateSize(); } catch {}
      };
      window.addEventListener('resize', handleWindowResize);
    }

    return () => {
      if (handleWindowResize) {
        window.removeEventListener('resize', handleWindowResize);
      }
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        schoolMarkerRef.current = null;
        schoolCircleRef.current = null;
        deviceMarkerRef.current = null;
        deviceAccuracyCircleRef.current = null;
        distanceLineRef.current = null;
      }
    };
  }, []);

  // Update pin sekolah & lingkaran radius saat Lat, Lng, Radius, atau Logo berubah
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = schoolMarkerRef.current;
    const circle = schoolCircleRef.current;

    if (!map || !marker || !circle) return;

    const validLat = Number.isFinite(Number(lat)) ? Number(lat) : -6.2088;
    const validLng = Number.isFinite(Number(lng)) ? Number(lng) : 106.8456;
    const validRadius = Number.isFinite(Number(radius)) && Number(radius) > 0 ? Number(radius) : 200;

    const newLatLng = L.latLng(validLat, validLng);
    marker.setLatLng(newLatLng);
    circle.setLatLng(newLatLng);
    circle.setRadius(validRadius);

    // Perbarui ikon sekolah jika logo berubah
    marker.setIcon(createSchoolIcon(logoUrl));

    marker.setPopupContent(`
      <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #18181b;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <strong style="font-size: 13px; color: #1e3a8a;">${institutionName || 'Pusat Sekolah'}</strong>
        </div>
        <div style="color: #52525b; font-family: monospace; font-size: 11px;">Lat: ${validLat.toFixed(6)}</div>
        <div style="color: #52525b; font-family: monospace; font-size: 11px;">Lng: ${validLng.toFixed(6)}</div>
        <div style="margin-top: 4px; color: #2563eb; font-weight: 600; font-size: 11px;">Radius Toleransi: ${validRadius} meter</div>
      </div>
    `);

    circle.setTooltipContent(`Radius Ujian: ${validRadius} meter`);
  }, [lat, lng, radius, institutionName, logoUrl]);

  // Update Pin Merah Real-time Posisi Perangkat & Garis Jarak (Polyline) di Peta
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const validLat = Number.isFinite(Number(lat)) ? Number(lat) : -6.2088;
    const validLng = Number.isFinite(Number(lng)) ? Number(lng) : 106.8456;

    if (deviceLocation) {
      const devLatLng = L.latLng(deviceLocation.lat, deviceLocation.lng);
      const dist = calculateDistanceMeters(deviceLocation.lat, deviceLocation.lng, validLat, validLng);
      const isInside = dist !== null ? dist <= Number(radius) : false;

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; color: #18181b; min-width: 170px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: #dc2626; margin-bottom: 4px;">
            <span>📍 Posisi Perangkat Anda (Live GPS)</span>
          </div>
          <div style="color: #52525b; font-family: monospace; font-size: 11px;">Lat: ${deviceLocation.lat.toFixed(6)}</div>
          <div style="color: #52525b; font-family: monospace; font-size: 11px;">Lng: ${deviceLocation.lng.toFixed(6)}</div>
          <div style="color: #71717a; font-size: 11px; margin-top: 2px;">Akurasi: &plusmn;${deviceLocation.accuracy} meter</div>
          <div style="
            margin-top: 6px;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            background: ${isInside ? '#dcfce7' : '#fee2e2'};
            color: ${isInside ? '#15803d' : '#b91c1c'};
          ">
            ${isInside ? `✓ Di Dalam Radius (${dist} m dari sekolah)` : `⚠️ Di Luar Radius (${dist} m dari sekolah)`}
          </div>
        </div>
      `;

      if (!deviceMarkerRef.current) {
        // Buat marker merah baru
        const deviceMarker = L.marker(devLatLng, {
          icon: createDeviceIcon(),
          zIndexOffset: 1000,
          title: 'Posisi Perangkat Anda (Real-time GPS)',
        }).addTo(map);

        deviceMarker.bindPopup(popupHtml);
        deviceMarker.bindTooltip(`Posisi Anda: ${dist !== null ? `${dist}m` : ''}`, {
          direction: 'top',
          offset: [0, -18],
        });

        deviceMarkerRef.current = deviceMarker;
      } else {
        // Perbarui posisi marker merah yang ada
        deviceMarkerRef.current.setLatLng(devLatLng);
        deviceMarkerRef.current.setPopupContent(popupHtml);
        deviceMarkerRef.current.setTooltipContent(`Posisi Anda: ${dist !== null ? `${dist}m` : ''}`);
      }

      // Lingkaran Akurasi GPS Tipis Merah
      if (deviceLocation.accuracy > 0 && deviceLocation.accuracy <= 400) {
        if (!deviceAccuracyCircleRef.current) {
          const accCircle = L.circle(devLatLng, {
            radius: deviceLocation.accuracy,
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.08,
            weight: 1,
            dashArray: '4, 4',
          }).addTo(map);
          deviceAccuracyCircleRef.current = accCircle;
        } else {
          deviceAccuracyCircleRef.current.setLatLng(devLatLng);
          deviceAccuracyCircleRef.current.setRadius(deviceLocation.accuracy);
        }
      } else if (deviceAccuracyCircleRef.current) {
        deviceAccuracyCircleRef.current.remove();
        deviceAccuracyCircleRef.current = null;
      }

      // Garis Jarak (Polyline) antara Posisi Sekolah dan Posisi Perangkat Peserta
      if (showDistanceLine && dist !== null) {
        const lineCoords = [
          [validLat, validLng],
          [deviceLocation.lat, deviceLocation.lng],
        ];

        const tooltipContent = `
          <div style="font-family: inherit; font-size: 11px; font-weight: 700; color: #3730a3; display: flex; align-items: center; gap: 4px;">
            <span>📏 Jarak:</span>
            <span style="font-size: 12px; color: ${isInside ? '#15803d' : '#b91c1c'};">${dist} meter</span>
          </div>
        `;

        if (!distanceLineRef.current) {
          const polyline = L.polyline(lineCoords, {
            color: isInside ? '#2563eb' : '#e11d48',
            weight: 3.5,
            dashArray: '6, 8',
            opacity: 0.85,
          }).addTo(map);

          polyline.bindTooltip(tooltipContent, {
            permanent: true,
            direction: 'center',
            className: 'distance-line-tooltip',
          });

          distanceLineRef.current = polyline;
        } else {
          distanceLineRef.current.setLatLngs(lineCoords);
          distanceLineRef.current.setStyle({
            color: isInside ? '#2563eb' : '#e11d48',
          });
          distanceLineRef.current.setTooltipContent(tooltipContent);
        }

        // Auto-fit bounds saat pertama kali garis jarak terbentuk
        if (!hasAutoFittedRef.current) {
          hasAutoFittedRef.current = true;
          try {
            const bounds = L.latLngBounds([
              [validLat, validLng],
              [deviceLocation.lat, deviceLocation.lng],
            ]);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          } catch { }
        }
      } else if (distanceLineRef.current) {
        distanceLineRef.current.remove();
        distanceLineRef.current = null;
      }
    }
  }, [deviceLocation, lat, lng, radius, showDistanceLine]);

  // Tombol untuk memusatkan peta ke koordinat sekolah
  const handleRecenterSchool = () => {
    if (!mapInstanceRef.current || !schoolCircleRef.current) return;
    try {
      mapInstanceRef.current.fitBounds(schoolCircleRef.current.getBounds(), {
        padding: [35, 35],
        maxZoom: 17,
      });
    } catch { }
  };

  // Tombol untuk memusatkan peta ke koordinat perangkat live
  const handleRecenterDevice = () => {
    if (!mapInstanceRef.current || !deviceLocation) return;
    try {
      mapInstanceRef.current.flyTo([deviceLocation.lat, deviceLocation.lng], 17, {
        duration: 1.0,
      });
      if (deviceMarkerRef.current) {
        deviceMarkerRef.current.openPopup();
      }
    } catch { }
  };

  // Tombol untuk menampilkan kedua titik secara penuh (Sekolah + Posisi Saya)
  const handleFitBothPoints = () => {
    if (!mapInstanceRef.current) return;
    const validLat = Number.isFinite(Number(lat)) ? Number(lat) : -6.2088;
    const validLng = Number.isFinite(Number(lng)) ? Number(lng) : 106.8456;
    const points = [[validLat, validLng]];
    if (deviceLocation) {
      points.push([deviceLocation.lat, deviceLocation.lng]);
    }
    try {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } catch { }
  };

  const coverageAreaHectares = (Math.PI * Math.pow(Number(radius) || 0, 2) / 10000).toFixed(2);
  const hasSchoolLogo = typeof logoUrl === 'string' && logoUrl.trim().length > 0;

  return (
    <div className="space-y-2.5">
      {/* Inject Keyframe Animation untuk Pulsing Radar Pin Merah & Styling Tooltip Garis Jarak */}
      <style>{`
        @keyframes liveGpsPulse {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          100% {
            transform: scale(2.4);
            opacity: 0;
          }
        }
        .distance-line-tooltip {
          background: #ffffff !important;
          border: 1.5px solid #6366f1 !important;
          border-radius: 8px !important;
          padding: 3px 8px !important;
          box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25) !important;
        }
      `}</style>

      {/* Top Bar Informasi Peta, Status Realtime GPS, & Preset Radius */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200/90 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Icon Petunjuk Sekolah: Logo Resmi jika ada, atau Ikon Bangunan jika tidak ada */}
          <div className="w-8 h-8 rounded-xl bg-white border border-blue-200 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden p-0.5">
            {hasSchoolLogo ? (
              <img
                src={logoUrl}
                alt="Logo Sekolah"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = '<span class="text-blue-700"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg></span>';
                }}
              />
            ) : (
              <Building2 className="w-4 h-4 text-blue-700" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-zinc-900 truncate flex items-center gap-1.5">
              <span>Preview Area Geofence: {institutionName || 'Sekolah'}</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-2 flex-wrap">
              <span>Radius: <strong className="text-blue-700">{radius} m</strong></span>
              <span>&bull;</span>
              <span>Cakupan: ~{coverageAreaHectares} Ha</span>
            </div>
          </div>
        </div>

        {/* Preset Cepat Radius & Tombol Kontrol */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {onDetectLiveLocation && (
            <button
              type="button"
              onClick={onDetectLiveLocation}
              disabled={isDetectingLocation}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[11px] font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-60 mr-1"
              title="Gunakan posisi live Anda saat ini sebagai titik pusat sekolah"
            >
              {isDetectingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
              <span>{isDetectingLocation ? 'Mencari Lokasi...' : 'Ambil Posisi Live'}</span>
            </button>
          )}

          {showPresets && (
            <>
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
            </>
          )}

          <button
            type="button"
            onClick={handleRecenterSchool}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 text-[11px] font-medium shadow-2xs transition-all cursor-pointer"
            title="Pusatkan kembali peta ke lokasi sekolah"
          >
            <Navigation className="w-3 h-3 text-zinc-500" />
            <span>Pusatkan Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (deviceLocation) {
                handleRecenterDevice();
              } else {
                requestDeviceLocation(true);
              }
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer"
            title="Deteksi dan pusatkan ke posisi perangkat saat ini"
          >
            <Crosshair className="w-3 h-3 text-rose-600" />
            <span>{deviceLocation ? 'Posisi Saya' : 'Cari Posisi Saya'}</span>
          </button>

          {showDistanceLine && (
            <button
              type="button"
              onClick={handleFitBothPoints}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[11px] font-semibold shadow-2xs transition-all cursor-pointer"
              title="Tampilkan posisi sekolah dan posisi perangkat Anda dalam satu layar penuh"
            >
              <Maximize2 className="w-3 h-3 text-indigo-600" />
              <span>Lihat Garis Jarak</span>
            </button>
          )}
        </div>
      </div>

      {/* Kontainer Peta Leaflet */}
      <div className={`relative w-full ${heightClass} rounded-2xl border border-zinc-300 overflow-hidden shadow-2xs z-0 bg-zinc-100`}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Top Controls di Atas Peta */}
        <div className="absolute top-3 inset-x-3 z-[1000] flex items-start justify-between gap-2.5 pointer-events-none">
          {/* Petunjuk Interaktif di Sudut Kiri Atas Peta */}
          <div className="hidden lg:flex bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-200/90 shadow-sm text-[11px] text-zinc-700 items-center gap-2 shrink-0 select-none">
            <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              {hasSchoolLogo ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-3.5 h-3.5 object-contain rounded-full"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <Building2 className="w-2.5 h-2.5" />
              )}
            </div>
            <span>
              {disableDragSchool
                ? 'Peta Geofence Radius Ujian Sekolah & Posisi Anda'
                : 'Klik peta atau geser pin sekolah untuk mengubah koordinat'}
            </span>
          </div>

          {/* Kolom Pencarian Lokasi Live di Peta (Sudut Kanan Atas) */}
          {showSearch && (
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
          )}
        </div>

        {/* Floating Bottom Left: Legenda Pin & Status GPS Perangkat Real-time */}
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-200 shadow-md flex flex-col gap-1.5 text-[11px] max-w-xs sm:max-w-md select-none">
            {/* Item 1: Pin Sekolah (Logo / Bangunan) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-4 h-4 rounded-full border border-blue-600 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  {hasSchoolLogo ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-2.5 h-2.5 text-blue-700" />
                  )}
                </div>
                <span className="font-semibold text-zinc-800 truncate">
                  Pin Sekolah ({hasSchoolLogo ? 'Logo Resmi' : 'Bangunan'})
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono shrink-0">Radius {radius}m</span>
            </div>

            {/* Item 2: Pin Merah Posisi Perangkat Saat Ini (Real-time GPS) */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                  <span className="absolute w-3.5 h-3.5 rounded-full bg-rose-500/40 animate-ping"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-white shadow-2xs"></span>
                </div>
                <div className="min-w-0 flex items-center gap-1">
                  <span className="font-semibold text-zinc-800 truncate">Pin Merah:</span>
                  {deviceLocation ? (
                    <span className="text-zinc-600 truncate">Posisi Anda (Live)</span>
                  ) : deviceGpsStatus === 'denied' ? (
                    <span className="text-amber-600 truncate">Izin GPS Ditolak</span>
                  ) : (
                    <span className="text-zinc-400 truncate flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin text-zinc-500" />
                      Mencari sinyal...
                    </span>
                  )}
                </div>
              </div>

              {deviceLocation && (
                <button
                  type="button"
                  onClick={handleRecenterDevice}
                  className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-medium text-[10px] transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  title="Arahkan peta ke posisi perangkat Anda saat ini"
                >
                  <Crosshair className="w-2.5 h-2.5" />
                  <span>Lihat</span>
                </button>
              )}
            </div>

            {/* Item 3: Garis Jarak (Jika showDistanceLine aktif) */}
            {showDistanceLine && currentDistance !== null && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 text-[10.5px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-3.5 h-0.5 bg-indigo-600 border-dashed border-b-2 border-indigo-600 shrink-0"></span>
                  <span className="font-medium text-zinc-700 truncate">Garis Jarak Lurus</span>
                </div>
                <span className="font-mono font-bold text-indigo-700 shrink-0">{currentDistance} meter</span>
              </div>
            )}

            {/* Jarak Realtime & Status Radius Ujian */}
            {deviceLocation && currentDistance !== null && (
              <div className={`mt-0.5 px-2 py-1 rounded-lg text-[10.5px] font-medium flex items-center justify-between gap-2 ${
                isInsideGeofence
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                  : 'bg-rose-50 text-rose-800 border border-rose-200/80'
              }`}>
                <div className="flex items-center gap-1 min-w-0">
                  {isInsideGeofence ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                  )}
                  <span className="truncate">
                    {isInsideGeofence ? 'Anda di dalam radius ujian' : 'Anda di luar radius ujian'}
                  </span>
                </div>
                <span className="font-mono font-bold shrink-0">{currentDistance} m</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
