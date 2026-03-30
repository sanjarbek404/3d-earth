import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { useAuth } from '../context/AuthContext';
import { LogOut, Map as MapIcon, Info, CheckCircle2, XCircle, Users, Building2, Globe2, Layers, Play, Pause, Navigation } from 'lucide-react';
import { Button } from '../components/ui/Button';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import DetailedMap from '../components/DetailedMap';

interface CountryInfo {
  name: { common: string; official: string };
  capital: string[];
  population: number;
  region: string;
  subregion: string;
  flags: { svg: string };
  languages: { [key: string]: string };
  currencies: { [key: string]: { name: string; symbol: string } };
  latlng?: [number, number];
  area?: number;
}

export default function MapDashboard() {
  const { user, logout, markVisited, unmarkVisited } = useAuth();
  const [countries, setCountries] = useState([]);
  const [hoverD, setHoverD] = useState<any>();
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [countryDetails, setCountryDetails] = useState<CountryInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  // New states for enhanced features
  const [mapStyle, setMapStyle] = useState<'realistic' | 'dark'>('realistic');
  const [autoRotate, setAutoRotate] = useState(true);
  const [showDetailedMap, setShowDetailedMap] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>();

  useEffect(() => {
    // Load GeoJSON data for countries
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setCountries(data.features));
  }, []);

  useEffect(() => {
    const observeTarget = containerRef.current;
    if (!observeTarget) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    
    resizeObserver.observe(observeTarget);
    return () => resizeObserver.unobserve(observeTarget);
  }, []);

  // Handle auto-rotation
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 0.8;
    }
  }, [autoRotate, dimensions, mapStyle]);

  const handlePolygonClick = async (polygon: any, event: any, { lat, lng, altitude }: any) => {
    setSelectedCountry(polygon);
    setLoading(true);
    setCountryDetails(null);
    setAutoRotate(false); // Stop rotation when a country is clicked
    
    // Auto-rotate globe to the clicked country
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat, lng, altitude: 1.2 }, 1000);
    }
    
    const isoCode = polygon.properties.ISO_A3;
    const name = polygon.properties.ADMIN;
    
    try {
      let response;
      if (isoCode && isoCode !== '-99') {
        response = await axios.get(`https://restcountries.com/v3.1/alpha/${isoCode}`);
      } else {
        response = await axios.get(`https://restcountries.com/v3.1/name/${name}?fullText=true`);
      }
      
      if (response.data && response.data.length > 0) {
        setCountryDetails(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching country details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCountryId = (polygon: any) => polygon?.properties?.ISO_A3 || polygon?.properties?.ADMIN;
  
  const isVisited = selectedCountry ? user?.visitedCountries.includes(getCountryId(selectedCountry)) : false;

  const handleToggleVisited = () => {
    if (!selectedCountry) return;
    const id = getCountryId(selectedCountry);
    if (isVisited) {
      unmarkVisited(id);
    } else {
      markVisited(id);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-950 overflow-hidden text-slate-50">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 shadow-sm z-10 relative">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-blue-600 p-1.5 shadow-lg shadow-blue-600/20">
            <Globe2 className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">GeoExplorer 3D</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-sm">
            <span className="font-medium text-slate-300">{user?.username}</span>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 shadow-inner">
              {user?.visitedCountries.length} ta davlat
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Chiqish</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {showDetailedMap && countryDetails && (
            <DetailedMap 
              key="detailed-map"
              countryDetails={countryDetails} 
              onBack={() => setShowDetailedMap(false)} 
            />
          )}
        </AnimatePresence>

        {/* 3D Globe Area */}
        <div ref={containerRef} className="flex-1 relative bg-slate-950 cursor-move">
          {dimensions.width > 0 && (
            <Globe
              ref={globeRef}
              width={dimensions.width}
              height={dimensions.height}
              // Use high-res blue marble for realistic, dark for political
              globeImageUrl={mapStyle === 'realistic' 
                ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" 
                : "//unpkg.com/three-globe/example/img/earth-dark.jpg"}
              // Add topology bump map for realistic mountains/terrain
              bumpImageUrl={mapStyle === 'realistic' 
                ? "//unpkg.com/three-globe/example/img/earth-topology.png" 
                : undefined}
              backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
              polygonsData={countries}
              polygonAltitude={(d: any) => (d === hoverD ? 0.04 : d === selectedCountry ? 0.04 : 0.005)}
              polygonCapColor={(d: any) => {
                const id = getCountryId(d);
                const isCountryVisited = user?.visitedCountries.includes(id);
                const isSelected = selectedCountry === d;
                const isHovered = hoverD === d;
                
                if (isSelected) return 'rgba(59, 130, 246, 0.6)'; // Blue, semi-transparent
                if (isHovered) return 'rgba(255, 255, 255, 0.2)'; // White, highly transparent
                if (isCountryVisited) return 'rgba(16, 185, 129, 0.6)'; // Emerald, semi-transparent
                
                // If realistic, make unvisited transparent to see the real earth map
                return mapStyle === 'realistic' ? 'rgba(0, 0, 0, 0)' : '#1e293b'; 
              }}
              polygonSideColor={() => 'rgba(0, 0, 0, 0.1)'}
              polygonStrokeColor={() => mapStyle === 'realistic' ? 'rgba(255, 255, 255, 0.3)' : '#334155'}
              polygonLabel={({ properties: d }: any) => `
                <div class="bg-slate-900/90 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-md border border-slate-700 shadow-2xl flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full ${user?.visitedCountries.includes(d.ISO_A3 || d.ADMIN) ? 'bg-emerald-500' : 'bg-slate-500'}"></span>
                  ${d.ADMIN}
                </div>
              `}
              onPolygonHover={setHoverD}
              onPolygonClick={handlePolygonClick}
              atmosphereColor="#3b82f6"
              atmosphereAltitude={0.12}
            />
          )}
          
          {/* Map Controls (Bottom Center) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-slate-700 z-10">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setMapStyle(s => s === 'realistic' ? 'dark' : 'realistic')}
              className={cn(
                "rounded-full px-4 transition-all",
                mapStyle === 'realistic' ? "bg-blue-600/20 text-blue-400" : "text-slate-300 hover:text-white"
              )}
            >
              <Layers className="h-4 w-4 mr-2" />
              {mapStyle === 'realistic' ? 'Realistik' : 'Siyosiy'}
            </Button>
            <div className="w-px h-5 bg-slate-700 mx-1"></div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setAutoRotate(!autoRotate)}
              className={cn(
                "rounded-full w-9 h-9 transition-all",
                autoRotate ? "bg-emerald-500/20 text-emerald-400" : "text-slate-300 hover:text-white"
              )}
              title={autoRotate ? "Aylanishni to'xtatish" : "Aylantirish"}
            >
              {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>

          {/* Legend (Bottom Left) */}
          <div className="absolute bottom-8 left-6 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-800 text-xs font-medium space-y-3 z-10 pointer-events-none hidden sm:block">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-sm bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
              <span className="text-slate-300">Tashrif buyurilgan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3.5 h-3.5 rounded-sm border",
                mapStyle === 'realistic' ? "border-slate-400 bg-transparent" : "bg-[#1e293b] border-slate-700"
              )}></div>
              <span className="text-slate-300">Tashrif buyurilmagan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-sm bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.4)]"></div>
              <span className="text-slate-300">Tanlangan</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {selectedCountry && (
            <motion.div
              initial={{ x: 350, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 350, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-80 md:w-96 shrink-0 border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl flex flex-col z-20 h-full overflow-y-auto"
            >
              <div className="p-6 pb-4 border-b border-slate-800 flex justify-between items-start sticky top-0 bg-slate-900/95 backdrop-blur-xl z-10">
                <h2 className="text-2xl font-bold text-white pr-4 tracking-tight">
                  {selectedCountry.properties.ADMIN}
                </h2>
                <button 
                  onClick={() => {
                    setSelectedCountry(null);
                    setAutoRotate(true); // Resume rotation when closed
                  }}
                  className="text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 flex-1 flex flex-col gap-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-4">
                    <div className="w-10 h-10 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium animate-pulse">Ma'lumotlar yuklanmoqda...</p>
                  </div>
                ) : countryDetails ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Flag */}
                    <div className="rounded-xl overflow-hidden border border-slate-800 shadow-lg relative group">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <img 
                        src={countryDetails.flags.svg} 
                        alt={`${countryDetails.name.common} flag`} 
                        className="w-full h-auto object-cover aspect-[3/2]"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                      <Button 
                        variant={isVisited ? "outline" : "default"}
                        className={cn(
                          "w-full gap-2 h-12 text-sm font-semibold shadow-lg transition-all", 
                          isVisited 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300" 
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                        )}
                        onClick={handleToggleVisited}
                      >
                        {isVisited ? (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            Tashrif buyurilgan
                          </>
                        ) : (
                          <>
                            <MapIcon className="h-5 w-5" />
                            Tashrif buyurilgan deb belgilash
                          </>
                        )}
                      </Button>

                      <Button 
                        variant="secondary"
                        className="w-full gap-2 h-12 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-lg transition-all"
                        onClick={() => setShowDetailedMap(true)}
                      >
                        <Navigation className="h-5 w-5 text-blue-400" />
                        Batafsil xarita (Google Maps)
                      </Button>
                    </div>

                    {/* Info Cards */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                          <Building2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Poytaxt</p>
                          <p className="text-sm font-semibold text-slate-100">
                            {countryDetails.capital ? countryDetails.capital[0] : 'Noma\'lum'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                          <Users className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Aholi soni</p>
                          <p className="text-sm font-semibold text-slate-100">
                            {countryDetails.population.toLocaleString('uz-UZ')} kishi
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-700">
                          <Globe2 className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Mintaqa</p>
                          <p className="text-sm font-semibold text-slate-100">
                            {countryDetails.region} {countryDetails.subregion ? <span className="text-slate-400 font-normal">({countryDetails.subregion})</span> : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-5 pt-5 border-t border-slate-800">
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Tillar</p>
                        <div className="flex flex-wrap gap-2">
                          {countryDetails.languages ? (
                            Object.values(countryDetails.languages).map((lang, i) => (
                              <span key={i} className="inline-flex items-center rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 border border-slate-700">
                                {lang}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">Noma'lum</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Valyuta</p>
                        <div className="flex flex-wrap gap-2">
                          {countryDetails.currencies ? (
                            Object.values(countryDetails.currencies).map((curr: any, i) => (
                              <span key={i} className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                                {curr.name} <span className="ml-1.5 opacity-70">({curr.symbol})</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">Noma'lum</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-4 text-center">
                    <div className="p-4 bg-slate-800 rounded-full border border-slate-700">
                      <Info className="h-8 w-8 text-slate-500" />
                    </div>
                    <p className="text-sm">Bu davlat haqida batafsil ma'lumot topilmadi.</p>
                    <Button 
                      variant={isVisited ? "outline" : "default"}
                      className={cn(
                        "w-full gap-2 mt-4 h-11", 
                        isVisited 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                          : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                      )}
                      onClick={handleToggleVisited}
                    >
                      {isVisited ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Tashrif buyurilgan
                        </>
                      ) : (
                        <>
                          <MapIcon className="h-4 w-4" />
                          Tashrif buyurilgan deb belgilash
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
