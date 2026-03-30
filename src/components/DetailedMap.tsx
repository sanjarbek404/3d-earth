import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Button } from './ui/Button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

interface DetailedMapProps {
  countryDetails: any;
  onBack: () => void;
}

export default function DetailedMap({ countryDetails, onBack }: DetailedMapProps) {
  // Default to center of the world if no latlng is provided
  const center: [number, number] = countryDetails?.latlng 
    ? [countryDetails.latlng[0], countryDetails.latlng[1]] 
    : [0, 0];
    
  // Calculate zoom based on area if available, otherwise default to 5
  let zoom = 5;
  if (countryDetails?.area) {
    if (countryDetails.area > 5000000) zoom = 3; // Russia, Canada, USA
    else if (countryDetails.area > 1000000) zoom = 4; // Large countries
    else if (countryDetails.area > 100000) zoom = 5; // Medium countries
    else if (countryDetails.area > 10000) zoom = 6; // Small countries
    else zoom = 8; // Very small countries/islands
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="absolute inset-0 z-50 bg-slate-900"
    >
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md shadow-md z-[1000] flex items-center px-6 justify-between border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="gap-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">3D Globusga qaytish</span>
          </Button>
          <div className="w-px h-6 bg-slate-300"></div>
          <div className="flex items-center gap-3">
            {countryDetails?.flags?.svg && (
              <img src={countryDetails.flags.svg} alt="flag" className="w-8 h-auto rounded-sm shadow-sm border border-slate-200" />
            )}
            <h2 className="text-xl font-bold text-slate-900">
              {countryDetails?.name?.common || 'Batafsil xarita'}
            </h2>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-full">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>Google Maps kabi ko'rinish: Viloyat va shaharlarni ko'rish uchun yaqinlashtiring</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-full pt-16">
        <MapContainer 
          center={center} 
          zoom={zoom} 
          className="w-full h-full" 
          zoomControl={false}
        >
          {/* Esri World Street Map - Very detailed, looks like Google Maps */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          />
          
          {/* Map Controls */}
          <div className="leaflet-top leaflet-right mt-4 mr-4">
            <div className="leaflet-control-zoom leaflet-bar leaflet-control">
              <a className="leaflet-control-zoom-in" href="#" title="Zoom in" role="button" aria-label="Zoom in">+</a>
              <a className="leaflet-control-zoom-out" href="#" title="Zoom out" role="button" aria-label="Zoom out">&#x2212;</a>
            </div>
          </div>

          <MapUpdater center={center} zoom={zoom} />
          
          {countryDetails && (
            <Marker position={center}>
              <Popup className="rounded-xl overflow-hidden shadow-xl border-0">
                <div className="p-1">
                  <h3 className="font-bold text-lg mb-1">{countryDetails.name.common}</h3>
                  <p className="text-sm text-slate-600 mb-2">Poytaxt: <span className="font-medium text-slate-900">{countryDetails.capital?.[0] || 'Noma\'lum'}</span></p>
                  <p className="text-xs text-slate-500 italic">Atrofni o'rganish uchun xaritani yaqinlashtiring</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </motion.div>
  );
}
